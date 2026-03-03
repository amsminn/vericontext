import { describe, expect, it } from "vitest";

import { readVerifyText } from "../src/verify/workspace.js";

describe("readVerifyText", () => {
  it("returns text directly when text is provided", async () => {
    const result = await readVerifyText({ root: "/tmp", text: "hello" });
    expect(result).toBe("hello");
  });

  it("normalizes EOL in text input", async () => {
    const result = await readVerifyText({ root: "/tmp", text: "a\r\nb" });
    expect(result).toBe("a\nb");
  });

  it("returns invalid_input when both text and inPath provided", async () => {
    const result = await readVerifyText({ root: "/tmp", text: "x", inPath: "file.md" });
    expect(result).toEqual({ reason: "invalid_input" });
  });

  it("returns invalid_input when neither text nor inPath provided", async () => {
    const result = await readVerifyText({ root: "/tmp" });
    expect(result).toEqual({ reason: "invalid_input" });
  });
});
