// Ledebe Client-Side Encryption Module
// Uses Web Crypto API — AES-256-GCM + PBKDF2 key derivation
// The server never sees plaintext terms — all encryption/decryption happens here.

const ALGO = 'AES-GCM';
const KEY_LENGTH = 256;
const PBKDF2_ITERATIONS = 100000;

// ── Generate a random team key (raw bytes → base64) ──────────────────────
export async function generateTeamKey() {
  const key = await crypto.subtle.generateKey(
    { name: ALGO, length: KEY_LENGTH },
    true, // extractable
    ['encrypt', 'decrypt']
  );
  const raw = await crypto.subtle.exportKey('raw', key);
  return bufToBase64(raw);
}

// ── Derive an AES key from a join code + salt using PBKDF2 ──────────────
async function deriveKeyFromCode(joinCode, salt) {
  const enc = new TextEncoder();
  const baseKey = await crypto.subtle.importKey(
    'raw', enc.encode(joinCode), 'PBKDF2', false, ['deriveKey']
  );
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: PBKDF2_ITERATIONS, hash: 'SHA-256' },
    baseKey,
    { name: ALGO, length: KEY_LENGTH },
    false,
    ['encrypt', 'decrypt']
  );
}

// ── Encrypt team key with join code (for server storage) ─────────────────
export async function encryptTeamKeyWithCode(teamKeyBase64, joinCode) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const codeKey = await deriveKeyFromCode(joinCode, salt);

  const teamKeyBytes = base64ToBuf(teamKeyBase64);
  const encrypted = await crypto.subtle.encrypt(
    { name: ALGO, iv },
    codeKey,
    teamKeyBytes
  );

  return {
    encryptedTeamKey: bufToBase64(encrypted),
    teamKeySalt: bufToBase64(salt),
    teamKeyIv: bufToBase64(iv),
  };
}

// ── Decrypt team key with join code (on employee device) ─────────────────
export async function decryptTeamKeyWithCode(encryptedTeamKey, teamKeySalt, teamKeyIv, joinCode) {
  const salt = base64ToBuf(teamKeySalt);
  const iv = base64ToBuf(teamKeyIv);
  const codeKey = await deriveKeyFromCode(joinCode, salt);
  const ciphertext = base64ToBuf(encryptedTeamKey);

  const decrypted = await crypto.subtle.decrypt(
    { name: ALGO, iv },
    codeKey,
    ciphertext
  );

  return bufToBase64(decrypted);
}

// ── Encrypt terms with team key ──────────────────────────────────────────
export async function encryptTerms(termsArray, teamKeyBase64) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await importKey(teamKeyBase64);
  const plaintext = new TextEncoder().encode(JSON.stringify(termsArray));

  const encrypted = await crypto.subtle.encrypt(
    { name: ALGO, iv },
    key,
    plaintext
  );

  return {
    encryptedTerms: bufToBase64(encrypted),
    termsIv: bufToBase64(iv),
  };
}

// ── Decrypt terms with team key ──────────────────────────────────────────
export async function decryptTerms(encryptedTerms, termsIv, teamKeyBase64) {
  const iv = base64ToBuf(termsIv);
  const key = await importKey(teamKeyBase64);
  const ciphertext = base64ToBuf(encryptedTerms);

  const decrypted = await crypto.subtle.decrypt(
    { name: ALGO, iv },
    key,
    ciphertext
  );

  return JSON.parse(new TextDecoder().decode(decrypted));
}

// ── Import a base64 team key as a CryptoKey ─────────────────────────────
async function importKey(base64) {
  const raw = base64ToBuf(base64);
  return crypto.subtle.importKey(
    'raw', raw, { name: ALGO, length: KEY_LENGTH }, false, ['encrypt', 'decrypt']
  );
}

// ── Base64 helpers ───────────────────────────────────────────────────────
function bufToBase64(buf) {
  const bytes = new Uint8Array(buf);
  let str = '';
  for (const b of bytes) str += String.fromCharCode(b);
  return btoa(str);
}

function base64ToBuf(b64) {
  const str = atob(b64);
  const buf = new Uint8Array(str.length);
  for (let i = 0; i < str.length; i++) buf[i] = str.charCodeAt(i);
  return buf.buffer;
}
