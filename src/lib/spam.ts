/**
 * Stateless spam heuristics for user-authored text. Deliberately
 * conservative to avoid false positives. Used client-side for immediate
 * feedback; the same logic is mirrored server-side in
 * functions/src/spam.ts for enforcement (keep the two in sync).
 */

// Illustrative starter list — expand/replace for your community.
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
  if (links > MAX_LINKS) {
    return { spam: true, reason: "Too many links." };
  }

  const letters = text.replace(/[^a-zA-Z]/g, "");
  if (letters.length >= CAPS_MIN_LETTERS) {
    const caps = text.replace(/[^A-Z]/g, "").length;
    if (caps / letters.length > CAPS_RATIO) {
      return { spam: true, reason: "Please don't write mostly in capitals." };
    }
  }

  if (/(.)\1{9,}/.test(text)) {
    return { spam: true, reason: "Too many repeated characters." };
  }

  const lower = text.toLowerCase();
  for (const phrase of BANNED_PHRASES) {
    if (lower.includes(phrase)) {
      return { spam: true, reason: "This looks like prohibited content." };
    }
  }

  return { spam: false, reason: null };
}
