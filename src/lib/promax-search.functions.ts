import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { isValidTurkeyLocation } from "./turkey-locations";
import type { BusinessDTO, SearchHistoryDTO, SearchResultDTO } from "./promax-types";

const searchInputSchema = z.object({
  keyword: z.string().trim().max(120).optional().default(""),
  province: z.string().trim().min(1),
  district: z.string().trim().min(1),
  page: z.number().int().min(1).max(50).optional().default(1),
  pageSize: z.number().int().min(1).max(30).optional().default(6),
  sort: z.enum(["recommended", "rating", "reviews", "name"]).optional().default("recommended"),
  fetchLive: z.boolean().optional().default(false),
});

export const searchBusinessesFn = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => searchInputSchema.parse(input))
  .handler(async ({ data }): Promise<SearchResultDTO> => {
    if (!isValidTurkeyLocation(data.province, data.district)) {
      throw new Error("Yalnızca geçerli Türkiye il ve ilçeleri seçilebilir.");
    }

    const [{ supabaseAdmin }, server] = await Promise.all([
      import("@/integrations/supabase/client.server"),
      import("./promax.server"),
    ]);

    const settings = await server.getSystemSettingsMap();
    const serperKey = (settings["serper_api_key"] ?? "").trim();
    const otpKey = (settings["otp_api_key"] ?? "").trim();
    const session = await server.getCurrentBusinessSession();
    const visitorKey = server.getOrCreateVisitorKey(session);

    let sourceMode: "serper" | "database" = "database";
    let filteredOutCount = 0;
    let liveError: string | null = null;

    if (data.fetchLive && serperKey) {
      const queryText = [data.keyword, data.district, data.province, "Türkiye"]
        .filter(Boolean)
        .join(" ");
      try {
        const res = await fetch("https://google.serper.dev/maps", {
          method: "POST",
          headers: {
            "X-API-KEY": serperKey,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            q: queryText,
            gl: "tr",
            hl: "tr",
            page: data.page,
          }),
        });

        if (!res.ok) {
          const bodyText = await res.text().catch(() => "");
          console.error(`[Promax Serper error ${res.status}]:`, bodyText);
          liveError = `Serper.dev araması hata döndürdü (${res.status}). Veritabanındaki kayıtlı sonuçlar gösteriliyor.`;
        } else {
          const payload = (await res.json()) as { places?: Array<Record<string, unknown>> };
          const places = Array.isArray(payload.places) ? payload.places : [];
          const upsertResult = await server.upsertSerperPlaces(
            places as never,
            data.province,
            data.district,
            data.keyword || "İşletme",
          );
          filteredOutCount = upsertResult.filteredOutCount;
          sourceMode = "serper";
        }
      } catch (err) {
        console.error("[Promax Serper network error]:", err);
        liveError = "Serper.dev servisine ulaşılamadı. Kayıtlı veritabanı sonuçları gösteriliyor.";
      }
    }

    let query = supabaseAdmin
      .from("businesses")
      .select("*", { count: "exact" })
      .eq("province", data.province)
      .eq("district", data.district)
      .like("mobile_phone_e164", "+905%");

    const cleanKeyword = data.keyword.replace(/[%_,]/g, " ").trim();
    if (cleanKeyword) {
      query = query.or(
        `title.ilike.%${cleanKeyword}%,category.ilike.%${cleanKeyword}%,address.ilike.%${cleanKeyword}%`,
      );
    }

    if (data.sort === "rating") {
      query = query.order("rating", { ascending: false, nullsFirst: false });
    } else if (data.sort === "reviews") {
      query = query.order("review_count", { ascending: false });
    } else if (data.sort === "name") {
      query = query.order("title", { ascending: true });
    } else {
      query = query
        .order("is_verified", { ascending: false })
        .order("created_at", { ascending: true });
    }

    const from = (data.page - 1) * data.pageSize;
    const to = from + data.pageSize - 1;
    const { data: rows, count, error } = await query.range(from, to);

    if (error) {
      console.error("[Promax search query error]:", error.message);
      throw new Error("İşletmeler listelenirken bir hata oluştu.");
    }

    const total = count ?? 0;
    const businesses = (rows ?? []).map(server.mapBusinessRow);

    if (data.fetchLive) {
      await supabaseAdmin.from("search_history").insert({
        visitor_key: visitorKey,
        keyword: data.keyword || "Tüm İşletmeler",
        province: data.province,
        district: data.district,
        result_count: total,
      });
    }

    return {
      businesses,
      total,
      page: data.page,
      pageSize: data.pageSize,
      totalPages: Math.max(1, Math.ceil(total / data.pageSize)),
      sourceMode,
      hasSerperKey: Boolean(serperKey),
      hasOtpKey: Boolean(otpKey),
      filteredOutCount,
      liveError,
    };
  });

export const getRecentSearchesFn = createServerFn({ method: "GET" }).handler(
  async (): Promise<{ searches: SearchHistoryDTO[] }> => {
    const [{ supabaseAdmin }, server] = await Promise.all([
      import("@/integrations/supabase/client.server"),
      import("./promax.server"),
    ]);

    const session = await server.getCurrentBusinessSession();
    const visitorKey = server.getOrCreateVisitorKey(session);

    const { data: ownRows } = await supabaseAdmin
      .from("search_history")
      .select("id, keyword, province, district, result_count, created_at")
      .eq("visitor_key", visitorKey)
      .order("created_at", { ascending: false })
      .limit(12);

    const sourceRows =
      ownRows && ownRows.length > 0
        ? ownRows
        : (
            await supabaseAdmin
              .from("search_history")
              .select("id, keyword, province, district, result_count, created_at")
              .eq("visitor_key", "default")
              .order("created_at", { ascending: false })
              .limit(6)
          ).data ?? [];

    // Deduplicate identical keyword+province+district combinations preserving most recent
    const seen = new Set<string>();
    const searches: SearchHistoryDTO[] = [];
    for (const row of sourceRows) {
      const key = `${row.keyword}|${row.province}|${row.district}`.toLocaleLowerCase("tr-TR");
      if (seen.has(key)) continue;
      seen.add(key);
      searches.push({
        id: row.id,
        keyword: row.keyword,
        province: row.province,
        district: row.district,
        resultCount: row.result_count,
        createdAt: row.created_at,
      });
      if (searches.length >= 6) break;
    }

    return { searches };
  },
);

const slugInputSchema = z.object({
  slug: z.string().trim().min(1).max(120),
});

export const getBusinessBySlugFn = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) => slugInputSchema.parse(input))
  .handler(async ({ data }): Promise<{ business: BusinessDTO | null; related: BusinessDTO[] }> => {
    const [{ supabaseAdmin }, server] = await Promise.all([
      import("@/integrations/supabase/client.server"),
      import("./promax.server"),
    ]);

    const { data: row } = await supabaseAdmin
      .from("businesses")
      .select("*")
      .eq("slug", data.slug)
      .maybeSingle();

    if (!row) {
      return { business: null, related: [] };
    }

    const { data: relatedRows } = await supabaseAdmin
      .from("businesses")
      .select("*")
      .eq("district", row.district)
      .neq("id", row.id)
      .limit(3);

    return {
      business: server.mapBusinessRow(row),
      related: (relatedRows ?? []).map(server.mapBusinessRow),
    };
  });