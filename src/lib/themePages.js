// ─── THEME PAGES PRODUCTION MODE ───────────────────────────
// Pure constants + helpers for the automated batch-content engine.
// No React here — kept separate so the pipeline logic is easy to reason
// about independently of the 5000-line UI component that consumes it.

export const THEME_FORMATS = [
  { id: "number-list", label: "Number list", hint: "Open with a number (e.g. '4 subtle signs someone feels safe around you'). Each middle slide delivers one item from that list." },
  { id: "curiosity", label: "Curiosity gap", hint: "Open with a claim that creates curiosity without fully explaining it (e.g. 'Your brain does this every day without you noticing'), then resolve it across the middle slides." },
  { id: "explanation", label: "Explanation", hint: "Open with a 'why' question (e.g. 'Why people pull away when things start going well'), then explain the mechanism step by step." },
  { id: "named-effect", label: "Named psychological effect", hint: "Center the whole carousel on one named effect or concept and explain what it is and why it happens." },
  { id: "practical-hack", label: "Practical hack", hint: "Open with the problem, then give one concrete, practical technique to fix it (e.g. 'Can't stop overthinking? Try this')." },
  { id: "myth", label: "Myth-busting", hint: "State a common myth plainly, then correct it with a more accurate, nuanced view." },
  { id: "comparison", label: "Comparison", hint: "Contrast two things side by side across the carousel (e.g. secure vs insecure communication)." },
  { id: "behaviour-signs", label: "Behaviour signs", hint: "List a small number of observable behaviours that quietly indicate something (e.g. emotional maturity)." },
];

export const THEME_PAGE_DEFAULTS = {
  psychology: {
    id: "psychology",
    label: "Psychology",
    pillars: ["Cognitive biases", "Social psychology", "Human behaviour", "Memory", "Habits", "Motivation", "Communication", "Emotional intelligence", "Confidence", "Overthinking", "Decision making", "Psychological effects", "Attachment", "Productivity psychology", "Behavioural psychology"],
    visualStyle: "cinematic editorial photography, realistic humans, slightly moody, premium, modern, subtle film grain, natural lighting, emotion-driven, plenty of negative space, no text or writing anywhere in the image, no obvious AI look",
    contentRules: "Avoid medical diagnosis. Avoid fake neuroscience. Avoid unsupported 'dark psychology' claims. Never present speculation as scientific fact — frame uncertain claims as 'research suggests', 'one theory is', or 'a common pattern is'.",
    ctaStyle: "follow, save, or share — never a fake product, download, or link",
    fontId: "poppins",
    accentColor: "#60A5FA",
    bgColour: "#12141c",
  },
  relationships: {
    id: "relationships",
    label: "Relationships",
    pillars: ["Attraction", "Dating", "Communication", "Attachment", "Conflict", "Emotional availability", "Trust", "Compatibility", "Boundaries", "Long-term relationships", "Breakups", "Green flags", "Red flags", "Relationship habits", "Texting and communication", "Emotional connection"],
    visualStyle: "cinematic lifestyle photography, couples or people in emotional situations, realistic, intimate, modern, natural light, editorial, subtle mood, not cheesy stock photography, no text or writing anywhere in the image, no obvious AI look",
    contentRules: "Avoid absolute interpretations of someone else's behaviour. Never state 'if they do X they're cheating' — prefer 'this can sometimes indicate...', 'one possible reason...', 'it may be a sign...'.",
    ctaStyle: "follow, save, or share — never a fake product, download, or link",
    fontId: "playfair",
    accentColor: "#C4756A",
    bgColour: "#241418",
  },
};

// Rotate through these per post so 20 posts don't all crop the hero image
// the same way. Each sequence is applied slide-by-slide (wrapping if a post
// has more slides than the sequence).
export const CROP_SEQUENCES = [
  [{ x: 50, y: 35 }, { x: 35, y: 50 }, { x: 65, y: 45 }, { x: 50, y: 30 }, { x: 50, y: 50 }],
  [{ x: 50, y: 50 }, { x: 70, y: 40 }, { x: 30, y: 55 }, { x: 50, y: 35 }, { x: 60, y: 50 }],
  [{ x: 40, y: 45 }, { x: 60, y: 55 }, { x: 50, y: 35 }, { x: 35, y: 50 }, { x: 50, y: 50 }],
  [{ x: 55, y: 40 }, { x: 45, y: 55 }, { x: 50, y: 50 }, { x: 65, y: 35 }, { x: 40, y: 45 }],
];

const STOPWORDS = new Set(["the", "a", "an", "of", "to", "in", "on", "for", "and", "or", "is", "are", "your", "you", "it", "this", "that", "why", "how", "what", "when", "with", "from", "about", "into", "their", "them", "they", "people", "someone", "one", "can", "do", "does", "did", "be", "if", "than", "then", "just", "not", "so", "as", "at", "by", "way", "will", "most", "more", "really"]);

export function extractKeywords(text) {
  return Array.from(new Set(
    (text || "").toLowerCase().replace(/[^a-z0-9\s]/g, " ").split(/\s+/)
      .filter(w => w.length > 2 && !STOPWORDS.has(w))
  ));
}

export function jaccardSimilarity(aWords, bWords) {
  const a = new Set(aWords), b = new Set(bWords);
  if (!a.size || !b.size) return 0;
  let inter = 0;
  for (const w of a) if (b.has(w)) inter++;
  return inter / (a.size + b.size - inter);
}

// Lightweight, dependency-free duplicate-content guard. Not semantic
// embeddings — just keyword overlap — but cheap, fast, and good enough to
// stop the model repeating the same fact/angle across a batch.
export function mostSimilar(topicText, memoryEntries, limit = 1) {
  const words = extractKeywords(topicText);
  let best = null, bestScore = 0;
  for (const m of memoryEntries) {
    const score = jaccardSimilarity(words, m.keywords || []);
    if (score > bestScore) { bestScore = score; best = m; }
  }
  return { score: bestScore, entry: best };
}

export function isTooSimilar(topicText, memoryEntries, threshold = 0.45) {
  return mostSimilar(topicText, memoryEntries).score >= threshold;
}

export function slugify(text) {
  return (text || "post")
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 40)
    .replace(/-+$/, "") || "post";
}

const TP_KEY = "bwt_theme_v1";

export function defaultThemeState() {
  return {
    pages: {
      psychology: { ...THEME_PAGE_DEFAULTS.psychology },
      relationships: { ...THEME_PAGE_DEFAULTS.relationships },
    },
    posts: [],
    memory: { psychology: [], relationships: [] },
  };
}

export function loadThemeState() {
  try {
    if (typeof window === "undefined") return defaultThemeState();
    const raw = JSON.parse(localStorage.getItem(TP_KEY) || "null");
    if (!raw) return defaultThemeState();
    const base = defaultThemeState();
    return {
      pages: { ...base.pages, ...(raw.pages || {}) },
      posts: Array.isArray(raw.posts) ? raw.posts : [],
      memory: { ...base.memory, ...(raw.memory || {}) },
    };
  } catch {
    return defaultThemeState();
  }
}

export function saveThemeState(state) {
  try {
    if (typeof window === "undefined") return;
    localStorage.setItem(TP_KEY, JSON.stringify(state));
  } catch (e) {
    console.error("Theme Pages state save failed:", e);
  }
}
