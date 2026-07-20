import { describe, it, expect } from "vitest";
import { validateImageFile, MAX_UPLOAD_BYTES } from "./imageUtils";

function fakeFile(type: string, size: number): File {
  const file = new File(["x"], "test", { type });
  Object.defineProperty(file, "size", { value: size });
  return file;
}

describe("validateImageFile", () => {
  it("accepts a small JPEG", () => {
    expect(validateImageFile(fakeFile("image/jpeg", 1024))).toBeNull();
  });

  it("rejects non-image types", () => {
    expect(validateImageFile(fakeFile("application/pdf", 1024))).toMatch(
      /JPEG|PNG|WebP|GIF/
    );
  });

  it("rejects files over the size limit", () => {
    expect(
      validateImageFile(fakeFile("image/png", MAX_UPLOAD_BYTES + 1))
    ).toMatch(/5 MB/);
  });

  it("accepts a file exactly at the limit", () => {
    expect(validateImageFile(fakeFile("image/webp", MAX_UPLOAD_BYTES))).toBeNull();
  });
});
