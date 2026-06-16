// Postgres persistence layer.
//
// Designed to be optional: if DATABASE_URL is not set the app boots
// without a database and all save/read calls become no-ops. This keeps
// local development easy and means production doesn't crash if the DB
// is briefly unreachable.

const { Pool } = require('pg');

const DATABASE_URL = process.env.DATABASE_URL;
let pool = null;
let ready = false;

if (DATABASE_URL) {
  pool = new Pool({
    connectionString: DATABASE_URL,
    // Render's managed Postgres requires SSL; the typical local Postgres does not.
    ssl: DATABASE_URL.includes('render.com') || process.env.PGSSL === 'true'
      ? { rejectUnauthorized: false }
      : undefined,
    max: 5,
    idleTimeoutMillis: 30000,
  });

  pool.on('error', (err) => {
    console.error('[db] pool error:', err.message);
  });
}

async function init() {
  if (!pool) {
    console.log('[db] DATABASE_URL not set; running without persistence.');
    return;
  }
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS multiplayer_results (
        id           BIGSERIAL PRIMARY KEY,
        room_code    TEXT        NOT NULL,
        player_name  TEXT        NOT NULL,
        avatar       TEXT        NOT NULL DEFAULT '🚀',
        wpm          INTEGER     NOT NULL,
        accuracy     INTEGER     NOT NULL,
        finish_ms    INTEGER,
        place        INTEGER,
        difficulty   TEXT        NOT NULL,
        theme        TEXT        NOT NULL DEFAULT 'random',
        finished     BOOLEAN     NOT NULL DEFAULT FALSE,
        created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_mp_top ON multiplayer_results (wpm DESC, accuracy DESC) WHERE finished = TRUE;`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_mp_recent ON multiplayer_results (created_at DESC);`);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS practice_runs (
        id           BIGSERIAL PRIMARY KEY,
        player_name  TEXT        NOT NULL,
        avatar       TEXT        NOT NULL DEFAULT '🚀',
        wpm          INTEGER     NOT NULL,
        accuracy     INTEGER     NOT NULL,
        duration_ms  INTEGER     NOT NULL,
        difficulty   TEXT        NOT NULL,
        theme        TEXT        NOT NULL DEFAULT 'random',
        created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_practice_top ON practice_runs (difficulty, wpm DESC);`);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS defender_runs (
        id            BIGSERIAL PRIMARY KEY,
        player_name   TEXT        NOT NULL,
        avatar        TEXT        NOT NULL DEFAULT '🚀',
        score         INTEGER     NOT NULL,
        level         INTEGER     NOT NULL,
        words_cleared INTEGER     NOT NULL,
        accuracy      INTEGER     NOT NULL,
        created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_defender_top ON defender_runs (score DESC);`);

    ready = true;
    console.log('[db] connected & schema ready.');
  } catch (err) {
    console.error('[db] init failed:', err.message);
    ready = false;
  }
}

function isEnabled() { return ready && !!pool; }

// ====== Writes ======

async function recordMultiplayerResults({ roomCode, difficulty, theme, players }) {
  if (!isEnabled()) return;
  if (!players || players.length === 0) return;
  const values = [];
  const params = [];
  let i = 1;
  for (const p of players) {
    values.push(`($${i++}, $${i++}, $${i++}, $${i++}, $${i++}, $${i++}, $${i++}, $${i++}, $${i++}, $${i++})`);
    params.push(
      roomCode,
      String(p.name).slice(0, 24),
      String(p.avatar || '🚀').slice(0, 8),
      Math.max(0, Math.min(250, Math.round(p.wpm || 0))),
      Math.max(0, Math.min(100, Math.round(p.accuracy || 0))),
      p.finishTime ? Math.round(p.finishTime) : null,
      p.place || null,
      difficulty,
      theme || 'random',
      !!p.finished,
    );
  }
  const sql = `INSERT INTO multiplayer_results
    (room_code, player_name, avatar, wpm, accuracy, finish_ms, place, difficulty, theme, finished)
    VALUES ${values.join(', ')}`;
  try {
    await pool.query(sql, params);
  } catch (err) {
    console.error('[db] recordMultiplayerResults failed:', err.message);
  }
}

