const LEDEBE_RULES = [
  {
    name: "EMAIL",
    label: "Email Address",
    regex: /\b[A-Z0-9._%+\-]+@[A-Z0-9.\-]+\.[A-Z]{2,}\b/gi,
    prefix: "LDB_EMAIL"
  },
  {
    name: "IP",
    label: "IP Address",
    regex: /\b(?:\d{1,3}\.){3}\d{1,3}\b/g,
    prefix: "LDB_IP",
    validate: isValidIpv4
  },
  {
    name: "CC",
    label: "Credit Card",
    regex: /\b(?:\d[ \-]*?){13,19}\b/g,
    prefix: "LDB_CC",
    validate: isLikelyCreditCard
  },
  {
    name: "NINO",
    label: "National Insurance Number",
    regex: /\b[A-Z]{2}\s?\d{2}\s?\d{2}\s?\d{2}\s?[A-D]\b/gi,
    prefix: "LDB_NINO"
  },
  {
    name: "ID",
    label: "SSN / ID Number",
    regex: /\b\d{3}[- ]?\d{2}[- ]?\d{4}\b/g,
    prefix: "LDB_ID"
  },
  {
    name: "PHONE",
    label: "Phone Number",
    regex: /\b(?:\+?\d[\d\s().\-]{7,}\d)\b/g,
    prefix: "LDB_PHONE",
    validate: isLikelyPhoneNumber
  },
  {
    name: "APIKEY",
    label: "API Key",
    regex: /\b(?:sk|pk|api|key|token|secret|bearer)[_\-]?[A-Za-z0-9]{20,}\b/gi,
    prefix: "LDB_APIKEY"
  }
];

const FINDING_PRIORITY = {
  CUSTOM: 100,
  APIKEY: 90,
  EMAIL: 80,
  CC: 70,
  PHONE: 60,
  IP: 50,
  ID: 40,
  NINO: 30
};

function escapeForRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function normalizeDigits(value) {
  return value.replace(/\D/g, "");
}

function isValidIpv4(value) {
  const parts = value.split(".");
  return parts.length === 4 && parts.every((part) => {
    if (!/^\d{1,3}$/.test(part)) {
      return false;
    }

    const octet = Number(part);
    return octet >= 0 && octet <= 255;
  });
}

function passesLuhnCheck(value) {
  const digits = normalizeDigits(value);
  let sum = 0;
  let shouldDouble = false;

  for (let index = digits.length - 1; index >= 0; index -= 1) {
    let digit = Number(digits[index]);

    if (shouldDouble) {
      digit *= 2;
      if (digit > 9) {
        digit -= 9;
      }
    }

    sum += digit;
    shouldDouble = !shouldDouble;
  }

  return sum % 10 === 0;
}

function isLikelyCreditCard(value) {
  const digits = normalizeDigits(value);
  if (digits.length < 13 || digits.length > 19) {
    return false;
  }

  return passesLuhnCheck(digits);
}

function isLikelyPhoneNumber(value) {
  const trimmed = value.trim();
  const digits = normalizeDigits(trimmed);

  if (digits.length < 10 || digits.length > 15) {
    return false;
  }

  if (!/[+\s().-]/.test(trimmed)) {
    return false;
  }

  if (/^\d{3}[- ]?\d{2}[- ]?\d{4}$/.test(trimmed)) {
    return false;
  }

  if (/^(?:\d{1,3}\.){3}\d{1,3}$/.test(trimmed)) {
    return false;
  }

  return true;
}

function findExistingToken(map, value) {
  for (const [token, original] of map.entries()) {
    if (original === value) {
      return token;
    }
  }
  return undefined;
}

function createPlaceholderToken(prefix, namespace, count) {
  if (!namespace) {
    return `[${prefix}_${count}]`;
  }

  return `[${prefix}_${namespace}_${count}]`;
}

function createFinding(type, label, prefix, value, index) {
  return {
    type,
    label,
    prefix,
    value,
    index,
    end: index + value.length
  };
}

function findingScore(finding) {
  const priority = FINDING_PRIORITY[finding.type] || 0;
  return (priority * 1000) + (finding.end - finding.index);
}

function dedupeOverlappingFindings(findings) {
  const sorted = [...findings].sort((a, b) => {
    if (a.index !== b.index) {
      return a.index - b.index;
    }

    return findingScore(b) - findingScore(a);
  });
  const result = [];

  for (const finding of sorted) {
    const previous = result[result.length - 1];
    if (!previous || finding.index >= previous.end) {
      result.push(finding);
      continue;
    }

    if (findingScore(finding) > findingScore(previous)) {
      result[result.length - 1] = finding;
    }
  }

  return result;
}

function detectPII(input, customTerms = []) {
  const findings = [];

  for (const term of customTerms) {
    if (!term.trim()) {
      continue;
    }

    const regex = new RegExp(escapeForRegex(term), "gi");
    let match;
    while ((match = regex.exec(input)) !== null) {
      findings.push(createFinding("CUSTOM", "Custom Term", "LDB_CUSTOM", match[0], match.index));
    }
  }

  for (const rule of LEDEBE_RULES) {
    const regex = new RegExp(rule.regex.source, rule.regex.flags);
    let match;
    while ((match = regex.exec(input)) !== null) {
      if (typeof rule.validate === "function" && !rule.validate(match[0])) {
        continue;
      }

      findings.push(createFinding(rule.name, rule.label, rule.prefix, match[0], match.index));
    }
  }

  return dedupeOverlappingFindings(findings);
}

