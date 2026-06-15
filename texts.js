// Themed sentence pools per difficulty.
// Each "text" the player sees is a random combination of N sentences
// from the chosen theme + difficulty, so variety grows combinatorially
// while every sentence stays hand-written and meaningful.

const THEMES = {};

THEMES.general = {
  label: 'General',
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
    'Birds wake early and never seem to mind it.',
    'A blank notebook is a promise you make to yourself.',
    'The smell of bread can pull you home from far away.',
    'A puzzle teaches patience without saying a word.',
    'Some songs feel like the day they were first heard.',
    'A morning fog turns familiar streets into a dream.',
  ],
  medium: [
    'Programming is the art of telling another human what one wants the computer to do.',
    'Clean code is not written by following a set of rules; it is written by paying attention.',
    'The best way to predict the future is to invent it, one careful step at a time.',
    'A typing race is a small window into focus, where the fingers fly while the mind stays still.',
    'Speed without accuracy is noise, and accuracy without speed is patience; together they become flow.',
    'Most good ideas arrive when you least expect them, often in the middle of doing something else.',
    'A well-organised desk is rarely about tidiness; it is mostly about removing friction from your day.',
    'Habits are the architecture of who we become, built one small choice at a time.',
    'Reading widely teaches you that nearly every problem has been faced before, in some form, by someone.',
    'Trust is built in millimeters and lost in miles, which is why small honest moments matter so much.',
    'A long walk can untangle problems that hours at a desk could not loosen for love or money.',
    'Comparison is the thief of joy, especially online where everyone shows the highlight and never the cut.',
    'When you teach something, you learn it twice; when you write it down, you learn it three times.',
    'Boredom is sometimes a signal, not a problem, telling you something important wants to be noticed.',
    'A garden does not grow because you watch it; it grows because you show up most days.',
    'In a world full of opinions, careful observation is rarer and often far more useful.',
    'Slow mornings tend to make for steady afternoons, while rushed starts often ripple into the day.',
    'Listening well is a skill that looks like silence but is actually a kind of generosity.',
    'A small notebook in your pocket can outlast a dozen apps you forget to open.',
    'The hardest part of writing is sitting down to do it; everything after that is just gentle steering.',
    'Old recipes carry the memory of kitchens that no longer exist, which is one reason families guard them.',
    'Cities feel different at five in the morning, when the streets belong to runners and bakers.',
    'A short pause before answering a hard question is rarely wasted time.',
    'Rain transforms an ordinary street into a film set, full of reflections and quiet drama.',
    'The right book at the right time can feel like a letter from someone who already understands you.',
    'Travel teaches you that home is partly a place and partly a feeling you carry in your pocket.',
    'A handwritten letter is slower than a message, but it tends to live a longer life.',
    'When the wind picks up at the coast, the ocean stops feeling like a postcard and remembers it is wild.',
    'A cup of tea, made carefully and drunk slowly, can turn an ordinary afternoon into a small ritual.',
    'Most arguments online are about definitions, even when both sides think they are about facts.',
  ],
  hard: [
    'A semicolon is the rarest piece of punctuation in casual writing; in formal writing, it is the difference between two sentences and one idea.',
    'Schadenfreude—the curious pleasure derived from another’s misfortune—remains, peculiarly, an under-examined emotion across decades of formal psychology.',
    'In linguistics, code-switching is rarely confusion; it is a fluent, deliberate choice that signals identity, audience, and intent.',
    'Etymology is a kind of archaeology in slow motion: every common word carries a stratigraphy of older languages and forgotten metaphors.',
    'Most heroic algorithms are merely careful; their elegance comes from refusing to do anything they do not strictly need to do.',
    'Photography, at its core, is just a quarrel with time: a stubborn attempt to keep a single second alive after it has gone.',
    'A well-designed interface, like a well-designed door, communicates how it should be used without a single instruction or arrow.',
    'A well-tuned violin, in skilled hands, sounds less like an object than like a mood briefly given a body.',
    'Onomatopoeia—buzz, hiss, clang, whoosh, gulp, splat, kerplunk—turns sound into syllable; translation, however, rarely survives the journey.',
    'Quizzical lexicographers, jazzed by zephyrs whipping through quaint quiet quays, jubilantly exchanged whimsical manuscripts.',
    'Cathedrals were the open-source projects of their age, built across generations by people who knew they would never see the finished spire.',
    'Stoicism, often misread as cold detachment, was in practice a discipline for living more vividly inside the things you cannot control.',
    'In thermodynamics, entropy is the universe’s preference for forgetting; structures cost energy, and forgetting is always free.',
    'The placebo effect is not imaginary; it is a measurable, biological response to expectation, ritual, and being cared for.',
    'A glacier moves slowly enough to be invisible to a watching eye, yet quickly enough to grind whole valleys into the shapes we hike through.',
  ],
};

