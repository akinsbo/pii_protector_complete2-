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
    prefix: "LDB_IP"
  },
  {
    name: "CC",
    label: "Credit Card",
    regex: /\b(?:\d[ \-]*?){13,19}\b/g,
    prefix: "LDB_CC"
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
    prefix: "LDB_PHONE"
  },
  {
    name: "APIKEY",
    label: "API Key",
    regex: /\b(?:sk|pk|api|key|token|secret|bearer)[_\-]?[A-Za-z0-9]{20,}\b/gi,
    prefix: "LDB_APIKEY"
  }
];

function escapeForRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function findExistingToken(map, value) {
  for (const [token, original] of map.entries()) {
    if (original === value) {
      return token;
    }
  }
  return undefined;
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
      findings.push({
        type: "CUSTOM",
        label: "Custom Term",
        value: match[0],
        index: match.index
      });
    }
  }

  for (const rule of LEDEBE_RULES) {
    const regex = new RegExp(rule.regex.source, rule.regex.flags);
    let match;
    while ((match = regex.exec(input)) !== null) {
      findings.push({
        type: rule.name,
        label: rule.label,
        value: match[0],
        index: match.index
      });
    }
  }

  return findings.sort((a, b) => a.index - b.index);
}

function maskText(input, customTerms = []) {
  const map = new Map();
  const counters = new Map();
  let result = input;

  for (const term of customTerms) {
    if (!term.trim()) {
      continue;
    }

    const regex = new RegExp(escapeForRegex(term), "gi");
    result = result.replace(regex, (match) => {
      const existing = findExistingToken(map, match);
      if (existing) {
        return existing;
      }

      const count = (counters.get("CUSTOM") || 0) + 1;
      counters.set("CUSTOM", count);
      const token = `[LDB_CUSTOM_${count}]`;
      map.set(token, match);
      return token;
    });
  }

  for (const rule of LEDEBE_RULES) {
    result = result.replace(rule.regex, (match) => {
      if (match.startsWith("[LDB_")) {
        return match;
      }

      const existing = findExistingToken(map, match);
      if (existing) {
        return existing;
      }

      const count = (counters.get(rule.name) || 0) + 1;
      counters.set(rule.name, count);
      const token = `[${rule.prefix}_${count}]`;
      map.set(token, match);
      return token;
    });
  }

  return {
    masked: result,
    replacements: Array.from(map.entries()).map(([token, original]) => ({ token, original }))
  };
}
