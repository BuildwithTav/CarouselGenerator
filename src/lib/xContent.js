import { ask, brandContext, generatePackage, feedbackBlock } from "./contentAi";

// The X content engine: a separate, lighter pipeline from the branded
// carousel system. Three native formats skip the slide-template renderer
// entirely (text-only, single AI photo, 2-4 photo carousel — the photo is
// attached to the post as-is, no headline/CTA overlay); a fourth format
// hands off to the real branded carousel system for a proper multi-slide
// post, capped at 4 slides to match X's own image-per-post limit.
//
// This brand's X account has a real enforcement history (one ban, several
// warnings, a pun video pulled down for being foot-suggestive even though it
// wasn't explicit) — so unlike a from-scratch account, "technically SFW"
// isn't a safe enough bar. The voice rules below are deliberately stricter
// than generic platform-safety advice: no foot-specific wordplay or jokes at
// all, ever, regardless of how mild. Feet stay visible in photos; they are
// never the punchline or the subject of the copy.

// Three posts a day, fixed: two text posts and one photo post (Tav's call —
// text is where replies come from and costs pennies; the photo is the
// brand's visual hook and the expensive one, so one a day). Each slot has
// its own job and a rotating set of proven X formats (POST_FORMATS below),
// so the account doesn't post the same shape of thing every day.
//
// What X's ranking actually rewards (its open-sourced For You weights, Aug
// 2026): a reply, quote or DM share counts ~10x a like, a copy-link share
// ~40x; a report, mute, "not interested" or block counts hugely against.
// So: posts people want to answer or send to someone, and nothing crude
// enough to get muted or reported. Asking for likes/replies/follows is
// demoted as engagement bait — the format has to make people WANT to reply.
export const X_SLOTS = [
  {
    key: "personality",
    job: "Scroll-stopper. A flirty, quirky, slightly cheeky text post that makes someone stop, smile, and either reply with their own version or send it to a friend. A statement, not a question: a confession, a hot take, a little crew-life story with a punchline.",
    formatWeights: { text: 1, single: 0 },
  },
  {
    key: "visual",
    job: "Visual identity. Let the photo do most of the work. The copy is short and never just describes what's in the photo — it adds a flirty line, a feeling, a moment, or a this-or-that about what's in the shot.",
    formatWeights: { text: 0, single: 1 },
  },
  {
    key: "conversation",
    job: "Reply magnet. A text post built so people genuinely want to answer it or argue with it: a this-or-that, an unpopular opinion, a specific question she answers first herself. Flirty and quirky, never a bland question.",
    formatWeights: { text: 1, single: 0 },
  },
];