async function recordPracticeRun({ playerName, avatar, wpm, accuracy, durationMs, difficulty, theme }) {
  if (!isEnabled()) return;
  try {
    await pool.query(
      `INSERT INTO practice_runs (player_name, avatar, wpm, accuracy, duration_ms, difficulty, theme)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        String(playerName || 'Anonymous').slice(0, 24),
        String(avatar || '🚀').slice(0, 8),
        Math.max(0, Math.min(250, Math.round(wpm || 0))),
        Math.max(0, Math.min(100, Math.round(accuracy || 0))),
        Math.max(0, Math.round(durationMs || 0)),
        difficulty,
        theme || 'random',
      ],
    );
  } catch (err) {
    console.error('[db] recordPracticeRun failed:', err.message);
  }
}

async function recordDefenderRun({ playerName, avatar, score, level, wordsCleared, accuracy }) {
  if (!isEnabled()) return;
  try {
    await pool.query(
      `INSERT INTO defender_runs (player_name, avatar, score, level, words_cleared, accuracy)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        String(playerName || 'Anonymous').slice(0, 24),
        String(avatar || '🚀').slice(0, 8),
        Math.max(0, Math.round(score || 0)),
        Math.max(1, Math.round(level || 1)),
        Math.max(0, Math.round(wordsCleared || 0)),
        Math.max(0, Math.min(100, Math.round(accuracy || 0))),
      ],
    );
  } catch (err) {
    console.error('[db] recordDefenderRun failed:', err.message);
  }
}

// ====== Reads ======

async function getRaceLeaderboard({ limit = 50, difficulty, theme } = {}) {
  if (!isEnabled()) return [];
  const where = ['finished = TRUE'];
  const params = [];
  let i = 1;
  if (difficulty) { where.push(`difficulty = $${i++}`); params.push(difficulty); }
  if (theme && theme !== 'random') { where.push(`theme = $${i++}`); params.push(theme); }
  params.push(Math.min(200, Math.max(1, limit)));
  const sql = `
    SELECT player_name, avatar, wpm, accuracy, finish_ms, difficulty, theme, created_at
    FROM multiplayer_results
    WHERE ${where.join(' AND ')}
    ORDER BY wpm DESC, accuracy DESC, finish_ms ASC
    LIMIT $${i}
  `;
  try {
    const { rows } = await pool.query(sql, params);
    return rows;
  } catch (err) {
    console.error('[db] getRaceLeaderboard failed:', err.message);
    return [];
  }
}

async function getPracticeLeaderboard({ limit = 50, difficulty, theme } = {}) {
  if (!isEnabled()) return [];
  const where = [];
  const params = [];
  let i = 1;
  if (difficulty) { where.push(`difficulty = $${i++}`); params.push(difficulty); }
  if (theme && theme !== 'random') { where.push(`theme = $${i++}`); params.push(theme); }
  params.push(Math.min(200, Math.max(1, limit)));
  const sql = `
    SELECT player_name, avatar, wpm, accuracy, duration_ms, difficulty, theme, created_at
    FROM practice_runs
    ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
    ORDER BY wpm DESC, accuracy DESC
    LIMIT $${i}
  `;
  try {
    const { rows } = await pool.query(sql, params);
    return rows;
  } catch (err) {
    console.error('[db] getPracticeLeaderboard failed:', err.message);
    return [];
  }
}

async function getDefenderLeaderboard({ limit = 50 } = {}) {
  if (!isEnabled()) return [];
  try {
    const { rows } = await pool.query(
      `SELECT player_name, avatar, score, level, words_cleared, accuracy, created_at
       FROM defender_runs
       ORDER BY score DESC, level DESC
       LIMIT $1`,
      [Math.min(200, Math.max(1, limit))],
    );
    return rows;
  } catch (err) {
    console.error('[db] getDefenderLeaderboard failed:', err.message);
    return [];
  }
}

module.exports = {
  init,
  isEnabled,
  recordMultiplayerResults,
  recordPracticeRun,
  recordDefenderRun,
  getRaceLeaderboard,
  getPracticeLeaderboard,
  getDefenderLeaderboard,
};