THEMES.movies = {
  label: 'Movies',
  easy: [
    'May the force be with you on every stormy commute.',
    'A wizard is never late, nor is he early; he arrives on time.',
    'There is no place like home, especially after a long trip.',
    'You shall not pass, said the chef to the burnt toast.',
    'Toys come alive when no one is watching the room.',
    'Some birds are not meant to be caged in small offices.',
    'Why so serious, asked the cat to the very tired dog.',
    'After all this time, the kettle still boils with patience.',
    'Life finds a way, even on a Monday morning.',
    'Just keep swimming until the weekend finally arrives.',
    'I see dead pixels on a very old laptop screen.',
    'A long time ago, in a kitchen far far away.',
    'The first rule of book club is that we always finish the book.',
    'Houston, we have a small but interesting problem.',
    'Show me the popcorn before the trailers start rolling.',
  ],
  medium: [
    'A film is a ribbon of dreams stretched out for an audience that has agreed to sit still.',
    'The best movies do not announce their themes; they let you walk into them like a quiet room.',
    'A great soundtrack rescues a weak scene more often than people are willing to admit out loud.',
    'Animation is not a genre but a method, and it can do almost anything live action cannot.',
    'A close-up is a confession the camera asks the actor to make in front of millions of strangers.',
    'Pacing is the invisible craft of cinema; you only notice it when something has gone wrong.',
    'Every great director has at least one movie they would happily disown if pressed at a dinner party.',
    'Subtitles change the rhythm of a film, but they rarely change the heart of it.',
    'A villain who believes their own reasoning is far more frightening than one who is simply cruel.',
    'The best on-screen kitchens have nothing to do with cooking and everything to do with intimacy.',
    'A trilogy is a tightrope, a remake is a balancing act, and a sequel is usually a leap of faith.',
    'Shot on film or shot on digital, the only thing that finally matters is whether you cannot look away.',
    'A montage is the cinematic equivalent of a long deep breath that the audience needed anyway.',
    'Comedy is the toughest genre to direct because timing is everything and timing forgives nothing.',
    'Every actor has a movie they wish they had said yes to and one they wish they had walked away from.',
  ],
  hard: [
    'Cinema, in its best form, is a delicate compromise between the planned shot list and the unplanned moment a real face makes when nobody warned it.',
    'A score by John Williams is not background music; it is the audience’s heartbeat, briefly outsourced to a full symphony orchestra.',
    'Akira Kurosawa once observed that the role of the director is to bring out what is essential, which is harder than it sounds at midnight on day forty-three of a shoot.',
    'A long take, when it works, dissolves the boundary between camera, character, and viewer; when it fails, it becomes a tour of an expensive set.',
    'Roger Ebert insisted that cinema is a machine that generates empathy, and few definitions of the medium have aged half as gracefully.',
    'Studio Ghibli films are remarkable not for their fantasy but for their domesticity—the way a kettle, a kitchen, or a wind matters as much as a dragon.',
    'The Coen brothers’ dialogue is loved precisely because it sounds nothing like how anyone you know speaks, yet feels eerily true.',
    'Cinematography is essentially the art of choosing what not to show; the frame is mostly an argument about omission.',
    'Pixar’s rule that "story is king" is repeated so often inside that studio that it functions less like a slogan and more like a pressure valve.',
    'A successful biopic resists the urge to canonize, opting instead for the awkward, granular details that suggest a real life lived inside an unreliable body.',
    'Hitchcock famously preferred suspense to surprise, arguing that suspense is generosity—you tell the audience the bomb is under the table.',
    'Editing, the youngest of the cinematic arts, is the one most likely to save a script and the one most often blamed when it cannot.',
    'A great period drama earns its costumes by making them feel like clothes rather than exhibits roped off behind glass.',
  ],
};