// The formats that consistently drive replies and shares on X right now,
// per slot. One is picked per post; `how` is the brief the writer follows.
const POST_FORMATS = {
  personality: [
    { key: "confession", how: "A small, flirty personal confession from crew life, stated plainly as an admission (\"Confession:\" optional). Specific and a little cheeky, the kind of thing people reply \"same\" to or quote with their own." },
    { key: "unpopular_opinion_flat", how: "An unpopular opinion stated flat as fact, no question: a defensible, mildly spicy take about heels, tights, feet care, travel, crew life or dating someone who's crew. Something people genuinely split on, so half want to agree and half want to argue." },
    { key: "used_to_now", how: "Personal admission arc in two beats: what she used to think or do, then what changed. Cheeky, specific, ends on the turn." },
    { key: "myth_reality", how: "Myth vs reality about cabin crew life, heels or feet: one line stating what people assume, one line with the real, slightly flirty truth. A genuine fact or a real crew experience, never a joke about feet." },
    { key: "nobody_tells_you", how: "\"Nobody tells you\" about some part of the job: 1 to 3 very short specific lines, the kind of insider detail people screenshot or send to a friend who's crew." },
    { key: "mini_story", how: "A tiny crew-life scene in two or three short lines (a passenger, the galley, the crew room, the jump seat, getting ready at home) with a real, concrete punchline at the end. Flirty undertone." },
    { key: "curiosity_gap", how: "A hook that states an outcome without the explanation, then pays it off in the same post (never a cliffhanger that makes people click away): e.g. the one thing that gets her through a 12 hour shift in heels, then what it is." },
  ],
  conversation: [
    { key: "this_or_that", how: "This or that: two specific options from her world (heels off in the galley or wait till home; sheer tan or barely-there; aisle or window; early report or night flight), she picks one with a short flirty reason, and the reader naturally wants to say theirs. No \"reply below\", the choice itself invites it." },
    { key: "unpopular_opinion", how: "\"Unpopular opinion:\" followed by a defensible, flirty or cheeky take people will genuinely argue with: about heels, tights, feet, travel, passengers, or what men get wrong. One or two lines. It must be a real opinion, not a fake-controversial one." },
    { key: "answer_first_question", how: "A specific question that can be answered in one sentence, with her own answer given first so people feel invited to add theirs (\"Mine's the 6am report with no coffee. What's yours?\" style). Never a broad \"thoughts?\"." },
    { key: "green_red_flag", how: "Green flag or red flag post, flirty: \"Green flag: a man who knows what 15 denier means.\" One flag, specific and funny, the kind people reply to with their own." },
    { key: "hot_take_agree", how: "A short hot take about crew life or travel that people can agree or disagree with in one word, stated confidently. No \"agree?\" tag needed, the take does the work." },
    { key: "rank_it", how: "A quick ranking of 3 things from her world (worst moments of a long-haul, best feeling after a shift, things passengers do), numbered, cheeky, specific, so people reply with their own order." },
  ],
  visual: [
    { key: "photo_line", how: "One short flirty line that adds a feeling or a moment to the photo, never a description of it." },
    { key: "photo_this_or_that", how: "A short flirty this-or-that about something in the photo (heels on or off; tights or bare), she gives her answer." },
    { key: "photo_moment", how: "A specific little moment the photo was taken in, told in one or two lines, sensual and real." },
  ],
};

function pickPostFormat(slot) {
  const list = POST_FORMATS[slot.key] || POST_FORMATS.personality;
  return list[Math.floor(Math.random() * list.length)];
}

// Pillar 2 is deliberately reframed from the original "heels/feet/tights"
// brief: its primary expression is now real, positive, interesting feet
// facts told in a "did you know" tone, not jokes or wordplay about feet —
// see the file header for why. Lifestyle shots of heels/tights/tired feet
// after a shift still belong here as the visual side of the same pillar.
export const X_PILLARS = [
  { key: "cabin_crew_reality", label: "Cabin crew reality", weight: 25, guidance: "Highly relatable, specific observations about actually working as cabin crew: early reports, delays, crew-room moments, passengers, body clock chaos, uniform problems, packing, crew terminology, food and drinks onboard." },
  { key: "feet_facts_lifestyle", label: "Feet facts / heels lifestyle", weight: 20, guidance: "Lean heavily into real, positive, genuinely interesting feet facts told in a credible 'did you know' tone (anatomy, circulation and swelling on long flights, foot care, shoe and heel history, pedicure trivia) — informative first, with a light, warm, occasionally suggestive-but-tasteful tone, never a joke or pun about feet. Alongside the facts, lifestyle shots of heels, tights, tired feet after a shift, switching into flats, feet up at home — shown, never joked about or called out with explicit words." },
  { key: "humour", label: "Humour", guidance: "Short, cabin-crew-specific jokes and relatable situations. Never a foot pun, never a joke where feet are the punchline. The humour comes from the job, not the body part.", weight: 15 },
  { key: "travel_aviation", label: "Travel and aviation", weight: 15, guidance: "Airports, aircraft, take-off and landing, passengers, flying and travel observations." },
  { key: "conversation_opinion", label: "Conversation and opinion", weight: 15, guidance: "Posts built to trigger genuine replies and discussion: natural questions or statements people want to agree or disagree with, always rooted in cabin crew life or travel." },
  { key: "feminine_lifestyle", label: "Feminine lifestyle / behind the scenes", weight: 10, guidance: "Getting ready at home, outfits, beauty, coffee, pedicures, relaxing on a day off, the contrast between work and off-duty, everyday moments." },
];

