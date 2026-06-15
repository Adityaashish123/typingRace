// Sentence pools per difficulty. Each "text" the player sees is a random
// combination of 2-3 sentences from the pool, so the variety grows
// combinatorially while every sentence stays hand-written and meaningful.

const SENTENCES = {
  easy: [
    'The quick brown fox jumps over the lazy dog.',
    'Coffee is the fuel of the modern world.',
    'A long walk in fresh air clears the mind.',
    'Cats nap in sunny patches all day long.',
    'Pizza night is the best night of the week.',
    'Rain on a tin roof is a kind of music.',
    'Old books smell like a quiet library.',
    'A warm cup of tea fixes most small problems.',
    'Bicycles are the friendliest machines we own.',
    'Sunday mornings move at their own slow speed.',
    'The garden grows faster than you can plan.',
    'Bread is best when it is still a little warm.',
    'A good map turns a long drive into an adventure.',
    'Crickets play music for anyone who listens at dusk.',
    'Snow days feel like permission to do nothing.',
    'A new pencil is full of unwritten ideas.',
    'The river bends but it never forgets the sea.',
    'Dogs greet every morning like a small festival.',
    'Stars look closer from the top of a hill.',
    'A clean room makes a busy day feel lighter.',
    'Fresh berries always taste best in summer.',
    'A small kindness can change a whole day.',
    'The kitchen is the warmest room in the house.',
    'Children chase shadows across the bright lawn.',
    'Tomatoes from the garden taste like sunshine.',
    'A short nap is sometimes a quiet superpower.',
    'Music makes the longest road feel shorter.',
    'Open windows let in the smell of summer rain.',
    'Friends know what to say and when to be quiet.',
    'A cold drink hits hardest after a long walk.',
    'Old photos hold secrets only families remember.',
    'The library is a small museum of patience.',
    'Honey from a local farm tastes like the season.',
    'A new pair of socks is a tiny celebration.',
    'Grandma always knew the right thing to cook.',
    'Birds wake early and never seem to mind it.',
    'A blank notebook is a promise you make to yourself.',
    'The smell of bread can pull you home from far away.',
    'A puzzle teaches patience without saying a word.',
    'Some songs feel like the day they were first heard.',
  ],
  medium: [
    'Programming is the art of telling another human what one wants the computer to do.',
    'Clean code is not written by following a set of rules; it is written by paying attention.',
    'The best way to predict the future is to invent it, one careful step at a time.',
    'Innovation distinguishes between a leader and a follower, and curiosity tells them apart from the start.',
    'A typing race is a small window into focus, where the fingers fly while the mind stays still.',
    'Speed without accuracy is noise, and accuracy without speed is patience; together they become flow.',
    'Espresso is brewed by forcing hot water through finely ground coffee at high pressure.',
    'Mountains were once the floor of ancient seas, lifted slowly by forces older than memory.',
    'Rivers carve canyons over millions of years, patient as a sculptor with all the time in the world.',
    'Most good ideas arrive when you least expect them, often in the middle of doing something else.',
    'A well-organised desk is rarely about tidiness; it is mostly about removing friction from your day.',
    'Language is a tool we use to think, and the words we choose quietly shape what we can imagine.',
    'Habits are the architecture of who we become, built one small choice at a time.',
    'Reading widely teaches you that nearly every problem has been faced before, in some form, by someone.',
    'Trust is built in millimeters and lost in miles, which is why small honest moments matter so much.',
    'A long walk can untangle problems that hours at a desk could not loosen for love or money.',
    'The best engineers ask better questions than they answer, because the questions point to the real work.',
    'Comparison is the thief of joy, especially online where everyone shows the highlight and never the cut.',
    'A short, kind email can carry more weight than a long, anxious one written and rewritten for hours.',
    'When you teach something, you learn it twice; when you write it down, you learn it three times.',
    'Boredom is sometimes a signal, not a problem, telling you something important wants to be noticed.',
    'A garden does not grow because you watch it; it grows because you show up most days.',
    'The internet remembers everything, which is why it is sometimes wise to write as if your future self is reading.',
    'Trains are quietly the most civilised way to travel, since you can think, read, or simply stare out the window.',
    'In a world full of opinions, careful observation is rarer and often far more useful.',
    'A great teacher is rarely the one who knows the most; it is the one who makes you want to know more.',
    'Slow mornings tend to make for steady afternoons, while rushed starts often ripple into the rest of the day.',
    'Listening well is a skill that looks like silence but is actually a kind of generosity.',
    'A small notebook in your pocket can outlast a dozen apps you forget to open.',
    'The hardest part of writing is sitting down to do it; everything after that is just gentle steering.',
    'Old recipes carry the memory of kitchens that no longer exist, which is one reason families guard them.',
    'Cities feel different at five in the morning, when the streets belong to the runners and the bakers.',
    'Most arguments online are about definitions, even when both sides think they are about facts.',
    'A short pause before answering a hard question is rarely wasted time.',
    'Rain transforms an ordinary street into a film set, full of reflections and quiet drama.',
    'The right book at the right time can feel like a letter from someone who already understands you.',
    'Travel teaches you that home is partly a place and partly a feeling you carry in your pocket.',
    'A handwritten letter is slower than a message, but it tends to live a longer life.',
    'When the wind picks up at the coast, the ocean stops feeling like a postcard and remembers it is wild.',
    'A good cup of tea, made carefully and drunk slowly, can turn an ordinary afternoon into a small ritual.',
  ],
  hard: [
    'Quizzical lexicographers, jazzed by zephyrs whipping through quaint quiet quays, jubilantly exchanged whimsical, oxygen-rich, syzygy-themed manuscripts.',
    'Schadenfreude—the curious pleasure derived from another’s misfortune—remains, peculiarly, an under-examined emotion across decades of formal psychology.',
    'Cryptography relies on hard problems: factoring large composites, discrete logarithms in cyclic groups, and lattice-based reductions over noisy domains.',
    'Quantum algorithms threaten classical schemes; therefore, post-quantum primitives are now urgent for engineers who care about long-lived data.',
    'In 1492, Columbus sailed; in 1969, Armstrong stepped; in 1989, the Wall fell—history’s pivots are abrupt, jagged, and almost always unexpected.',
    'Onomatopoeia—buzz, hiss, clang, whoosh, gulp, splat, kerplunk—turns sound into syllable; translation, however, rarely survives the journey.',
    'Bioluminescence in deep-sea creatures evolved independently many times, suggesting that, when light is scarce, evolution is endlessly inventive.',
    'A semicolon is the rarest piece of punctuation in casual writing; in formal writing, it is the difference between two sentences and one idea.',
    'The Monty Hall problem, despite its simple statement, fooled more than a few professional mathematicians when it first appeared in print.',
    'Tide pools are miniature universes, governed by the same physics as the open ocean but drained and refilled twice a day.',
    'Plate tectonics is, in a real sense, the single most important idea in earth science—without it, geology is a list of strange coincidences.',
    'Regular expressions are simultaneously the most useful and the most unforgiving tool a developer reaches for late on a Thursday afternoon.',
    'A katabatic wind, formed when dense, cold air drains down a slope, can reach hurricane speeds along certain Antarctic coasts.',
    'Compilers transform a precise, human-readable description into a precise, machine-readable one—a quietly miraculous act repeated trillions of times daily.',
    'The Fermi paradox—if life is common, where is everyone?—is less a puzzle than a mirror, reflecting whatever we already believe.',
    'Espresso depends on a delicate equilibrium of grind size, dose, temperature, and pressure; change one and you change the whole cup.',
    'Cathedrals were the open-source projects of their age, built across generations by people who knew they would never see the finished spire.',
    'In music theory, a tritone—an interval of three whole steps—was once nicknamed diabolus in musica for its restless, unresolved tension.',
    'The pigeonhole principle is almost embarrassingly simple, yet it underpins surprisingly deep results in combinatorics and computer science.',
    'A well-designed interface, like a well-designed door, communicates how it should be used without a single instruction or arrow.',
    'Tardigrades, those microscopic eight-legged survivors, can endure radiation, vacuum, and temperatures that would shatter most familiar molecules.',
    'In the Renaissance, perspective was not just a drawing technique—it was an argument about how the world was structured and seen.',
    'Type systems are, in essence, lightweight proofs about programs; they make certain bugs impossible by making them impossible to express.',
    'The placebo effect is not "imaginary"; it is a measurable, biological response to expectation, ritual, and the warmth of being cared for.',
    'A glacier moves slowly enough to be invisible to a watching eye, yet quickly enough to grind whole valleys into the shapes we hike through.',
    'Etymology is a kind of archaeology in slow motion: every common word carries a stratigraphy of older languages and forgotten metaphors.',
    'Cellular respiration, in spite of its forbidding name, is essentially the controlled burning of sugar to power every move you make.',
    'A black hole’s event horizon is not a wall but an instruction: from this point on, all paths in spacetime lead inward.',
    'Stoicism, often misread as cold detachment, was in practice a discipline for living more vividly inside the things you cannot control.',
    'A pendulum slows in a vacuum chamber not because gravity tires, but because friction, that quiet thief, has fewer places to hide.',
    'Most heroic algorithms are merely careful; their elegance comes from refusing to do anything they do not strictly need to do.',
    'The Coriolis effect, often blamed for bathwater swirls, actually operates on much grander scales—curving cyclones and ocean currents alike.',
    'Photography, at its core, is just a quarrel with time: a stubborn attempt to keep a single second alive after it has gone.',
    'In thermodynamics, entropy is the universe’s preference for forgetting; structures cost energy, and forgetting is always free.',
    'A well-tuned violin, in skilled hands, sounds less like an object than like a mood briefly given a body.',
    'The double-slit experiment refuses tidy explanations; it remains, after a century, a small, polite revolution against common sense.',
    'In linguistics, code-switching is rarely confusion; it is a fluent, deliberate choice that signals identity, audience, and intent.',
    'Deltas are the polite end of rivers, where centuries of mud are arranged into the geometry that future cities will be built upon.',
    'The Halting Problem, proven by Turing in 1936, remains a useful reminder that even careful programs cannot always reason about themselves.',
    'Bach’s fugues are simultaneously rigorous mathematics and gentle conversations between voices, which is part of why they feel so alive.',
  ],
  code: [
    'function fib(n) { if (n < 2) return n; let a = 0, b = 1; for (let i = 2; i <= n; i++) { const c = a + b; a = b; b = c; } return b; }',
    'const sum = (arr) => arr.reduce((acc, x) => acc + x, 0); const avg = (arr) => arr.length ? sum(arr) / arr.length : 0;',
    'class Stack { constructor() { this.items = []; } push(x) { this.items.push(x); } pop() { return this.items.pop(); } peek() { return this.items[this.items.length - 1]; } }',
    'async function fetchUser(id) { const res = await fetch(`/api/users/${id}`); if (!res.ok) throw new Error("HTTP " + res.status); return res.json(); }',
    'SELECT u.id, u.name, COUNT(o.id) AS orders FROM users u LEFT JOIN orders o ON o.user_id = u.id WHERE u.created_at > NOW() - INTERVAL 30 DAY GROUP BY u.id ORDER BY orders DESC LIMIT 10;',
    'const debounce = (fn, ms) => { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; };',
    'function isPalindrome(s) { const t = s.toLowerCase().replace(/[^a-z0-9]/g, ""); return t === t.split("").reverse().join(""); }',
    'const memo = (fn) => { const cache = new Map(); return (x) => cache.has(x) ? cache.get(x) : cache.set(x, fn(x)).get(x); };',
    'function quickSort(a) { if (a.length <= 1) return a; const p = a[0], l = [], r = []; for (let i = 1; i < a.length; i++) (a[i] < p ? l : r).push(a[i]); return [...quickSort(l), p, ...quickSort(r)]; }',
    'const groupBy = (arr, key) => arr.reduce((acc, x) => ({ ...acc, [x[key]]: [...(acc[x[key]] || []), x] }), {});',
    'app.get("/health", (req, res) => res.json({ status: "ok", uptime: process.uptime(), timestamp: Date.now() }));',
    'function binarySearch(a, t) { let lo = 0, hi = a.length - 1; while (lo <= hi) { const m = (lo + hi) >> 1; if (a[m] === t) return m; a[m] < t ? lo = m + 1 : hi = m - 1; } return -1; }',
  ],
};

// How many sentences to combine per "text" per difficulty.
const COMBINE_RANGE = {
  easy: [2, 3],
  medium: [2, 3],
  hard: [1, 2],
  code: [1, 1], // code snippets stand alone
};

function pickN(arr, n) {
  const pool = arr.slice();
  const out = [];
  for (let i = 0; i < n && pool.length > 0; i++) {
    const idx = Math.floor(Math.random() * pool.length);
    out.push(pool.splice(idx, 1)[0]);
  }
  return out;
}

function getRandomText(difficulty = 'medium') {
  const list = SENTENCES[difficulty] || SENTENCES.medium;
  const [min, max] = COMBINE_RANGE[difficulty] || [2, 3];
  const n = Math.min(list.length, min + Math.floor(Math.random() * (max - min + 1)));
  // Join sentences with no space after the period (matches the chosen style).
  return pickN(list, n).join('');
}

module.exports = { getRandomText, SENTENCES, TEXTS: SENTENCES };
