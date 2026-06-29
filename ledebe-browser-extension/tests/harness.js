"use strict";

// jsdom harness for the content script.
//
// Loads detector.js + content.js into a jsdom window with an in-memory `chrome`
// stub, on a chosen host, and exposes helpers to drive real DOM events and read
// storage / message state. This is the L2 "high-confidence DOM core" — it covers
// the <textarea> path only (jsdom has no execCommand/contenteditable). Timing
// uses short real waits (the deliberately low-risk path); strict UI timing lives
// in the Playwright E2E layer.

const fs = require("node:fs");
const path = require("node:path");
const { JSDOM, VirtualConsole } = require("jsdom");

const DETECTOR = fs.readFileSync(path.join(__dirname, "..", "detector.js"), "utf8");
const CONTENT = fs.readFileSync(path.join(__dirname, "..", "content.js"), "utf8");

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function makeChrome(initialSync) {
  const areas = { sync: { ...initialSync }, local: {}, session: {} };
  const changeListeners = [];
  const msgListeners = [];

  const resolve = (store, keys) => {
    if (keys == null) return { ...store };
    if (typeof keys === "string") return { [keys]: store[keys] };
    if (Array.isArray(keys)) { const o = {}; for (const k of keys) o[k] = store[k]; return o; }
    const o = {};
    for (const k of Object.keys(keys)) o[k] = (k in store) ? store[k] : keys[k];
    return o;
  };

  const area = (name) => ({
    get: async (keys) => resolve(areas[name], keys),
    set: async (obj) => {
      const changes = {};
      for (const k of Object.keys(obj)) {
        changes[k] = { oldValue: areas[name][k], newValue: obj[k] };
        areas[name][k] = obj[k];
      }
      changeListeners.forEach((l) => l(changes, name));
    },
    remove: async (keys) => {
      const arr = Array.isArray(keys) ? keys : [keys];
      const changes = {};
      for (const k of arr) {
        changes[k] = { oldValue: areas[name][k], newValue: undefined };
        delete areas[name][k];
      }
      changeListeners.forEach((l) => l(changes, name));
    },
    setAccessLevel: async () => {}
  });

  return {
    _areas: areas,
    _dispatch: (msg) => new Promise((res) => {
      for (const l of msgListeners) {
        let done = false;
        const ret = l(msg, {}, (r) => { done = true; res(r); });
        if (ret === true || done) return;
      }
      res(undefined);
    }),
    runtime: {
      id: "test-ext",
      getURL: (p) => "chrome-extension://test/" + p,
      getManifest: () => ({ version: "1.2.6" }),
      onMessage: { addListener: (l) => msgListeners.push(l) },
      sendMessage: () => {}
    },
    storage: {
      sync: area("sync"),
      local: area("local"),
      session: area("session"),
      onChanged: { addListener: (l) => changeListeners.push(l) }
    }
  };
}

async function createHarness({ host = "chatgpt.com", sync = {} } = {}) {
  // Swallow only the teardown noise (pending idle/sweep timers fire after the
  // window is closed and read a null location); surface any real error.
  const virtualConsole = new VirtualConsole();
  virtualConsole.on("jsdomError", (err) => {
    const msg = String((err && err.message) || err);
    if (msg.includes("_location") || msg.includes("Cannot read properties of null")) return;
    console.error(msg);
  });

  const dom = new JSDOM(
    '<!doctype html><html><body><textarea id="composer"></textarea></body></html>',
    { url: `https://${host}/`, runScripts: "dangerously", pretendToBeVisual: true, virtualConsole }
  );
  const { window } = dom;
  const chrome = makeChrome(sync);
  window.chrome = chrome;

  for (const code of [DETECTOR, CONTENT]) {
    const s = window.document.createElement("script");
    s.textContent = code;
    window.document.body.appendChild(s);
  }
  await delay(20); // let content.js async init (settings → map → listeners) settle

  const composer = window.document.getElementById("composer");

  const setValue = (el, value, caret = value.length) => {
    el.value = value;
    try { el.selectionStart = el.selectionEnd = caret; } catch (e) { /* ignore */ }
  };
  const type = (el, value, caret = value.length) => {
    setValue(el, value, caret);
    el.dispatchEvent(new window.Event("input", { bubbles: true }));
  };
  const paste = (el, value, caret = value.length) => {
    el.dispatchEvent(new window.Event("paste", { bubbles: true }));
    setValue(el, value, caret); // the pasted text lands; content.js reads it ~60ms later
  };
  const enter = (el) => el.dispatchEvent(
    new window.KeyboardEvent("keydown", { key: "Enter", bubbles: true })
  );

  const mapKey = `ledebeSessionPlaceholderMap::${host}`;

  return {
    dom, window, chrome, composer,
    setValue, type, paste, enter,
    tick: delay,
    send: (msg) => chrome._dispatch(msg),
    localMap: () => chrome._areas.local[mapKey] || null,
    allLocalKeys: () => Object.keys(chrome._areas.local),
    // Flush queued MutationObserver/microtask callbacks while the window is still
    // alive, then tear down — avoids post-close "location is null" teardown noise.
    close: async () => { await delay(10); try { dom.window.close(); } catch (e) { /* ignore */ } }
  };
}

module.exports = { createHarness };
