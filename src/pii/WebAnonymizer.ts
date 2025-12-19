// src/pii/WebAnonymizer.ts
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
interface Match {
  type: PiiType;
  start: number;
  end: number;
  value: string;
}
export interface MaskResult {
  maskedText: string;
  placeholders: Record<string, string>;
}
export interface RestoreResult {
  restoredText: string;
}

const EMAIL_RE = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi;
const PHONE_RE =
  /\b(?:\+?\d{1,3}[-.\s]?)?(?:\(?\d{3,4}\)?[-.\s]?)?\d{3}[-.\s]?\d{3,4}\b/g;
const IP_RE = /\b(?:\d{1,3}\.){3}\d{1,3}\b/g;
const IBAN_RE = /\b[A-Z]{2}\d{2}[A-Z0-9]{10,30}\b/g;
const NIN_BVN_RE = /\b\d{11}\b/g;
const CARD_RE = /\b(?:\d[ -]*?){13,19}\b/g;

function djb2(str: string): string {
  let h = 5381;
  for (let i = 0; i < str.length; i++) h = ((h << 5) + h) ^ str.charCodeAt(i);
  return (h >>> 0).toString(16);
}

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

  setCustomTerms(terms: string[]) {
    this.customExactTerms = terms ?? [];
  }
  clear() {
    this.byOriginal.clear();
    this.byPlaceholder.clear();
    Object.keys(this.counters).forEach((k) => ((this.counters as any)[k] = 0));
  }

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

  unmask(text: string): RestoreResult {
    const restored = text.replace(
      /\[\[LDB:([A-Z]+)_(\d+)\]\]/g,
      (full) => this.byPlaceholder.get(full) ?? full
    );
    return { restoredText: restored };
  }

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
