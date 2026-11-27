export interface BusinessDTO {
  id: string;
  placeId: string | null;
  title: string;
  slug: string;
  category: string;
  address: string;
  province: string;
  district: string;
  mobilePhone: string;
  mobilePhoneE164: string;
  rating: number | null;
  reviewCount: number;
  thumbnailUrl: string | null;
  website: string | null;
  isVerified: boolean;
  claimedAt: string | null;
  source: string;
  createdAt: string;
}

export interface SessionUserDTO {
  businessId: string;
  businessTitle: string;
  businessSlug: string;
  phoneDisplay: string;
  phoneE164: string;
  isAdmin: boolean;
}

export interface SearchHistoryDTO {
  id: string;
  keyword: string;
  province: string;
  district: string;
  resultCount: number;
  createdAt: string;
}

export interface SearchResultDTO {
  businesses: BusinessDTO[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  sourceMode: "serper" | "database";
  hasSerperKey: boolean;
  hasOtpKey: boolean;
  filteredOutCount: number;
  liveError: string | null;
}

export interface SavedBusinessItemDTO {
  savedId: string;
  note: string;
  savedAt: string;
  business: BusinessDTO;
}

export interface BusinessGroupDTO {
  id: string;
  name: string;
  description: string;
  color: string;
  createdAt: string;
  itemCount: number;
  items: SavedBusinessItemDTO[];
}

export interface ApiSettingsStatusDTO {
  hasSerperKey: boolean;
  serperKeyMask: string;
  hasOtpKey: boolean;
  otpKeyMask: string;
  otpApiUrl: string;
  otpLocale: string;
  updatedAt: string | null;
}