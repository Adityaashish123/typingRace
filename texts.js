// Text snippets grouped by difficulty. Hand-picked to be fun and varied.
const TEXTS = {
  easy: [
    'The quick brown fox jumps over the lazy dog. A pack of sly dogs watch a quick fox dart past.',
    'Coffee is the fuel of the modern world. One cup at dawn turns sleepy heads into busy minds.',
    'Cats nap in sunny patches all day. They wake up only when food appears or a bird flies by.',
    'A long walk in fresh air clears the mind faster than any app or quick fix can ever hope to.',
    'Pizza night is the best night. Warm cheese, soft crust, and a movie make the week feel new.',
  ],
  medium: [
    'Programming is the art of telling another human what one wants the computer to do. Clean code is not written by following a set of rules. You do not become a good craftsman by learning a list of heuristics.',
    'The best way to predict the future is to invent it. Innovation distinguishes between a leader and a follower, and the people who are crazy enough to think they can change the world are the ones who do.',
    'A typing race is a small window into focus. Your fingers fly while your mind stays calm. Speed without accuracy is noise. Accuracy without speed is patience. Both together, however, become flow.',
    'Espresso is brewed by forcing hot water through finely ground coffee at high pressure. The result is a small, intense shot with a layer of crema on top, full of complex flavors and sharp edges.',
    'Mountains were once the floor of ancient seas. Rivers carve canyons over millions of years, patient and slow, until what looks like solid stone becomes a gentle valley of green and quiet water.',
  ],
  hard: [
    'Quizzical lexicographers, jazzed by zephyrs whipping through quaint quiet quays, jubilantly exchanged whimsical, oxygen-rich, syzygy-themed manuscripts—each marked with peculiar punctuation: semicolons; em-dashes—and curly quotes!',
    'Schadenfreude—the curious pleasure derived from another’s misfortune—remains, peculiarly, an under-examined emotion; psychologists, neuroscientists, and philosophers (alike) continue to wrangle over its evolutionary origins.',
    'Cryptography relies on hard problems: factoring large composites, discrete logarithms in cyclic groups, and lattice-based reductions. Quantum algorithms threaten classical schemes; therefore, post-quantum primitives are now urgent.',
    'In 1492, Columbus sailed; in 1969, Armstrong stepped; in 1989, the Wall fell. History’s pivots—abrupt, jagged, often unexpected—reshape borders, beliefs, and bytes (yes, including the ones you’re typing right now).',
    'Onomatopoeia—buzz, hiss, clang, whoosh, gulp, splat, kerplunk—turns sound into syllable. Translators struggle: a Japanese “doki-doki” heart-thump rarely lands the same way in English, French, or Brazilian Portuguese.',
  ],
  code: [
    'function fib(n) { if (n < 2) return n; let a = 0, b = 1; for (let i = 2; i <= n; i++) { const c = a + b; a = b; b = c; } return b; }',
    'const sum = (arr) => arr.reduce((acc, x) => acc + x, 0); const avg = (arr) => arr.length ? sum(arr) / arr.length : 0;',
    'class Stack { constructor() { this.items = []; } push(x) { this.items.push(x); } pop() { return this.items.pop(); } peek() { return this.items[this.items.length - 1]; } }',
    'async function fetchUser(id) { const res = await fetch(`/api/users/${id}`); if (!res.ok) throw new Error("HTTP " + res.status); return res.json(); }',
    'SELECT u.id, u.name, COUNT(o.id) AS orders FROM users u LEFT JOIN orders o ON o.user_id = u.id WHERE u.created_at > NOW() - INTERVAL 30 DAY GROUP BY u.id ORDER BY orders DESC LIMIT 10;',
  ],
};

function getRandomText(difficulty = 'medium') {
  const list = TEXTS[difficulty] || TEXTS.medium;
  return list[Math.floor(Math.random() * list.length)];
}

module.exports = { getRandomText, TEXTS };
