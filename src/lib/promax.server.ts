import { getCookie, setCookie } from "@tanstack/react-start/server";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { parseTurkishMobile, slugifyTurkish } from "./turkish-phone";
import type { BusinessDTO, SessionUserDTO } from "./promax-types";

export const SESSION_COOKIE_NAME = "promax_session";
export const VISITOR_COOKIE_NAME = "promax_visitor";

export async function sha256Hex(value: string): Promise<string> {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export function timingSafeEqualStr(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

export function randomTokenHex(byteLength = 32): string {
  const bytes = new Uint8Array(byteLength);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export function randomSixDigitCode(): string {
  const arr = new Uint32Array(1);
  crypto.getRandomValues(arr);
  return String(100000 + ((arr[0] ?? 0) % 900000));
}

export function maskSecret(secret: string): string {
  const trimmed = secret.trim();
  if (!trimmed) return "";
  if (trimmed.length <= 6) return "••••••";
  return `••••••${trimmed.slice(-4)}`;
}

export function mapBusinessRow(row: {
  id: string;
  place_id: string | null;
  title: string;
  slug: string;
  category: string;
  address: string;
  province: string;
  district: string;
  mobile_phone: string;
  mobile_phone_e164: string;
  rating: number | null;
  review_count: number;
  thumbnail_url: string | null;
  website: string | null;
  is_verified: boolean;
  claimed_at: string | null;
  source: string;
  created_at: string;
}): BusinessDTO {
  return {
    id: row.id,
    placeId: row.place_id,
    title: row.title,
    slug: row.slug,
    category: row.category,
    address: row.address,
    province: row.province,
    district: row.district,
    mobilePhone: row.mobile_phone,
    mobilePhoneE164: row.mobile_phone_e164,
    rating: row.rating !== null ? Number(row.rating) : null,
    reviewCount: row.review_count,
    thumbnailUrl: row.thumbnail_url,
    website: row.website,
    isVerified: row.is_verified,
    claimedAt: row.claimed_at,
    source: row.source,
    createdAt: row.created_at,
  };
}

export async function getSystemSettingsMap(): Promise<Record<string, string>> {
  const { data, error } = await supabaseAdmin
    .from("system_settings")
    .select("key, value");
  if (error) {
    console.error("[Promax] Failed to read system_settings:", error.message);
    return {};
  }
  const result: Record<string, string> = {};
  for (const row of data ?? []) {
    result[row.key] = row.value;
  }
  return result;
}

export async function isAdminPhone(phoneE164: string): Promise<boolean> {
  const { data } = await supabaseAdmin
    .from("admin_phones")
    .select("phone_e164")
    .eq("phone_e164", phoneE164)
    .maybeSingle();
  return Boolean(data);
}

export async function getCurrentBusinessSession(): Promise<SessionUserDTO | null> {
  const rawToken = getCookie(SESSION_COOKIE_NAME);
  if (!rawToken) return null;

  const tokenHash = await sha256Hex(rawToken);
  const nowIso = new Date().toISOString();

  const { data: sessionRow } = await supabaseAdmin
    .from("business_sessions")
    .select("id, business_id, phone_e164, expires_at")
    .eq("token_hash", tokenHash)
    .gt("expires_at", nowIso)
    .maybeSingle();

  if (!sessionRow) return null;

  const { data: business } = await supabaseAdmin
    .from("businesses")
    .select("id, title, slug, mobile_phone, mobile_phone_e164")
    .eq("id", sessionRow.business_id)
    .maybeSingle();

  if (!business) return null;

  const admin = await isAdminPhone(business.mobile_phone_e164);
  return {
    businessId: business.id,
    businessTitle: business.title,
    businessSlug: business.slug,
    phoneDisplay: business.mobile_phone,
    phoneE164: business.mobile_phone_e164,
    isAdmin: admin,
  };
}

export function getOrCreateVisitorKey(session: SessionUserDTO | null): string {
  if (session) return `phone:${session.phoneE164}`;
  let visitorId = getCookie(VISITOR_COOKIE_NAME);
  if (!visitorId) {
    visitorId = randomTokenHex(12);
    setCookie(VISITOR_COOKIE_NAME, visitorId, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });
  }
  return `visitor:${visitorId}`;
}

export interface SerperMapPlace {
  title?: string;
  address?: string;
  phoneNumber?: string;
  rating?: number;
  ratingCount?: number;
  type?: string;
  types?: string[];
  website?: string;
  thumbnailUrl?: string;
  cid?: string;
  placeId?: string;
  latitude?: number;
  longitude?: number;
  openingHours?: Record<string, string>;
}

async function ensureUniqueSlug(baseSlug: string, placeId: string): Promise<string> {
  const { data: existingByPlace } = await supabaseAdmin
    .from("businesses")
    .select("slug")
    .eq("place_id", placeId)
    .maybeSingle();
  if (existingByPlace?.slug) return existingByPlace.slug;

  let candidate = baseSlug;
  for (let i = 0; i < 6; i++) {
    const { data: clash } = await supabaseAdmin
      .from("businesses")
      .select("id")
      .eq("slug", candidate)
      .maybeSingle();
    if (!clash) return candidate;
    candidate = `${baseSlug}-${i + 2}`;
  }
  return `${baseSlug}-${randomTokenHex(3)}`;
}

export async function upsertSerperPlaces(
  places: SerperMapPlace[],
  province: string,
  district: string,
  fallbackCategory: string,
): Promise<{ savedIds: string[]; filteredOutCount: number }> {
  const savedIds: string[] = [];
  let filteredOutCount = 0;

  for (const place of places) {
    const title = place.title?.trim();
    if (!title) {
      filteredOutCount += 1;
      continue;
    }

    const parsedMobile = parseTurkishMobile(place.phoneNumber);
    if (!parsedMobile) {
      filteredOutCount += 1;
      continue;
    }

    const placeId =
      place.placeId?.trim() ||
      place.cid?.trim() ||
      `serper:${slugifyTurkish(title)}:${parsedMobile.e164}`;
    const baseSlug = slugifyTurkish(title, parsedMobile.national.slice(-4));
    const slug = await ensureUniqueSlug(baseSlug, placeId);
    const category = place.type?.trim() || place.types?.[0]?.trim() || fallbackCategory || "İşletme";

    const { data, error } = await supabaseAdmin
      .from("businesses")
      .upsert(
        {
          place_id: placeId,
          title,
          slug,
          category,
          address: place.address?.trim() ?? `${district}, ${province}`,
          province,
          district,
          mobile_phone: parsedMobile.display,
          mobile_phone_e164: parsedMobile.e164,
          rating: typeof place.rating === "number" ? Number(place.rating.toFixed(1)) : null,
          review_count: typeof place.ratingCount === "number" ? Math.max(0, Math.round(place.ratingCount)) : 0,
          thumbnail_url: place.thumbnailUrl?.trim() || null,
          website: place.website?.trim() || null,
          latitude: typeof place.latitude === "number" ? place.latitude : null,
          longitude: typeof place.longitude === "number" ? place.longitude : null,
          opening_hours: place.openingHours ?? null,
          source: "serper",
          updated_at: new Date().toISOString(),
        },
        { onConflict: "place_id" },
      )
      .select("id")
      .single();

    if (!error && data?.id) {
      savedIds.push(data.id);
    }
  }

  return { savedIds, filteredOutCount };
}