THEMES.science = {
  label: 'Science',
  easy: [
    'The moon is not a friend, it is a quiet rock that follows the earth.',
    'Plants eat sunlight and exhale the air we breathe every day.',
    'Most of the human body is water dressed up as a person.',
    'Sound is just air pushed in tiny patient waves.',
    'A magnet has a north and a south, and neither asks for permission.',
    'Ice floats because cold water is bossier than warm water.',
    'Bees do a small dance to tell other bees where the best flowers are.',
    'Lightning is hotter than the surface of the sun for a very brief moment.',
    'Octopuses can taste with their arms, which is honestly very rude.',
    'A rainbow is sunlight bent through tiny round drops of water.',
    'Sharks are older than trees, which seems unfair to the trees.',
    'Bananas are technically berries, and strawberries technically are not.',
    'Honey never really spoils if you keep it dry and sealed up.',
    'Sleep is when your brain quietly tidies its desk for you.',
    'Salt makes ice melt because water is easily distracted.',
  ],
  medium: [
    'Photosynthesis is the slowest chemical magic trick on Earth, performed by every leaf during every quiet sunny afternoon.',
    'The speed of light in a vacuum is not just a measurement; it is a hard rule about how causes and effects can travel.',
    'DNA is essentially a recipe written in four letters that has been edited and copied for billions of years.',
    'Every breath you take contains, statistically, a few molecules that were once exhaled by every person who has ever lived.',
    'Black holes are not cosmic vacuum cleaners; they are simply objects with so much gravity that even light cannot quite leave the room.',
    'The honeybee waggle dance encodes both distance and direction with a precision that took human scientists decades to fully decode.',
    'Antibiotic resistance evolves not because bacteria are clever, but because they reproduce fast enough to find every loophole at scale.',
    'A mole is just a counting word, like dozen, except it counts atoms by the trillions of trillions.',
    'Tides are caused mostly by the moon and partly by the sun, and only a little by anything you would ever feel personally.',
    'CRISPR is a bacterial defense system that we politely borrowed and turned into a precision tool for editing genomes.',
    'Volcanoes are how the planet exhales, releasing pressure, gas, and lava that built every continent we now stand on.',
    'A neuron is essentially a long thin cell that votes; whether it fires depends on how persuasive its neighbours have been.',
    'Quantum mechanics describes the world we cannot see, and despite a century of evidence, it still feels like a strange in-joke.',
    'Mitochondria, the powerhouses of the cell, were once free-living bacteria that decided cooperation paid better than independence.',
    'Climate, unlike weather, is the long arc; weather is what you grab a coat for, climate is why coats exist in the first place.',
  ],
  hard: [
    'The second law of thermodynamics, often summarized as entropy increases, is less a law about disorder than a law about probability and large numbers misbehaving in your favour.',
    'CRISPR-Cas9, repurposed from bacterial adaptive immunity, allows targeted edits to genomes with a precision that would have seemed mythological to molecular biologists in the 1980s.',
    'Quantum entanglement is not faster-than-light communication; it is a subtler, stranger correlation between particles that refuses every classical metaphor we throw at it.',
    'Stellar nucleosynthesis is the patient cosmic factory that forged every atom heavier than helium inside stars that exploded long before our sun existed.',
    'The blood-brain barrier is not a wall but a remarkably selective membrane, which is why designing drugs that target the brain is famously difficult.',
    'Plate tectonics unifies geology in the same way evolution unifies biology: without it, both fields collapse into a list of unrelated coincidences.',
    'The Higgs mechanism does not give particles mass through magic; it gives them mass through a field that quietly fills the entire universe.',
    'In neuroscience, plasticity is the rule rather than the exception, which is why both childhood learning and adult recovery from injury are possible at all.',
    'Bayesian reasoning, often described as updating beliefs, is more honestly the discipline of admitting how uncertain you were before the new evidence arrived.',
    'The cosmic microwave background is the universe’s baby photograph, a faint and almost uniform whisper of light from when it was just a few hundred thousand years old.',
    'Protein folding, long considered intractable, has yielded surprisingly to modern machine learning, which has quietly rewritten parts of structural biology.',
    'The genetic code is degenerate, meaning multiple codons map to the same amino acid; this redundancy is part of why life is robust to small mutations.',
  ],
};

