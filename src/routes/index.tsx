import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Clock, Info, Layers, ShieldAlert, SearchX, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SearchPanel } from "@/components/search-panel";
import { BusinessRowCard } from "@/components/business-row-card";
import { SaveToGroupDialog } from "@/components/save-to-group-dialog";
import { usePromaxSession } from "@/components/promax-session-context";
import { getRecentSearchesFn, searchBusinessesFn } from "@/lib/promax-search.functions";
import type { BusinessDTO } from "@/lib/promax-types";

type SortMode = "recommended" | "rating" | "reviews" | "name";

const DEFAULT_PROVINCE = "İstanbul";
const DEFAULT_DISTRICT = "Kadıköy";
const PAGE_SIZE = 5;

const initialSearchQueryOptions = queryOptions({
  queryKey: ["promax-search", "", DEFAULT_PROVINCE, DEFAULT_DISTRICT, 1, "recommended", 0],
  queryFn: () =>
    searchBusinessesFn({
      data: {
        keyword: "",
        province: DEFAULT_PROVINCE,
        district: DEFAULT_DISTRICT,
        page: 1,
        pageSize: PAGE_SIZE,
        sort: "recommended",
        fetchLive: false,
      },
    }),
});

const recentSearchesQueryOptions = queryOptions({
  queryKey: ["promax-recent-searches"],
  queryFn: () => getRecentSearchesFn(),
});

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Promax — Türkiye 05xx İşletme Arama Motoru" },
      {
        name: "description",
        content:
          "81 il ve 973 ilçede yalnızca 05 ile başlayan cep telefonu numarasına sahip doğrulanabilir işletmeleri bulun, gruplara kaydedin.",
      },
      { property: "og:title", content: "Promax — Türkiye 05xx İşletme Arama Motoru" },
      {
        property: "og:description",
        content:
          "81 il ve 973 ilçede yalnızca 05 ile başlayan cep telefonu numarasına sahip doğrulanabilir işletmeleri bulun, gruplara kaydedin.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  loader: async ({ context }) => {
    const [initialSearch, initialRecent] = await Promise.all([
      context.queryClient.ensureQueryData(initialSearchQueryOptions),
      context.queryClient.ensureQueryData(recentSearchesQueryOptions),
    ]);
    return { initialSearch, initialRecent };
  },
  component: HomeSearchPage,
});

