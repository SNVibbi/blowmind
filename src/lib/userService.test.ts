import { describe, it, expect, vi } from "vitest";

// firebaseConfig initializes Firebase at import time and requires env
// vars; stub it since normalizeUserProfile is pure and never touches it.
vi.mock("../utils/firebaseConfig", () => ({ db: {}, auth: {}, storage: {} }));

import { normalizeUserProfile, DEFAULT_AVATAR } from "./userService";

describe("normalizeUserProfile", () => {
  it("normalizes a well-formed document", () => {
    const profile = normalizeUserProfile({
      firstName: "Ada",
      lastName: "Lovelace",
      email: "ada@example.com",
      photoUrl: "https://example.com/a.jpg",
      headline: "Engineer",
      interests: ["tech"],
      category: "tech",
      online: true,
    });
    expect(profile.firstName).toBe("Ada");
    expect(profile.photoUrl).toBe("https://example.com/a.jpg");
    expect(profile.interests).toEqual(["tech"]);
  });

  it("accepts the legacy photoURL (capitalized) field", () => {
    const profile = normalizeUserProfile({ photoURL: "https://example.com/legacy.jpg" });
    expect(profile.photoUrl).toBe("https://example.com/legacy.jpg");
  });

  it("accepts the legacy singular interest field", () => {
    const profile = normalizeUserProfile({ interest: ["music", "art"] });
    expect(profile.interests).toEqual(["music", "art"]);
  });

  it("falls back to the default avatar when no photo is set", () => {
    const profile = normalizeUserProfile({});
    expect(profile.photoUrl).toBe(DEFAULT_AVATAR);
  });

  it("fills safe defaults for a completely empty document", () => {
    const profile = normalizeUserProfile({});
    expect(profile).toEqual({
      firstName: "",
      lastName: "",
      email: "",
      photoUrl: DEFAULT_AVATAR,
      headline: "",
      interests: [],
      category: "",
      online: false,
    });
  });
});
