# Typing Race 🏁

A real-time multiplayer typing game with rooms, power-ups, themed sentence packs, a single-player arcade mode, and a global leaderboard. Built with Node.js, Socket.IO, and PostgreSQL.

**🌐 Live demo:** https://typing-race-6oaz.onrender.com

---

## Features

- 🏎️ **Real-time multiplayer races** — up to 8 players per room, live race-track visualization, WPM and accuracy updating ~4 times per second across all clients
- ⚡ **Power-ups** — earn at 25/50/75% progress and lob `FOG`, `SHAKE`, or `REVERSE` at opponents
- 😂 **Emoji reactions** — taunt and cheer mid-race
- 🎚️ **3 difficulties × 7 themes** — Easy/Medium/Hard, themes include General, Movies, Science, Tech, History, Quotes, and Code; tens of thousands of unique text combinations
- 🎯 **Practice mode** — solo runs with personal best tracking per difficulty, theme picker, errors-allowed Finish button, Enter shortcut
- 🚀 **Space Defender (arcade mode)** — typing meets bullet-hell: type words to fire bullets at falling targets; difficulty scales with score (faster spawn, longer words, more concurrent targets)
- 🏆 **Global leaderboards** — Postgres-backed top scores for Race, Practice, and Defender, filterable by difficulty and theme
- 🛡️ **Anti-cheat** — paste/drag-drop blocked client-side, server validates progress (no jumps, no impossible WPM, throttled emit rate)
- 📱 **Responsive** — works on phone, tablet, and desktop with proper breakpoints and touch targets
- 🔗 **Shareable invite links** — one-click copy

## Tech stack

| Layer | Choice |
|---|---|
| Runtime | Node.js 20 |
| Web framework | Express 4 |
| Real-time | Socket.IO 4 (WebSockets) |
| Database | PostgreSQL (managed on Render) |
| Frontend | Vanilla HTML / CSS / JavaScript — no build step, no framework |
| Testing | Jest + Supertest (30 tests across validators, text generation, and HTTP endpoints) |
| Deploy | Render (web service + managed Postgres, auto-deploy from GitHub) |
| Other | Dockerfile and `fly.toml` included for portability |

## Architecture

The server is a single Express + Socket.IO process. Game state is held in memory as a `Map<roomCode, Room>`; persistence via Postgres is opt-in (the app starts and runs fine without a database, with leaderboards disabled).

Each room is a state machine that transitions `lobby → countdown → racing → finished`. State is broadcast over Socket.IO room channels every time it changes, so every client sees the same view of the world.

```
┌────────┐  ws  ┌─────────────────┐  pg  ┌────────────┐
│ Client │◄────►│ Express + IO    │◄────►│ PostgreSQL │
└────────┘      │  - rooms (Map)  │      └────────────┘
                │  - state machine│
                │  - anti-cheat   │
                └─────────────────┘
```

### Anti-cheat layers

- **Client-side:** typing inputs block `paste`, `drop`, and right-click `contextmenu`
- **Server-side:** every `race:progress` event is validated for monotonic non-decreasing progress, capped at `(elapsed seconds × max human chars/sec) / text length`, throttled to ≥80ms apart, and clamped to ≤250 WPM (the world record is ~216)

### Schema (Postgres)

Three indexed tables — schema is auto-created on boot:

```sql
multiplayer_results (room_code, player_name, avatar, wpm, accuracy, finish_ms, place, difficulty, theme, finished, created_at)
practice_runs       (player_name, avatar, wpm, accuracy, duration_ms, difficulty, theme, created_at)
defender_runs       (player_name, avatar, score, level, words_cleared, accuracy, created_at)
```

Indexes: `multiplayer_results (wpm DESC, accuracy DESC) WHERE finished`, `practice_runs (difficulty, wpm DESC)`, `defender_runs (score DESC)`.

## Getting started locally

```bash
git clone https://github.com/Adityaashish123/typingRace
cd typingRace
npm install
npm start
```

Open http://localhost:3000.

The leaderboard is disabled until you set `DATABASE_URL`. Everything else (multiplayer, practice, defender) works without a database.

To enable the leaderboard locally, run any local Postgres and set:

```bash
DATABASE_URL=postgresql://localhost/typingrace npm start
```

The schema is created automatically on first boot.

## Testing

Unit + integration tests via Jest:

```bash
npm test
```

Three test suites:
- `tests/validators.test.js` — anti-cheat rules (progress bounds, monotonicity, time cap, throttling, WPM/accuracy clamping)
- `tests/texts.test.js` — themed text generation across difficulties
- `tests/api.test.js` — HTTP endpoints via supertest, including the graceful-degrade path when the database isn't configured

Anti-cheat logic was deliberately extracted into a pure module (`lib/validators.js`) so it can be unit tested without spinning up sockets, rooms, or timers.

## Project layout

```
typingRace/
├── server.js            # Express + Socket.IO server, room state machine
├── db.js                # Optional Postgres persistence layer (graceful degrade)
├── texts.js             # Themed sentence pools per difficulty
├── lib/
│   └── validators.js    # Pure anti-cheat validation rules (testable)
├── tests/
│   ├── validators.test.js
│   ├── texts.test.js
│   └── api.test.js
├── public/
│   ├── index.html       # Single-page UI
│   ├── styles.css       # Phone/tablet/desktop responsive styles
│   └── app.js           # Client logic (typing engine, state, render, sockets)
├── Dockerfile
├── render.yaml
├── fly.toml
└── package.json
```

## Deployment

The repository auto-deploys to Render on every push to `main` via the included `render.yaml` blueprint. The same Node code can ship to any container host using the included `Dockerfile`.

For a managed Postgres instance, see Render's Postgres docs — the only required environment variable is `DATABASE_URL` (Render injects SSL config automatically).

## Production considerations

This project is honest about its limits.

| Concern | Current state | What scaling would look like |
|---|---|---|
| **Concurrency** | ~800 players (~100 active rooms) per Node instance | Move room state to Redis; add the [Socket.IO Redis adapter](https://socket.io/docs/v4/redis-adapter/) so events propagate across instances |
| **Sticky sessions** | Single-instance, not needed | Required at the load balancer for the WebSocket handshake when scaling to 2+ instances |
| **In-memory state** | Lost on restart | Redis (or Postgres for non-transient) for rooms; current Postgres covers historical results only |
| **Rate limiting** | Not implemented | Per-IP and per-socket throttles on `room:create`, `race:progress`, `race:emoji`, etc. |
| **Authentication** | None — players pick a name | Optional account layer (Postgres + bcrypt or OAuth) for verified leaderboards |
| **Observability** | `console.log` only | Structured logs (pino), request IDs, metrics (Prometheus), error tracking (Sentry) |
| **Tests** | 30 unit + integration tests (Jest + Supertest) covering validators, text generation, and API | Add room state machine tests, Socket.IO integration tests, end-to-end with Playwright |

The trade-offs above are intentional for the project's scope (play with friends, run on free hosting). Each item is a real, scoped piece of work — not a vague "TODO".

## License

MIT
