/**
 * Convert post HTML into a plain-text excerpt for meta descriptions and
 * previews. Strips tags and entities, collapses whitespace, truncates on
 * a word boundary. Safe for both server and client (no DOM needed).
 */
export function toPlainText(html: string, maxLength = 160): string {
  const text = html
    .replace(/<[^>]*>/g, " ") // strip tags
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();

  if (text.length <= maxLength) return text;

  const truncated = text.slice(0, maxLength);
  const lastSpace = truncated.lastIndexOf(" ");
  return `${(lastSpace > 0 ? truncated.slice(0, lastSpace) : truncated).trim()}…`;
}