THEMES.tech = {
  label: 'Tech',
  easy: [
    'A computer is a very fast box that follows very small instructions.',
    'Wifi works best when no one tries to explain how it actually works.',
    'A keyboard remembers nothing but tells everyone everything.',
    'The cloud is just other people’s computers wearing a marketing hat.',
    'A bug is a feature that decided to stop pretending.',
    'Open source means many strangers slowly gardening a single yard.',
    'The internet was supposed to deliver mail; it ended up delivering opinions.',
    'A USB cable can always be plugged in three ways, two of them wrong.',
    'A password manager is a tiny, polite assistant who never forgets.',
    'A cache is your computer trying to be helpful by remembering snacks.',
    'A search engine is a very fast librarian who never sleeps.',
    'A pixel is a tiny soldier in a very large picture.',
    'A virus is a small, rude visitor that did not knock first.',
    'A GPU is a calculator that loves to draw and refuses to do anything else.',
    'Software updates are why your evening plans change without warning.',
  ],
  medium: [
    'A function is a small contract: give it the inputs it expects, and it promises a single, predictable output.',
    'Caching is one of the genuinely hard problems in computer science; the other is naming things, and the third is off-by-one errors.',
    'Latency is the time something takes; throughput is how much you can do per unit of time, and they are not the same thing.',
    'A REST API is a polite agreement between two systems to talk in nouns rather than verbs whenever possible.',
    'Most production outages are caused not by a single dramatic bug but by three small, perfectly reasonable decisions colliding at three in the morning.',
    'Version control is essentially a polite way of arguing with your past self about what should and should not have been deleted.',
    'A monolith is not always wrong, and microservices are not always right; the answer almost always depends on team size and deployment pain.',
    'A queue smooths out spikes the way a reservoir smooths out rain: by absorbing what cannot be processed immediately.',
    'A good unit test fails for one and only one reason, and tells you exactly which reason in its name.',
    'The single most underrated programming skill is reading code carefully before changing any of it.',
    'Static typing is a conversation between you and your compiler about what you actually meant; dynamic typing is the same conversation, postponed to runtime.',
    'A 99.9 percent uptime guarantee allows for nearly nine hours of downtime per year, which is more than most slogans suggest at first glance.',
    'Encryption protects your data in transit, hashing protects your secrets at rest, and confusing the two is how breaches get worse.',
    'A pull request is, at its best, a quiet, written form of pair programming with someone who is not currently in the room.',
    'A linter is the tireless coworker who never gets tired of pointing out the same small mistakes.',
  ],
  hard: [
    'CAP theorem says that in the face of a network partition, a distributed system must choose between consistency and availability; the trade-off is real, the marketing copy is usually negotiable.',
    'A kernel does not run your program so much as it patiently arbitrates between every program that wants to pretend it is the only one running.',
    'Garbage collection trades programmer time for runtime predictability, which is usually a fair deal until you find yourself debugging a long pause at exactly the wrong moment.',
    'TLS does not just encrypt traffic; it also negotiates identity, integrity, and forward secrecy, which is why it is more interesting than its abbreviation suggests.',
    'A B-tree is the unsung hero of database engineering, quietly turning random reads into something acceptable for spinning disks long after disks stopped spinning.',
    'A consistent hashing ring is one of those data structures that seems clever for ten minutes and then becomes the obvious choice for the next ten years.',
    'The Byzantine generals problem is a poetic name for an aggressively practical question about how systems can agree when some of their members may be lying.',
    'A floating-point number is a clever compromise between range and precision, which is why financial code that uses them is often quietly haunted.',
    'Modern compilers do not just translate your code; they negotiate with the CPU on your behalf, reordering, vectorizing, and inlining whenever they can get away with it.',
    'Eventual consistency is usually fine until it is not, and the moment you discover the difference is almost always also the moment you wish you had a stronger guarantee.',
    'A well-designed API is one whose deprecations are gentle, whose defaults are sensible, and whose error messages assume the reader is tired and on a phone.',
    'Public-key cryptography rests on the asymmetry between operations that are easy in one direction and computationally infeasible in the other, an asymmetry that quantum computing might one day inconvenience.',
  ],
};

