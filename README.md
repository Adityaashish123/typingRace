# Typing Race 🏁

A real-time multiplayer typing race game. Create a room, share the code, and race to the finish line. Sabotage your friends with power-ups along the way. Solo Practice mode tracks your personal best WPM per difficulty.

## Features

- 🏎️ **Live race track** — every player is a racer sliding from start to finish in real time
- ⌨️ **Honest typing engine** — character feedback, live WPM, accuracy
- ⚡ **Power-ups** — earn at 25/50/75% progress and lob them at opponents
  - **FOG** blurs their screen, **SHAKE** shakes their UI, **REVERSE** locks their input
- 😂 **Emoji reactions** — taunt and cheer mid-race
- 🎚️ **Difficulties** — easy / medium / hard / code (real code snippets)
- 🎯 **Practice Mode** — solo runs with personal best WPM tracked per difficulty (stored locally)
- 🏆 **Results screen** with podium and rematch button
- 🔗 **Shareable invite links** — one-click copy

## Quick start (local)

```bash
npm install
npm start
```

Then open http://localhost:3000.

## Playing with friends

`localhost` only works on your own machine. Pick one of these to play with anyone:

### Option 1: Quick share with a tunnel (no deploy)
```bash
npm start            # in one terminal
npm run tunnel       # in another terminal
```
You'll get a public URL like `https://typing-race.loca.lt`. Share it. Done. The tunnel only works while both processes are running.

For a more reliable tunnel, use [ngrok](https://ngrok.com):
```bash
ngrok http 3000
```

### Option 2: Deploy to Render (recommended, free tier)

1. Push this repo to GitHub
2. Go to [render.com](https://render.com) → New → Web Service → connect your repo
3. Render auto-detects `render.yaml`. Click **Create**
4. Done. You get a permanent URL like `https://typing-race.onrender.com`

The free tier sleeps after 15 minutes of inactivity (cold start ~30 seconds). Upgrade to keep it always-on.

### Option 3: Deploy to Fly.io
```bash
brew install flyctl          # or curl -L https://fly.io/install.sh | sh
fly auth signup              # or fly auth login
fly launch --copy-config     # uses the included fly.toml
fly deploy
```

### Option 4: Deploy to Railway
```bash
npm i -g @railway/cli
railway login
railway init
railway up
```

### Option 5: Any Docker host
A `Dockerfile` is included. Build and run anywhere that runs containers:
```bash
docker build -t typing-race .
docker run -p 3000:3000 typing-race
```
Works on Fly, AWS App Runner, Google Cloud Run, Azure Container Apps, DigitalOcean App Platform, your own VM, etc.

## Why not Vercel / Netlify / GitHub Pages?

Those are great for static sites but Socket.IO needs persistent WebSocket connections. Use a host that runs a real Node process: Render, Railway, Fly, Heroku, EC2, etc.

## Stack

- Node.js + Express + Socket.IO
- Vanilla HTML/CSS/JS on the client (no build step)

## Layout

```
TypingRace/
├── server.js          # Express + Socket.IO server, room/race state machine
├── texts.js           # Text snippets per difficulty
├── public/
│   ├── index.html     # Single page UI (Home, Practice, Lobby, Race, Results)
│   ├── styles.css
│   └── app.js
├── Dockerfile
├── render.yaml        # Render blueprint
├── fly.toml           # Fly.io config
└── package.json
```

## How a race plays out

1. Host creates a room → gets a 5-character code (e.g. `K7PR2`)
2. Players join with the code or via the invite link
3. Everyone clicks **I'm Ready** (host can also force-start)
4. 5-second countdown, then the same text appears for everyone
5. First to finish wins. Results show WPM, accuracy, and finish time

## Tweakables

`server.js`:
- `COUNTDOWN_SECONDS`, `RACE_TIMEOUT_SECONDS`, `MAX_PLAYERS`, `POWER_UP_TYPES`

`texts.js`:
- Add your own snippets to any difficulty bucket.

## Scaling notes

The server uses in-memory room state, which means one instance only. To run multiple instances behind a load balancer, you need:
1. **Sticky sessions** on the load balancer (Socket.IO handshake)
2. The [Socket.IO Redis adapter](https://socket.io/docs/v4/redis-adapter/) so events propagate between instances
3. Move room state out of memory into Redis or a database

For a hobby project with a few hundred players, one instance is plenty.
