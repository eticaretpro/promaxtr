export interface PlaceCategorySuggestion {
  label: string;
  group: string;
}

export const GOOGLE_PLACES_CATEGORIES: PlaceCategorySuggestion[] = [
  { label: "Restoran", group: "Yeme & İçme" },
  { label: "Kafe", group: "Yeme & İçme" },
  { label: "Pastane", group: "Yeme & İçme" },
  { label: "Kebapçı", group: "Yeme & İçme" },
  { label: "Dönerci", group: "Yeme & İçme" },
  { label: "Kahvaltı Salonu", group: "Yeme & İçme" },
  { label: "Pizzacı", group: "Yeme & İçme" },
  { label: "Balık Restoranı", group: "Yeme & İçme" },
  { label: "Klinik", group: "Sağlık" },
  { label: "Diş Kliniği", group: "Sağlık" },
  { label: "Eczane", group: "Sağlık" },
  { label: "Veteriner Kliniği", group: "Sağlık" },
  { label: "Fizyoterapi Merkezi", group: "Sağlık" },
  { label: "Göz Kliniği", group: "Sağlık" },
  { label: "Estetik Merkezi", group: "Sağlık" },
  { label: "Psikolog", group: "Sağlık" },
  { label: "Kuaför", group: "Güzellik & Bakım" },
  { label: "Berber", group: "Güzellik & Bakım" },
  { label: "Güzellik Salonu", group: "Güzellik & Bakım" },
  { label: "Spa ve Masaj", group: "Güzellik & Bakım" },
  { label: "Tırnak Stüdyosu", group: "Güzellik & Bakım" },
  { label: "Oto Servis", group: "Otomotiv" },
  { label: "Oto Yıkama", group: "Otomotiv" },
  { label: "Lastikçi", group: "Otomotiv" },
  { label: "Oto Ekspertiz", group: "Otomotiv" },
  { label: "Oto Kiralama", group: "Otomotiv" },
  { label: "Emlak Ofisi", group: "Profesyonel Hizmetler" },
  { label: "Avukatlık Bürosu", group: "Profesyonel Hizmetler" },
  { label: "Mali Müşavir", group: "Profesyonel Hizmetler" },
  { label: "Mimarlık Ofisi", group: "Profesyonel Hizmetler" },
  { label: "Reklam Ajansı", group: "Profesyonel Hizmetler" },
  { label: "Yazılım Şirketi", group: "Profesyonel Hizmetler" },
  { label: "Sigorta Acentesi", group: "Profesyonel Hizmetler" },
  { label: "Otel", group: "Konaklama" },
  { label: "Butik Otel", group: "Konaklama" },
  { label: "Pansiyon", group: "Konaklama" },
  { label: "Spor Salonu", group: "Spor & Yaşam" },
  { label: "Pilates Stüdyosu", group: "Spor & Yaşam" },
  { label: "Yoga Stüdyosu", group: "Spor & Yaşam" },
  { label: "Çiçekçi", group: "Alışveriş" },
  { label: "Mobilya Mağazası", group: "Alışveriş" },
  { label: "Kuyumcu", group: "Alışveriş" },
  { label: "Optik", group: "Alışveriş" },
  { label: "Pet Shop", group: "Alışveriş" },
  { label: "Kırtasiye", group: "Alışveriş" },
  { label: "Elektrikçi", group: "Tamir & Teknik" },
  { label: "Tesisatçı", group: "Tamir & Teknik" },
  { label: "Çilingir", group: "Tamir & Teknik" },
  { label: "Klima Servisi", group: "Tamir & Teknik" },
  { label: "Bilgisayar Tamiri", group: "Tamir & Teknik" },
  { label: "Telefon Tamiri", group: "Tamir & Teknik" },
  { label: "Nakliyat", group: "Lojistik" },
  { label: "Kuru Temizleme", group: "Günlük Hizmetler" },
  { label: "Halı Yıkama", group: "Günlük Hizmetler" },
  { label: "Özel Ders & Kurs", group: "Eğitim" },
  { label: "Sürücü Kursu", group: "Eğitim" },
  { label: "Anaokulu", group: "Eğitim" },
  { label: "Fotoğraf Stüdyosu", group: "Etkinlik & Medya" },
  { label: "Düğün Salonu", group: "Etkinlik & Medya" },
];

function normalizeTr(value: string): string {
  return value.toLocaleLowerCase("tr-TR").trim();
}

export function filterPlaceCategories(query: string, limit = 8): PlaceCategorySuggestion[] {
  const q = normalizeTr(query);
  if (!q) return GOOGLE_PLACES_CATEGORIES.slice(0, limit);

  const startsWith: PlaceCategorySuggestion[] = [];
  const includes: PlaceCategorySuggestion[] = [];

  for (const item of GOOGLE_PLACES_CATEGORIES) {
    const label = normalizeTr(item.label);
    const group = normalizeTr(item.group);
    if (label.startsWith(q)) {
      startsWith.push(item);
    } else if (label.includes(q) || group.includes(q)) {
      includes.push(item);
    }
  }
  return [...startsWith, ...includes].slice(0, limit);
}