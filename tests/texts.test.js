const { getRandomText, THEMES } = require('../texts');

describe('text generation', () => {
  test('exposes the expected themes', () => {
    const expected = ['general', 'movies', 'science', 'tech', 'history', 'quotes', 'code'];
    for (const key of expected) {
      expect(THEMES[key]).toBeDefined();
      expect(typeof THEMES[key].label).toBe('string');
    }
  });

  test('every theme has at least 3 sentences for each difficulty', () => {
    for (const key of Object.keys(THEMES)) {
      for (const diff of ['easy', 'medium', 'hard']) {
        const list = THEMES[key][diff];
        expect(Array.isArray(list)).toBe(true);
        expect(list.length).toBeGreaterThanOrEqual(3);
      }
    }
  });

  test('returns non-empty text for every difficulty x theme combination', () => {
    for (const theme of Object.keys(THEMES)) {
      for (const diff of ['easy', 'medium', 'hard']) {
        const text = getRandomText(diff, theme);
        expect(typeof text).toBe('string');
        expect(text.length).toBeGreaterThan(0);
      }
    }
  });

  test('"random" theme returns text from one of the non-code themes', () => {
    // Run a few times: the result should always be present in at least one theme pool.
    for (let i = 0; i < 10; i++) {
      const text = getRandomText('medium', 'random');
      const allMedium = Object.entries(THEMES)
        .filter(([key]) => key !== 'code')
        .flatMap(([, t]) => t.medium);
      // Any sentence inside the combined text must come from the non-code pool.
      const anyMatch = allMedium.some((s) => text.includes(s));
      expect(anyMatch).toBe(true);
    }
  });

  test('falls back to medium when given an unknown difficulty', () => {
    const text = getRandomText('superhard', 'general');
    const allMedium = THEMES.general.medium;
    const anyMatch = allMedium.some((s) => text.includes(s));
    expect(anyMatch).toBe(true);
  });

  test('produces varied output across many calls (sanity check on randomness)', () => {
    const seen = new Set();
    for (let i = 0; i < 30; i++) {
      seen.add(getRandomText('medium', 'general'));
    }
    // Not strictly guaranteed, but a properly-randomized 30-call sample over a 30-sentence
    // pool with combinations of 2-3 should produce far more than 5 distinct outputs.
    expect(seen.size).toBeGreaterThan(5);
  });

  test('code theme returns a single snippet (never combined)', () => {
    for (let i = 0; i < 10; i++) {
      const text = getRandomText('medium', 'code');
      const list = THEMES.code.medium;
      expect(list).toContain(text);
    }
  });
});
