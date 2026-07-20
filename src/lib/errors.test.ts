import { describe, it, expect } from "vitest";
import { FirebaseError } from "firebase/app";
import { getAppError, getErrorMessage, ValidationError } from "./errors";

describe("getAppError", () => {
  it("maps auth errors to friendly messages", () => {
    const err = new FirebaseError("auth/invalid-credential", "raw internal");
    const result = getAppError(err);
    expect(result.category).toBe("auth");
    expect(result.code).toBe("auth/invalid-credential");
    expect(result.message).toBe("Incorrect email or password. Please try again.");
  });

  it("maps permission-denied to the permission category", () => {
    const err = new FirebaseError("permission-denied", "raw");
    const result = getAppError(err);
    expect(result.category).toBe("permission");
    expect(result.message).toBe("You don't have permission to do that.");
  });

  it("maps storage errors", () => {
    const err = new FirebaseError("storage/unauthorized", "raw");
    const result = getAppError(err);
    expect(result.category).toBe("storage");
    expect(result.message).toBe("You don't have permission to upload this file.");
  });

  it("categorizes unavailable as a network problem", () => {
    const result = getAppError(new FirebaseError("unavailable", "raw"));
    expect(result.category).toBe("network");
  });

  it("never leaks the raw Firebase message", () => {
    const err = new FirebaseError(
      "auth/some-unmapped-code",
      "Internal: token xyz at /secret/path"
    );
    const result = getAppError(err);
    expect(result.message).not.toContain("token");
    expect(result.message).not.toContain("/secret/path");
    expect(result.message).toBe("Something went wrong. Please try again.");
  });

  it("passes ValidationError messages through (they are user-safe)", () => {
    const result = getAppError(new ValidationError("File is too large."));
    expect(result.category).toBe("validation");
    expect(result.message).toBe("File is too large.");
  });

  it("returns a generic message for arbitrary thrown values", () => {
    expect(getErrorMessage("boom")).toBe("Something went wrong. Please try again.");
    expect(getErrorMessage(undefined)).toBe(
      "Something went wrong. Please try again."
    );
    expect(getErrorMessage(new Error("raw internal error"))).toBe(
      "Something went wrong. Please try again."
    );
  });
});
