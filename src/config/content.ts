/**
 * Everything you are likely to want to edit lives in this file.
 * All text and photos below are PLACEHOLDERS – replace them with your own words.
 */

/* ------------------------------------------------------------------ */
/* Site                                                                */
/* ------------------------------------------------------------------ */

/** Shown when a message addresses the reader directly (quiz result). */
export const PARTNER_NAME = "my love";

/** Set to false to hide the little "editable placeholder" hints. */
export const SHOW_EDIT_HINTS = true;

/**
 * Relationship start: 21 September 2026, 00:00 India Standard Time (UTC+05:30)
 * written as one ISO timestamp in UTC.
 */
export const RELATIONSHIP_START_ISO = "2026-09-20T18:30:00Z";

export const NAV_LINKS = [
  { id: "home", label: "Home" },
  { id: "memories", label: "Memories" },
  { id: "songs", label: "Songs" },
  { id: "us", label: "Us" },
  { id: "quiz", label: "Quiz" },
] as const;

/* ------------------------------------------------------------------ */
/* Memories (hanging Polaroids)                                        */
/* ------------------------------------------------------------------ */

export type Memory = {
  id: string;
  /** Short handwritten caption printed under the photo. */
  caption: string;
  /** Longer line shown in the lightbox. */
  note?: string;
  /** ISO date (YYYY-MM-DD). Leave undefined to show a gentle placeholder. */
  date?: string;
  /**
   * Image URL. When omitted a drawn placeholder is shown.
   * For Supabase Storage photos, see src/integration/README.md.
   */
  src?: string;
  alt?: string;
  /** Which watercolour palette the placeholder uses (0–5). */
  tone: number;
  /** Resting rotation of the Polaroid, in degrees. */
  tilt: number;
  /** Tiny decoration pinned to the photo corner. */
  charm?: "flower";
};

const PLACEHOLDER_NOTE =
  "This is a placeholder picture. Swap in a real photo and write a few words here.";

export const MEMORIES: Memory[] = [
  { id: "m1", caption: "memory no. 01", note: PLACEHOLDER_NOTE, tone: 0, tilt: -3.5 },
  { id: "m2", caption: "memory no. 02", note: PLACEHOLDER_NOTE, tone: 1, tilt: 2.5, charm: "flower" },
  { id: "m3", caption: "memory no. 03", note: PLACEHOLDER_NOTE, tone: 2, tilt: -1.5 },
  { id: "m4", caption: "memory no. 04", note: PLACEHOLDER_NOTE, tone: 3, tilt: 3.5 },
  { id: "m5", caption: "memory no. 05", note: PLACEHOLDER_NOTE, tone: 4, tilt: 2 },
  { id: "m6", caption: "memory no. 06", note: PLACEHOLDER_NOTE, tone: 5, tilt: -3, charm: "flower" },
  { id: "m7", caption: "memory no. 07", note: PLACEHOLDER_NOTE, tone: 1, tilt: 1.5 },
  { id: "m8", caption: "memory no. 08", note: PLACEHOLDER_NOTE, tone: 0, tilt: -2.5 },
];

/* ------------------------------------------------------------------ */
/* Songs (placeholders for the vinyl player)                           */
/* ------------------------------------------------------------------ */

export const SONGS = [
  { title: "Our first song", artist: "A little piece of us", color: "#b9787e" },
  { title: "The long drives", artist: "Our favourite memories", color: "#858c70" },
  { title: "You feel like home", artist: "My favourite person", color: "#b7a3bd" },
];

/* ------------------------------------------------------------------ */
/* Quiz – five questions, four options each                            */
/* ------------------------------------------------------------------ */

export type QuizOption = {
  text: string;
  /** true = "the answer I would pick". Only used for the gentle tally at the end. */
  match?: boolean;
  /** Playful reply shown right after this option is chosen. */
  reply: string;
};