THEMES.history = {
  label: 'History',
  easy: [
    'The Great Wall of China is long, but it was built one stone at a time.',
    'The first wheels were probably used for pottery before anyone tried a cart.',
    'Romans had vending machines, fast food, and very loud sandals.',
    'Vikings did sail across the Atlantic long before Columbus packed a single bag.',
    'Tea sparked more revolutions than most kings ever managed to.',
    'The pyramids were ancient even to ancient Egyptians by the late dynasties.',
    'Cleopatra lived closer in time to the moon landing than to the building of the pyramids.',
    'Coffee houses were once banned in several cities for stirring up too much chatter.',
    'Pirates often had retirement plans and disability pay, which is honestly impressive.',
    'The first photo took eight hours of patient sunlight to expose properly.',
    'Albert Einstein was offered the presidency of Israel and politely declined the job.',
    'The Wright brothers ran a bicycle shop before they ever tried to fly.',
    'The Eiffel Tower was supposed to be torn down after twenty years.',
    'Napoleon was not actually that short; he was an average height for his time.',
    'Sliced bread was once banned in the United States during the Second World War.',
  ],
  medium: [
    'The Renaissance was less a sudden burst of brilliance and more a long, lucky accumulation of letters, libraries, and patient patrons.',
    'The Silk Road was less a single road and more a tangled network of merchants, monks, and rumors stretching across continents.',
    'The printing press did not just spread books; it quietly redistributed power away from anyone whose authority depended on copies being rare.',
    'World War One was a war that almost no one wanted, started by a chain of telegrams that no one fully read in time.',
    'The Industrial Revolution did not happen in a year; it crept across British towns over two slow, soot-stained generations.',
    'The Library of Alexandria probably did not burn down in one dramatic night; it was lost, slowly, to neglect, war, and bad luck.',
    'Catherine the Great corresponded with Voltaire for years, in part because being seen as enlightened was politically useful.',
    'The Apollo program landed humans on the moon with less computing power than a modern toaster, which is a humbling fact for engineers.',
    'The Magna Carta was originally a peace treaty between an unhappy king and his unhappier barons; democracy had to be added later.',
    'The Black Death reshaped wages, religion, and architecture across Europe in ways economic historians are still debating today.',
    'Nelson Mandela spent twenty-seven years in prison before negotiating, with remarkable patience, a peaceful end to apartheid.',
    'The Suez Canal cut weeks off the journey from Europe to Asia and quietly redrew the map of global shipping forever.',
    'Most ancient battles were lost to logistics rather than tactics; armies were undone by hunger far more often than by enemy lines.',
    'The Treaty of Versailles tried to end one war and accidentally helped to set the stage for another within a single generation.',
    'The Cold War never quite became hot, but it did invent the modern conception of nuclear deterrence, surveillance, and proxy conflict.',
  ],
  hard: [
    'Historians sometimes describe the long nineteenth century as stretching from 1789 to 1914, a period long enough that nearly every modern political vocabulary was forged inside it.',
    'The Treaty of Westphalia in 1648 is often credited with inventing the modern state system, although the actual concept evolved over the following two centuries.',
    'Pax Romana, that famous two-century stretch of relative imperial calm, was less a guarantee of peace than an effective monopoly on organised violence.',
    'The Mongol Empire connected Eurasia in a way that briefly made the bubonic plague, paper money, and sophisticated diplomacy all travel along the same dusty roads.',
    'The French Revolution was not a single event but a cascade of revolutions, each undoing parts of the last, until exhaustion produced something that called itself an emperor.',
    'The collapse of the Qing dynasty was driven less by external invasion than by an accumulation of fiscal, technological, and ideological pressures inside an enormous, fragile system.',
    'The Atlantic slave trade reshaped three continents simultaneously and bequeathed economic and demographic distortions that have outlasted every empire that profited from it.',
    'During the Meiji Restoration, Japan deliberately imported foreign experts, technologies, and laws, then refashioned them into something distinctly Japanese within a single political generation.',
    'The Marshall Plan was as much a tool of geopolitical persuasion as it was an aid program, designed to rebuild economies and align them simultaneously.',
    'The Cuban Missile Crisis, often presented as a thirteen-day standoff, was in fact resolved by quieter back-channel negotiations that public histories took decades to fully describe.',
    'The Reformation was not a single doctrinal dispute but a long, fragmented argument about authority, conducted in pamphlets, sermons, and occasionally muskets.',
    'The end of the Soviet Union came less from a dramatic external defeat than from a dense tangle of economic stagnation, political reform, and quiet institutional decay.',
  ],
};

