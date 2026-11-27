import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { Search, MapPin, Building2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { filterPlaceCategories } from "@/lib/places-categories";
import { getDistrictsForProvince, TURKEY_PROVINCES } from "@/lib/turkey-locations";

interface SearchPanelProps {
  keyword: string;
  province: string;
  district: string;
  isSearching: boolean;
  onKeywordChange: (value: string) => void;
  onProvinceChange: (province: string, nextDistrict: string) => void;
  onDistrictChange: (district: string) => void;
  onSubmit: () => void;
}

export function SearchPanel({
  keyword,
  province,
  district,
  isSearching,
  onKeywordChange,
  onProvinceChange,
  onDistrictChange,
  onSubmit,
}: SearchPanelProps) {
  const [suggestOpen, setSuggestOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const suggestions = useMemo(() => filterPlaceCategories(keyword, 8), [keyword]);
  const districts = useMemo(() => getDistrictsForProvince(province), [province]);

  useEffect(() => {
    function handleOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setSuggestOpen(false);
      }
    }
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, []);

  function handleFormSubmit(e: FormEvent) {
    e.preventDefault();
    setSuggestOpen(false);
    onSubmit();
  }

  function handleSelectProvince(nextProvince: string) {
    const nextDistricts = getDistrictsForProvince(nextProvince);
    const preferred =
      nextProvince === "İstanbul" && nextDistricts.includes("Kadıköy")
        ? "Kadıköy"
        : nextProvince === "Ankara" && nextDistricts.includes("Çankaya")
          ? "Çankaya"
          : nextProvince === "İzmir" && nextDistricts.includes("Konak")
            ? "Konak"
            : (nextDistricts[0] ?? "");
    onProvinceChange(nextProvince, preferred);
  }

  return (
    <form
      onSubmit={handleFormSubmit}
      className="rounded-2xl border border-border bg-card p-3 shadow-sm sm:p-4"
    >
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div ref={containerRef} className="relative flex-1">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={keyword}
            onChange={(e) => {
              onKeywordChange(e.target.value);
              setSuggestOpen(true);
            }}
            onFocus={() => setSuggestOpen(true)}
            onKeyDown={(e) => {
              if (e.key === "Escape") setSuggestOpen(false);
            }}
            placeholder="Kategori yazın (örn: Restoran)"
            aria-label="İşletme kategorisi veya anahtar kelime"
            autoComplete="off"
            className="h-11 w-full rounded-full border border-input bg-background pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/25"
          />

          {suggestOpen && suggestions.length > 0 && (
            <div
              role="listbox"
              aria-label="Google Places Kategori Önerileri"
              className="absolute left-0 right-0 top-[calc(100%+6px)] z-30 max-h-72 overflow-y-auto rounded-2xl border border-border bg-popover p-1.5 shadow-lg"
            >
              <div className="px-3 py-1.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                Google Places Kategorileri
              </div>
              {suggestions.map((item) => (
                <button
                  key={item.label}
                  type="button"
                  role="option"
                  aria-selected={keyword.toLocaleLowerCase("tr-TR") === item.label.toLocaleLowerCase("tr-TR")}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    onKeywordChange(item.label);
                    setSuggestOpen(false);
                  }}
                  className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm transition-colors hover:bg-secondary"
                >
                  <span className="font-medium text-foreground">{item.label}</span>
                  <span className="text-xs text-muted-foreground">{item.group}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:flex lg:items-center">
          <Select value={province} onValueChange={handleSelectProvince}>
            <SelectTrigger
              aria-label="İl seçin"
              className="h-11 w-full rounded-full border-input bg-background px-4 text-sm lg:w-[200px]"
            >
              <div className="flex items-center gap-1.5 truncate">
                <MapPin className="h-3.5 w-3.5 shrink-0 text-primary" />
                <span className="text-muted-foreground">İl:</span>
                <SelectValue placeholder="İl seçin" />
              </div>
            </SelectTrigger>
            <SelectContent className="max-h-72 rounded-xl">
              {TURKEY_PROVINCES.map((p) => (
                <SelectItem key={p.plate} value={p.name}>
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={district} onValueChange={onDistrictChange}>
            <SelectTrigger
              aria-label="İlçe seçin"
              className="h-11 w-full rounded-full border-input bg-background px-4 text-sm lg:w-[200px]"
            >
              <div className="flex items-center gap-1.5 truncate">
                <Building2 className="h-3.5 w-3.5 shrink-0 text-primary" />
                <span className="text-muted-foreground">İlçe:</span>
                <SelectValue placeholder="İlçe seçin" />
              </div>
            </SelectTrigger>
            <SelectContent className="max-h-72 rounded-xl">
              {districts.map((d) => (
                <SelectItem key={d} value={d}>
                  {d}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button
          type="submit"
          disabled={isSearching}
          className="h-11 shrink-0 rounded-full px-6 text-sm font-semibold shadow-sm"
        >
          {isSearching && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          İşletmeleri Bul
        </Button>
      </div>
    </form>
  );
}