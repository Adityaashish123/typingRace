const { validateProgress } = require('../lib/validators');

// A small helper to build the context object more concisely.
const ctx = (overrides = {}) => ({
  prevProgress: 0,
  lastProgressAt: 0,
  raceStartedAt: 1000,
  now: 1000,
  textLength: 100,
  ...overrides,
});

describe('validateProgress', () => {
  describe('basic shape', () => {
    test('rejects non-numeric progress', () => {
      const r = validateProgress({ progress: 'cheat', wpm: 50, accuracy: 100 }, ctx({ now: 11000 }));
      expect(r.ok).toBe(false);
      expect(r.reason).toMatch(/finite/);
    });

    test('rejects NaN progress', () => {
      const r = validateProgress({ progress: NaN }, ctx({ now: 11000 }));
      expect(r.ok).toBe(false);
    });

    test('rejects Infinity progress', () => {
      const r = validateProgress({ progress: Infinity }, ctx({ now: 11000 }));
      expect(r.ok).toBe(false);
    });

    test('clamps progress above 1 down to 1 (then validates against time cap)', () => {
      // 10s elapsed with 100-char text => max progress = (10*30)/100 = 3.0 capped to 1.
      const r = validateProgress({ progress: 5, wpm: 60, accuracy: 100 }, ctx({ now: 11000 }));
      expect(r.ok).toBe(true);
      expect(r.progress).toBe(1);
    });

    test('clamps negative progress to zero', () => {
      const r = validateProgress({ progress: -0.5, wpm: 0, accuracy: 100 }, ctx({ now: 11000 }));
      expect(r.ok).toBe(true);
      expect(r.progress).toBe(0);
    });
  });

  describe('monotonic non-decreasing progress', () => {
    test('rejects progress that goes backward', () => {
      const r = validateProgress(
        { progress: 0.4, wpm: 60, accuracy: 100 },
        ctx({ prevProgress: 0.6, now: 11000 }),
      );
      expect(r.ok).toBe(false);
      expect(r.reason).toMatch(/decreased/);
    });

    test('accepts progress equal to previous', () => {
      const r = validateProgress(
        { progress: 0.5, wpm: 60, accuracy: 100 },
        ctx({ prevProgress: 0.5, now: 11000 }),
      );
      expect(r.ok).toBe(true);
    });
  });

  describe('time-based progress cap (anti-cheat)', () => {
    test('rejects "0 to 100%" in 1 second on a 100-char text', () => {
      // 1 second elapsed: max chars = 30 -> max progress = 0.30 + slack 0.05 = 0.35
      const r = validateProgress(
        { progress: 1, wpm: 60, accuracy: 100 },
        ctx({ raceStartedAt: 1000, now: 2000, textLength: 100 }),
      );
      expect(r.ok).toBe(false);
      expect(r.reason).toMatch(/impossibly/);
    });

    test('accepts realistic 50% progress at 5 seconds on a 100-char text', () => {
      // 5s elapsed: max chars = 150 -> max progress capped at 1.0 -> 0.5 is fine.
      const r = validateProgress(
        { progress: 0.5, wpm: 60, accuracy: 100 },
        ctx({ raceStartedAt: 1000, now: 6000, textLength: 100 }),
      );
      expect(r.ok).toBe(true);
      expect(r.progress).toBe(0.5);
    });

    test('allows small clock-drift slack on first event', () => {
      // 1s elapsed, max progress 0.30, slack 0.05 -> 0.34 is allowed
      const r = validateProgress(
        { progress: 0.34, wpm: 60, accuracy: 100 },
        ctx({ raceStartedAt: 1000, now: 2000, textLength: 100 }),
      );
      expect(r.ok).toBe(true);
    });
  });

  describe('throttling', () => {
    test('rejects events arriving < 80ms apart', () => {
      const r = validateProgress(
        { progress: 0.2, wpm: 60, accuracy: 100 },
        ctx({ lastProgressAt: 11000, now: 11050, raceStartedAt: 1000, textLength: 100 }),
      );
      expect(r.ok).toBe(false);
      expect(r.reason).toMatch(/frequent/);
    });

    test('accepts events at the 250ms client cadence', () => {
      const r = validateProgress(
        { progress: 0.2, wpm: 60, accuracy: 100 },
        ctx({ lastProgressAt: 11000, now: 11250, raceStartedAt: 1000, textLength: 100 }),
      );
      expect(r.ok).toBe(true);
    });

    test('first event is not throttled (lastProgressAt is 0)', () => {
      const r = validateProgress(
        { progress: 0.05, wpm: 30, accuracy: 100 },
        ctx({ lastProgressAt: 0, now: 11500, raceStartedAt: 1000, textLength: 100 }),
      );
      expect(r.ok).toBe(true);
    });
  });

  describe('WPM and accuracy clamping', () => {
    test('clamps wpm above 250 down to 250', () => {
      const r = validateProgress(
        { progress: 0.3, wpm: 9999, accuracy: 100 },
        ctx({ now: 11000 }),
      );
      expect(r.ok).toBe(true);
      expect(r.wpm).toBe(250);
    });

    test('rounds and clamps accuracy to [0, 100]', () => {
      const high = validateProgress(
        { progress: 0.3, wpm: 60, accuracy: 250 },
        ctx({ now: 11000 }),
      );
      const low = validateProgress(
        { progress: 0.3, wpm: 60, accuracy: -20 },
        ctx({ now: 11000 }),
      );
      expect(high.accuracy).toBe(100);
      expect(low.accuracy).toBe(0);
    });

    test('coerces missing wpm and accuracy to safe defaults', () => {
      const r = validateProgress({ progress: 0.3 }, ctx({ now: 11000 }));
      expect(r.ok).toBe(true);
      expect(r.wpm).toBe(0);
      expect(r.accuracy).toBe(100);
    });
  });
});