THEMES.quotes = {
  label: 'Quotes',
  easy: [
    'Be the change you wish to see in the world.',
    'The only way to do great work is to love what you do.',
    'Whether you think you can, or you think you cannot, you are right.',
    'In the middle of every difficulty lies opportunity.',
    'Do not wait; the time will never be just right.',
    'Try not to become a person of success, but a person of value.',
    'It always seems impossible until it is done.',
    'Happiness depends upon ourselves more than we like to admit.',
    'The journey of a thousand miles begins with a single tired step.',
    'A goal without a plan is just a wish in nicer clothes.',
    'Life is what happens to you while you are busy making other plans.',
    'Success is not final; failure is not fatal; courage is what counts.',
    'You miss every shot you do not take, and most of the ones you do.',
    'Be yourself; everyone else is already taken anyway.',
    'A friend is a present you give yourself when you really need one.',
  ],
  medium: [
    'In any moment of decision, the best thing you can do is the right thing, the next best thing is the wrong thing, and the worst thing you can do is nothing.',
    'It is during our darkest moments that we must focus to see the light, especially when we have forgotten where the switch is.',
    'The only true wisdom is in knowing you know nothing, which is exactly what every junior engineer eventually figures out the hard way.',
    'I have not failed; I have just found ten thousand ways that will not work, and a few that will only work on Tuesdays.',
    'A person who never made a mistake never tried anything new, which means they probably also never had a particularly interesting Friday night.',
    'Genius is one percent inspiration and ninety-nine percent perspiration, which is why most great work happens far away from a stage.',
    'Education is what remains after one has forgotten what one has learned in school, which is more than most curricula are willing to admit.',
    'If you cannot explain it simply, you do not understand it well enough; you may, however, understand it well enough to bluff at a meeting.',
    'It is not the strongest of the species that survives, nor the most intelligent, but the one most responsive to change.',
    'I would rather be optimistic and wrong than pessimistic and right, because optimism, even when wrong, tends to leave the room better than it found it.',
    'The two most important days of your life are the day you were born and the day you find out why; both deserve cake, in their own way.',
    'Whatever you are, be a good one, even on a Monday morning when nothing is working as advertised.',
    'You cannot cross a sea by merely standing and staring at the water, even if the water is genuinely very pretty today.',
    'The best preparation for tomorrow is doing your best today, which sounds obvious until you try to actually do it.',
    'Logic will get you from A to B; imagination will take you everywhere else, including into trouble, occasionally.',
  ],
  hard: [
    'Carl Sagan once observed that for small creatures such as we are, the vastness is bearable only through love—a sentence that quietly does more philosophical work than most full books.',
    'Hannah Arendt wrote that the sad truth is that most evil is done by people who never make up their minds to be either evil or good, a thought that is uncomfortable precisely because it is plausible.',
    'Joan Didion noted that we tell ourselves stories in order to live, by which she meant something both more comforting and more troubling than the line is usually quoted to suggest.',
    'James Baldwin argued that not everything that is faced can be changed, but nothing can be changed until it is faced, an idea that has aged into something close to scripture in modern essays.',
    'Marie Curie remarked that nothing in life is to be feared; it is only to be understood—now is the time to understand more so that we may fear less.',
    'Frederick Douglass insisted that it is easier to build strong children than to repair broken adults, a sentence that quietly reorders most public policy if taken seriously.',
    'Albert Camus wrote that in the depth of winter I finally learned that within me there lay an invincible summer, an image that has outlived several literary movements without being quite worn out.',
    'Toni Morrison observed that if there is a book that you want to read but it has not been written yet, then you must be the one to write it, which is in equal parts encouragement and threat.',
    'Bertrand Russell remarked that the trouble with the world is that the stupid are cocksure and the intelligent are full of doubt, a line that has aged so well it now sounds like reportage.',
    'Confucius said that it does not matter how slowly you go as long as you do not stop—an idea that long predates the modern productivity industry that is forever trying to repackage it.',
    'Marcus Aurelius wrote that you have power over your mind, not outside events; realize this, and you will find strength, an instruction that is roughly two thousand years old and still uncomfortably useful.',
    'Audre Lorde insisted that caring for myself is not self-indulgence; it is self-preservation, and that is an act of political warfare, a sentence written long before wellness culture began to dilute it.',
  ],
};

