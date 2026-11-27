import bizCafe from "@/assets/biz-cafe.jpg";
import bizRestaurant from "@/assets/biz-restaurant.jpg";
import bizClinic from "@/assets/biz-clinic.jpg";
import bizBakery from "@/assets/biz-bakery.jpg";
import bizSalon from "@/assets/biz-salon.jpg";
import bizAuto from "@/assets/biz-auto.jpg";

const SEED_IMAGE_MAP: Record<string, string> = {
  "seed:cafe": bizCafe,
  "seed:restaurant": bizRestaurant,
  "seed:clinic": bizClinic,
  "seed:bakery": bizBakery,
  "seed:salon": bizSalon,
  "seed:auto": bizAuto,
};

export function resolveBusinessThumbnail(
  thumbnailUrl: string | null | undefined,
  category?: string,
): string {
  if (thumbnailUrl && SEED_IMAGE_MAP[thumbnailUrl]) {
    return SEED_IMAGE_MAP[thumbnailUrl];
  }
  if (thumbnailUrl && /^https?:\/\//i.test(thumbnailUrl)) {
    return thumbnailUrl;
  }

  const lower = (category ?? "").toLocaleLowerCase("tr-TR");
  if (lower.includes("kafe") || lower.includes("kahve")) return bizCafe;
  if (lower.includes("klinik") || lower.includes("diş") || lower.includes("eczane")) return bizClinic;
  if (lower.includes("pastane") || lower.includes("fırın")) return bizBakery;
  if (lower.includes("kuaför") || lower.includes("berber") || lower.includes("güzellik")) return bizSalon;
  if (lower.includes("oto") || lower.includes("servis") || lower.includes("lastik")) return bizAuto;
  return bizRestaurant;
}