"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { JSDOM, VirtualConsole } = require("jsdom");

const SIDEPANEL = fs.readFileSync(path.join(__dirname, "..", "sidepanel.js"), "utf8");

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function makeChrome({ state, fetchLog }) {
  const areas = {
    sync: {
      enabled: true,
      autoReplace: true,
      scanOnPaste: true,
      restoreResponses: true,
      persistMappings: true,
      appendInstruction: true,
      detectNames: true,
      detectNumbers: true,
      detectAddresses: true,
      detectCodes: true,
      customTerms: [],
      personalTerms: [],
      pausedHosts: [],
      subscriptionPlan: "free"
    },
    local: {},
    session: {}
  };
  const storageListeners = [];
  const runtimeListeners = [];

  const resolve = (store, keys) => {
    if (keys == null) return { ...store };
    if (typeof keys === "string") return { [keys]: store[keys] };
    if (Array.isArray(keys)) {
      const result = {};
      for (const key of keys) result[key] = store[key];
      return result;
    }
    const result = {};
    for (const key of Object.keys(keys)) result[key] = key in store ? store[key] : keys[key];
    return result;
  };

  const area = (name) => ({
    get: async (keys) => resolve(areas[name], keys),
    set: async (obj) => {
      const changes = {};
      for (const key of Object.keys(obj)) {
        changes[key] = { oldValue: areas[name][key], newValue: obj[key] };
        areas[name][key] = obj[key];
      }
      storageListeners.forEach((listener) => listener(changes, name));
    },
    remove: async (keys) => {
      const list = Array.isArray(keys) ? keys : [keys];
      const changes = {};
      for (const key of list) {
        changes[key] = { oldValue: areas[name][key], newValue: undefined };
        delete areas[name][key];
      }
      storageListeners.forEach((listener) => listener(changes, name));
    }
  });

  return {
    _areas: areas,
    _state: state,
    _fetchLog: fetchLog,
    runtime: {
      getURL: (asset) => `chrome-extension://test/${asset}`,
      onMessage: { addListener: (listener) => runtimeListeners.push(listener) },
      sendMessage: async () => ({ ok: true })
    },
    tabs: {
      query: async () => [{ id: 1 }],
      sendMessage: async (_tabId, message) => {
        if (message?.type === "GET_STATE") return state;
        if (message?.type === "PANEL_VISIBLE") return { ok: true };
        return state;
      },
      onActivated: { addListener: () => {} },
      onUpdated: { addListener: () => {} }
    },
    storage: {
      sync: area("sync"),
      local: area("local"),
      session: area("session"),
      onChanged: { addListener: (listener) => storageListeners.push(listener) }
    }
  };
}

async function createHarness({ state, fetchImpl }) {
  const virtualConsole = new VirtualConsole();
  virtualConsole.on("jsdomError", () => {});
  const dom = new JSDOM(
    `<!doctype html><html><body>
      <header class="head">
        <img class="head__logo" id="logo" alt="">
        <div class="head__copy">
          <div class="head__title-row">
            <strong>Ledebe Protector</strong>
            <span class="head__privacy" id="privacy-note">Your data never leaves your device.</span>
          </div>
          <span class="head__sub" id="session-count">0 values protected this session</span>
        </div>
      </header>
      <nav class="tabs">
        <button type="button" class="tab is-active" data-tab="home">Home</button>
        <button type="button" class="tab" data-tab="words">Custom words</button>
        <button type="button" class="tab" data-tab="field">Protected words</button>
        <button type="button" class="tab" data-tab="settings">Settings</button>
      </nav>
      <main class="body" id="body"></main>
    </body></html>`,
    { url: "chrome-extension://test/sidepanel.html", runScripts: "dangerously", pretendToBeVisual: true, virtualConsole }
  );

  const fetchLog = [];
  const chrome = makeChrome({ state, fetchLog });
  dom.window.chrome = chrome;
  dom.window.fetch = async (url, options = {}) => {
    fetchLog.push({ url, options });
    return fetchImpl ? fetchImpl(url, options) : { ok: true, json: async () => ({ ok: true }) };
  };
  Object.defineProperty(dom.window.document, "visibilityState", {
    value: "visible",
    configurable: true
  });

  const script = dom.window.document.createElement("script");
  script.textContent = SIDEPANEL;
  dom.window.document.body.appendChild(script);
  await delay(30);

  return {
    window: dom.window,
    document: dom.window.document,
    fetchLog,
    tick: delay,
    close: async () => { await delay(10); dom.window.close(); }
  };
}