function weightedPick(items, weightKey = "weight") {
  const total = items.reduce((s, i) => s + i[weightKey], 0);
  let r = Math.random() * total;
  for (const item of items) {
    r -= item[weightKey];
    if (r <= 0) return item;
  }
  return items[items.length - 1];
}

export function pickPillar() {
  return weightedPick(X_PILLARS);
}

// Returns "text" | "single" — only ever text or exactly one photo. Ignores
// any carousel/branded_carousel weight a slot might still carry, so that
// format can't come back by way of a stray config value.
export function pickFormat(slot) {
  const w = slot.formatWeights;
  const items = [
    { key: "text", weight: w.text },
    { key: "single", weight: w.single },
  ];
  const format = weightedPick(items, "weight").key;
  const photoCount = format === "single" ? 1 : 0;
  return { format, photoCount };
}

const BANNED_PHRASES = `There's something about..., It's not just X, it's Y, Because sometimes..., A little reminder..., POV: when..., Tell me you're X without telling me..., Who else can relate?, Can we talk about..., Just another day..., Nothing beats..., If you know, you know`;

const VOICE_RULES = `You write as a real woman who actually works cabin crew, posting on her own X account. She's 30, confident, having a good time with her life, and this is just her talking, not a brand account. Personality: playful, feminine, confident, slightly cheeky, observational, occasionally sarcastic, conversational, relatable, never desperate for engagement — and genuinely flirty: a sensual, alluring undertone that invites rather than announces, the same quiet seductiveness this brand already writes with elsewhere (think "a slow reveal", not a hard sell). British English, natural punctuation, sentence fragments are fine. Occasional emojis from this set only, used sparingly, never in every post: ✈️ 👠 😮‍💨 😂 🛫 ☕️ 🖤.

Never use an em dash or en dash (—, –) anywhere, for any reason — use a comma, full stop, or just start a new sentence instead. Never use jargon, business-speak, or a word an ordinary 30-year-old wouldn't actually say out loud (no "elevate", "curated", "journey", "vibe check", "era" as a noun, "main character", or anything that sounds like a brand strategist wrote it). Plain, everyday words only.

Never sound like an automated account, a content farm, or an AI. Never use these phrases or anything that reads like them: ${BANNED_PHRASES}. If a line reads like marketing copy, a LinkedIn post, or a listicle, rewrite it plainer. Watch especially for a vague, poetic, slightly melancholy closing line tacked onto an otherwise normal post ("...and so am I, apparently", "...just like that", "...funny how that works") — that specific pattern reads as AI-generated. If a post needs a punchline, make it a real, specific, concrete one, not a wistful one-liner.

Never write a line that could be misread or land wrong, and never force a joke that isn't actually funny, shoehorned in because the post "needs" one — if there's no genuinely funny angle, don't make one up.

Length: short and sweet, always. Most posts are 5 to 20 words. Conversational posts can run a little longer but 35 words is a hard ceiling, not a target to aim for — when in doubt, cut it shorter, never pad a short punchy thought out to fill space. This has to leave room for hashtags too (they count toward the same post), so write the line itself tight enough that adding them doesn't cut anything off. A post that reads as rambling or runs long is a failure here, full stop.

Hashtags: every post carries 2 to 5, placed inside the post text itself (never as a separate trailing block, never generic filler like #love or #instagood). Pick ones genuinely tied to this specific post's actual content — the pillar, the moment, the job it's doing. Treat zero hashtags as something to actively avoid, not a neutral default; only skip them if you genuinely cannot find any that fit this exact post.

Never beg for engagement: no "like if you agree", "retweet if", "follow me for more", "drop a [emoji]", "comment YES", "tag someone", "let's get this to X likes". Never mention OnlyFans, never link to the website, never ask people to visit the profile — this is organic growth content, not a sales post.

Don't default to ending a post on a question. A question is the exception, not the structure every post reaches for, most posts should be a flat statement, an observation, or a sensual little moment described plainly, full stop at the end. Only end on a question when the post's format calls for one (a this-or-that, or a specific question she answers first herself).

For a single-image or carousel post, never just describe what's visible in the photo ("here's my feet after a long shift"). The copy adds a feeling, a moment, a number, a punchline the photo doesn't already say. Let the image do the work.

Lean into suggestive and seductive, genuinely — a real physical, sensory moment, not just a mood word dropped in. Think specific detail: the heat, the relief of slipping out of a hot shoe on a break, the stretch after a long shift, bare feet on cool tile after being in heels for hours, the exact feeling of a moment like that. That specificity is what makes it land as alluring instead of generic. This is a tone, not a licence: still fully clothed above the waist always, nothing explicit, no crude language, nothing beyond what the brand's existing boudoir-style editorial photography already does. Absolute rule, not a style preference, and unrelated to the above: no wordplay, puns, or jokes about feet, toes, or soles, however mild. Never use the words "feet pics", "fetish", "worship", "soles", or "toes" as the subject of a joke. This account has already been banned once and warned multiple times for content that read as sexual or suggestive, including a pun that was never explicit in its wording. Feet can appear in photos and in genuine, factual, positive context (see the feet-facts pillar) but are never the punchline, never the explicit subject of a joke, and never described in explicit or crude language. Suggestive and sensory is encouraged; a foot-specific joke or pun is not, ever — those are different things and this distinction matters. To be direct about what that actually means: say "feet", "legs", "tights", "heels" plainly when that's genuinely what the post is about — don't dance around the words with vague euphemisms. The rule above is specifically about turning them into a joke or pun, not about avoiding naming them. Mentioning them directly, including sensually, is exactly what this account is for.`;

