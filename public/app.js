/* eslint-disable no-undef */
(function () {
  const socket = io();

  // ====== State ======
  const state = {
    me: null, // socket id once joined
    name: localStorage.getItem('tr.name') || '',
    avatar: localStorage.getItem('tr.avatar') || '🚀',
    room: null, // last room state from server
    typingState: null, // { text, started, startTime, correctChars, totalKeys, errors, finished, locked }
    activeEffects: new Set(),
  };

  const AVATARS = ['🚀','🦊','🐢','🐉','🐱','🦄','🐼','🐸','🐧','🦁','🐯','🐵','🐙','🦖','🤖','👾','🐝','🐞','🦋','🐳','🦅','🐺','🦝','🍕'];

  // ====== Helpers ======
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => Array.from(document.querySelectorAll(sel));
  const showScreen = (id) => {
    $$('.screen').forEach((s) => s.classList.remove('active'));
    $('#' + id).classList.add('active');
  };

  function toast(message) {
    const el = document.createElement('div');
    el.className = 'toast';
    el.textContent = message;
    $('#toasts').appendChild(el);
    setTimeout(() => el.remove(), 2900);
  }

  function setError(msg) { $('#homeError').textContent = msg || ''; }

  // Lock a typing input against paste, drag-drop, and right-click,
  // making the casual "select text + paste" cheat fail. Cheaters with
  // dev tools will still bypass this, but server-side WPM validation
  // catches that (see anti-cheat rules in server.js).
  function lockTypingInput(el, onCheatAttempt) {
    if (!el) return;
    const block = (e) => {
      e.preventDefault();
      if (typeof onCheatAttempt === 'function') onCheatAttempt();
    };
    el.addEventListener('paste', block);
    el.addEventListener('drop', block);
    el.addEventListener('dragover', (e) => e.preventDefault());
    el.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  // ====== Home: avatar grid ======
  function renderAvatars() {
    const grid = $('#avatarGrid');
    grid.innerHTML = '';
    AVATARS.forEach((a) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.textContent = a;
      if (a === state.avatar) b.classList.add('selected');
      b.addEventListener('click', () => {
        state.avatar = a;
        localStorage.setItem('tr.avatar', a);
        renderAvatars();
      });
      grid.appendChild(b);
    });
  }

  $('#nameInput').value = state.name;
  $('#nameInput').addEventListener('input', (e) => {
    state.name = e.target.value;
    localStorage.setItem('tr.name', state.name);
  });
  renderAvatars();

  // ====== Themes ======
  let themesCache = null;
  async function loadThemesIntoSelects() {
    if (themesCache) {
      populateThemeSelects(themesCache);
      return;
    }
    try {
      const res = await fetch('/api/themes');
      const data = await res.json();
      themesCache = data.themes || [];
      populateThemeSelects(themesCache);
    } catch {
      // fallback: keep just "random"
    }
  }
  function populateThemeSelects(list) {
    const selects = [$('#themeSelect'), $('#practiceThemeSelect')];
    selects.forEach((sel) => {
      if (!sel) return;
      const current = sel.value || 'random';
      // Keep the existing first option (Random); rebuild after it
      sel.innerHTML = '<option value="random">Random</option>';
      list.forEach((t) => {
        const opt = document.createElement('option');
        opt.value = t.key;
        opt.textContent = t.label;
        sel.appendChild(opt);
      });
      sel.value = current;
    });
  }
  loadThemesIntoSelects();

  // Auto-fill room code from URL hash
  const hashCode = (location.hash || '').replace('#', '').toUpperCase();
  if (hashCode) $('#codeInput').value = hashCode;

  $('#createBtn').addEventListener('click', () => {
    if (!state.name.trim()) return setError('Pick a name first');
    setError('');
    socket.emit('room:create', { name: state.name, avatar: state.avatar, difficulty: 'medium' }, (res) => {
      if (!res.ok) return setError(res.error || 'Could not create room');
    });
  });

  $('#joinBtn').addEventListener('click', () => {
    const code = $('#codeInput').value.toUpperCase().trim();
    if (!state.name.trim()) return setError('Pick a name first');
    if (!code) return setError('Enter a room code');
    setError('');
    socket.emit('room:join', { code, name: state.name, avatar: state.avatar }, (res) => {
      if (!res.ok) return setError(res.error || 'Could not join room');
    });
  });
  $('#codeInput').addEventListener('keydown', (e) => { if (e.key === 'Enter') $('#joinBtn').click(); });

  // ====== Lobby ======
  $('#copyCodeBtn').addEventListener('click', async () => {
    if (!state.room) return;
    const url = `${location.origin}/#${state.room.code}`;
    try {
      await navigator.clipboard.writeText(url);
      toast('Invite link copied');
    } catch {
      toast(url);
    }
  });

  $('#difficultySelect').addEventListener('change', (e) => {
    socket.emit('room:setDifficulty', { difficulty: e.target.value });
  });

  $('#themeSelect').addEventListener('change', (e) => {
    socket.emit('room:setTheme', { theme: e.target.value });
  });

  let isReady = false;
  $('#readyBtn').addEventListener('click', () => {
    isReady = !isReady;
    $('#readyBtn').textContent = isReady ? 'Cancel Ready' : "I’m Ready";
    $('#readyBtn').classList.toggle('secondary', isReady);
    $('#readyBtn').classList.toggle('primary', !isReady);
    socket.emit('room:ready', { ready: isReady });
  });

  $('#startNowBtn').addEventListener('click', () => socket.emit('room:startNow'));
  $('#leaveLobbyBtn').addEventListener('click', () => location.reload());
  $('#leaveResultsBtn').addEventListener('click', () => location.reload());
  $('#rematchBtn').addEventListener('click', () => socket.emit('room:rematch'));

  // ====== Race: text rendering & typing ======
  const textBox = $('#textBox');
  const input = $('#typingInput');
  lockTypingInput(input, () => toast('Typing only — paste is disabled.'));

  function startTypingFor(text) {
    state.typingState = {
      text,
      started: false,
      startTime: 0,
      correctChars: 0,
      totalKeys: 0,
      errors: 0,
      lastEmitProgress: -1,
      finished: false,
      locked: false,
    };
    renderText('');
    input.value = '';
    input.disabled = true;
    setTimeout(() => { input.disabled = false; input.focus(); }, 0);
  }

  function renderText(typed) {
    const text = state.typingState ? state.typingState.text : '';
    const frag = document.createDocumentFragment();
    for (let i = 0; i < text.length; i++) {
      const span = document.createElement('span');
      span.className = 'ch';
      span.textContent = text[i] === ' ' ? '\u00A0' : text[i];
      if (i < typed.length) {
        span.classList.add(typed[i] === text[i] ? 'correct' : 'wrong');
        if (typed[i] !== text[i]) {
          // Show what was expected (keep original char visible) - already shown above
        }
      } else if (i === typed.length) {
        span.classList.add('cursor');
      }
      frag.appendChild(span);
    }
    textBox.innerHTML = '';
    textBox.appendChild(frag);
  }

  function calcWpmAndAcc(typedLen, correct, totalKeys, elapsedSec) {
    const minutes = Math.max(elapsedSec / 60, 1 / 60);
    const wpm = Math.round((correct / 5) / minutes);
    const accuracy = totalKeys > 0 ? Math.round((correct / totalKeys) * 100) : 100;
    return { wpm, accuracy };
  }

  let lastEmit = 0;
  function emitProgress() {
    const ts = state.typingState;
    if (!ts || !state.room || state.room.status !== 'racing') return;
    const elapsed = (performance.now() - ts.startTime) / 1000;
    const { wpm, accuracy } = calcWpmAndAcc(input.value.length, ts.correctChars, ts.totalKeys, elapsed);
    const progress = ts.correctChars / ts.text.length;
    $('#wpmStat').textContent = wpm;
    $('#accStat').textContent = accuracy + '%';
    if (progress !== ts.lastEmitProgress) {
      ts.lastEmitProgress = progress;
      socket.emit('race:progress', { progress, wpm, accuracy });
    }
  }

  input.addEventListener('input', (e) => {
    const ts = state.typingState;
    if (!ts || ts.finished || !state.room || state.room.status !== 'racing') {
      // disallow typing outside race
      input.value = '';
      return;
    }
    if (ts.locked) {
      // reverse effect: prevent forward progress until unlock
      e.preventDefault?.();
      return;
    }
    if (!ts.started) {
      ts.started = true;
      ts.startTime = performance.now();
    }

    const value = input.value;
    const text = ts.text;

    // Recount correct chars and total typed
    let correct = 0;
    for (let i = 0; i < Math.min(value.length, text.length); i++) {
      if (value[i] === text[i]) correct++;
    }
    // Total keys: track the max length the user has reached + corrections
    // Simpler: every input event increments totalKeys by absolute diff
    if (e.inputType !== 'historyUndo' && e.inputType !== 'historyRedo') {
      // consider every input as one key press
      ts.totalKeys += 1;
    }
    ts.correctChars = correct;

    // Cap input at text length to prevent overshoot
    if (value.length > text.length) {
      input.value = value.slice(0, text.length);
    }

    renderText(input.value);

    if (correct === text.length && input.value.length === text.length) {
      ts.finished = true;
      input.disabled = true;
    }
  });

  // Throttled emit loop, also drives the timer display
  setInterval(() => {
    const ts = state.typingState;
    if (!ts) return;
    if (state.room && state.room.status === 'racing' && ts.startTime) {
      const elapsed = (performance.now() - ts.startTime) / 1000;
      $('#timeStat').textContent = elapsed.toFixed(1) + 's';
    }
    emitProgress();
  }, 250);

  // Power-ups
  $('#powerUps').addEventListener('click', (e) => {
    const btn = e.target.closest('.powerup');
    if (!btn) return;
    // Show target picker by toasting list of player ids; simpler: prompt
    const choices = (state.room?.players || []).filter((p) => p.id !== state.me && !p.finished);
    if (choices.length === 0) return toast('No targets available');
    // Quick picker: if only one target, fire it; else show floating list.
    if (choices.length === 1) {
      socket.emit('race:usePowerUp', { targetId: choices[0].id });
      return;
    }
    showTargetPicker(choices, (target) => {
      socket.emit('race:usePowerUp', { targetId: target.id });
    });
  });

  function showTargetPicker(choices, onPick) {
    const existing = document.getElementById('targetPicker');
    if (existing) existing.remove();
    const wrap = document.createElement('div');
    wrap.id = 'targetPicker';
    Object.assign(wrap.style, {
      position: 'fixed', left: '50%', top: '50%', transform: 'translate(-50%, -50%)',
      background: 'rgba(20,25,40,0.97)', border: '1px solid rgba(255,255,255,0.1)',
      padding: '14px', borderRadius: '14px', zIndex: 80, minWidth: '220px',
    });
    const h = document.createElement('div');
    h.textContent = 'Pick a target';
    Object.assign(h.style, { color: 'var(--muted)', fontSize: '12px', marginBottom: '8px' });
    wrap.appendChild(h);
    choices.forEach((c) => {
      const b = document.createElement('button');
      b.className = 'secondary';
      b.style.width = '100%';
      b.style.margin = '4px 0';
      b.textContent = `${c.avatar} ${c.name}`;
      b.addEventListener('click', () => { onPick(c); wrap.remove(); });
      wrap.appendChild(b);
    });
    const cancel = document.createElement('button');
    cancel.className = 'ghost';
    cancel.style.width = '100%';
    cancel.textContent = 'Cancel';
    cancel.addEventListener('click', () => wrap.remove());
    wrap.appendChild(cancel);
    document.body.appendChild(wrap);
  }

  // Emoji
  $('#emojiBar').addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-emoji]');
    if (!btn) return;
    socket.emit('race:emoji', { emoji: btn.dataset.emoji });
  });

  socket.on('race:emoji', ({ from, emoji }) => {
    const el = document.createElement('div');
    el.className = 'pop';
    el.innerHTML = `<span style="font-size:18px">${emoji}</span> <span class="muted">${from}</span>`;
    $('#emojiPop').appendChild(el);
    setTimeout(() => el.remove(), 2400);
  });

  socket.on('race:hit', (effect) => {
    applyEffect(effect.type);
    toast(`💥 ${effect.from} hit you with ${effect.type.toUpperCase()}`);
  });

  socket.on('race:powerUpUsed', ({ from, to, type }) => {
    if (state.room && state.me && to !== state.me) {
      // Don't show toast to the target (they get a bigger one above)
      const p = (state.room.players || []).find((x) => x.id === state.me);
      if (p && p.name === to) return;
    }
    toast(`${from} → ${to}: ${type.toUpperCase()}`);
  });

  function applyEffect(type) {
    const overlay = $('#effectOverlay');
    overlay.classList.add(type);
    state.activeEffects.add(type);
    if (type === 'reverse' && state.typingState) {
      state.typingState.locked = true;
    }
    setTimeout(() => {
      overlay.classList.remove(type);
      state.activeEffects.delete(type);
      if (type === 'reverse' && state.typingState) state.typingState.locked = false;
    }, 4000);
  }

  // ====== Socket events ======
  socket.on('connect', () => {
    state.me = socket.id;
  });

  socket.on('room:joined', ({ code, you }) => {
    state.me = you;
    location.hash = code;
    showScreen('lobby');
    isReady = false;
    $('#readyBtn').textContent = "I’m Ready";
    $('#readyBtn').classList.add('primary');
    $('#readyBtn').classList.remove('secondary');
  });

  socket.on('room:state', (room) => {
    const prevStatus = state.room?.status;
    state.room = room;
    renderRoom(room);

    // Status transitions
    if (prevStatus !== room.status) {
      if (room.status === 'lobby') {
        showScreen('lobby');
        // Returning to lobby (e.g. rematch): server cleared ready flags,
        // so reset our local ready toggle and the button to match.
        isReady = false;
        $('#readyBtn').textContent = "I’m Ready";
        $('#readyBtn').classList.add('primary');
        $('#readyBtn').classList.remove('secondary');
      } else if (room.status === 'countdown') {
        showScreen('race');
        startTypingFor(room.text);
        beginCountdown(room.startsAt);
      } else if (room.status === 'racing') {
        showScreen('race');
        $('#countdown').classList.add('hidden');
        if (!state.typingState || state.typingState.text !== room.text) {
          startTypingFor(room.text);
        }
        // Ensure focus
        setTimeout(() => input.focus(), 50);
      } else if (room.status === 'finished') {
        showResults(room);
      }
    } else if (room.status === 'racing') {
      // keep input focused if user clicks elsewhere
    }
  });

  function beginCountdown(startsAt) {
    $('#countdown').classList.remove('hidden');
    const update = () => {
      const remaining = Math.max(0, startsAt - Date.now());
      const secs = Math.ceil(remaining / 1000);
      $('#countdown .count-num').textContent = secs > 0 ? secs : 'GO!';
      if (remaining > 0) {
        requestAnimationFrame(update);
      } else {
        setTimeout(() => $('#countdown').classList.add('hidden'), 400);
      }
    };
    update();
  }

  function renderRoom(room) {
    if (!room) return;
    // lobby pieces
    $('#roomCode').textContent = room.code;
    $('#raceRoomCode').textContent = room.code;

    // host controls visibility
    if (room.hostId === state.me && room.status === 'lobby') {
      $('#hostControls').classList.remove('hidden');
      $('#difficultySelect').value = room.difficulty;
      if ($('#themeSelect') && room.theme) $('#themeSelect').value = room.theme;
    } else {
      $('#hostControls').classList.add('hidden');
    }

    // player list (lobby)
    const list = $('#playerList');
    list.innerHTML = '';
    room.players.forEach((p) => {
      const li = document.createElement('li');
      li.className = 'player-row' + (p.id === state.me ? ' me' : '') + (p.ready ? ' ready' : '');
      li.innerHTML = `
        <span class="av">${escapeHtml(p.avatar)}</span>
        <span class="name">${escapeHtml(p.name)}${room.hostId === p.id ? '<span class="tag">HOST</span>' : ''}${p.id === state.me ? '<span class="tag">YOU</span>' : ''}</span>
        <span class="muted">${p.ready ? 'Ready' : 'Waiting'}</span>
      `;
      list.appendChild(li);
    });

    // race track
    renderTrack(room);

    // power ups for me
    const me = room.players.find((p) => p.id === state.me);
    const pu = $('#powerUps');
    pu.innerHTML = '';
    if (me && room.status === 'racing' && me.powerUps > 0) {
      // We don't know the type list per-power-up here (server sends count only).
      // Show "use" button(s) — server pops type from the queue.
      for (let i = 0; i < me.powerUps; i++) {
        const b = document.createElement('button');
        b.className = 'powerup';
        b.innerHTML = '⚡ Use Power-Up';
        pu.appendChild(b);
      }
    }
  }

  function renderTrack(room) {
    const track = $('#track');
    track.innerHTML = '';
    room.players.forEach((p) => {
      const lane = document.createElement('div');
      lane.className = 'lane';
      const finish = document.createElement('div');
      finish.className = 'finish';
      lane.appendChild(finish);

      const racer = document.createElement('div');
      racer.className = 'racer' + (p.id === state.me ? ' me' : '') + (p.finished ? ' finished' : '');
      const placePrefix = p.finished && p.place ? `${ordinal(p.place)} ` : '';
      racer.innerHTML = `
        <span class="name">${placePrefix}${escapeHtml(p.name)} · ${p.wpm} WPM · ${p.accuracy}%</span>
        ${escapeHtml(p.avatar)}
      `;
      const pct = Math.max(0, Math.min(1, p.progress));
      // Place across the lane, leaving padding for finish stripe
      racer.style.left = (4 + pct * 92) + '%';
      lane.appendChild(racer);
      track.appendChild(lane);
    });
  }

  function showResults(room) {
    showScreen('results');
    const list = $('#resultsList');
    list.innerHTML = '';
    const sorted = [...room.players].sort((a, b) => {
      if (a.finished && b.finished) return (a.finishTime || 0) - (b.finishTime || 0);
      if (a.finished) return -1;
      if (b.finished) return 1;
      return b.progress - a.progress;
    });
    sorted.forEach((p, i) => {
      const place = p.place || i + 1;
      const cls = place === 1 ? 'gold' : place === 2 ? 'silver' : place === 3 ? 'bronze' : '';
      const li = document.createElement('li');
      li.className = `result-row ${cls}`;
      const time = p.finishTime ? `${(p.finishTime / 1000).toFixed(1)}s` : '—';
      li.innerHTML = `
        <span class="place">${ordinal(place)}</span>
        <span class="av">${escapeHtml(p.avatar)}</span>
        <span>
          <div><strong>${escapeHtml(p.name)}</strong>${p.id === state.me ? ' <span class="tag">YOU</span>' : ''}</div>
          <div class="meta">${p.wpm} WPM · ${p.accuracy}% accuracy · ${time}</div>
        </span>
        <span>${p.finished ? '🏁' : '⏱'}</span>
      `;
      list.appendChild(li);
    });

    if (room.hostId === state.me) {
      $('#rematchBtn').classList.remove('hidden');
    } else {
      $('#rematchBtn').classList.add('hidden');
    }
  }

  function ordinal(n) {
    const s = ['th', 'st', 'nd', 'rd'];
    const v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  // Refocus typing input on click anywhere in race screen
  $('#race').addEventListener('click', (e) => {
    if (state.room && state.room.status === 'racing') {
      if (e.target.closest('button, input, select, label')) return;
      input.focus();
    }
  });

  // ====== Practice Mode (solo, no server room required) ======
  const practice = {
    text: '',
    difficulty: 'medium',
    started: false,
    startTime: 0,
    correctChars: 0,
    totalKeys: 0,
    errors: 0,
    finished: false,
    timer: null,
  };

  const pTextBox = $('#practiceTextBox');
  const pInput = $('#practiceInput');
  lockTypingInput(pInput, () => toast('Typing only — paste is disabled.'));

  function loadBests() {
    ['easy', 'medium', 'hard'].forEach((d) => {
      const raw = localStorage.getItem('tr.best.' + d);
      if (!raw) return;
      try {
        const best = JSON.parse(raw);
        const wpmEl = $('#best' + cap(d));
        const metaEl = $('#best' + cap(d) + 'Meta');
        if (wpmEl) wpmEl.textContent = best.wpm;
        if (metaEl) {
          const when = best.at ? new Date(best.at).toLocaleDateString() : '';
          metaEl.textContent = `${best.accuracy}% acc · ${(best.timeMs / 1000).toFixed(1)}s${when ? ' · ' + when : ''}`;
        }
      } catch {}
    });
  }
  function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }

  async function startPracticeRun(difficulty) {
    practice.difficulty = difficulty || practice.difficulty;
    $('#practiceDiffPill').textContent = practice.difficulty.toUpperCase();
    $$('#practiceDiffSeg button').forEach((b) => b.classList.toggle('active', b.dataset.diff === practice.difficulty));

    const theme = ($('#practiceThemeSelect') && $('#practiceThemeSelect').value) || 'random';

    let text;
    try {
      const res = await fetch('/api/practice-text?difficulty=' + practice.difficulty + '&theme=' + encodeURIComponent(theme));
      const data = await res.json();
      text = data.text;
    } catch {
      text = 'The quick brown fox jumps over the lazy dog. Practice mode could not reach the server, so here is a fallback line for you to type.';
    }
    practice.text = text;
    practice.started = false;
    practice.startTime = 0;
    practice.correctChars = 0;
    practice.totalKeys = 0;
    practice.errors = 0;
    practice.finished = false;
    pInput.value = '';
    pInput.disabled = false;
    renderPracticeText('');
    $('#pWpm').textContent = '0';
    $('#pAcc').textContent = '100%';
    $('#pTime').textContent = '0.0s';
    $('#pProg').textContent = '0%';
    $('#practiceResult').classList.add('hidden');
    $('#practiceFinishBtn').disabled = true;
    $('#practiceFinishHint').textContent = 'Type the full sentence (errors okay) to enable Finish.';
    setTimeout(() => pInput.focus(), 30);
  }

  function renderPracticeText(typed) {
    const text = practice.text;
    const frag = document.createDocumentFragment();
    for (let i = 0; i < text.length; i++) {
      const span = document.createElement('span');
      span.className = 'ch';
      span.textContent = text[i] === ' ' ? '\u00A0' : text[i];
      if (i < typed.length) {
        span.classList.add(typed[i] === text[i] ? 'correct' : 'wrong');
      } else if (i === typed.length) {
        span.classList.add('cursor');
      }
      frag.appendChild(span);
    }
    pTextBox.innerHTML = '';
    pTextBox.appendChild(frag);
  }

  pInput.addEventListener('input', (e) => {
    if (practice.finished) return;
    if (!practice.started) {
      practice.started = true;
      practice.startTime = performance.now();
      if (practice.timer) clearInterval(practice.timer);
      practice.timer = setInterval(updatePracticeStats, 200);
    }

    const value = pInput.value;
    const text = practice.text;
    if (value.length > text.length) {
      pInput.value = value.slice(0, text.length);
    }
    let correct = 0;
    let firstWrongAt = -1;
    for (let i = 0; i < Math.min(pInput.value.length, text.length); i++) {
      if (pInput.value[i] === text[i]) correct++;
      else if (firstWrongAt === -1) firstWrongAt = i;
    }
    practice.correctChars = correct;
    if (e.inputType !== 'historyUndo' && e.inputType !== 'historyRedo') {
      practice.totalKeys += 1;
      if (firstWrongAt !== -1 && pInput.value.length > firstWrongAt && pInput.value[firstWrongAt] !== text[firstWrongAt]) {
        // count an error per wrong char only when newly produced
        if (e.inputType && e.inputType.startsWith('insert')) {
          const lastIdx = pInput.value.length - 1;
          if (lastIdx >= 0 && lastIdx < text.length && pInput.value[lastIdx] !== text[lastIdx]) {
            practice.errors += 1;
          }
        }
      }
    }
    renderPracticeText(pInput.value);
    updatePracticeStats();

    // Enable the Finish button once they've typed the full length, errors or not.
    const reachedEnd = pInput.value.length >= text.length;
    $('#practiceFinishBtn').disabled = !reachedEnd;
    $('#practiceFinishHint').textContent = reachedEnd
      ? 'Click Finish to lock in your time and WPM.'
      : 'Type the full sentence (errors okay) to enable Finish.';

    if (correct === text.length && pInput.value.length === text.length) {
      finishPracticeRun();
    }
  });

  function updatePracticeStats() {
    if (!practice.text) return;
    const elapsed = practice.started ? (performance.now() - practice.startTime) / 1000 : 0;
    const minutes = Math.max(elapsed / 60, 1 / 60);
    const wpm = practice.started ? Math.round((practice.correctChars / 5) / minutes) : 0;
    const accuracy = practice.totalKeys > 0 ? Math.round((practice.correctChars / practice.totalKeys) * 100) : 100;
    const progress = Math.round((practice.correctChars / practice.text.length) * 100);
    $('#pWpm').textContent = wpm;
    $('#pAcc').textContent = accuracy + '%';
    $('#pTime').textContent = elapsed.toFixed(1) + 's';
    $('#pProg').textContent = progress + '%';
  }

  function finishPracticeRun() {
    practice.finished = true;
    if (practice.timer) { clearInterval(practice.timer); practice.timer = null; }
    pInput.disabled = true;

    const elapsedMs = performance.now() - practice.startTime;
    const minutes = Math.max(elapsedMs / 1000 / 60, 1 / 60);
    const wpm = Math.round((practice.correctChars / 5) / minutes);
    const accuracy = practice.totalKeys > 0 ? Math.round((practice.correctChars / practice.totalKeys) * 100) : 100;

    // Compare with stored best
    const key = 'tr.best.' + practice.difficulty;
    let best = null;
    try { best = JSON.parse(localStorage.getItem(key) || 'null'); } catch {}
    const isNewBest = !best || wpm > best.wpm;
    if (isNewBest) {
      const record = { wpm, accuracy, timeMs: Math.round(elapsedMs), at: Date.now() };
      localStorage.setItem(key, JSON.stringify(record));
      loadBests();
    }

    $('#prWpm').textContent = wpm + (isNewBest ? '' : '');
    $('#practiceResultTitle').innerHTML = isNewBest
      ? `Run Complete <span class="new-best">NEW BEST</span>`
      : 'Run Complete';
    $('#prAcc').textContent = accuracy + '%';
    $('#prTime').textContent = (elapsedMs / 1000).toFixed(1) + 's';
    $('#prErr').textContent = practice.errors;
    $('#practiceResult').classList.remove('hidden');
  }

  $('#practiceFinishBtn').addEventListener('click', () => {
    if (!practice.started || practice.finished) return;
    if (pInput.value.length < practice.text.length) return;
    finishPracticeRun();
  });

  // Enter key triggers Finish once the button is enabled.
  pInput.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter') return;
    if ($('#practiceFinishBtn').disabled) return;
    e.preventDefault();
    finishPracticeRun();
  });

  $('#practiceBtn').addEventListener('click', () => {
    showScreen('practice');
    loadBests();
    startPracticeRun('medium');
  });
  $('#practiceLeaveBtn').addEventListener('click', () => showScreen('home'));
  $('#practiceNewBtn').addEventListener('click', () => startPracticeRun(practice.difficulty));
  $('#practiceAgainBtn').addEventListener('click', () => startPracticeRun(practice.difficulty));
  $('#practiceCloseResult').addEventListener('click', () => $('#practiceResult').classList.add('hidden'));
  $('#practiceResultHomeBtn').addEventListener('click', () => {
    $('#practiceResult').classList.add('hidden');
    showScreen('home');
  });

  $('#practiceDiffSeg').addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-diff]');
    if (!btn) return;
    startPracticeRun(btn.dataset.diff);
  });

  // Changing the theme in practice should pull a new text immediately.
  const _practiceThemeSel = $('#practiceThemeSelect');
  if (_practiceThemeSel) {
    _practiceThemeSel.addEventListener('change', () => startPracticeRun(practice.difficulty));
  }

  $('#practice').addEventListener('click', (e) => {
    // Don't steal focus from interactive controls (dropdown <select>, buttons, inputs, labels).
    if (e.target.closest('button, input, select, label, .seg')) return;
    pInput.focus();
  });

  // ====== Space Defender (single-player arcade typing) ======
  const defender = {
    running: false,
    paused: false,
    rafId: null,
    arena: null,
    arenaRect: null,
    ship: null,
    wordsLayer: null,
    bulletsLayer: null,
    input: null,
    words: [],   // active words on screen
    bullets: [],
    score: 0,
    level: 1,
    lives: 3,
    correctChars: 0,
    totalKeys: 0,
    wordsCleared: 0,
    spawnIntervalMs: 1800,
    lastSpawnAt: 0,
    lastFrameAt: 0,
    targetedId: null, // id of word being matched
    wordPool: null,
  };

  const dArena = $('#defenderArena');
  const dShip = $('#defenderShip');
  const dWordsLayer = $('#defenderWords');
  const dBulletsLayer = $('#defenderBullets');
  const dInput = $('#defenderInput');
  lockTypingInput(dInput, () => toast('Typing only — paste is disabled.'));

  // A larger word pool for the arcade mode. Short, common words to keep
  // the gameplay brisk; longer words dialed in as level grows.
  const DEFENDER_WORDS_SHORT = [
    'jump','code','rocket','space','star','warp','laser','beam','shield','dodge',
    'fast','plasma','quark','orbit','nova','pulse','meteor','comet','alien','ray',
    'echo','glow','flux','core','beep','boop','quick','snap','bolt','flame',
    'spark','frost','blaze','swift','byte','bit','data','flow','grid','node',
    'pixel','chip','disk','file','heap','loop','mesh','ping','queue','sync',
    'tape','task','wire','zone','aero','azur','blue','calm','duck','edge',
    'foam','game','hint','iron','jolt','keen','lake','milk','navy','open',
    'park','rain','sail','tide','urge','vine','warm','xray','yarn','wind',
    'cloud','river','tree','sand','rock','snow','leaf','moon','nest','stone',
    'fire','ice','wave','peak','shore','gulf','reef','cave','dune','field',
    'ash','arc','bay','brisk','cog','dawn','dim','dusk','elf','fern',
    'flint','frog','gem','glide','grit','haze','hawk','hum','ink','jade',
    'kelp','lark','loft','moss','mist','myth','nap','oak','onyx','owl',
    'plum','pond','pyre','ridge','rim','rune','sage','sash','silk','silo',
    'sled','smog','sob','soot','step','swan','swap','swap','tan','tilt',
    'tomb','torch','vat','vex','vow','wand','wax','web','wisp','yawn',
    'zinc','zoo','dusk','duo','foe','fox','gum','hue','isle','jay',
    'kite','lump','marsh','melt','nudge','ode','pith','quay','quartz','rust',
    'salt','sane','tang','toll','urn','urge','veer','vista','wail','willow',
    'yak','yelp','zest','zeal','zip','plume','prism','clamp','crisp','dwell',
  ];
  const DEFENDER_WORDS_LONG = [
    'asteroid','cosmonaut','telescope','satellite','algorithm','keyboard',
    'frequency','hyperspace','wormhole','navigator','ionosphere','spaceport',
    'gravitas','starship','meteorite','quasar','nebula','radiation',
    'commander','quantum','encrypt','protocol','interface','momentum',
    'parallax','firmware','snapshot','redshift','blueshift','escape',
    'horizon','solstice','equinox','antenna','aperture','particle',
    'simulate','transmit','receive','calibrate','modulate','frequency',
    'gravitate','luminous','meridian','observe','overdrive','penumbra',
    'planetoid','propeller','radiance','reactor','recursive','resonate',
    'scanner','spectrum','stabilize','starlight','supernova','synthwave',
    'thruster','transmit','traverse','turbulence','umbra','velocity',
    'vortex','warpdrive','wavelength','xenobiology','yieldpoint','zenith',
    'crystal','dimension','enigma','fragment','galactic','harness',
    'incandescent','journey','keystone','lighthouse','mainframe','navigate',
    'omnibus','phantom','quasimoon','rendezvous','singularity','telemetry',
    'ultraviolet','vacuum','weightless','eclipse','dynamo','flotilla',
    'cybernetic','deepspace','deflector','exoplanet','fusion','hologram',
  ];

  // Buffer of recently spawned words to reduce back-to-back repeats.
  const recentDefenderWords = [];
  const RECENT_BUFFER_MAX = 12;

  function pickWord(level) {
    // Higher level -> more chance of long words.
    const longChance = Math.min(0.7, 0.1 + level * 0.07);
    const onScreen = new Set(defender.words.map((w) => w.word));
    const recent = new Set(recentDefenderWords);

    // Try up to 12 picks to find one that isn't on screen or recently used.
    for (let attempt = 0; attempt < 12; attempt++) {
      const list = Math.random() < longChance ? DEFENDER_WORDS_LONG : DEFENDER_WORDS_SHORT;
      const candidate = list[Math.floor(Math.random() * list.length)];
      if (onScreen.has(candidate)) continue; // never duplicate live targets
      if (recent.has(candidate)) continue;   // avoid recent
      rememberDefenderWord(candidate);
      return candidate;
    }

    // Fallback: pick anything not currently on screen.
    const list = Math.random() < longChance ? DEFENDER_WORDS_LONG : DEFENDER_WORDS_SHORT;
    const fallback = list.find((w) => !onScreen.has(w)) || list[Math.floor(Math.random() * list.length)];
    rememberDefenderWord(fallback);
    return fallback;
  }

  function rememberDefenderWord(word) {
    recentDefenderWords.push(word);
    while (recentDefenderWords.length > RECENT_BUFFER_MAX) {
      recentDefenderWords.shift();
    }
  }

  function levelFromScore(score) {
    // Roughly: every 8 cleared words bumps level. Score per word can be 10-30+, so use
    // wordsCleared as the canonical signal.
    return 1 + Math.floor(defender.wordsCleared / 8);
  }

  function spawnIntervalForLevel(level) {
    // Starts at 1800ms, decreases gradually but never below ~450ms.
    return Math.max(450, 1800 - (level - 1) * 140);
  }

  function fallSpeedForLevel(level) {
    // px per second. Starts gentle, grows faster than spawn rate decreases.
    return 35 + (level - 1) * 9;
  }

  function maxConcurrentForLevel(level) {
    return Math.min(8, 3 + Math.floor((level - 1) / 2));
  }

  function startDefender() {
    showScreen('defender');
    $('#defenderStart').classList.add('hidden');
    $('#defenderGameOver').classList.add('hidden');
    defender.running = true;
    defender.score = 0;
    defender.level = 1;
    defender.lives = 3;
    defender.correctChars = 0;
    defender.totalKeys = 0;
    defender.wordsCleared = 0;
    defender.words.forEach((w) => w.el.remove());
    defender.bullets.forEach((b) => b.el.remove());
    defender.words = [];
    defender.bullets = [];
    defender.targetedId = null;
    defender.spawnIntervalMs = spawnIntervalForLevel(1);
    defender.lastSpawnAt = performance.now();
    defender.lastFrameAt = performance.now();
    recentDefenderWords.length = 0;
    updateDefenderHUD();
    dInput.value = '';
    dInput.disabled = false;
    setTimeout(() => dInput.focus(), 30);

    if (defender.rafId) cancelAnimationFrame(defender.rafId);
    defender.rafId = requestAnimationFrame(defenderLoop);
  }

  function stopDefender() {
    defender.running = false;
    if (defender.rafId) cancelAnimationFrame(defender.rafId);
    defender.rafId = null;
  }

  function defenderLoop(now) {
    if (!defender.running) return;
    const dt = Math.min(64, now - defender.lastFrameAt) / 1000; // seconds, clamp big jumps
    defender.lastFrameAt = now;

    // Refresh arena rect each frame in case of resize
    defender.arenaRect = dArena.getBoundingClientRect();

    // Spawn words
    if (now - defender.lastSpawnAt > defender.spawnIntervalMs && defender.words.length < maxConcurrentForLevel(defender.level)) {
      spawnDefenderWord();
      defender.lastSpawnAt = now;
    }

    // Move words
    const arenaH = defender.arenaRect.height;
    const arenaW = defender.arenaRect.width;
    const fallSpeed = fallSpeedForLevel(defender.level);
    const shipBottomMargin = 96; // ship sprite + flames + bottom padding

    for (let i = defender.words.length - 1; i >= 0; i--) {
      const w = defender.words[i];
      if (w.exploding) continue;
      w.y += fallSpeed * dt;
      w.el.style.top = w.y + 'px';
      if (w.y >= arenaH - shipBottomMargin) {
        // Collided with ship area
        loseLife(w);
      }
    }

    // Move bullets
    for (let i = defender.bullets.length - 1; i >= 0; i--) {
      const b = defender.bullets[i];
      b.y -= 600 * dt;
      b.el.style.top = b.y + 'px';
      // If bullet reached its target word, explode and clean up
      const target = defender.words.find((w) => w.id === b.targetId && !w.exploding);
      if (target) {
        const targetTop = target.y;
        if (b.y <= targetTop + 14) {
          explodeWord(target);
          b.el.remove();
          defender.bullets.splice(i, 1);
          continue;
        }
      } else {
        // Target gone (e.g. lost), retire bullet when off screen
        if (b.y < -20) {
          b.el.remove();
          defender.bullets.splice(i, 1);
        }
      }
    }

    if (defender.running) defender.rafId = requestAnimationFrame(defenderLoop);
  }

  function spawnDefenderWord() {
    const arenaW = defender.arenaRect.width;
    const word = pickWord(defender.level);
    const el = document.createElement('div');
    el.className = 'def-word';
    el.innerHTML = `<span class="typed"></span><span class="rest">${escapeHtml(word)}</span>`;
    // Estimate word width so longer words get pulled away from edges proportionally.
    // Roughly ~10px per character at desktop sizes; a touch less on phones via CSS clamp.
    const estCharW = arenaW < 480 ? 9 : 11;
    const halfWordW = (word.length * estCharW) / 2;
    const padding = Math.max(40, halfWordW + 12);
    const minX = padding;
    const maxX = Math.max(minX, arenaW - padding);
    const x = minX + Math.random() * (maxX - minX);
    el.style.left = x + 'px';
    el.style.top = '-30px';
    dWordsLayer.appendChild(el);
    defender.words.push({
      id: Math.random().toString(36).slice(2, 9),
      word,
      typed: '',
      x,
      y: -30,
      el,
      exploding: false,
    });
  }

  function explodeWord(w) {
    if (w.exploding) return;
    w.exploding = true;
    w.el.classList.add('exploding');
    // Score: base + length bonus
    const points = 10 + w.word.length * 2;
    defender.score += points;
    defender.wordsCleared += 1;
    defender.correctChars += w.word.length;
    const newLevel = levelFromScore(defender.score);
    if (newLevel !== defender.level) {
      defender.level = newLevel;
      defender.spawnIntervalMs = spawnIntervalForLevel(newLevel);
    }
    setTimeout(() => {
      w.el.remove();
      defender.words = defender.words.filter((x) => x !== w);
    }, 280);
    if (defender.targetedId === w.id) {
      defender.targetedId = null;
      dInput.value = '';
    }
    updateDefenderHUD();
  }

  function loseLife(w) {
    w.exploding = true;
    w.el.classList.add('exploding');
    setTimeout(() => {
      w.el.remove();
      defender.words = defender.words.filter((x) => x !== w);
    }, 280);
    if (defender.targetedId === w.id) {
      defender.targetedId = null;
      dInput.value = '';
    }
    defender.lives = Math.max(0, defender.lives - 1);
    dArena.classList.add('hit', 'flash');
    setTimeout(() => dArena.classList.remove('hit', 'flash'), 260);
    updateDefenderHUD();
    if (defender.lives <= 0) gameOverDefender();
  }

  function fireBullet(targetWord) {
    const arenaH = defender.arenaRect.height;
    const arenaW = defender.arenaRect.width;
    // Fire from ship position toward word x
    const shipX = arenaW / 2;
    const el = document.createElement('div');
    el.className = 'def-bullet';
    el.style.left = targetWord.x + 'px';
    el.style.top = (arenaH - 110) + 'px';
    dBulletsLayer.appendChild(el);
    defender.bullets.push({ y: arenaH - 110, targetId: targetWord.id, el });
  }

  function updateDefenderHUD() {
    $('#defenderScore').textContent = defender.score;
    $('#defenderLevel').textContent = 'LV ' + defender.level;
    $('#defenderLives').textContent = '❤️'.repeat(Math.max(0, defender.lives)) || '💀';
    const acc = defender.totalKeys > 0 ? Math.round((defender.correctChars / defender.totalKeys) * 100) : 100;
    $('#defenderAcc').textContent = acc + '%';
    const best = parseInt(localStorage.getItem('tr.defender.best') || '0', 10);
    $('#defenderBest').textContent = best;
  }

  function gameOverDefender() {
    stopDefender();
    dInput.disabled = true;
    const acc = defender.totalKeys > 0 ? Math.round((defender.correctChars / defender.totalKeys) * 100) : 100;
    const prevBest = parseInt(localStorage.getItem('tr.defender.best') || '0', 10);
    const isBest = defender.score > prevBest;
    if (isBest) localStorage.setItem('tr.defender.best', String(defender.score));
    $('#goScore').textContent = defender.score;
    $('#goLevel').textContent = defender.level;
    $('#goWords').textContent = defender.wordsCleared;
    $('#goAcc').textContent = acc + '%';
    $('#goNewBest').classList.toggle('hidden', !isBest);
    $('#defenderGameOver').classList.remove('hidden');
    updateDefenderHUD();
  }

  // Input handling: matches against the closest word starting with the typed prefix.
  // Once a word is targeted, finishing it fires a bullet and clears the input.
  dInput.addEventListener('input', (e) => {
    if (!defender.running) return;
    const value = dInput.value;

    if (e.inputType !== 'historyUndo' && e.inputType !== 'historyRedo') {
      defender.totalKeys += 1;
    }

    if (!value) {
      clearTargets();
      return;
    }

    // Pick the lowest-y (closest to ship) word that starts with the typed value.
    const candidates = defender.words
      .filter((w) => !w.exploding && w.word.toLowerCase().startsWith(value.toLowerCase()))
      .sort((a, b) => b.y - a.y);

    if (candidates.length === 0) {
      // Mistake - shake input briefly
      dInput.classList.add('shake');
      setTimeout(() => dInput.classList.remove('shake'), 180);
      // Reset typed visualization on previous target if any
      clearTargets();
      // Soft penalty: clear value
      dInput.value = '';
      return;
    }

    const target = candidates[0];
    // Update visualization
    defender.words.forEach((w) => {
      if (w === target) {
        w.typed = value;
        w.el.classList.add('targeted');
        const typedSpan = w.el.querySelector('.typed');
        const restSpan = w.el.querySelector('.rest');
        typedSpan.textContent = w.word.slice(0, value.length);
        restSpan.textContent = w.word.slice(value.length);
      } else if (w.el.classList.contains('targeted')) {
        w.el.classList.remove('targeted');
        w.typed = '';
        w.el.querySelector('.typed').textContent = '';
        w.el.querySelector('.rest').textContent = w.word;
      }
    });
    defender.targetedId = target.id;

    // Word complete? fire bullet
    if (value.toLowerCase() === target.word.toLowerCase()) {
      fireBullet(target);
      dInput.value = '';
      defender.targetedId = null;
    }
  });

  function clearTargets() {
    defender.words.forEach((w) => {
      if (w.el.classList.contains('targeted')) {
        w.el.classList.remove('targeted');
        w.typed = '';
        const typedSpan = w.el.querySelector('.typed');
        const restSpan = w.el.querySelector('.rest');
        if (typedSpan) typedSpan.textContent = '';
        if (restSpan) restSpan.textContent = w.word;
      }
    });
    defender.targetedId = null;
  }

  $('#defenderBtn').addEventListener('click', () => {
    showScreen('defender');
    $('#defenderStart').classList.remove('hidden');
    $('#defenderGameOver').classList.add('hidden');
    updateDefenderHUD();
  });
  $('#defenderStartBtn').addEventListener('click', startDefender);
  $('#defenderRestartBtn').addEventListener('click', startDefender);
  $('#defenderLeaveBtn').addEventListener('click', () => {
    stopDefender();
    showScreen('home');
  });
  $('#defenderHomeBtn').addEventListener('click', () => {
    stopDefender();
    showScreen('home');
  });

  // Esc from Practice or Defender returns to Home (lightweight nav for arcade flow).
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    const active = document.querySelector('.screen.active');
    if (!active) return;
    if (active.id === 'practice' || active.id === 'defender') {
      stopDefender();
      showScreen('home');
    }
  });

  $('#defender').addEventListener('click', (e) => {
    if (!defender.running) return;
    if (e.target.closest('button, select, label')) return;
    dInput.focus();
  });

  showScreen('home');
})();