function HomeSearchPage() {
  const { initialSearch, initialRecent } = Route.useLoaderData();
  const queryClient = useQueryClient();
  const { user, openLoginModal } = usePromaxSession();
  const runSearch = useServerFn(searchBusinessesFn);
  const fetchRecent = useServerFn(getRecentSearchesFn);

  const [inputKeyword, setInputKeyword] = useState("");
  const [inputProvince, setInputProvince] = useState(DEFAULT_PROVINCE);
  const [inputDistrict, setInputDistrict] = useState(DEFAULT_DISTRICT);

  const [applied, setApplied] = useState({
    keyword: "",
    province: DEFAULT_PROVINCE,
    district: DEFAULT_DISTRICT,
    page: 1,
    sort: "recommended" as SortMode,
    fetchLive: false,
    nonce: 0,
  });

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [saveDialogTarget, setSaveDialogTarget] = useState<{ ids: string[]; label?: string } | null>(null);

  const isInitialQuery =
    applied.keyword === "" &&
    applied.province === DEFAULT_PROVINCE &&
    applied.district === DEFAULT_DISTRICT &&
    applied.page === 1 &&
    applied.sort === "recommended" &&
    applied.nonce === 0;

  const searchQuery = useQuery({
    queryKey: [
      "promax-search",
      applied.keyword,
      applied.province,
      applied.district,
      applied.page,
      applied.sort,
      applied.nonce,
    ],
    queryFn: async () => {
      const result = await runSearch({
        data: {
          keyword: applied.keyword,
          province: applied.province,
          district: applied.district,
          page: applied.page,
          pageSize: PAGE_SIZE,
          sort: applied.sort,
          fetchLive: applied.fetchLive,
        },
      });
      if (applied.fetchLive) {
        void queryClient.invalidateQueries({ queryKey: ["promax-recent-searches"] });
      }
      return result;
    },
    ...(isInitialQuery ? { initialData: initialSearch } : {}),
    staleTime: 30_000,
    placeholderData: (prev) => prev,
  });

  const recentQuery = useQuery({
    queryKey: ["promax-recent-searches"],
    queryFn: () => fetchRecent(),
    initialData: initialRecent,
    staleTime: 30_000,
  });

  const data = searchQuery.data;
  const businesses = data?.businesses ?? [];
  const total = data?.total ?? 0;
  const page = data?.page ?? applied.page;
  const totalPages = data?.totalPages ?? 1;
  const recentSearches = recentQuery.data?.searches ?? [];

  useEffect(() => {
    setSelectedIds([]);
  }, [applied.keyword, applied.province, applied.district, applied.page, applied.nonce]);

  const allVisibleSelected =
    businesses.length > 0 && businesses.every((b) => selectedIds.includes(b.id));

  function triggerSearch(nextKeyword: string, nextProvince: string, nextDistrict: string) {
    setInputKeyword(nextKeyword);
    setInputProvince(nextProvince);
    setInputDistrict(nextDistrict);
    setApplied((prev) => ({
      ...prev,
      keyword: nextKeyword.trim(),
      province: nextProvince,
      district: nextDistrict,
      page: 1,
      fetchLive: true,
      nonce: prev.nonce + 1,
    }));
  }

  function toggleSelectAll() {
    if (allVisibleSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(businesses.map((b) => b.id));
    }
  }

  function toggleSelectOne(id: string) {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  function handleSingleSave(business: BusinessDTO) {
    if (!user) {
      toast.info("İşletmeleri gruba kaydetmek için önce 05xx OTP ile giriş yapmalısınız.");
      openLoginModal();
      return;
    }
    setSaveDialogTarget({ ids: [business.id], label: business.title });
  }

  function handleBulkSave() {
    if (!user) {
      toast.info("Toplu kaydetme için önce 05xx OTP ile giriş yapın.");
      openLoginModal();
      return;
    }
    if (selectedIds.length === 0) {
      toast.info("Kaydetmek için en az bir işletme seçin.");
      return;
    }
    setSaveDialogTarget({ ids: selectedIds });
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-7 sm:px-7 sm:py-9">
      <section className="space-y-1.5">
        <h1 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-[28px]">
          Promax İşletme Arama Motoru
        </h1>
        <p className="text-sm text-muted-foreground">
          Türkiye genelinde 81 il ve 973 ilçede 05xx cep telefonu doğrulamalı işletmeleri bulun ve gruplarınıza kaydedin.
        </p>
      </section>

      <section className="mt-5">
        <SearchPanel
          keyword={inputKeyword}
          province={inputProvince}
          district={inputDistrict}
          isSearching={searchQuery.isFetching}
          onKeywordChange={setInputKeyword}
          onProvinceChange={(nextProvince, nextDistrict) => {
            setInputProvince(nextProvince);
            setInputDistrict(nextDistrict);
          }}
          onDistrictChange={setInputDistrict}
          onSubmit={() => triggerSearch(inputKeyword, inputProvince, inputDistrict)}
        />

        {recentSearches.length > 0 && (
          <div className="mt-3.5 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground mr-1">
              <Clock className="h-3.5 w-3.5" />
              Son Aramalar
            </span>
            {recentSearches.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() =>
                  triggerSearch(
                    item.keyword === "Tüm İşletmeler" ? "" : item.keyword,
                    item.province,
                    item.district,
                  )
                }
                className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-foreground transition-colors hover:border-primary/50 hover:bg-secondary"
              >
                <span>{item.keyword}</span>
                <span className="text-muted-foreground">· {item.district}</span>
              </button>
            ))}
          </div>
        )}
      </section>

      {data && !data.hasSerperKey && (
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-primary/20 bg-secondary/70 px-4 py-3 text-xs text-secondary-foreground">
          <div className="flex items-start gap-2.5">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <p>
              Kayıtlı veritabanı işletmeleri listeleniyor. Canlı Google Maps (Serper.dev) aramaları için yönetici girişi yaparak API anahtarınızı veritabanına kaydedin.
            </p>
          </div>
          {user?.isAdmin ? (
            <Button asChild size="sm" variant="outline" className="h-8 rounded-full text-xs">
              <Link to="/ayarlar">API Ayarlarını Aç</Link>
            </Button>
          ) : (
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => openLoginModal("0532 418 27 90")}
              className="h-8 rounded-full text-xs"
            >
              Yönetici Girişi
            </Button>
          )}
        </div>
      )}

      {data?.liveError && (
        <div className="mt-4 flex items-center gap-2.5 rounded-2xl border border-destructive/25 bg-destructive/10 px-4 py-3 text-xs text-destructive">
          <ShieldAlert className="h-4 w-4 shrink-0" />
          <span>{data.liveError}</span>
        </div>
      )}

      <section className="mt-7">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="font-display text-lg font-semibold text-foreground sm:text-xl">
              {applied.district} için {total} işletme bulundu
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Yalnızca 05 ile başlayan cep telefonu numarasına sahip, SMS ile doğrulanabilir işletmeler listelenir.
              {data && data.filteredOutCount > 0
                ? ` (Son aramada ${data.filteredOutCount} sabit hat/numarasız kayıt elendi.)`
                : ""}
            </p>
          </div>

          <Select
            value={applied.sort}
            onValueChange={(value) =>
              setApplied((prev) => ({ ...prev, sort: value as SortMode, page: 1, fetchLive: false }))
            }
          >
            <SelectTrigger aria-label="Sıralama" className="h-9 w-full rounded-full bg-card text-xs sm:w-[190px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="recommended">Önerilen Sıralama</SelectItem>
              <SelectItem value="rating">En Yüksek Puan</SelectItem>
              <SelectItem value="reviews">En Çok Yorum</SelectItem>
              <SelectItem value="name">İsme Göre (A-Z)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-surface-subtle px-4 py-2.5">
          <div className="flex items-center gap-4 text-xs sm:text-sm">
            <label className="flex cursor-pointer items-center gap-2.5 font-medium text-foreground select-none">
              <Checkbox
                checked={allVisibleSelected}
                onCheckedChange={toggleSelectAll}
                aria-label="Tümünü Seç"
                className="rounded-[4px]"
              />
              <span>Tümünü Seç</span>
            </label>
            <span className="text-muted-foreground">{selectedIds.length} seçili</span>
          </div>

          {user ? (
            <Button
              type="button"
              size="sm"
              disabled={selectedIds.length === 0}
              onClick={handleBulkSave}
              className="h-9 rounded-full px-4 text-xs font-semibold"
            >
              <Layers className="mr-1.5 h-3.5 w-3.5" />
              Seçilenleri Gruba Kaydet
            </Button>
          ) : (
            <Button
              type="button"
              size="sm"
              variant="secondary"
              disabled
              aria-disabled="true"
              title="Toplu kaydetmek için 05xx OTP ile giriş yapın"
              className="h-9 cursor-not-allowed rounded-full px-4 text-xs font-medium opacity-70"
            >
              Seçilenleri Gruba Kaydet (Giriş Yapın)
            </Button>
          )}
        </div>

        <div className="mt-4 flex flex-col gap-3.5">
          {businesses.length > 0 ? (
            businesses.map((business) => (
              <BusinessRowCard
                key={business.id}
                business={business}
                selected={selectedIds.includes(business.id)}
                onToggleSelect={toggleSelectOne}
                onSaveClick={handleSingleSave}
              />
            ))
          ) : (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card px-6 py-14 text-center">
              <SearchX className="h-9 w-9 text-muted-foreground/60" />
              <h3 className="mt-3 font-display text-base font-semibold text-foreground">
                {applied.district} bölgesinde eşleşen 05xx işletme bulunamadı
              </h3>
              <p className="mt-1 max-w-md text-xs text-muted-foreground">
                Farklı bir kategori deneyebilir veya API Ayarları üzerinden Serper.dev anahtarınızı ekleyerek Google Maps üzerinden canlı tarama başlatabilirsiniz.
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => triggerSearch("", DEFAULT_PROVINCE, DEFAULT_DISTRICT)}
                className="mt-4 rounded-full"
              >
                Kadıköy İşletmelerini Göster
              </Button>
            </div>
          )}
        </div>

        {total > 0 && (
          <nav
            aria-label="Sayfalama"
            className="mt-7 flex items-center justify-center gap-3 text-sm"
          >
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={page <= 1 || searchQuery.isFetching}
              onClick={() =>
                setApplied((prev) => ({ ...prev, page: Math.max(1, prev.page - 1), fetchLive: false }))
              }
              className="h-9 rounded-full px-4 text-xs font-medium"
            >
              <ChevronLeft className="mr-1 h-3.5 w-3.5" />
              Önceki
            </Button>
            <span className="px-3 text-xs font-semibold text-foreground">
              {page} / {totalPages}
            </span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={page >= totalPages || searchQuery.isFetching}
              onClick={() =>
                setApplied((prev) => ({
                  ...prev,
                  page: Math.min(totalPages, prev.page + 1),
                  fetchLive: false,
                }))
              }
              className="h-9 rounded-full px-4 text-xs font-medium"
            >
              Sonraki
              <ChevronRight className="ml-1 h-3.5 w-3.5" />
            </Button>
          </nav>
        )}
      </section>

      <SaveToGroupDialog
        open={saveDialogTarget !== null}
        onOpenChange={(open) => {
          if (!open) setSaveDialogTarget(null);
        }}
        businessIds={saveDialogTarget?.ids ?? []}
        businessLabel={saveDialogTarget?.label}
        onSaved={() => setSelectedIds([])}
      />
    </div>
  );
}
