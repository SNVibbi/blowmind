/**
 * Server-side spam heuristics. MIRROR of the app's src/lib/spam.ts —
 * keep the two in sync. This is the enforced copy (clients can be
 * bypassed; Cloud Functions can't).
 */
const BANNED_PHRASES = [
  "viagra",
  "casino",
  "crypto giveaway",
  "double your bitcoin",
  "work from home and earn",
  "click here to win",
];

const MAX_LINKS = 5;
const CAPS_MIN_LETTERS = 20;
const CAPS_RATIO = 0.7;

export interface SpamResult {
  spam: boolean;
  reason: string | null;
}

function stripTags(html: string): string {
  return html.replace(/<[^>]*>/g, " ");
}

export function detectSpam(input: string): SpamResult {
  const text = stripTags(input);

  const links = (text.match(/https?:\/\//gi) || []).length;
  if (links > MAX_LINKS) return { spam: true, reason: "too-many-links" };

  const letters = text.replace(/[^a-zA-Z]/g, "");
  if (letters.length >= CAPS_MIN_LETTERS) {
    const caps = text.replace(/[^A-Z]/g, "").length;
    if (caps / letters.length > CAPS_RATIO) {
      return { spam: true, reason: "excessive-caps" };
    }
  }

  if (/(.)\1{9,}/.test(text)) return { spam: true, reason: "repeated-chars" };

  const lower = text.toLowerCase();
  for (const phrase of BANNED_PHRASES) {
    if (lower.includes(phrase)) return { spam: true, reason: "banned-phrase" };
  }

  return { spam: false, reason: null };
}

/** Simple stable hash for duplicate-content detection. */
export function contentHash(text: string): string {
  let hash = 0;
  const normalized = stripTags(text).toLowerCase().replace(/\s+/g, " ").trim();
  for (let i = 0; i < normalized.length; i++) {
    hash = (hash << 5) - hash + normalized.charCodeAt(i);
    hash |= 0;
  }
  return String(hash);
}
