"use strict";

// L2 — jsdom DOM-integration. Drives the REAL content.js against a fake DOM for
// the <textarea> path (high-confidence core). See tests/harness.js.

const test = require("node:test");
const assert = require("node:assert/strict");
const { createHarness } = require("./harness.js");

const SCAN = 130;  // > the 90ms input-scan debounce
const IDLE = 900;  // > the 800ms idle auto-protect

test("textarea: masks a completed value once the caret moves past it", async () => {
  const h = await createHarness();
  try {
    h.type(h.composer, "email a@b.com "); // caret at end, past the email
    await h.tick(SCAN);
    assert.ok(!h.composer.value.includes("a@b.com"));
    assert.match(h.composer.value, /\[LDB_EMAIL_/);
  } finally { await h.close(); }
});

test("textarea: leaves the value alone while the caret is still in it", async () => {
  const h = await createHarness();
  try {
    h.type(h.composer, "email a@b.com"); // caret == end of email, still typing
    await h.tick(SCAN);
    assert.ok(h.composer.value.includes("a@b.com")); // not masked yet
  } finally { await h.close(); }
});

test("textarea: every paste masks (first AND second)", async () => {
  const h = await createHarness();
  try {
    h.paste(h.composer, "one a@b.com");
    await h.tick(SCAN);
    assert.ok(!h.composer.value.includes("a@b.com"), "first paste should mask");

    h.paste(h.composer, h.composer.value + " two c@d.com");
    await h.tick(SCAN);
    assert.ok(!h.composer.value.includes("c@d.com"), "second paste should mask too");
  } finally { await h.close(); }
});

test("idle auto-protect masks the value at the caret after a pause", async () => {
  const h = await createHarness();
  try {
    h.type(h.composer, "email a@b.com"); // caret in value → not masked immediately
    await h.tick(IDLE);
    assert.ok(!h.composer.value.includes("a@b.com"), "idle should force-mask");
  } finally { await h.close(); }
});

test("stores the mapping under a per-host key (no global key)", async () => {
  const h = await createHarness({ host: "chatgpt.com" });
  try {
    h.type(h.composer, "email a@b.com ");
    await h.tick(SCAN);
    const map = h.localMap();
    assert.ok(map, "per-host key present");
    assert.ok(Object.values(map).includes("a@b.com"));
    assert.ok(!h.allLocalKeys().includes("ledebeSessionPlaceholderMap"), "no unscoped global key");
  } finally { await h.close(); }
});

test("a different host does not see another host's protected values", async () => {
  const a = await createHarness({ host: "chatgpt.com" });
  const b = await createHarness({ host: "example.com" }); // not an AI host
  try {
    a.type(a.composer, "email a@b.com ");
    await a.tick(SCAN);
    assert.ok(a.localMap(), "host A has a map");
    assert.equal(b.localMap(), null, "host B map is empty");
    // and on a non-AI host nothing auto-masks anyway:
    b.type(b.composer, "email a@b.com ");
    await b.tick(SCAN);
    assert.ok(b.composer.value.includes("a@b.com"));
  } finally { await a.close(); await b.close(); }
});

test("paused host does not mask", async () => {
  const h = await createHarness({ sync: { pausedHosts: ["chatgpt.com"] } });
  try {
    h.type(h.composer, "email a@b.com ");
    await h.tick(SCAN);
    assert.ok(h.composer.value.includes("a@b.com"));
  } finally { await h.close(); }
});

test("disabled category is honored end-to-end (numbers off, email on)", async () => {
  const h = await createHarness({ sync: { detectNumbers: false } });
  try {
    h.type(h.composer, "num 12345 mail a@b.com ");
    await h.tick(SCAN);
    assert.ok(h.composer.value.includes("12345"), "number left alone");
    assert.ok(!h.composer.value.includes("a@b.com"), "email still masked");
  } finally { await h.close(); }
});

test("send-flush prepends the keep-placeholders note once", async () => {
  const h = await createHarness();
  try {
    h.type(h.composer, "email a@b.com ");
    await h.tick(SCAN);
    h.enter(h.composer);
    await h.tick(20);
    const v1 = h.composer.value;
    assert.ok(v1.startsWith("[Ledebe note to the assistant:"), "note is at the top");

    h.enter(h.composer);
    await h.tick(20);
    const occurrences = h.composer.value.split("[Ledebe note to the assistant:").length - 1;
    assert.equal(occurrences, 1, "note is not duplicated");
  } finally { await h.close(); }
});

test("GET_STATE returns the grouped panel shape", async () => {
  const h = await createHarness();
  try {
    h.type(h.composer, "email a@b.com ");
    await h.tick(SCAN);
    const state = await h.send({ type: "GET_STATE" });
    assert.equal(state.host, "chatgpt.com");
    assert.ok(Array.isArray(state.protected) && Array.isArray(state.exposed) && Array.isArray(state.session));
    assert.ok(state.protected.some((p) => p.value === "a@b.com"));
    assert.equal(typeof state.sessionCount, "number");
  } finally { await h.close(); }
});

test("OPEN_PANEL reserves viewport space for the in-page drawer", async () => {
  const h = await createHarness();
  try {
    await h.send({ type: "OPEN_PANEL" });
    await h.tick(20);
    const html = h.window.document.documentElement;
    assert.ok(html.classList.contains("ledebe-page-pushed"));
    assert.match(html.style.marginRight, /\d+px/);
    assert.match(h.window.document.body.style.width, /calc\(100vw - \d+px\)/);
  } finally { await h.close(); }
});

test("OPEN_PANEL toggles the in-page drawer closed on the second click", async () => {
  const h = await createHarness();
  try {
    await h.send({ type: "OPEN_PANEL" });
    await h.tick(20);
    let html = h.window.document.documentElement;
    assert.ok(html.classList.contains("ledebe-page-pushed"));

    await h.send({ type: "OPEN_PANEL" });
    await h.tick(20);
    html = h.window.document.documentElement;
    assert.ok(!html.classList.contains("ledebe-page-pushed"));
    assert.equal(html.style.marginRight, "0px");
    assert.equal(h.window.document.body.style.width, "");
  } finally { await h.close(); }
});

test("TOGGLE_SELECTION_PROTECTION reveals just the selected placeholder", async () => {
  const h = await createHarness();
  try {
    h.type(h.composer, "email a@b.com and c@d.com ");
    await h.tick(SCAN);
    const tokens = h.composer.value.match(/\[LDB_EMAIL_[A-Z0-9]+_\d+\]/g) || [];
    assert.equal(tokens.length, 2);

    const first = tokens[0];
    const start = h.composer.value.indexOf(first);
    h.composer.selectionStart = start;
    h.composer.selectionEnd = start + first.length;

    await h.send({ type: "TOGGLE_SELECTION_PROTECTION", selectedText: first });
    await h.tick(20);

    assert.ok(h.composer.value.includes("a@b.com"));
    assert.ok(h.composer.value.includes(tokens[1]));
  } finally { await h.close(); }
});

test("TOGGLE_SELECTION_PROTECTION protects just the selected plaintext and selects the placeholder", async () => {
  const h = await createHarness();
  try {
    h.type(h.composer, "ping a@b.com now");
    const start = h.composer.value.indexOf("a@b.com");
    h.composer.selectionStart = start;
    h.composer.selectionEnd = start + "a@b.com".length;

    await h.send({ type: "TOGGLE_SELECTION_PROTECTION", selectedText: "a@b.com" });
    await h.tick(20);

    const [token] = h.composer.value.match(/\[LDB_EMAIL_[A-Z0-9]+_\d+\]|\[LDB_EMAIL_\d+\]/g) || [];
    assert.ok(token);
    assert.equal(h.composer.value.slice(h.composer.selectionStart, h.composer.selectionEnd), token);
  } finally { await h.close(); }
});

test("Home tab gives ChatGPT email writing blocks their own copyable section", async () => {
  const h = await createHarness();
  try {
    h.type(h.composer, "email a@b.com ");
    await h.tick(SCAN);

    const [token] = h.composer.value.match(/\[LDB_EMAIL_[A-Z0-9]+_\d+\]/g) || [];
    assert.ok(token, "email placeholder should exist");

    const thread = h.window.document.createElement("div");
    thread.innerHTML = `
      <div data-message-author-role="assistant">
        <div class="markdown prose">
          <p>Here's a sample email with a realistic address:</p>
          <div class="writing-block-editor">
            <div
              class="ProseMirror markdown prose"
              data-writing-block-fullscreen-editor-region="true"
              contenteditable="true"
            >
              <p>Subject: Welcome</p>
              <p>From: Sarah Johnson &lt;${token}&gt;</p>
              <p>To: Alex Carter &lt;${token}&gt;</p>
            </div>
          </div>
        </div>
      </div>
    `;
    h.window.document.body.appendChild(thread);

    await h.send({ type: "OPEN_PANEL" });
    await h.tick(20);
    h.window.document.querySelector('.ledebe-tab[data-tab="home"]')?.dispatchEvent(
      new h.window.MouseEvent("click", { bubbles: true })
    );
    await h.tick(20);

    const blocks = h.window.document.querySelectorAll(".ledebe-msg__block");
    assert.equal(blocks.length, 2);
    assert.ok(blocks[1].classList.contains("is-code"));
    assert.match(blocks[1].textContent || "", /From: Sarah Johnson <a@b\.com>/);
    assert.equal(h.window.document.querySelectorAll(".ledebe-msg__copy").length, 2);
  } finally { await h.close(); }
});