// ── Findom text posts (Tav, Oct 2026) ────────────────────────────────────
// Sky High Soles' text posts are aimed at the findom world: paypigs,
// daddies, being spoiled, gifts, pointing to her Throne wishlist and her
// OnlyFans. Photo posts keep the cabin-crew brief above. Tav approves every
// draft before it goes out.
export const TEXT_FOCUS = {
  "sky-high-soles": {
    links: { wishlist: "throne.com/skyhighsoles", onlyfans: "onlyfans.com/skyhighsoles" },
    // Share of text posts that carry the actual link; the rest say it's in
    // her bio. Every post since X said (July 2026) it dropped its reach
    // penalty for link posts. Lower it if link posts start getting less reach.
    linkChance: 1,
  },
};

const FINDOM_JOBS = {
  personality: "Scroll-stopper. A bratty, confident statement a paypig or daddy stops scrolling for: what she expects, what she deserves, how it feels when a tribute lands. A statement, not a question.",
  conversation: "Reply magnet. Built so paypigs and daddies want to answer: a this-or-that, a specific question she answers first herself, or a playful \"who's first today\".",
};

export const FINDOM_THEMES = [
  { key: "spoil_me", label: "Being spoiled", weight: 25, guidance: "What she deserves after a long shift (new heels, a pedicure, a spa day, a first-class seat for once), said as an expectation, never a hope. Points to her wishlist.", link: "wishlist" },
  { key: "tributes", label: "Tributes", weight: 20, guidance: "The thrill of a tribute landing, the ones who know their place, who sent one today, said with bratty confidence. Points to her wishlist.", link: "wishlist" },
  { key: "daddies", label: "Daddies", weight: 15, guidance: "The generous man who treats her: what a good one does without being asked, light teasing of the ones who only talk.", link: null },
  { key: "wishlist", label: "Wishlist", weight: 15, guidance: "Her Throne wishlist: that there's something on it with someone's name on it, whose turn it is. Keep it general, never invent a specific item.", link: "wishlist" },
  { key: "onlyfans_tease", label: "OnlyFans tease", weight: 15, guidance: "What's waiting on her OnlyFans (her feet in nylons, heels, slow reveals), and that it's earned, not free. Suggestive, never explicit.", link: "onlyfans" },
  { key: "crew_flavour", label: "Crew life, spoiled", weight: 10, guidance: "Her flight-attendant life as the setting for being spoiled: the salary doesn't cover the heels, that's what you're for; a long-haul, the crew room, a layover.", link: null },
];

