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
      if (!e.target.closest('button') && !e.target.closest('input')) {
        input.focus();
      }
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

    let text;
    try {
      const res = await fetch('/api/practice-text?difficulty=' + practice.difficulty);
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

  $('#practiceBtn').addEventListener('click', () => {
    showScreen('practice');
    loadBests();
    startPracticeRun('medium');
  });
  $('#practiceLeaveBtn').addEventListener('click', () => showScreen('home'));
  $('#practiceNewBtn').addEventListener('click', () => startPracticeRun(practice.difficulty));
  $('#practiceAgainBtn').addEventListener('click', () => startPracticeRun(practice.difficulty));
  $('#practiceCloseResult').addEventListener('click', () => $('#practiceResult').classList.add('hidden'));

  $('#practiceDiffSeg').addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-diff]');
    if (!btn) return;
    startPracticeRun(btn.dataset.diff);
  });

  $('#practice').addEventListener('click', (e) => {
    if (!e.target.closest('button') && !e.target.closest('input')) pInput.focus();
  });

  showScreen('home');
})();
