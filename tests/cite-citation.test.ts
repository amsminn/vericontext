import { describe, expect, it } from "vitest";

import { parseCitations, renderCitation } from "../src/cite/citation.js";

describe("renderCitation", () => {
  it("renders correct format with truncated hash", () => {
    const sha256Full = "a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2";
    const result = renderCitation("src/file.ts", 1, 10, sha256Full);
    expect(result).toBe("[[vctx:src/file.ts#L1-L10@a1b2c3d4]]");
  });

  it("uses first 8 chars of hash", () => {
    const result = renderCitation("foo.ts", 5, 5, "abcdef1234567890");
    expect(result).toBe("[[vctx:foo.ts#L5-L5@abcdef12]]");
  });
});

describe("parseCitations", () => {
  it("parses single citation", () => {
    const text = "some text [[vctx:src/file.ts#L1-L10@a1b2c3d4]] more text";
    const results = parseCitations(text);
    expect(results).toHaveLength(1);
    expect(results[0]).toEqual({
      path: "src/file.ts",
      startLine: 1,
      endLine: 10,
      hash8: "a1b2c3d4",
      raw: "[[vctx:src/file.ts#L1-L10@a1b2c3d4]]",
    });
  });

  it("parses multiple citations", () => {
    const text = "[[vctx:a.ts#L1-L2@11111111]] mid [[vctx:b.ts#L3-L4@22222222]]";
    const results = parseCitations(text);
    expect(results).toHaveLength(2);
    expect(results[0].path).toBe("a.ts");
    expect(results[1].path).toBe("b.ts");
  });

  it("returns empty array for no citations", () => {
    expect(parseCitations("no citations here")).toEqual([]);
  });

  it("returns empty array for empty string", () => {
    expect(parseCitations("")).toEqual([]);
  });

  it("ignores malformed citations — wrong hash length", () => {
    const text = "[[vctx:file.ts#L1-L2@abc]]";
    expect(parseCitations(text)).toEqual([]);
  });

  it("ignores malformed citations — missing line range", () => {
    const text = "[[vctx:file.ts@a1b2c3d4]]";
    expect(parseCitations(text)).toEqual([]);
  });

  it("parses citations in HTML comments", () => {
    const text = "<!-- [[vctx:src/cli.ts#L1-L111@d491e15a]] -->";
    const results = parseCitations(text);
    expect(results).toHaveLength(1);
    expect(results[0].path).toBe("src/cli.ts");
  });

  it("handles paths with nested directories", () => {
    const text = "[[vctx:src/core/deep/file.ts#L10-L20@abcdef12]]";
    const results = parseCitations(text);
    expect(results).toHaveLength(1);
    expect(results[0].path).toBe("src/core/deep/file.ts");
  });
});
