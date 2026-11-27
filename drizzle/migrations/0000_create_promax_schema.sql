-- 1. Businesses (discovered via Serper.dev Maps API; also serve as platform members)
CREATE TABLE public.businesses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  place_id TEXT UNIQUE,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL,
  address TEXT NOT NULL DEFAULT '',
  province TEXT NOT NULL,
  district TEXT NOT NULL,
  mobile_phone TEXT NOT NULL,
  mobile_phone_e164 TEXT NOT NULL,
  rating NUMERIC(2,1),
  review_count INTEGER NOT NULL DEFAULT 0,
  thumbnail_url TEXT,
  website TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  opening_hours JSONB,
  is_verified BOOLEAN NOT NULL DEFAULT false,
  claimed_at TIMESTAMPTZ,
  source TEXT NOT NULL DEFAULT 'serper',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_businesses_location ON public.businesses (province, district);
CREATE INDEX idx_businesses_phone_e164 ON public.businesses (mobile_phone_e164);
CREATE INDEX idx_businesses_category ON public.businesses (category);

GRANT SELECT ON public.businesses TO anon, authenticated;
GRANT ALL ON public.businesses TO service_role;

ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view businesses"
  ON public.businesses
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- 2. Business Groups (user's custom saved lists)
CREATE TABLE public.business_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_phone_e164 TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  color TEXT NOT NULL DEFAULT 'blue',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (owner_phone_e164, name)
);

CREATE INDEX idx_business_groups_owner ON public.business_groups (owner_phone_e164);

GRANT ALL ON public.business_groups TO service_role;
ALTER TABLE public.business_groups ENABLE ROW LEVEL SECURITY;

-- 3. Saved Businesses (many-to-many between groups and businesses)
CREATE TABLE public.saved_businesses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.business_groups(id) ON DELETE CASCADE,
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  owner_phone_e164 TEXT NOT NULL,
  note TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (group_id, business_id)
);

CREATE INDEX idx_saved_businesses_owner ON public.saved_businesses (owner_phone_e164);
CREATE INDEX idx_saved_businesses_group ON public.saved_businesses (group_id);

GRANT ALL ON public.saved_businesses TO service_role;
ALTER TABLE public.saved_businesses ENABLE ROW LEVEL SECURITY;

-- 4. Search History (recent searches per signed-in phone or visitor)
CREATE TABLE public.search_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  visitor_key TEXT NOT NULL,
  keyword TEXT NOT NULL,
  province TEXT NOT NULL,
  district TEXT NOT NULL,
  result_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_search_history_visitor ON public.search_history (visitor_key, created_at DESC);

GRANT ALL ON public.search_history TO service_role;
ALTER TABLE public.search_history ENABLE ROW LEVEL SECURITY;

-- 5. OTP Verifications (OTP.com or sandbox verification tracking)
CREATE TABLE public.otp_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_e164 TEXT NOT NULL,
  provider TEXT NOT NULL DEFAULT 'sandbox',
  external_otp_id TEXT,
  code_hash TEXT,
  attempts INTEGER NOT NULL DEFAULT 0,
  expires_at TIMESTAMPTZ NOT NULL,
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_otp_verifications_phone ON public.otp_verifications (phone_e164, created_at DESC);

GRANT ALL ON public.otp_verifications TO service_role;
ALTER TABLE public.otp_verifications ENABLE ROW LEVEL SECURITY;

-- 6. Business Sessions (server-side verified cookie sessions)
CREATE TABLE public.business_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token_hash TEXT NOT NULL UNIQUE,
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  phone_e164 TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_business_sessions_token ON public.business_sessions (token_hash);

GRANT ALL ON public.business_sessions TO service_role;
ALTER TABLE public.business_sessions ENABLE ROW LEVEL SECURITY;

