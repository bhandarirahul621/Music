// Static reference data taken from the SunoAPI docs (docs.sunoapi.org).

export const MODELS = [
  { id: "V6", name: "V6", badge: "Recommended", desc: "Most expressive. Natural vocals and rich detail.", duration: true },
  { id: "V6_WILD", name: "V6 Wild", badge: "Bold", desc: "Pushes creative boundaries for distinctive, unexpected results.", duration: true },
  { id: "V6_MINI", name: "V6 Mini", badge: "Fast", desc: "Lightweight and quick. Great for sketching ideas.", duration: true },
  { id: "V5_5", name: "V5.5", badge: "Legacy", desc: "Custom models tuned to your taste.", legacy: true, duration: true },
  { id: "V5", name: "V5", badge: "Legacy", desc: "Superior musicality, faster generation.", legacy: true },
  { id: "V4_5PLUS", name: "V4.5+", badge: "Legacy", desc: "Richer sound, up to 8 min.", legacy: true },
  { id: "V4_5ALL", name: "V4.5 All", badge: "Legacy", desc: "Better song structure, up to 8 min.", legacy: true },
  { id: "V4_5", name: "V4.5", badge: "Legacy", desc: "Smarter prompts, up to 8 min.", legacy: true },
  { id: "V4", name: "V4", badge: "Legacy", desc: "Improved vocals, up to 4 min.", legacy: true },
];

export const modelById = (id) => MODELS.find((m) => m.id === id) || MODELS[0];

export const CHIPS = {
  Genre: ["Pop", "Hip-hop", "R&B", "Rock", "Indie folk", "EDM", "House", "Lo-fi", "Jazz", "Soul", "Funk", "Country", "Reggaeton", "K-pop", "Synthwave", "Drum & bass", "Afrobeats", "Metal", "Classical", "Cinematic", "Bollywood", "Gospel"],
  Mood: ["Uplifting", "Melancholic", "Dreamy", "Energetic", "Chill", "Dark", "Romantic", "Nostalgic", "Epic", "Playful", "Anthemic", "Moody"],
  Sound: ["Acoustic guitar", "Piano", "808s", "Strings", "Brass", "Analog synths", "Choir", "Female vocals", "Male vocals", "Duet", "Whispered vocals", "Fast tempo", "Slow tempo", "Live drums"],
};

export const LYRIC_TAGS = ["[Intro]", "[Verse]", "[Pre-Chorus]", "[Chorus]", "[Bridge]", "[Drop]", "[Instrumental]", "[Outro]"];

const SUBJECTS = [
  "a robot learning to dance at a school prom", "the last summer night before everyone moves away", "a cat who thinks it runs the city",
  "falling in love at a 24-hour laundromat", "a road trip with no destination", "a lighthouse keeper talking to the stars",
  "Monday morning coffee as a heroic quest", "a long-distance friendship across time zones", "a street food vendor's midnight rush",
  "a houseplant finally getting sunlight", "rain on a tin roof in the monsoon", "an astronaut missing home cooking",
  "a grandmother's recipe book", "winning the local talent show against all odds", "the city waking up at 5 a.m.",
];
const FLAVORS = [
  "upbeat indie pop with handclaps", "dreamy lo-fi with vinyl crackle", "cinematic orchestral build", "funky disco groove with slap bass",
  "soulful acoustic ballad", "high-energy EDM with a massive drop", "80s synthwave with gated drums", "laid-back bossa nova",
  "anthemic stadium rock", "smooth R&B with lush harmonies", "Bollywood dance number with dhol", "sea shanty sung by a rowdy choir",
];
export const surprisePrompt = () => {
  const pick = (a) => a[Math.floor(Math.random() * a.length)];
  return `A song about ${pick(SUBJECTS)}. Make it ${pick(FLAVORS)}.`;
};
export const SURPRISE_TITLES = ["Neon Laundromat", "Paper Planets", "Midnight Chai", "Gravity Is Optional", "Postcards From Mars", "Sunday Static", "Glow in the Rain", "Ferris Wheel Heart"];

export const COOKING_LINES = [
  "Tuning the virtual guitars…", "Warming up the vocal cords…", "Finding the perfect hook…", "Teaching the drummer to count to four…",
  "Layering harmonies…", "Adding a pinch of reverb…", "Arguing about the bridge…", "Polishing the chorus until it sparkles…",
  "Asking the bassist to turn it down…", "Mixing, mastering, vibing…",
];

export const MUSIC_STAGES = ["Queued", "Lyrics written", "First track ready", "Complete"];

export const VARIETY = ["Off: exact style", "Normal: balanced", "High: distinct styles", "Extra: bold exploration", "Max: unreasonably varied"];

export const SOUND_KEYS = ["Any", "C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B", "Cm", "C#m", "Dm", "D#m", "Em", "Fm", "F#m", "Gm", "G#m", "Am", "A#m", "Bm"];

export const STEM_NAMES = ["Lead Vocal", "Backing Vocals", "Drum Kit", "Kick", "Snare", "Hi-Hat", "Bass", "808", "Piano", "Electric Guitar", "Acoustic Guitar", "Synth", "Synth Pad", "Synth Bass", "String Section", "Brass Section", "Organ", "Percussion", "Choir", "Violin", "Cello", "Saxophone", "Trumpet", "Flute", "Sound Effects", "Orchestra", "Rhodes", "Sitar", "Tabla", "Harp", "Ukulele", "Banjo", "Harmonica", "Marimba", "Theremin"];

export const SOUND_IDEAS = ["Warm vinyl crackle loop", "Rainforest ambience with distant thunder", "Punchy trap drum loop", "Retro arcade power-up", "Lo-fi piano loop, cozy", "Cinematic whoosh and impact", "Ocean waves on a pebble beach", "Deep house bassline loop"];

// Human-readable messages for SunoAPI response codes.
export const ERROR_CODES = {
  400: "The request had invalid parameters.",
  401: "That API key was rejected. Check it and try again.",
  402: "Payment required. Your plan may not cover this feature.",
  404: "Endpoint not found.",
  405: "Rate limit exceeded. Give it a moment.",
  409: "This task already exists.",
  413: "Your prompt or lyrics are too long for this model.",
  422: "Some fields didn't pass validation.",
  429: "You're out of credits. Top up at sunoapi.org.",
  430: "Slow down a little: too many requests in a short time.",
  451: "The source audio couldn't be fetched.",
  455: "SunoAPI is under maintenance. Try again shortly.",
  500: "SunoAPI had a server error. Try again.",
};