const FINDOM_FORMATS = {
  personality: [
    { key: "demand", how: "A short, confident demand: what she wants and who's providing it. No question." },
    { key: "confession", how: "A bratty little confession about being spoiled or about tributes, specific and cheeky." },
    { key: "rules", how: "Her rules, as 2 or 3 short numbered lines: how a proper tribute works, or what a good paypig does. Playful and dominant." },
    { key: "moment", how: "A tiny moment in one or two lines (a tribute landing mid-shift, opening a gift after a long-haul) with a cheeky, concrete punchline." },
  ],
  conversation: [
    { key: "this_or_that", how: "Two things she could be treated to; she picks one, and it's clear which one 'you' are covering." },
    { key: "answer_first", how: "A specific question for her paypigs or daddies, with her own answer first so they want to add theirs. Never a broad \"thoughts?\"." },
    { key: "whos_first", how: "A playful \"who's first today?\" style post about the first tribute or gift of the day, with a reason today is the day." },
    { key: "rank_it", how: "A quick numbered ranking of 3 ways to spoil her, cheeky and specific, so people reply with theirs." },
  ],
};

const FINDOM_VOICE = `You write as a confident, bratty, spoiled 30-year-old flight attendant who runs a findom page on her own X account. She expects to be spoiled, teases her paypigs and daddies, and treats tributes and gifts as her due. Playful dominance and teasing, never needy or desperate. This is an 18+ account for an adult audience who come looking for exactly this. British English, natural punctuation, sentence fragments are fine. Emojis sparingly, from this set only: 👠 💸 🖤 👑 💅 🎁 ✈️ 😮‍💨.

Never use an em dash or en dash (—, –); use a comma, full stop or a new sentence. Plain everyday words, nothing that sounds like a marketer or an AI wrote it. Never use these phrases or anything like them: ${BANNED_PHRASES}.

Length: short. 5 to 25 words of post before any link and hashtags; 35 words is a hard ceiling. The whole post, link and hashtags included, stays well under 280 characters.

Findom words are fine and expected: findom, paypig, finsub, tribute, spoil, daddy, wallet, wishlist, worship, feet, nylons, heels.
What it never does:
- Nothing sexually explicit: no sex acts, nothing about nudity or genitals. Suggestive and teasing only.
- No threats, blackmail, exposing anyone, debts, or guilt about money someone can't afford. No promises to meet up or of any contact outside her pages.
- Nothing that hints at minors or youthfulness (school, teen, young, little, barely legal), non-consent or violence, in the words or the hashtags.
- Never ask for likes, reposts, replies or follows.

Hashtags: 2 to 5, inside the post, from the findom and fetish world and fitting this post (for example #findom #paypig #finsub #tribute #spoilme #footfetish #nylonfeet #pantyhose #sugardaddy). Never tags about minors, non-consent or violence.`;

function weekdayLondon(date = new Date()) {
  return date.toLocaleDateString("en-GB", { weekday: "long", timeZone: "Europe/London" });
}

// One findom text post. Returns the same shape as generateXPost, plus the
// theme it was written on.
async function generateFindomTextPost(brand, { slot, recentPosts = [], feedback = [], rand = Math.random }) {
  const focus = TEXT_FOCUS[brand?.slug];
  const theme = weightedPick(FINDOM_THEMES);
  const formats = FINDOM_FORMATS[slot.key] || FINDOM_FORMATS.personality;
  const postFormat = formats[Math.floor(rand() * formats.length)];
  const target = theme.link || (rand() < 0.6 ? "wishlist" : "onlyfans");
  const page = target === "onlyfans" ? "her OnlyFans" : "her Throne wishlist";
  const withLink = rand() < focus.linkChance;
  const cta = withLink
    ? `End by pointing to ${page} with this exact link, written exactly as given: ${focus.links[target]}`
    : `End by pointing to ${page} and saying it's in her bio (for example "wishlist in bio" or "OF in bio"). No link in this one.`;

  const recentBlock = recentPosts.length
    ? `Recent posts from this account (do not repeat their hook, angle or sentence structure):\n${recentPosts.map((p) => `- ${p}`).join("\n")}`
    : "No recent post history yet.";

  const system = `You write one X (Twitter) post for an adult creator's account. Reply with JSON only: {"text": "..."}.
${FINDOM_VOICE}`;
  const user = `${brandContext(brand)}

Today is ${weekdayLondon()}. Day themes like Tribute Tuesday or Wallet Wednesday are fine when they fit, never forced.
Today's post job: ${FINDOM_JOBS[slot.key] || FINDOM_JOBS.personality}
Theme: ${theme.label}. ${theme.guidance}
Format (follow it): ${postFormat.how}
This post is text only. ${cta}

${recentBlock}
${feedbackBlock(feedback)}
Before answering, check: is it short, confident and bratty rather than needy? Does it follow the format and the theme? Does it point to ${page} the way asked? Does it have 2 to 5 fitting hashtags? Is it clearly different from the recent posts? Is it free of em dashes and AI-sounding phrases, and inside every "never" above?

Write the post.`;

  const out = await ask(system, user, 800);
  return { text: clampTweet(String(out.text || "").trim()), scenes: [], postFormat: `findom_${postFormat.key}`, theme: theme.label };
}

