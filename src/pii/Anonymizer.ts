/**
 * @fileoverview Core PII anonymization engine for Ledebe Protector.
 * Provides secure masking and unmasking of personally identifiable information
 * including emails, phone numbers, IBANs, and custom terms.
 * 
 * @author Olaolu
 * @version 1.0.0
 * @since December 2025
 * @license MIT
 */

import crypto from 'crypto';

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
export interface Match {
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

/** Configuration options for Anonymizer. */
export interface AnonymizerOptions {
  /** Custom terms to anonymize */
  customExactTerms?: string[];
  /** Key for consistent mapping across sessions */
  consistentMapKey?: string;
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

type ConsistentMaps = {
  byOriginal: Map<string, string>;
  byPlaceholder: Map<string, string>;
  counters: Record<PiiType, number>;
};

/**
 * Core anonymization engine for PII protection.
 * Handles masking and unmasking of sensitive data with consistent placeholders.
 */
export class Anonymizer {
  private consistent: ConsistentMaps;
  private opts: AnonymizerOptions;

  /**
   * Creates a new Anonymizer instance.
   * @param opts Configuration options for the anonymizer
   */
  constructor(opts: AnonymizerOptions = {}) {
    this.opts = opts;
    this.consistent = {
      byOriginal: new Map(),
      byPlaceholder: new Map(),
      counters: {
        EMAIL: 0,
        PHONE: 0,
        IP: 0,
        IBAN: 0,
        NIN: 0,
        BVN: 0,
        CARD: 0,
        NAME: 0,
        CUSTOM: 0,
      },
    };
  }

  /**
   * Clears all stored mappings and resets counters.
   */
  clear() {
    this.consistent.byOriginal.clear();
    this.consistent.byPlaceholder.clear();
    for (const k of Object.keys(this.consistent.counters)) {
      (this.consistent.counters as any)[k] = 0;
    }
  }

  /**
   * Sets custom terms to be anonymized.
   * @param terms Array of custom terms to protect
   */
  setCustomTerms(terms: string[]) {
    this.opts.customExactTerms = terms ?? [];
  }

  /**
   * Masks PII in the provided text.
   * @param text The text to anonymize
   * @return Object containing masked text and placeholder mappings
   */
  mask(text: string): MaskResult {
    const matches = this.findMatches(text).sort((a, b) => b.start - a.start);
    console.log('matches =' + matches);
    let masked = text;
    const placeholders: Record<string, string> = {};
    for (const m of matches) {
      const placeholder = this.getOrCreatePlaceholder(m.type, m.value);
      masked = masked.slice(0, m.start) + placeholder + masked.slice(m.end);
      placeholders[placeholder] = m.value;
    }
    return { maskedText: masked, placeholders };
  }

  /**
   * Restores original values from masked text.
   * @param text The masked text to restore
   * @return Object containing the restored text
   */
  unmask(text: string): RestoreResult {
    const restored = text.replace(/\[\[LDB:([A-Z]+)_(\d+)\]\]/g, (full) => {
      const original = this.consistent.byPlaceholder.get(full);
      return original ?? full;
    });
    return { restoredText: restored };
  }

  /**
   * Finds all PII matches in the text.
   * @param text The text to scan for PII
   * @return Array of matches found
   */
  private findMatches(text: string): Match[] {
    const results: Match[] = [];
    const pushMatches = (re: RegExp, type: PiiType) => {
      re.lastIndex = 0;
      let m: RegExpExecArray | null;
      while ((m = re.exec(text)) !== null) {
        results.push({
          type,
          start: m.index,
          end: m.index + m[0].length,
          value: m[0],
        });
      }
    };
    pushMatches(EMAIL_RE, 'EMAIL');
    pushMatches(PHONE_RE, 'PHONE');
    pushMatches(IP_RE, 'IP');
    pushMatches(IBAN_RE, 'IBAN');
    pushMatches(NIN_BVN_RE, 'NIN');
    pushMatches(CARD_RE, 'CARD');

    if (this.opts.customExactTerms?.length) {
      for (const t of this.opts.customExactTerms) {
        if (!t) continue;
        const esc = t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const re = new RegExp(`\\b${esc}\\b`, 'gi');
        let m: RegExpExecArray | null;
        while ((m = re.exec(text)) !== null) {
          results.push({
            type: 'CUSTOM',
            start: m.index,
            end: m.index + m[0].length,
            value: m[0],
          });
        }
      }
    }

    results.sort((a, b) => a.start - b.start || b.end - a.end);
    const dedup: Match[] = [];
    let lastEnd = -1;
    for (const r of results) {
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
   * Gets or creates a consistent placeholder for a PII value.
   * @param type The type of PII
   * @param original The original value to mask
   * @return The placeholder string
   */
  private getOrCreatePlaceholder(type: PiiType, original: string): string {
    const stableKey = this.hash(
      `${this.opts.consistentMapKey ?? 'session'}::${type}::${original}`
    );
    const existing = this.consistent.byOriginal.get(stableKey);
    if (existing) return existing;
    const idx = ++this.consistent.counters[type];
    const placeholder = `[[LDB:${type}_${idx}]]`;
    this.consistent.byOriginal.set(stableKey, placeholder);
    this.consistent.byPlaceholder.set(placeholder, original);
    return placeholder;
  }

  /**
   * Creates a hash of the input string for consistent mapping.
   * @param s The string to hash
   * @return Truncated SHA-256 hash
   */
  private hash(s: string): string {
    return crypto.createHash('sha256').update(s).digest('hex').slice(0, 16);
  }
}