export type QuizQuestion = {
  id: string;
  prompt: string;
  options: [QuizOption, QuizOption, QuizOption, QuizOption];
};

export const QUIZ_NOTE = "five little questions about us";

export const QUIZ: QuizQuestion[] = [
  {
    id: "q1",
    prompt: "What's most likely to become our favourite tradition?",
    options: [
      { text: "Random late-night trips", reply: "The best traditions start with “shall we just go?”" },
      { text: "Getting Belgian waffles", match: true, reply: "A sweet tradition. I am already looking forward to it." },
      { text: "Chilling in Thar till sunrise", reply: "Just us, the night sky, and nowhere else to be." },
      { text: "Cafe dates", reply: "Good coffee, good company, and a table for two." },
    ],
  },
  {
    id: "q2",
    prompt: "What's our most memorable moment?",
    options: [
      { text: "Our first proper date", reply: "A day I would happily relive with you." },
      { text: "That random day we couldn't stop laughing", reply: "My favourite kind of memory: us being us." },
      { text: "Our first late-night drive", match: true, reply: "The road, the night, and you beside me." },
      { text: "That one moment you made me feel understood", reply: "I hope I keep making you feel that way." },
    ],
  },
  {
    id: "q3",
    prompt: "If our relationship had a movie title, what would it be?",
    options: [
      { text: "No Plans, Just Us", reply: "Our kind of story: spontaneous and together." },
      { text: "Waffles, Drives & You", match: true, reply: "Honestly, that already sounds like our favourite scenes." },
      { text: "The Way We Happened", reply: "A pretty lovely story, if you ask me." },
      { text: "Two Idiots in Love", reply: "A rom-com I'd watch a hundred times." },
    ],
  },
  {
    id: "q4",
    prompt: "If sleeping was an Olympic sport, what would your medal ceremony look like?",
    options: [
      { text: "Gold medal, obviously. No competition.", reply: "The judges agree. A flawless performance." },
      { text: "I'd sleep through the ceremony.", match: true, reply: "They can deliver the medal when you wake up." },
      { text: "I'd wake up just in time for the snacks.", reply: "Priorities worthy of a champion." },
      { text: "I'd ask for five more minutes before accepting my medal.", reply: "The official champion's encore: five more minutes." },
    ],
  },
  {
    id: "q5",
    prompt: "What's one thing about our relationship that makes you feel safe?",
    options: [
      { text: "Knowing I can be myself around you", match: true, reply: "Always. You never have to be anyone but you." },
      { text: "Knowing you'll listen without judging", reply: "I'll always make room to hear you out." },
      { text: "Knowing we can work through disagreements", reply: "We're on the same team, even when we disagree." },
      { text: "Knowing I don't have to pretend to be okay", reply: "You can bring every version of yourself to me." },
    ],
  },
];

/** Shown after the last question. {name} is replaced with PARTNER_NAME. */
export const QUIZ_RESULTS = {
  high: {
    title: "Well, look at you.",
    body: "You and I are nearly in sync, {name}. Scarily so. Please never stop.",
  },
  mid: {
    title: "A lovely little overlap.",
    body: "We matched on a few, {name}, and the rest are just excuses to talk about it over tea.",
  },
  low: {
    title: "Plot twist: there are no wrong answers.",
    body: "Every pick tells me something new about you, {name}, and I'm very much here for it.",
  },
  footer: "However the answers fell, you win the same prize: me, and a lifetime of rematches.",
};

/* ------------------------------------------------------------------ */
/* Final letter                                                        */
/* ------------------------------------------------------------------ */

export const LETTER = {
  heading: "and if I could choose again…",
  paragraphs: [
    "This is a placeholder for your letter. Replace these lines with the words only you can say: what you feel, what you are grateful for, and what you hope for.",
    "Keep it honest, keep it yours. A few true sentences will always beat a hundred grand ones.",
  ],
  closing: "I'd choose you, every time.",
  signoff: "always yours,",
  signature: "– your name here",
};
