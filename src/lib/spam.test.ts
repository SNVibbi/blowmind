import { describe, it, expect } from "vitest";
import { detectSpam } from "./spam";

describe("detectSpam", () => {
  it("passes normal content", () => {
    expect(detectSpam("Here are my thoughts on gardening this spring.").spam).toBe(
      false
    );
  });

  it("allows a couple of links", () => {
    expect(
      detectSpam("See https://a.com and https://b.com for context.").spam
    ).toBe(false);
  });

  it("flags excessive links", () => {
    const text = Array.from({ length: 7 }, (_, i) => `https://x${i}.com`).join(
      " "
    );
    expect(detectSpam(text)).toEqual({ spam: true, reason: "Too many links." });
  });

  it("flags mostly-capitalized shouting", () => {
    expect(detectSpam("BUY NOW LIMITED TIME OFFER ACT FAST TODAY").spam).toBe(
      true
    );
  });

  it("does not flag short capitalized text (e.g., acronyms)", () => {
    expect(detectSpam("NASA and NBy").spam).toBe(false);
  });

  it("flags long runs of repeated characters", () => {
    expect(detectSpam("soooooooooooo good").spam).toBe(true);
  });

  it("flags banned phrases case-insensitively", () => {
    expect(detectSpam("Free CASINO bonus inside").spam).toBe(true);
  });

  it("ignores HTML tags when measuring capitalization", () => {
    expect(detectSpam("<p>A normal sentence about code.</p>").spam).toBe(false);
  });
});
