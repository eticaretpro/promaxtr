import { describe, expect, it } from "vitest";
import { parseTurkishMobile, slugifyTurkish } from "@/lib/turkish-phone";
import { isValidTurkeyLocation, TURKEY_PROVINCES } from "@/lib/turkey-locations";
import { filterPlaceCategories } from "@/lib/places-categories";

describe("Turkish 05xx mobile phone filter", () => {
  it("accepts and formats valid Turkish 05xx mobile numbers", () => {
    expect(parseTurkishMobile("0532 418 27 90")).toEqual({
      display: "0532 418 27 90",
      e164: "+905324182790",
      national: "05324182790",
    });
    expect(parseTurkishMobile("+90 544 203 61 15")?.e164).toBe("+905442036115");
    expect(parseTurkishMobile("905057769432")?.display).toBe("0505 776 94 32");
    expect(parseTurkishMobile("5308193347")?.e164).toBe("+905308193347");
  });

  it("strictly excludes landlines, 0850, 444, and invalid numbers", () => {
    expect(parseTurkishMobile("0212 245 12 34")).toBeNull();
    expect(parseTurkishMobile("+90 216 338 11 22")).toBeNull();
    expect(parseTurkishMobile("0312 417 00 00")).toBeNull();
    expect(parseTurkishMobile("0850 222 00 00")).toBeNull();
    expect(parseTurkishMobile("444 0 444")).toBeNull();
    expect(parseTurkishMobile("")).toBeNull();
    expect(parseTurkishMobile(null)).toBeNull();
  });
});

describe("Turkey 81 provinces and cascading districts validation", () => {
  it("contains all 81 provinces and validates official province/district pairs", () => {
    expect(TURKEY_PROVINCES).toHaveLength(81);
    expect(isValidTurkeyLocation("İstanbul", "Kadıköy")).toBe(true);
    expect(isValidTurkeyLocation("Ankara", "Çankaya")).toBe(true);
    expect(isValidTurkeyLocation("İstanbul", "Çankaya")).toBe(false);
    expect(isValidTurkeyLocation("Atlantis", "Merkez")).toBe(false);
  });
});

describe("Turkish business slug generation & category autosuggest", () => {
  it("generates clean Turkish URL slugs and guards reserved paths", () => {
    expect(slugifyTurkish("Moda Sahil Cafe")).toBe("moda-sahil-cafe");
    expect(slugifyTurkish("Kadıköy Diş Sağlığı")).toBe("kadikoy-dis-sagligi");
    expect(slugifyTurkish("ayarlar")).toBe("ayarlar-profil");
  });

  it("suggests matching Google Places categories", () => {
    const matches = filterPlaceCategories("Resto");
    expect(matches[0]?.label).toBe("Restoran");
  });
});