const express = require('express');
const http = require('http');
const path = require('path');
const { Server } = require('socket.io');
const { getRandomText } = require('./texts');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

app.use(express.static(path.join(__dirname, 'public')));

// Expose a random text for solo practice mode (no socket required).
app.get('/api/practice-text', (req, res) => {
  const difficulty = ['easy', 'medium', 'hard'].includes(req.query.difficulty)
    ? req.query.difficulty
    : 'medium';
  res.json({ difficulty, text: getRandomText(difficulty) });
});

// In-memory room store. For a real product, swap with Redis.
const rooms = new Map();

const COUNTDOWN_SECONDS = 5;
const RACE_TIMEOUT_SECONDS = 180;
const MAX_PLAYERS = 8;

function makeRoomCode() {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  let code;
  do {
    code = Array.from({ length: 5 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  } while (rooms.has(code));
  return code;
}

function publicRoomState(room) {
  return {
    code: room.code,
    hostId: room.hostId,
    status: room.status, // 'lobby' | 'countdown' | 'racing' | 'finished'
    text: room.status === 'lobby' ? null : room.text,
    difficulty: room.difficulty,
    startsAt: room.startsAt,
    endsAt: room.endsAt,
    players: Array.from(room.players.values()).map((p) => ({
      id: p.id,
      name: p.name,
      avatar: p.avatar,
      progress: p.progress,
      wpm: p.wpm,
      accuracy: p.accuracy,
      finished: p.finished,
      finishTime: p.finishTime,
      place: p.place,
      ready: p.ready,
      effects: p.effects,
      powerUps: p.powerUps.length,
    })),
  };
}

function broadcastRoom(code) {
  const room = rooms.get(code);
  if (!room) return;
  io.to(code).emit('room:state', publicRoomState(room));
}

function startCountdown(code) {
  const room = rooms.get(code);
  if (!room) return;
  room.status = 'countdown';
  room.text = getRandomText(room.difficulty);
  room.startsAt = Date.now() + COUNTDOWN_SECONDS * 1000;
  room.endsAt = null;
  for (const p of room.players.values()) {
    p.progress = 0;
    p.wpm = 0;
    p.accuracy = 100;
    p.finished = false;
    p.finishTime = null;
    p.place = null;
    p.effects = [];
    p.powerUps = [];
  }
  broadcastRoom(code);

  setTimeout(() => {
    const r = rooms.get(code);
    if (!r || r.status !== 'countdown') return;
    r.status = 'racing';
    r.startedAt = Date.now();
    r.endsAt = Date.now() + RACE_TIMEOUT_SECONDS * 1000;
    broadcastRoom(code);

    // Auto-finish if time runs out
    r.timeoutHandle = setTimeout(() => finishRace(code), RACE_TIMEOUT_SECONDS * 1000);
  }, COUNTDOWN_SECONDS * 1000);
}

function maybeFinishRace(code) {
  const room = rooms.get(code);
  if (!room || room.status !== 'racing') return;
  const allDone = Array.from(room.players.values()).every((p) => p.finished);
  if (allDone) finishRace(code);
}

function finishRace(code) {
  const room = rooms.get(code);
  if (!room) return;
  if (room.timeoutHandle) clearTimeout(room.timeoutHandle);
  room.status = 'finished';
  // Assign places to anyone who didn't finish based on progress
  const unfinished = Array.from(room.players.values())
    .filter((p) => !p.finished)
    .sort((a, b) => b.progress - a.progress);
  const finishedCount = Array.from(room.players.values()).filter((p) => p.finished).length;
  unfinished.forEach((p, idx) => {
    p.place = finishedCount + idx + 1;
  });
  broadcastRoom(code);
}

const POWER_UP_TYPES = ['fog', 'shake', 'reverse'];

function maybeGrantPowerUp(player, prevProgress) {
  // Award a power-up at 25%, 50%, 75% milestones
  const milestones = [0.25, 0.5, 0.75];
  for (const m of milestones) {
    if (prevProgress < m && player.progress >= m) {
      const type = POWER_UP_TYPES[Math.floor(Math.random() * POWER_UP_TYPES.length)];
      player.powerUps.push(type);
    }
  }
}

io.on('connection', (socket) => {
  let currentRoomCode = null;

  socket.on('room:create', ({ name, avatar, difficulty }, ack) => {
    const code = makeRoomCode();
    const room = {
      code,
      hostId: socket.id,
      status: 'lobby',
      players: new Map(),
      text: null,
      difficulty: difficulty || 'medium',
      startsAt: null,
      endsAt: null,
      startedAt: null,
      timeoutHandle: null,
    };
    rooms.set(code, room);
    joinRoom(socket, code, name, avatar);
    if (ack) ack({ ok: true, code });
  });

  socket.on('room:join', ({ code, name, avatar }, ack) => {
    code = (code || '').toUpperCase().trim();
    const room = rooms.get(code);
    if (!room) return ack && ack({ ok: false, error: 'Room not found' });
    if (room.players.size >= MAX_PLAYERS) return ack && ack({ ok: false, error: 'Room is full' });
    if (room.status !== 'lobby') return ack && ack({ ok: false, error: 'Race in progress, try again later' });
    joinRoom(socket, code, name, avatar);
    if (ack) ack({ ok: true, code });
  });

  function joinRoom(s, code, name, avatar) {
    const room = rooms.get(code);
    if (!room) return;
    s.join(code);
    currentRoomCode = code;
    room.players.set(s.id, {
      id: s.id,
      name: (name || 'Racer').slice(0, 20),
      avatar: avatar || '🚀',
      progress: 0,
      wpm: 0,
      accuracy: 100,
      finished: false,
      finishTime: null,
      place: null,
      ready: false,
      effects: [],
      powerUps: [],
    });
    s.emit('room:joined', { code, you: s.id });
    broadcastRoom(code);
  }

  socket.on('room:setDifficulty', ({ difficulty }) => {
    if (!currentRoomCode) return;
    const room = rooms.get(currentRoomCode);
    if (!room || room.hostId !== socket.id) return;
    if (!['easy', 'medium', 'hard', 'code'].includes(difficulty)) return;
    room.difficulty = difficulty;
    broadcastRoom(currentRoomCode);
  });

  socket.on('room:ready', ({ ready }) => {
    if (!currentRoomCode) return;
    const room = rooms.get(currentRoomCode);
    if (!room) return;
    const p = room.players.get(socket.id);
    if (!p) return;
    p.ready = !!ready;
    broadcastRoom(currentRoomCode);

    if (room.status === 'lobby' && room.players.size >= 1) {
      const allReady = Array.from(room.players.values()).every((pl) => pl.ready);
      if (allReady) startCountdown(currentRoomCode);
    }
  });

  socket.on('room:startNow', () => {
    if (!currentRoomCode) return;
    const room = rooms.get(currentRoomCode);
    if (!room || room.hostId !== socket.id) return;
    if (room.status !== 'lobby') return;
    startCountdown(currentRoomCode);
  });

  socket.on('room:rematch', () => {
    if (!currentRoomCode) return;
    const room = rooms.get(currentRoomCode);
    if (!room || room.hostId !== socket.id) return;
    if (room.status !== 'finished') return;
    room.status = 'lobby';
    for (const p of room.players.values()) {
      p.ready = false;
      p.progress = 0;
      p.wpm = 0;
      p.accuracy = 100;
      p.finished = false;
      p.finishTime = null;
      p.place = null;
      p.effects = [];
      p.powerUps = [];
    }
    broadcastRoom(currentRoomCode);
  });

  socket.on('race:progress', ({ progress, wpm, accuracy }) => {
    if (!currentRoomCode) return;
    const room = rooms.get(currentRoomCode);
    if (!room || room.status !== 'racing') return;
    const p = room.players.get(socket.id);
    if (!p || p.finished) return;
    const prev = p.progress;
    p.progress = Math.max(0, Math.min(1, Number(progress) || 0));
    p.wpm = Math.max(0, Math.round(Number(wpm) || 0));
    p.accuracy = Math.max(0, Math.min(100, Math.round(Number(accuracy) || 0)));
    maybeGrantPowerUp(p, prev);

    if (p.progress >= 1 && !p.finished) {
      p.finished = true;
      p.finishTime = Date.now() - room.startedAt;
      const finishedCount = Array.from(room.players.values()).filter((x) => x.finished).length;
      p.place = finishedCount; // 1st, 2nd, etc.
    }
    broadcastRoom(currentRoomCode);
    if (p.finished) maybeFinishRace(currentRoomCode);
  });

  socket.on('race:usePowerUp', ({ targetId }) => {
    if (!currentRoomCode) return;
    const room = rooms.get(currentRoomCode);
    if (!room || room.status !== 'racing') return;
    const sender = room.players.get(socket.id);
    if (!sender || sender.finished || sender.powerUps.length === 0) return;
    const target = room.players.get(targetId);
    if (!target || target.id === sender.id || target.finished) return;
    const type = sender.powerUps.shift();
    const effect = { type, expiresAt: Date.now() + 4000, from: sender.name };
    target.effects.push(effect);
    io.to(target.id).emit('race:hit', effect);
    io.to(currentRoomCode).emit('race:powerUpUsed', { from: sender.name, to: target.name, type });
    // Clear effect server-side after expiry so it doesn't pile up forever
    setTimeout(() => {
      target.effects = target.effects.filter((e) => e !== effect);
      broadcastRoom(currentRoomCode);
    }, 4100);
    broadcastRoom(currentRoomCode);
  });

  socket.on('race:emoji', ({ emoji }) => {
    if (!currentRoomCode) return;
    const room = rooms.get(currentRoomCode);
    if (!room) return;
    const p = room.players.get(socket.id);
    if (!p) return;
    const safe = (emoji || '').slice(0, 8);
    if (!safe) return;
    io.to(currentRoomCode).emit('race:emoji', { from: p.name, fromId: p.id, emoji: safe });
  });

  socket.on('disconnect', () => {
    if (!currentRoomCode) return;
    const room = rooms.get(currentRoomCode);
    if (!room) return;
    room.players.delete(socket.id);
    if (room.players.size === 0) {
      if (room.timeoutHandle) clearTimeout(room.timeoutHandle);
      rooms.delete(currentRoomCode);
      return;
    }
    if (room.hostId === socket.id) {
      room.hostId = room.players.keys().next().value;
    }
    if (room.status === 'racing') maybeFinishRace(currentRoomCode);
    broadcastRoom(currentRoomCode);
  });
});

const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0';
server.listen(PORT, HOST, () => {
  console.log(`🏁 Typing Race running at http://localhost:${PORT}`);
  console.log(`   LAN: any device on your Wi-Fi can reach http://<your-lan-ip>:${PORT}`);
  console.log(`   Internet: run "npm run tunnel" to get a public URL to share.`);
});
