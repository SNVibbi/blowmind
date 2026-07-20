import { describe, it, expect } from "vitest";
import { toPlainText } from "./text";

describe("toPlainText", () => {
  it("strips HTML tags", () => {
    expect(toPlainText("<p>Hello <strong>world</strong></p>")).toBe("Hello world");
  });

  it("decodes common entities", () => {
    expect(toPlainText("Tom &amp; Jerry &lt;3")).toBe("Tom & Jerry <3");
  });

  it("collapses whitespace", () => {
    expect(toPlainText("a\n\n  b   c")).toBe("a b c");
  });

  it("truncates on a word boundary with an ellipsis", () => {
    const out = toPlainText("one two three four five", 12);
    expect(out.endsWith("…")).toBe(true);
    expect(out.length).toBeLessThanOrEqual(13);
    expect(out).not.toContain("thr…"); // no mid-word cut
  });

  it("leaves short text untouched", () => {
    expect(toPlainText("short", 160)).toBe("short");
  });
});
