"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");

const {
  detectPII,
  maskText,
  computeLiveReplacement,
  restorePlaceholders,
  createPlaceholderToken
} = require("../detector.js");

// ---------------------------------------------------------------------------
// Typing / paste "catch" core — computeLiveReplacement
//
// This is the engine that swaps a value for a placeholder as the user types or
// pastes into a field. It is what the content script feeds a textarea's value
// (or a composer's text) on every input event.
// ---------------------------------------------------------------------------

test("masks a completed value when the caret has moved past it", () => {
  const text = "Email me at john@example.com please";
  const caret = text.length; // caret is well past the email
  const result = computeLiveReplacement(text, caret, {});

  assert.equal(result.changed, true);
  assert.equal(result.replacements.length, 1);
  assert.equal(result.replacements[0].original, "john@example.com");
  assert.match(result.replacements[0].token, /^\[LDB_EMAIL_\d+\]$/);
  assert.ok(!result.text.includes("john@example.com"));
  assert.ok(result.text.includes(result.replacements[0].token));
});

test("leaves the value alone while the caret is still inside it (mid-typing)", () => {
  const text = "Email me at john@example.com";
  const caret = text.length; // caret sits at the end of the email — still typing
  const result = computeLiveReplacement(text, caret, {});

  assert.equal(result.changed, false);
  assert.equal(result.text, text);
});

test("carries original-text offsets so callers can replace in place", () => {
  const text = "ref john@example.com end";
  const result = computeLiveReplacement(text, 0, {});
  const { start, end } = result.replacements[0];

  assert.equal(text.slice(start, end), "john@example.com");
});

test("reuses an existing token for the same value", () => {
  const existingMap = new Map([["[LDB_EMAIL_KEEP_1]", "john@example.com"]]);
  const result = computeLiveReplacement("write john@example.com now", 0, { existingMap });

  assert.equal(result.replacements[0].token, "[LDB_EMAIL_KEEP_1]");
  assert.ok(result.text.includes("[LDB_EMAIL_KEEP_1]"));
});

test("does not mask a value the user chose to keep exposed", () => {
  const result = computeLiveReplacement("call me at john@example.com", 0, {
    exclude: new Set(["john@example.com"])
  });

  assert.equal(result.changed, false);
});

test("adjusts the caret for the length change of replacements before it", () => {
  const text = "john@example.com x"; // caret at the very end
  const result = computeLiveReplacement(text, text.length, {});

  assert.equal(result.changed, true);
  // The email (before the caret) became a placeholder; caret stays at the end.
  assert.equal(result.caret, result.text.length);
  assert.ok(result.text.endsWith(" x"));
});

test("masks multiple distinct values in one pass", () => {
  const text = "a@b.com and c@d.com";
  const result = computeLiveReplacement(text, 0, {});

  assert.equal(result.replacements.length, 2);
  assert.ok(!result.text.includes("a@b.com"));
  assert.ok(!result.text.includes("c@d.com"));
});

test("returns unchanged for empty / non-string input", () => {
  assert.equal(computeLiveReplacement("", 0, {}).changed, false);
  assert.equal(computeLiveReplacement(null, 0, {}).changed, false);
});

// ---------------------------------------------------------------------------
// Restore core — restorePlaceholders
//
// When the AI's reply echoes a placeholder, this swaps it back to the real
// value before it is shown in the page / drawer.
// ---------------------------------------------------------------------------

test("restores a known placeholder back to its original value", () => {
  const mapping = { "[LDB_EMAIL_1]": "john@example.com" };
  const out = restorePlaceholders("Reply to [LDB_EMAIL_1] today", mapping);

  assert.equal(out.restored, "Reply to john@example.com today");
  assert.equal(out.restoredCount, 1);
});

test("restores every occurrence and counts them", () => {
  const mapping = new Map([["[LDB_PHONE_1]", "020 7946 0000"]]);
  const out = restorePlaceholders("[LDB_PHONE_1] / [LDB_PHONE_1]", mapping);

  assert.equal(out.restoredCount, 2);
  assert.equal(out.restored, "020 7946 0000 / 020 7946 0000");
});

test("leaves unknown placeholders untouched", () => {
  const out = restorePlaceholders("keep [LDB_UNKNOWN_9] as is", { "[LDB_EMAIL_1]": "x@y.com" });

  assert.equal(out.restored, "keep [LDB_UNKNOWN_9] as is");
  assert.equal(out.restoredCount, 0);
});

test("round-trips: mask then restore returns the original text", () => {
  const original = "Email john@example.com about invoice.";
  const masked = computeLiveReplacement(original, 0, {});
  const mapping = new Map(masked.replacements.map((r) => [r.token, r.original]));
  const restored = restorePlaceholders(masked.text, mapping);

  assert.equal(restored.restored, original);
});

// ---------------------------------------------------------------------------
// maskText exclude option + detector sanity
// ---------------------------------------------------------------------------

test("maskText skips excluded values", () => {
  const out = maskText("a@b.com and c@d.com", [], { exclude: ["a@b.com"] });

  assert.equal(out.replacements.length, 1);
  assert.ok(out.masked.includes("a@b.com"));
  assert.ok(!out.masked.includes("c@d.com"));
});

test("detectPII finds an email and a custom term", () => {
  const findings = detectPII("ping john@example.com re: ProjectFalcon", ["ProjectFalcon"]);
  const types = findings.map((f) => f.type);

  assert.ok(types.includes("EMAIL"));
  assert.ok(types.includes("CUSTOM"));
});

test("createPlaceholderToken formats with and without a namespace", () => {
  assert.equal(createPlaceholderToken("LDB_EMAIL", "", 2), "[LDB_EMAIL_2]");
  assert.equal(createPlaceholderToken("LDB_EMAIL", "NS", 2), "[LDB_EMAIL_NS_2]");
});
