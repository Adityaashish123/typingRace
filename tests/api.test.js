// HTTP API smoke tests via supertest.
//
// We import the Express app directly (server.js exports `app` and only
// calls .listen() when run via `node server.js`). We unset DATABASE_URL
// before requiring so the persistence layer no-ops gracefully and our
// tests stay hermetic — no DB needed.

beforeAll(() => {
  delete process.env.DATABASE_URL;
});

const request = require('supertest');
const { app } = require('../server');

describe('public API (no database)', () => {
  test('GET /api/themes returns the configured themes', async () => {
    const res = await request(app).get('/api/themes');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.themes)).toBe(true);
    const keys = res.body.themes.map((t) => t.key);
    expect(keys).toEqual(
      expect.arrayContaining(['general', 'movies', 'science', 'tech', 'history', 'quotes', 'code']),
    );
  });

  test('GET /api/practice-text returns a text for a valid difficulty', async () => {
    const res = await request(app)
      .get('/api/practice-text')
      .query({ difficulty: 'easy', theme: 'general' });
    expect(res.status).toBe(200);
    expect(res.body.difficulty).toBe('easy');
    expect(res.body.theme).toBe('general');
    expect(typeof res.body.text).toBe('string');
    expect(res.body.text.length).toBeGreaterThan(0);
  });

  test('GET /api/practice-text falls back to medium for unknown difficulty', async () => {
    const res = await request(app)
      .get('/api/practice-text')
      .query({ difficulty: 'extreme' });
    expect(res.status).toBe(200);
    expect(res.body.difficulty).toBe('medium');
  });

  test('GET /api/leaderboard/race responds 200 with enabled:false (graceful degrade)', async () => {
    const res = await request(app).get('/api/leaderboard/race');
    expect(res.status).toBe(200);
    expect(res.body.enabled).toBe(false);
    expect(Array.isArray(res.body.rows)).toBe(true);
  });

  test('POST /api/practice-result rejects an obviously invalid difficulty', async () => {
    const res = await request(app)
      .post('/api/practice-result')
      .send({ playerName: 'x', wpm: 50, accuracy: 90, durationMs: 5000, difficulty: 'extreme' });
    expect(res.status).toBe(400);
    expect(res.body.ok).toBe(false);
  });

  test('POST /api/practice-result rejects a sub-1.5s "run" (anti-cheat sanity check)', async () => {
    const res = await request(app)
      .post('/api/practice-result')
      .send({ playerName: 'x', wpm: 200, accuracy: 100, durationMs: 50, difficulty: 'medium' });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/short/);
  });

  test('POST /api/defender-result rejects scoring without clearing any words', async () => {
    const res = await request(app)
      .post('/api/defender-result')
      .send({ playerName: 'x', score: 9999, level: 9, wordsCleared: 0, accuracy: 100 });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/inconsistent/);
  });
});