-- 7. System Settings (Serper.dev & OTP.com API credentials stored in DB)
CREATE TABLE public.system_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  is_secret BOOLEAN NOT NULL DEFAULT true,
  updated_by_phone TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT ALL ON public.system_settings TO service_role;
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- 8. Admin Phones (server-verified admins allowed to update API settings)
CREATE TABLE public.admin_phones (
  phone_e164 TEXT PRIMARY KEY,
  label TEXT NOT NULL DEFAULT 'Yönetici',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT ALL ON public.admin_phones TO service_role;
ALTER TABLE public.admin_phones ENABLE ROW LEVEL SECURITY;

-- Default API setting rows (keys empty until configured by admin)
INSERT INTO public.system_settings (key, value, description, is_secret) VALUES
  ('serper_api_key', '', 'Serper.dev Google Maps API Anahtarı (X-API-KEY)', true),
  ('otp_api_key', '', 'OTP.com API Anahtarı (Bearer Token)', true),
  ('otp_api_url', 'https://api.otp.com/api/v1', 'OTP.com API Temel Adresi', false),
  ('otp_locale', 'tr', 'OTP.com SMS Dil Kodu', false);

-- Initial platform admin phone (Moda Sahil Cafe demo business)
INSERT INTO public.admin_phones (phone_e164, label) VALUES
  ('+905324182790', 'Promax Yönetici');

-- Initial Kadıköy & İstanbul businesses (strictly 05xx Turkish mobile numbers)
INSERT INTO public.businesses (
  place_id, title, slug, category, address, province, district,
  mobile_phone, mobile_phone_e164, rating, review_count, thumbnail_url, website, is_verified, source
) VALUES
  ('seed_moda_sahil_cafe', 'Moda Sahil Cafe', 'moda-sahil-cafe', 'Kafe', 'Caferağa Mah. Moda Cad. No:142, Kadıköy, İstanbul', 'İstanbul', 'Kadıköy', '0532 418 27 90', '+905324182790', 4.8, 342, 'seed:cafe', 'https://modasahilcafe.example.com', true, 'seed'),
  ('seed_kadikoy_lezzet_doner', 'Kadıköy Lezzet Döner', 'kadikoy-lezzet-doner', 'Restoran', 'Osmanağa Mah. Söğütlüçeşme Cad. No:58, Kadıköy, İstanbul', 'İstanbul', 'Kadıköy', '0544 203 61 15', '+905442036115', 4.6, 518, 'seed:restaurant', 'https://kadikoylezzetdoner.example.com', true, 'seed'),
  ('seed_kadikoy_dis_sagligi', 'Kadıköy Diş Sağlığı', 'kadikoy-dis-sagligi', 'Klinik', 'Suadiye Mah. Bağdat Cad. No:314/4, Kadıköy, İstanbul', 'İstanbul', 'Kadıköy', '0505 776 94 32', '+905057769432', 4.9, 196, 'seed:clinic', 'https://kadikoydissagligi.example.com', true, 'seed'),
  ('seed_bahariye_artisanal_bakery', 'Bahariye Fırın & Kahve', 'bahariye-firin-kahve', 'Pastane', 'Osmanağa Mah. General Asım Gündüz Cad. No:71, Kadıköy, İstanbul', 'İstanbul', 'Kadıköy', '0533 612 48 19', '+905336124819', 4.7, 284, 'seed:bakery', NULL, false, 'seed'),
  ('seed_fenerbahce_atelier_hair', 'Fenerbahçe Stüdyo Kuaför', 'fenerbahce-studyo-kuafor', 'Kuaför', 'Fenerbahçe Mah. Dr. Faruk Ayanoğlu Cad. No:24, Kadıköy, İstanbul', 'İstanbul', 'Kadıköy', '0535 904 12 63', '+905359041263', 4.8, 165, 'seed:salon', NULL, false, 'seed'),
  ('seed_goztepe_oto_bakim', 'Göztepe Premium Oto Servis', 'goztepe-premium-oto-servis', 'Oto Servis', 'Merdivenköy Mah. Fahrettin Kerim Gökay Cad. No:210, Kadıköy, İstanbul', 'İstanbul', 'Kadıköy', '0542 387 55 04', '+905423875504', 4.5, 129, 'seed:auto', NULL, false, 'seed'),
  ('seed_yeldegirmeni_roastery', 'Yeldeğirmeni Kahve Kavurucusu', 'yeldegirmeni-kahve-kavurucusu', 'Kafe', 'Rasimpaşa Mah. Karakolhane Cad. No:46, Kadıköy, İstanbul', 'İstanbul', 'Kadıköy', '0530 819 33 47', '+905308193347', 4.9, 412, 'seed:cafe', NULL, false, 'seed'),
  ('seed_bagdat_bistro_grill', 'Bağdat Ocakbaşı & Restoran', 'bagdat-ocakbasi-restoran', 'Restoran', 'Caddebostan Mah. Bağdat Cad. No:265, Kadıköy, İstanbul', 'İstanbul', 'Kadıköy', '0536 441 72 88', '+905364417288', 4.7, 624, 'seed:restaurant', NULL, false, 'seed'),
  ('seed_kozyatagi_estetik_klinik', 'Kozyatağı Medikal Estetik', 'kozyatagi-medikal-estetik', 'Klinik', 'Kozyatağı Mah. Şemsettin Günaltay Cad. No:118, Kadıköy, İstanbul', 'İstanbul', 'Kadıköy', '0545 219 80 51', '+905452198051', 4.8, 143, 'seed:clinic', NULL, false, 'seed'),
  ('seed_besiktas_kahve_evi', 'Beşiktaş Çarşı Kahve Evi', 'besiktas-carsi-kahve-evi', 'Kafe', 'Sinanpaşa Mah. Ortabahçe Cad. No:19, Beşiktaş, İstanbul', 'İstanbul', 'Beşiktaş', '0531 524 66 10', '+905315246610', 4.7, 275, 'seed:cafe', NULL, false, 'seed'),
  ('seed_cankaya_gurme_mutfak', 'Çankaya Anadolu Mutfağı', 'cankaya-anadolu-mutfagi', 'Restoran', 'Kavaklidere Mah. Tunalı Hilmi Cad. No:94, Çankaya, Ankara', 'Ankara', 'Çankaya', '0534 778 29 40', '+905347782940', 4.8, 389, 'seed:restaurant', NULL, false, 'seed'),
  ('seed_konak_alsancak_dis', 'Alsancak İmplant & Diş Kliniği', 'alsancak-implant-dis-klinigi', 'Klinik', 'Kültür Mah. Cumhuriyet Blv. No:162, Konak, İzmir', 'İzmir', 'Konak', '0507 635 14 82', '+905076351482', 4.9, 211, 'seed:clinic', NULL, false, 'seed');

-- Sample recent searches for initial discovery
INSERT INTO public.search_history (visitor_key, keyword, province, district, result_count) VALUES
  ('default', 'Kafe', 'İstanbul', 'Kadıköy', 9),
  ('default', 'Restoran', 'İstanbul', 'Kadıköy', 9),
  ('default', 'Klinik', 'İstanbul', 'Kadıköy', 9);
