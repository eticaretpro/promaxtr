import rawProvinces from "@/data/turkey-locations.json";

export interface TurkeyProvince {
  plate: number;
  name: string;
  districts: string[];
}

export const TURKEY_PROVINCES: TurkeyProvince[] = rawProvinces as TurkeyProvince[];

const PROVINCE_MAP = new Map<string, TurkeyProvince>(
  TURKEY_PROVINCES.map((p) => [p.name, p]),
);

export function getProvinceByName(name: string): TurkeyProvince | undefined {
  return PROVINCE_MAP.get(name);
}

export function getDistrictsForProvince(provinceName: string): string[] {
  return PROVINCE_MAP.get(provinceName)?.districts ?? [];
}

export function isValidTurkeyLocation(provinceName: string, districtName?: string): boolean {
  const province = PROVINCE_MAP.get(provinceName);
  if (!province) return false;
  if (!districtName) return true;
  return province.districts.includes(districtName);
}