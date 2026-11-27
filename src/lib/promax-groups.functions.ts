import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { BusinessGroupDTO } from "./promax-types";

export const listGroupsFn = createServerFn({ method: "GET" }).handler(
  async (): Promise<{ authenticated: boolean; groups: BusinessGroupDTO[] }> => {
    const [{ supabaseAdmin }, server] = await Promise.all([
      import("@/integrations/supabase/client.server"),
      import("./promax.server"),
    ]);

    const session = await server.getCurrentBusinessSession();
    if (!session) {
      return { authenticated: false, groups: [] };
    }

    const { data: groups } = await supabaseAdmin
      .from("business_groups")
      .select("id, name, description, color, created_at")
      .eq("owner_phone_e164", session.phoneE164)
      .order("created_at", { ascending: false });

    if (!groups || groups.length === 0) {
      return { authenticated: true, groups: [] };
    }

    const groupIds = groups.map((g) => g.id);
    const { data: savedRows } = await supabaseAdmin
      .from("saved_businesses")
      .select("id, group_id, note, created_at, businesses(*)")
      .in("group_id", groupIds)
      .eq("owner_phone_e164", session.phoneE164)
      .order("created_at", { ascending: false });

    const itemsByGroup = new Map<string, BusinessGroupDTO["items"]>();
    for (const row of savedRows ?? []) {
      const biz = row.businesses as Parameters<typeof server.mapBusinessRow>[0] | null;
      if (!biz) continue;
      const list = itemsByGroup.get(row.group_id) ?? [];
      list.push({
        savedId: row.id,
        note: row.note,
        savedAt: row.created_at,
        business: server.mapBusinessRow(biz),
      });
      itemsByGroup.set(row.group_id, list);
    }

    return {
      authenticated: true,
      groups: groups.map((g) => {
        const items = itemsByGroup.get(g.id) ?? [];
        return {
          id: g.id,
          name: g.name,
          description: g.description,
          color: g.color,
          createdAt: g.created_at,
          itemCount: items.length,
          items,
        };
      }),
    };
  },
);

const createGroupSchema = z.object({
  name: z.string().trim().min(2, "Grup adı en az 2 karakter olmalıdır.").max(80),
  description: z.string().trim().max(240).optional().default(""),
  color: z.enum(["blue", "emerald", "amber", "rose", "slate"]).optional().default("blue"),
});

export const createGroupFn = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => createGroupSchema.parse(input))
  .handler(async ({ data }) => {
    const [{ supabaseAdmin }, server] = await Promise.all([
      import("@/integrations/supabase/client.server"),
      import("./promax.server"),
    ]);

    const session = await server.getCurrentBusinessSession();
    if (!session) {
      return { ok: false as const, error: "Grup oluşturmak için 05xx OTP ile giriş yapmalısınız." };
    }

    const { data: created, error } = await supabaseAdmin
      .from("business_groups")
      .insert({
        owner_phone_e164: session.phoneE164,
        name: data.name,
        description: data.description,
        color: data.color,
      })
      .select("id, name, description, color, created_at")
      .single();

    if (error || !created) {
      if (error?.code === "23505") {
        return { ok: false as const, error: "Bu isimde bir işletme grubunuz zaten mevcut." };
      }
      return { ok: false as const, error: "İşletme grubu oluşturulamadı." };
    }

    return { ok: true as const, group: created };
  });

const deleteGroupSchema = z.object({
  groupId: z.string().uuid(),
});

export const deleteGroupFn = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => deleteGroupSchema.parse(input))
  .handler(async ({ data }) => {
    const [{ supabaseAdmin }, server] = await Promise.all([
      import("@/integrations/supabase/client.server"),
      import("./promax.server"),
    ]);

    const session = await server.getCurrentBusinessSession();
    if (!session) {
      return { ok: false as const, error: "Oturum gerekli." };
    }

    const { error } = await supabaseAdmin
      .from("business_groups")
      .delete()
      .eq("id", data.groupId)
      .eq("owner_phone_e164", session.phoneE164);

    if (error) {
      return { ok: false as const, error: "Grup silinemedi." };
    }
    return { ok: true as const };
  });

const saveBusinessesSchema = z.object({
  groupId: z.string().uuid(),
  businessIds: z.array(z.string().uuid()).min(1).max(100),
  note: z.string().trim().max(240).optional().default(""),
});

export const saveBusinessesToGroupFn = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => saveBusinessesSchema.parse(input))
  .handler(async ({ data }) => {
    const [{ supabaseAdmin }, server] = await Promise.all([
      import("@/integrations/supabase/client.server"),
      import("./promax.server"),
    ]);

    const session = await server.getCurrentBusinessSession();
    if (!session) {
      return {
        ok: false as const,
        error: "İşletmeleri gruba kaydetmek için 05xx OTP ile giriş yapmalısınız.",
      };
    }

    const { data: group } = await supabaseAdmin
      .from("business_groups")
      .select("id, name")
      .eq("id", data.groupId)
      .eq("owner_phone_e164", session.phoneE164)
      .maybeSingle();

    if (!group) {
      return { ok: false as const, error: "Hedef grup bulunamadı." };
    }

    const rows = data.businessIds.map((businessId) => ({
      group_id: group.id,
      business_id: businessId,
      owner_phone_e164: session.phoneE164,
      note: data.note,
    }));

    const { error } = await supabaseAdmin
      .from("saved_businesses")
      .upsert(rows, { onConflict: "group_id,business_id" });

    if (error) {
      return { ok: false as const, error: "İşletmeler gruba kaydedilemedi." };
    }

    return { ok: true as const, savedCount: rows.length, groupName: group.name };
  });

const removeSavedSchema = z.object({
  savedId: z.string().uuid(),
});

export const removeBusinessFromGroupFn = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => removeSavedSchema.parse(input))
  .handler(async ({ data }) => {
    const [{ supabaseAdmin }, server] = await Promise.all([
      import("@/integrations/supabase/client.server"),
      import("./promax.server"),
    ]);

    const session = await server.getCurrentBusinessSession();
    if (!session) {
      return { ok: false as const, error: "Oturum gerekli." };
    }

    const { error } = await supabaseAdmin
      .from("saved_businesses")
      .delete()
      .eq("id", data.savedId)
      .eq("owner_phone_e164", session.phoneE164);

    if (error) {
      return { ok: false as const, error: "İşletme gruptan çıkarılamadı." };
    }
    return { ok: true as const };
  });