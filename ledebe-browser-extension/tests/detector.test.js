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

test("restores many placeholders across a long, multi-line reply", () => {
  const mapping = {
    "[LDB_EMAIL_NS_1]": "n.caldwell.exec@proton.me",
    "[LDB_PHONE_NS_1]": "(404) 555-0147",
    "[LDB_PHONE_NS_2]": "(404) 555-0148",
    "[LDB_ID_NS_1]": "441-88-0000"
  };
  const reply = [
    "Confirmed. Your email [LDB_EMAIL_NS_1] is on file.",
    "Primary line: [LDB_PHONE_NS_1]; emergency: [LDB_PHONE_NS_2].",
    "SSN [LDB_ID_NS_1] recorded. We also re-list [LDB_EMAIL_NS_1] for the alt contact."
  ].join("\n");

  const out = restorePlaceholders(reply, mapping);

  assert.equal(out.restoredCount, 5); // email appears twice
  assert.ok(!out.restored.includes("[LDB_"));
  assert.ok(out.restored.includes("n.caldwell.exec@proton.me"));
  assert.ok(out.restored.includes("(404) 555-0148"));
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

// ---------------------------------------------------------------------------
// Expanded detection: numbers, alphanumerics, names, addresses
// ---------------------------------------------------------------------------

test("detects any run of 3+ digits (with or without separators)", () => {
  assert.ok(detectPII("balance 12345 today").some((f) => f.type === "NUMBER" && f.value === "12345"));
  assert.ok(detectPII("ref 404-555-0147 call").some((f) => f.type === "NUMBER" || f.type === "PHONE"));
});

test("ignores number runs shorter than 3 digits", () => {
  assert.ok(!detectPII("aged 25 years").some((f) => f.type === "NUMBER"));
});

test("detects mixed letter+digit codes (ALNUM)", () => {
  const findings = detectPII("passport US-Z9876543 issued");
  assert.ok(findings.some((f) => f.type === "ALNUM" && f.value.includes("Z9876543")));
});

test("does not treat a plain word as a code", () => {
  assert.ok(!detectPII("hello world").some((f) => f.type === "ALNUM"));
});

test("detects a multi-word name, but not common capitalised phrases", () => {
  assert.ok(detectPII("from Harrison Vance Caldwell today").some((f) => f.type === "NAME" && f.value === "Harrison Vance Caldwell"));
  assert.ok(!detectPII("Global Mobility and Payroll Team").some((f) => f.type === "NAME"));
});

test("detects a street address", () => {
  const findings = detectPII("mail to 1420 Peachtree St NE, Atlanta");
  assert.ok(findings.some((f) => f.type === "ADDRESS" && f.value.includes("Peachtree")));
});

test("never re-detects inside an existing placeholder token", () => {
  const existingMap = new Map([["[LDB_EMAIL_AB12_1]", "x@y.com"]]);
  const result = computeLiveReplacement("[LDB_EMAIL_AB12_1] then call 4045550199", 0, { existingMap });
  assert.ok(result.text.includes("[LDB_EMAIL_AB12_1]")); // placeholder untouched
  assert.ok(!result.text.includes("4045550199"));         // the number is masked
});

test("maskText leaves existing placeholders intact", () => {
  const out = maskText("ref [LDB_EMAIL_AB12_1] and code 5551234", []);
  assert.ok(out.masked.includes("[LDB_EMAIL_AB12_1]"));
  assert.ok(!out.masked.includes("5551234"));
});

test("createPlaceholderToken formats with and without a namespace", () => {
  assert.equal(createPlaceholderToken("LDB_EMAIL", "", 2), "[LDB_EMAIL_2]");
  assert.equal(createPlaceholderToken("LDB_EMAIL", "NS", 2), "[LDB_EMAIL_NS_2]");
});