// Code snippets are kept simple: never combined, always single, but the
// pool is bigger so it does not feel repetitive.
THEMES.code = {
  label: 'Code',
  easy: [
    'const sum = (a, b) => a + b;',
    'function double(x) { return x * 2; }',
    'const isEven = (n) => n % 2 === 0;',
    'const greet = (name) => `Hello, ${name}!`;',
    'const last = (arr) => arr[arr.length - 1];',
    'const square = (n) => n * n;',
    'const max = (a, b) => (a > b ? a : b);',
    'const reverse = (s) => s.split("").reverse().join("");',
    'const upper = (s) => s.toUpperCase();',
    'const not = (b) => !b;',
  ],
  medium: [
    'function fib(n) { if (n < 2) return n; let a = 0, b = 1; for (let i = 2; i <= n; i++) { const c = a + b; a = b; b = c; } return b; }',
    'const sumArr = (arr) => arr.reduce((acc, x) => acc + x, 0);',
    'class Stack { constructor() { this.items = []; } push(x) { this.items.push(x); } pop() { return this.items.pop(); } }',
    'async function fetchUser(id) { const res = await fetch(`/api/users/${id}`); if (!res.ok) throw new Error("HTTP " + res.status); return res.json(); }',
    'const debounce = (fn, ms) => { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; };',
    'function isPalindrome(s) { const t = s.toLowerCase().replace(/[^a-z0-9]/g, ""); return t === t.split("").reverse().join(""); }',
    'const memo = (fn) => { const cache = new Map(); return (x) => cache.has(x) ? cache.get(x) : cache.set(x, fn(x)).get(x); };',
    'const groupBy = (arr, key) => arr.reduce((acc, x) => ({ ...acc, [x[key]]: [...(acc[x[key]] || []), x] }), {});',
    'app.get("/health", (req, res) => res.json({ status: "ok", uptime: process.uptime() }));',
    'function binarySearch(a, t) { let lo = 0, hi = a.length - 1; while (lo <= hi) { const m = (lo + hi) >> 1; if (a[m] === t) return m; a[m] < t ? lo = m + 1 : hi = m - 1; } return -1; }',
  ],
  hard: [
    'function quickSort(a) { if (a.length <= 1) return a; const p = a[0], l = [], r = []; for (let i = 1; i < a.length; i++) (a[i] < p ? l : r).push(a[i]); return [...quickSort(l), p, ...quickSort(r)]; }',
    'SELECT u.id, u.name, COUNT(o.id) AS orders FROM users u LEFT JOIN orders o ON o.user_id = u.id WHERE u.created_at > NOW() - INTERVAL 30 DAY GROUP BY u.id ORDER BY orders DESC LIMIT 10;',
    'function* zip(a, b) { const len = Math.min(a.length, b.length); for (let i = 0; i < len; i++) yield [a[i], b[i]]; }',
    'const curry = (fn) => function curried(...args) { return args.length >= fn.length ? fn(...args) : (...more) => curried(...args, ...more); };',
    'const compose = (...fns) => (x) => fns.reduceRight((acc, f) => f(acc), x);',
    'function bfs(graph, start) { const seen = new Set([start]); const q = [start]; while (q.length) { const node = q.shift(); for (const n of graph[node] || []) { if (!seen.has(n)) { seen.add(n); q.push(n); } } } return seen; }',
    'const Result = { ok: (v) => ({ ok: true, value: v }), err: (e) => ({ ok: false, error: e }) };',
  ],
};