test("side panel renders restored bullet lists with placeholder chips", async () => {
  const h = await createHarness({
    state: {
      host: "chatgpt.com",
      sessionCount: 2,
      transcript: [
        {
          role: "assistant",
          blocks: [{
            kind: "text",
            text: "I see two email placeholders in your message:\n\n- [LDB_EMAIL_ALPHA_1]\n- [LDB_EMAIL_BRAVO_1]\n\nSomething else"
          }]
        }
      ],
      latestRestored: ""
    }
  });
  try {
    assert.equal(h.document.querySelectorAll(".msg__list").length, 1);
    assert.equal(h.document.querySelectorAll(".msg__list-item").length, 2);
    assert.equal(h.document.querySelectorAll(".msg__token").length, 2);
    assert.match(h.document.querySelector(".msg__list")?.textContent || "", /LDB_EMAIL_ALPHA_1/);
  } finally {
    await h.close();
  }
});

test("side panel feedback omits blank email and shows success", async () => {
  const h = await createHarness({
    state: {
      host: "chatgpt.com",
      sessionCount: 0,
      transcript: [],
      latestRestored: ""
    }
  });
  try {
    h.document.querySelector('.tab[data-tab="settings"]').click();
    await h.tick(30);

    const textarea = h.document.querySelector("textarea");
    const email = h.document.querySelector('input[type="email"]');
    const send = Array.from(h.document.querySelectorAll("button")).find((button) => button.textContent === "Send feedback");

    textarea.value = "It worked well.";
    email.value = "";
    send.click();
    await h.tick(30);

    assert.equal(h.fetchLog.length, 1);
    const payload = JSON.parse(h.fetchLog[0].options.body);
    assert.equal(payload.message, "It worked well.");
    assert.ok(!Object.hasOwn(payload, "email"));
    assert.match(h.document.getElementById("flash")?.textContent || "", /Feedback sent\. Thank you\./);
    assert.equal(textarea.value, "");
    assert.equal(email.value, "");
  } finally {
    await h.close();
  }
});

test("settings show activation code entry and upgrade path for free users", async () => {
  const h = await createHarness({
    state: {
      host: "chatgpt.com",
      sessionCount: 0,
      transcript: [],
      latestRestored: ""
    }
  });
  try {
    h.document.querySelector('.tab[data-tab="settings"]').click();
    await h.tick(40);

    assert.match(h.document.body.textContent, /Browser Pro activation/);
    assert.match(h.document.body.textContent, /Upgrade to Pro/);
    assert.ok(h.document.querySelector('input[placeholder="Activation code"]'));
  } finally {
    await h.close();
  }
});

test("redeeming an activation code stores plan state and shows success", async () => {
  const h = await createHarness({
    state: {
      host: "chatgpt.com",
      sessionCount: 0,
      transcript: [],
      latestRestored: ""
    },
    fetchImpl: async (url, options = {}) => {
      if (String(url).includes("/activation/redeem")) {
        return {
          ok: true,
          json: async () => ({
            active: true,
            plan: "pro",
            features: ["pro"],
            sessionToken: "session-123",
            sessionExpiresAt: "2026-08-01T00:00:00.000Z",
            activationCodeMasked: "LDB-PRO-ABCD...WXYZ",
            privacyBoundary: "Billing only."
          })
        };
      }
      if (String(url).includes("/activation/session")) {
        return {
          ok: true,
          json: async () => ({
            active: true,
            plan: "pro",
            features: ["pro"],
            sessionExpiresAt: "2026-08-01T00:00:00.000Z",
            activationCodeMasked: "LDB-PRO-ABCD...WXYZ",
            privacyBoundary: "Billing only."
          })
        };
      }
      return { ok: true, json: async () => ({ ok: true }) };
    }
  });
  try {
    h.document.querySelector('.tab[data-tab="settings"]').click();
    await h.tick(40);

    const input = h.document.querySelector('input[placeholder="Activation code"]');
    const activate = Array.from(h.document.querySelectorAll("button")).find((button) => button.textContent === "Activate Pro");
    input.value = "LDB-PRO-ABCD-WXYZ";
    activate.click();
    await h.tick(60);

    assert.equal(h.window.chrome._areas.sync.subscriptionPlan, "pro");
    assert.equal(h.window.chrome._areas.local.ledebeActivationState.plan, "pro");
    assert.match(h.document.getElementById("flash")?.textContent || "", /Browser Pro is active on this browser\./);
  } finally {
    await h.close();
  }
});
