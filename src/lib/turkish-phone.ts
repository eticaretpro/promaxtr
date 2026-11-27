export interface NormalizedTurkishMobile {
  /** Formatted display phone: 0532 418 27 90 */
  display: string;
  /** Strict E.164 format: +905324182790 */
  e164: string;
  /** National 11-digit format: 05324182790 */
  national: string;
}

/**
 * Parses and strictly validates Turkish mobile phone numbers starting with 05 / +90 5xx.
 * Returns null for landlines (0212, 0216, 0312, 0850, 444, etc.) or invalid lengths.
 */
export function parseTurkishMobile(raw: string | null | undefined): NormalizedTurkishMobile | null {
  if (!raw) return null;
  const digits = raw.replace(/\D/g, "");

  let tenDigits: string | null = null;
  if (digits.length === 10 && digits.startsWith("5")) {
    tenDigits = digits;
  } else if (digits.length === 11 && digits.startsWith("05")) {
    tenDigits = digits.slice(1);
  } else if (digits.length === 12 && digits.startsWith("905")) {
    tenDigits = digits.slice(2);
  } else if (digits.length === 14 && digits.startsWith("00905")) {
    tenDigits = digits.slice(4);
  }

  if (!tenDigits || !/^5\d{9}$/.test(tenDigits)) {
    return null;
  }

  const national = `0${tenDigits}`;
  const display = `${national.slice(0, 4)} ${national.slice(4, 7)} ${national.slice(7, 9)} ${national.slice(9, 11)}`;
  const e164 = `+90${tenDigits}`;
  return { display, e164, national };
}

export function maskTurkishPhone(e164: string): string {
  const parsed = parseTurkishMobile(e164);
  if (!parsed) return e164;
  const n = parsed.national;
  return `${n.slice(0, 4)} *** ** ${n.slice(9, 11)}`;
}

const TR_CHAR_MAP: Record<string, string> = {
  ç: "c",
  Ç: "c",
  ğ: "g",
  Ğ: "g",
  ı: "i",
  I: "i",
  İ: "i",
  ö: "o",
  Ö: "o",
  ş: "s",
  Ş: "s",
  ü: "u",
  Ü: "u",
};

const RESERVED_SLUGS = new Set(["gruplarim", "ayarlar", "api", "auth", "login", "admin", "index"]);

export function slugifyTurkish(text: string, fallbackSuffix?: string): string {
  const mapped = text
    .split("")
    .map((ch) => TR_CHAR_MAP[ch] ?? ch)
    .join("")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);

  const base = mapped || "isletme";
  if (RESERVED_SLUGS.has(base)) {
    return `${base}-${fallbackSuffix ?? "profil"}`;
  }
  return base;
}