function toLowerSet(input) {
  const set = new Set();
  if (input instanceof Set || Array.isArray(input)) {
    for (const value of input) {
      set.add(String(value).toLowerCase());
    }
  }
  return set;
}

function maskText(input, customTerms = [], options = {}) {
  const map = new Map();
  const counters = new Map();
  const namespace = options.namespace || "";
  const exclude = toLowerSet(options.exclude);
  const findings = detectPII(input, customTerms);
  let result = input;

  for (const finding of [...findings].sort((a, b) => b.index - a.index)) {
    if (finding.value.startsWith("[LDB_")) {
      continue;
    }

    if (exclude.has(finding.value.toLowerCase())) {
      continue;
    }

    const existing = findExistingToken(map, finding.value);
    const token = existing || createPlaceholderToken(
      finding.prefix,
      namespace,
      (counters.get(finding.type) || 0) + 1
    );

    if (!existing) {
      counters.set(finding.type, (counters.get(finding.type) || 0) + 1);
      map.set(token, finding.value);
    }

    result = `${result.slice(0, finding.index)}${token}${result.slice(finding.end)}`;
  }

  return {
    masked: result,
    replacements: Array.from(map.entries()).map(([token, original]) => ({ token, original }))
  };
}

// Live "catch as you type / paste" core.
//
// Given the current field text and caret position, returns the text with every
// detected PII value swapped for a placeholder — EXCEPT the value the caret is
// currently inside, which is left alone so a half-typed value isn't clobbered
// mid-keystroke (e.g. while still typing "john@exa…"). It reuses tokens from
// `existingMap` so the same value always maps to the same placeholder, and skips
// anything the user has explicitly chosen to leave exposed (`exclude`).
//
// Pure and DOM-free so it can be unit tested directly. Returned `replacements`
// carry original-text offsets (start/end) so a caller can apply them in place
// (textarea slice or contenteditable Range) without re-detecting.
function computeLiveReplacement(text, caret, options = {}) {
  const noChange = { text, caret, changed: false, replacements: [] };
  if (typeof text !== "string" || !text) {
    return noChange;
  }

  const customTerms = options.customTerms || [];
  const exclude = toLowerSet(options.exclude);
  const existing = options.existingMap instanceof Map ? options.existingMap : new Map();
  const namespace = options.namespace || "";
  const counters = options.counters instanceof Map ? options.counters : new Map();
  const caretPos = typeof caret === "number" ? caret : null;

  const reverse = new Map();
  for (const [token, original] of existing.entries()) {
    reverse.set(original, token);
  }

  const eligible = detectPII(text, customTerms)
    .filter((finding) => !finding.value.startsWith("[LDB_"))
    .filter((finding) => !exclude.has(finding.value.toLowerCase()))
    // Leave the value the caret is sitting in/just after — it may still be
    // growing. A caret at the very start (caret <= index) isn't editing it.
    .filter((finding) => caretPos === null || caretPos <= finding.index || caretPos > finding.end)
    .sort((a, b) => a.index - b.index);

  if (!eligible.length) {
    return noChange;
  }

  const replacements = eligible.map((finding) => {
    let token = reverse.get(finding.value);
    if (!token) {
      const next = (counters.get(finding.type) || 0) + 1;
      counters.set(finding.type, next);
      token = createPlaceholderToken(finding.prefix, namespace, next);
      reverse.set(finding.value, token);
    }
    return { token, original: finding.value, start: finding.index, end: finding.end };
  });

  // Apply right-to-left so earlier offsets stay valid as we splice.
  let result = text;
  let nextCaret = caretPos === null ? text.length : caretPos;
  for (let i = replacements.length - 1; i >= 0; i -= 1) {
    const item = replacements[i];
    result = result.slice(0, item.start) + item.token + result.slice(item.end);
    if (item.end <= nextCaret) {
      nextCaret += item.token.length - (item.end - item.start);
    }
  }

  return { text: result, caret: nextCaret, changed: true, replacements };
}

// Reverse a masking: swap every known placeholder back to its original value.
// `mapping` may be a Map or a plain { token: original } object. Pure/testable.
function restorePlaceholders(text, mapping) {
  if (typeof text !== "string" || !text) {
    return { restored: text || "", restoredCount: 0 };
  }

  const entries = mapping instanceof Map
    ? Array.from(mapping.entries())
    : Object.entries(mapping || {});

  let restored = text;
  let restoredCount = 0;
  for (const [token, original] of entries) {
    if (typeof original !== "string" || !restored.includes(token)) {
      continue;
    }
    const escaped = token.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    restored = restored.replace(new RegExp(escaped, "g"), () => {
      restoredCount += 1;
      return original;
    });
  }

  return { restored, restoredCount };
}

// Dual use: a content-script global in the browser, a CommonJS module in tests.
if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    LEDEBE_RULES,
    detectPII,
    maskText,
    computeLiveReplacement,
    restorePlaceholders,
    createPlaceholderToken,
    escapeForRegex,
    isValidIpv4,
    isLikelyCreditCard,
    isLikelyPhoneNumber
  };
}