// How many sentences to combine per "text" per difficulty.
const COMBINE_RANGE = {
  easy: [2, 3],
  medium: [2, 3],
  hard: [1, 2],
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

function getThemeKeys() {
  return Object.keys(THEMES);
}

function pickRandomThemeKey(excludeCode = false) {
  const keys = getThemeKeys().filter((k) => !excludeCode || k !== 'code');
  return keys[Math.floor(Math.random() * keys.length)];
}

// difficulty: 'easy' | 'medium' | 'hard'
// theme:      'general' | 'movies' | 'science' | 'tech' | 'history' | 'quotes' | 'code' | 'random'
function getRandomText(difficulty = 'medium', theme = 'random') {
  const allowedDiff = ['easy', 'medium', 'hard'].includes(difficulty) ? difficulty : 'medium';

  let themeKey = theme;
  if (theme === 'random' || !THEMES[theme]) {
    themeKey = pickRandomThemeKey(true);
  }

  // Code theme is never combined; always one snippet.
  if (themeKey === 'code') {
    const list = THEMES.code[allowedDiff] || THEMES.code.medium;
    return list[Math.floor(Math.random() * list.length)];
  }

  const themePack = THEMES[themeKey];
  const list = themePack[allowedDiff] || themePack.medium;
  const [min, max] = COMBINE_RANGE[allowedDiff] || [2, 3];
  const n = Math.min(list.length, min + Math.floor(Math.random() * (max - min + 1)));
  return pickN(list, n).join('');
}

module.exports = { getRandomText, THEMES, getThemeKeys };