// `recentPosts` is a short list of recent captions (already posted or
// queued) for this brand, used purely to stop the model repeating a hook,
// joke, question, or structure it's already used in roughly the last month.
//
// If the model ever runs over X's 280-char limit despite the length rules
// in VOICE_RULES, cut at the last whole word rather than slicing mid-string
// — a blind slice(0, 280) is exactly how a post ended mid-word ("...on a
// sho") and read as obviously broken rather than just a bit long.
function clampTweet(text) {
  if (text.length <= 280) return text;
  const cut = text.slice(0, 280);
  const lastSpace = cut.lastIndexOf(" ");
  return (lastSpace > 0 ? cut.slice(0, lastSpace) : cut).trim();
}

// Text-first, not photo-first: for "single"/"carousel" this writes the post
// AND a precise description of what each attached photo must show, in one
// call — the caller then generates a photo FROM that description (see
// imageGen.js), so a line like "slipped into the bath out of my tights"
// gets a photo that actually shows that, not a vaguely-matching stock shot.
export async function generateXPost(brand, { slot, pillar, format, recentPosts = [], feedback = [], photoIdea = null, rand = Math.random }) {
  if (format === "text" && TEXT_FOCUS[brand?.slug]) return generateFindomTextPost(brand, { slot, recentPosts, feedback, rand });
  const needsPhotos = format === "single" || format === "carousel";
  const postFormat = pickPostFormat(slot);

  const system = `You write one X (Twitter) post for a brand's account. Reply with JSON only: ${needsPhotos ? `{"text": "...", "scenes": ["...", ...]}` : `{"text": "..."}`}.
${VOICE_RULES}
${needsPhotos ? `\nYou are also directing the photo(s) that go with this post — they don't exist yet, you're describing exactly what to generate. For each photo, write one vivid, concrete scene description (setting, pose, specific action, props — enough detail that a photographer could shoot exactly this): a precise physical scene, not a mood or a vibe. The post's words and the scene(s) must describe the same real moment — if the text says something specific happened ("slipped into the bath out of my tights"), the scene has to show exactly that, tights included. Describe the natural version of the moment, the photo she'd actually take of it, the way a photographer would see it, not a list of every noun in the post: jokes and figures of speech in the post ("kettle on", "the heels don't get a say") are not props, only things physically where she is can be in the scene (feet up on the balcony with the kettle boiled is a balcony scene with no kettle), anything the post says is absent or for later stays out of the scene, and off duty means no uniform and no work heels. Always fully clothed above the waist, nothing explicit, her head out of the frame (consistent with this brand's existing photo direction).
Every scene happens in a real cabin crew life place: on the aircraft (cabin aisle, jump seat, galley, crew rest), the crew room, the airport, her own home (getting ready, bed, sofa, bath, kitchen, balcony), a pedicure chair, or now and then a hotel room or pool. Layovers and hotels are overused on this account: don't make the post about a layover or set it in a hotel unless it's genuinely the point, and never if one of the recent posts above already was. Pick a moment for the post that happens in one of those places, so the words and the photo match: never a bus, taxi, car, train, gym, street or shop. With her uniform, her shoes are navy court heels or navy flats (the same navy as her skirt) and her tights are sheer tan; never black shoes. Vary the moment, the pose and the place from post to post so the account never looks predictable: feet up on a seat or window ledge, lying on the crew bunk on her front with her feet raised, kneeling seen from behind, on tiptoe reaching into a galley locker, walking away down the aisle, stretching her feet after a shift, heels off beside her. Her shoes are on her feet or resting on the floor, never dangling from her toes. Never her hands busy putting on or pulling off shoes or tights.` : ""}`;

  const formatBrief =
    format === "text"
      ? "This post is text-only, no image. The words alone have to carry it."
      : format === "single"
      ? "This post gets one photo, generated to match. \"scenes\" is an array with exactly one entry. 3 to 25 words of post text — never a caption that just describes the photo, but it has to genuinely depict the same moment as the scene you describe, not a generic line."
      : "This post gets 2 to 4 photos, generated to match, in a short sequence that tells a tiny story or shows real progression (e.g. getting ready, then heels, then aircraft, then shoes off). \"scenes\" is an array with one entry per photo, in order. Write one short line of post text for the whole set, not per-photo captions.";

  const recentBlock = recentPosts.length
    ? `Recent posts from this account (do not repeat their hook, joke, question, topic angle, or sentence structure — the execution must be noticeably different even if the broad topic recurs):\n${recentPosts.map((p) => `- ${p}`).join("\n")}`
    : "No recent post history yet.";

  const user = `${brandContext(brand)}

Today's post job: ${slot.job}
Post format for this one (follow it): ${postFormat.how}
Content pillar: ${pillar.label}. ${pillar.guidance}
${formatBrief}${needsPhotos && photoIdea ? `
Tav has asked for this exact photo: "${photoIdea}". The scene must be exactly that (keep it inside the brand's photo rules above), and the post text must be about that same moment.` : ""}
The first line is the hook: it has to stop a thumb on its own. Flirty, quirky and specific beats clever and vague. Never ask for likes, reposts, replies or follows, and nothing crude enough that someone would mute or report it.

${recentBlock}
${feedbackBlock(feedback)}
Before answering, check every one of these — this has to be a 10/10, not a rough draft: Is it short — genuinely short, not just under some technical limit? Does it have 2-5 hashtags that actually fit this specific post (and only skip them if truly nothing does)? Is it flirty, suggestive and alluring, not flat or purely observational? Does it sound like a real person, not an automated account? Is it clearly different from the recent posts above? Is the language natural, not AI-coded, no em dashes, no jargon? Does it follow today's post format, and only end on a question if that format calls for one? ${needsPhotos ? "Does each scene describe the exact same moment the text is about, specifically enough to actually shoot?" : ""} If this touches feet at all, is it handled through genuine lifestyle or fact framing, with zero wordplay or joking?

Write the post${needsPhotos ? " and its scene description(s)" : ""}.`;

  const out = await ask(system, user, 800);
  const text = clampTweet(String(out.text || "").trim());
  const scenes = needsPhotos ? (Array.isArray(out.scenes) ? out.scenes.map((s) => String(s || "").trim()).filter(Boolean) : []) : [];
  return { text, scenes, postFormat: postFormat.key };
}

// Hands off to the real branded carousel system (same one Instagram content
// uses) for a short, proper multi-slide post — capped at 4 slides to match
// X's own image-per-post limit. Reuses generatePackage as-is rather than
// forking its slide-writing logic; the X pillar only seeds the one-line idea
// it's built from, the slides themselves are written in the brand's own
// template voice (SLIDE_BRIEF), not the X voice rules above.
export async function generateBrandedCarouselIdea(brand, { pillar, recentPosts = [] }) {
  const system = `You write a one-line content idea for a short branded carousel post. Reply with JSON only: {"idea": "..."}.`;
  const recentBlock = recentPosts.length
    ? `Avoid repeating the topic or angle of these recent posts:\n${recentPosts.slice(0, 10).map((p) => `- ${p}`).join("\n")}`
    : "";
  const user = `${brandContext(brand)}
Content pillar: ${pillar.label}. ${pillar.guidance}
${recentBlock}
Write one specific, concrete content idea for a short carousel (3 content slides plus a closing slide) on this pillar.`;
  const out = await ask(system, user, 300);
  return String(out.idea || pillar.label).trim();
}

export { generatePackage };
