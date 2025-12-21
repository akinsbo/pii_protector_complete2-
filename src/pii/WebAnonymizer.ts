/**
 * @fileoverview Browser-compatible PII anonymization engine.
 * Lightweight version of Anonymizer for web environments without Node.js crypto.
 * Uses DJB2 hash algorithm for consistent placeholder generation.
 * 
 * @author Olaolu
 * @version 1.0.0
 * @since December 2025
 * @license MIT
 */

export type PiiType =
  | 'EMAIL'
  | 'PHONE'
  | 'IP'
  | 'IBAN'
  | 'NIN'
  | 'BVN'
  | 'CARD'
  | 'NAME'
  | 'CUSTOM';
/** Represents a PII match found in text. */
interface Match {
  /** The type of PII detected */
  type: PiiType;
  /** Starting position in the text */
  start: number;
  /** Ending position in the text */
  end: number;
  /** The matched value */
  value: string;
}

/** Result of masking operation. */
export interface MaskResult {
  /** Text with PII replaced by placeholders */
  maskedText: string;
  /** Mapping of placeholders to original values */
  placeholders: Record<string, string>;
}

/** Result of unmasking operation. */
export interface RestoreResult {
  /** Text with placeholders restored to original values */
  restoredText: string;
}

/** Regular expression for email addresses. */
const EMAIL_RE = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi;

/** Regular expression for phone numbers. */
const PHONE_RE =
  /\b(?:\+?\d{1,3}[-.\s]?)?(?:\(?\d{3,4}\)?[-.\s]?)?\d{3}[-.\s]?\d{3,4}\b/g;

/** Regular expression for IP addresses. */
const IP_RE = /\b(?:\d{1,3}\.){3}\d{1,3}\b/g;

/** Regular expression for IBAN codes. */
const IBAN_RE = /\b[A-Z]{2}\d{2}[A-Z0-9]{10,30}\b/g;

/** Regular expression for NIN/BVN numbers (11 digits). */
const NIN_BVN_RE = /\b\d{11}\b/g;

/** Regular expression for credit card numbers. */
const CARD_RE = /\b(?:\d[ -]*?){13,19}\b/g;

/**
 * DJB2 hash function for consistent placeholder generation.
 * @param str The string to hash
 * @return Hexadecimal hash string
 */
function djb2(str: string): string {
  let h = 5381;
  for (let i = 0; i < str.length; i++) h = ((h << 5) + h) ^ str.charCodeAt(i);
  return (h >>> 0).toString(16);
}

/**
 * Browser-compatible PII anonymization engine.
 * Lightweight version without Node.js dependencies.
 */
export class WebAnonymizer {
  private byOriginal = new Map<string, string>();
  private byPlaceholder = new Map<string, string>();
  private counters: Record<PiiType, number> = {
    EMAIL: 0,
    PHONE: 0,
    IP: 0,
    IBAN: 0,
    NIN: 0,
    BVN: 0,
    CARD: 0,
    NAME: 0,
    CUSTOM: 0,
  };
  private customExactTerms: string[] = [];
  private scope = 'browser-session';

  /**
   * Sets custom terms to be anonymized.
   * @param terms Array of custom terms to protect
   */
  setCustomTerms(terms: string[]) {
    this.customExactTerms = terms ?? [];
  }
  /**
   * Clears all stored mappings and resets counters.
   */
  clear() {
    this.byOriginal.clear();
    this.byPlaceholder.clear();
    Object.keys(this.counters).forEach((k) => ((this.counters as any)[k] = 0));
  }

  /**
   * Masks PII in the provided text.
   * @param text The text to anonymize
   * @return Object containing masked text and placeholder mappings
   */
  mask(text: string): MaskResult {
    const matches = this.findMatches(text).sort((a, b) => b.start - a.start);
    let masked = text;
    const placeholders: Record<string, string> = {};
    for (const m of matches) {
      const ph = this.getPlaceholder(m.type, m.value);
      masked = masked.slice(0, m.start) + ph + masked.slice(m.end);
      placeholders[ph] = m.value;
    }
    return { maskedText: masked, placeholders };
  }

  /**
   * Restores original values from masked text.
   * @param text The masked text to restore
   * @return Object containing the restored text
   */
  unmask(text: string): RestoreResult {
    const restored = text.replace(
      /\[\[LDB:([A-Z]+)_(\d+)\]\]/g,
      (full) => this.byPlaceholder.get(full) ?? full
    );
    return { restoredText: restored };
  }

  /**
   * Finds all PII matches in the text.
   * @param text The text to scan for PII
   * @return Array of matches found
   */
  private findMatches(text: string): Match[] {
    const out: Match[] = [];
    const push = (re: RegExp, type: PiiType) => {
      re.lastIndex = 0;
      let m: RegExpExecArray | null;
      while ((m = re.exec(text)))
        out.push({
          type,
          start: m.index,
          end: m.index + m[0].length,
          value: m[0],
        });
    };
    push(EMAIL_RE, 'EMAIL');
    push(PHONE_RE, 'PHONE');
    push(IP_RE, 'IP');
    push(IBAN_RE, 'IBAN');
    push(NIN_BVN_RE, 'NIN');
    push(CARD_RE, 'CARD');
    for (const term of this.customExactTerms) {
      if (!term) continue;
      const esc = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const re = new RegExp(`\\b${esc}\\b`, 'gi');
      let m: RegExpExecArray | null;
      while ((m = re.exec(text)))
        out.push({
          type: 'CUSTOM',
          start: m.index,
          end: m.index + m[0].length,
          value: m[0],
        });
    }
    out.sort((a, b) => a.start - b.start || b.end - a.end);
    const dedup: Match[] = [];
    let lastEnd = -1;
    for (const r of out) {
      if (r.start >= lastEnd) {
        dedup.push(r);
        lastEnd = r.end;
      } else {
        const prev = dedup[dedup.length - 1];
        if (r.end - r.start > prev.end - prev.start) {
          dedup[dedup.length - 1] = r;
          lastEnd = r.end;
        }
      }
    }
    return dedup;
  }

  /**
   * Gets or creates a placeholder for a PII value.
   * @param type The type of PII
   * @param original The original value to mask
   * @return The placeholder string
   */
  private getPlaceholder(type: PiiType, original: string): string {
    const key = djb2(`${this.scope}::${type}::${original}`);
    const existing = this.byOriginal.get(key);
    if (existing) return existing;
    const idx = ++this.counters[type];
    const ph = `[[LDB:${type}_${idx}]]`;
    this.byOriginal.set(key, ph);
    this.byPlaceholder.set(ph, original);
    return ph;
  }
}
