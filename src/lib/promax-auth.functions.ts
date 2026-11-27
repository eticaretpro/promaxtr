import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { maskTurkishPhone, parseTurkishMobile } from "./turkish-phone";
import type { ApiSettingsStatusDTO, SessionUserDTO } from "./promax-types";

export const getSessionFn = createServerFn({ method: "GET" }).handler(
  async (): Promise<{ user: SessionUserDTO | null }> => {
    const { getCurrentBusinessSession } = await import("./promax.server");
    const user = await getCurrentBusinessSession();
    return { user };
  },
);

const requestOtpSchema = z.object({
  phone: z.string().trim().min(10, "Geçerli bir 05xx numarası girin.").max(25),
});

export const requestOtpFn = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => requestOtpSchema.parse(input))
  .handler(async ({ data }) => {
    const parsed = parseTurkishMobile(data.phone);
    if (!parsed) {
      return {
        ok: false as const,
        error: "Yalnızca 05 ile başlayan geçerli Türk cep telefonu numaraları ile giriş yapılabilir.",
      };
    }

    const [{ supabaseAdmin }, server, { getRequestIP }] = await Promise.all([
      import("@/integrations/supabase/client.server"),
      import("./promax.server"),
      import("@tanstack/react-start/server"),
    ]);

    const { data: business } = await supabaseAdmin
      .from("businesses")
      .select("id, title, slug, mobile_phone, mobile_phone_e164")
      .eq("mobile_phone_e164", parsed.e164)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (!business) {
      return {
        ok: false as const,
        error:
          "Bu 05xx numarasıyla sistemde kayıtlı bir işletme bulunamadı. Önce işletmenizi arama motorunda aratarak sisteme dahil edilmesini sağlayın.",
      };
    }

    const settings = await server.getSystemSettingsMap();
    const otpApiKey = (settings["otp_api_key"] ?? "").trim();
    const otpApiUrl = (settings["otp_api_url"] ?? "https://api.otp.com/api/v1").trim().replace(/\/+$/, "");
    const otpLocale = (settings["otp_locale"] ?? "tr").trim() || "tr";
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();

    if (otpApiKey) {
      const clientIp = getRequestIP({ xForwardedFor: true });
      const payload: Record<string, string> = {
        recipient: parsed.e164,
        locale: otpLocale,
      };
      if (clientIp && !clientIp.startsWith("127.") && clientIp !== "::1") {
        payload["client_ip"] = clientIp;
      }

      const res = await fetch(`${otpApiUrl}/otp/send`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${otpApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errText = await res.text().catch(() => "");
        console.error(`[Promax OTP.com send error ${res.status}]:`, errText);
        return {
          ok: false as const,
          error: `OTP.com SMS gönderimi başarısız oldu (${res.status}). API ayarlarınızı kontrol edin.`,
        };
      }

      const otpData = (await res.json()) as { otp_id?: string; masked_recipient?: string };
      if (!otpData.otp_id) {
        return {
          ok: false as const,
          error: "OTP.com yanıtı eksik geldi (otp_id bulunamadı).",
        };
      }

      const { data: inserted, error: insertError } = await supabaseAdmin
        .from("otp_verifications")
        .insert({
          phone_e164: parsed.e164,
          provider: "otp.com",
          external_otp_id: otpData.otp_id,
          expires_at: expiresAt,
        })
        .select("id")
        .single();

      if (insertError || !inserted) {
        return { ok: false as const, error: "Doğrulama kaydı oluşturulamadı." };
      }

      return {
        ok: true as const,
        verificationId: inserted.id,
        maskedPhone: otpData.masked_recipient ?? maskTurkishPhone(parsed.e164),
        businessTitle: business.title,
        mode: "otp.com" as const,
        demoCode: null as string | null,
      };
    }

    // Sandbox fallback when OTP.com API key is not yet configured in system_settings
    const demoCode = server.randomSixDigitCode();
    const codeHash = await server.sha256Hex(demoCode);

    const { data: inserted, error: insertError } = await supabaseAdmin
      .from("otp_verifications")
      .insert({
        phone_e164: parsed.e164,
        provider: "sandbox",
        code_hash: codeHash,
        expires_at: expiresAt,
      })
      .select("id")
      .single();

    if (insertError || !inserted) {
      return { ok: false as const, error: "Doğrulama kaydı oluşturulamadı." };
    }

    return {
      ok: true as const,
      verificationId: inserted.id,
      maskedPhone: maskTurkishPhone(parsed.e164),
      businessTitle: business.title,
      mode: "sandbox" as const,
      demoCode,
    };
  });

const verifyOtpSchema = z.object({
  verificationId: z.string().uuid("Geçersiz doğrulama kimliği."),
  code: z.string().trim().regex(/^\d{6}$/, "6 haneli doğrulama kodunu girin."),
});

export const verifyOtpFn = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => verifyOtpSchema.parse(input))
  .handler(async ({ data }) => {
    const [{ supabaseAdmin }, server, { setCookie }] = await Promise.all([
      import("@/integrations/supabase/client.server"),
      import("./promax.server"),
      import("@tanstack/react-start/server"),
    ]);

    const { data: otpRow } = await supabaseAdmin
      .from("otp_verifications")
      .select("*")
      .eq("id", data.verificationId)
      .maybeSingle();

    if (!otpRow || otpRow.verified_at) {
      return { ok: false as const, error: "Doğrulama oturumu bulunamadı veya zaten kullanıldı." };
    }
    if (new Date(otpRow.expires_at).getTime() < Date.now()) {
      return { ok: false as const, error: "Doğrulama kodunun süresi doldu. Yeni kod isteyin." };
    }
    if (otpRow.attempts >= 5) {
      return { ok: false as const, error: "Çok fazla hatalı deneme yapıldı. Yeni kod isteyin." };
    }

    await supabaseAdmin
      .from("otp_verifications")
      .update({ attempts: otpRow.attempts + 1 })
      .eq("id", otpRow.id);

    let matched = false;
    if (otpRow.provider === "otp.com" && otpRow.external_otp_id) {
      const settings = await server.getSystemSettingsMap();
      const otpApiKey = (settings["otp_api_key"] ?? "").trim();
      const otpApiUrl = (settings["otp_api_url"] ?? "https://api.otp.com/api/v1").trim().replace(/\/+$/, "");

      const res = await fetch(`${otpApiUrl}/otp/verify`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${otpApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ otp_id: otpRow.external_otp_id, code: data.code }),
      });

      if (res.ok) {
        const body = (await res.json()) as { matched?: boolean; status?: string };
        matched = body.matched === true || body.status === "approved";
      }
    } else if (otpRow.code_hash) {
      const candidateHash = await server.sha256Hex(data.code);
      matched = server.timingSafeEqualStr(candidateHash, otpRow.code_hash);
    }

    if (!matched) {
      return { ok: false as const, error: "Doğrulama kodu hatalı. Lütfen tekrar kontrol edin." };
    }

    const nowIso = new Date().toISOString();
    await supabaseAdmin
      .from("otp_verifications")
      .update({ verified_at: nowIso })
      .eq("id", otpRow.id);

    const { data: business } = await supabaseAdmin
      .from("businesses")
      .select("id, title, slug, mobile_phone, mobile_phone_e164, claimed_at")
      .eq("mobile_phone_e164", otpRow.phone_e164)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (!business) {
      return { ok: false as const, error: "İşletme kaydı bulunamadı." };
    }

    await supabaseAdmin
      .from("businesses")
      .update({
        is_verified: true,
        claimed_at: business.claimed_at ?? nowIso,
        updated_at: nowIso,
      })
      .eq("mobile_phone_e164", otpRow.phone_e164);

    const rawToken = server.randomTokenHex(32);
    const tokenHash = await server.sha256Hex(rawToken);
    const sessionExpiry = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

    await supabaseAdmin.from("business_sessions").insert({
      token_hash: tokenHash,
      business_id: business.id,
      phone_e164: business.mobile_phone_e164,
      expires_at: sessionExpiry,
    });

    setCookie(server.SESSION_COOKIE_NAME, rawToken, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });

    const isAdmin = await server.isAdminPhone(business.mobile_phone_e164);
    const user: SessionUserDTO = {
      businessId: business.id,
      businessTitle: business.title,
      businessSlug: business.slug,
      phoneDisplay: business.mobile_phone,
      phoneE164: business.mobile_phone_e164,
      isAdmin,
    };

    return { ok: true as const, user };
  });

export const logoutFn = createServerFn({ method: "POST" }).handler(async () => {
  const [{ supabaseAdmin }, server, { deleteCookie, getCookie }] = await Promise.all([
    import("@/integrations/supabase/client.server"),
    import("./promax.server"),
    import("@tanstack/react-start/server"),
  ]);

  const rawToken = getCookie(server.SESSION_COOKIE_NAME);
  if (rawToken) {
    const tokenHash = await server.sha256Hex(rawToken);
    await supabaseAdmin.from("business_sessions").delete().eq("token_hash", tokenHash);
  }
  deleteCookie(server.SESSION_COOKIE_NAME, { path: "/" });
  return { ok: true };
});

export const getApiSettingsFn = createServerFn({ method: "GET" }).handler(
  async (): Promise<{ authorized: boolean; settings: ApiSettingsStatusDTO | null }> => {
    const [{ supabaseAdmin }, server] = await Promise.all([
      import("@/integrations/supabase/client.server"),
      import("./promax.server"),
    ]);

    const session = await server.getCurrentBusinessSession();
    if (!session || !session.isAdmin) {
      return { authorized: false, settings: null };
    }

    const { data } = await supabaseAdmin
      .from("system_settings")
      .select("key, value, updated_at");

    const map: Record<string, string> = {};
    let latestUpdated: string | null = null;
    for (const row of data ?? []) {
      map[row.key] = row.value;
      if (!latestUpdated || row.updated_at > latestUpdated) {
        latestUpdated = row.updated_at;
      }
    }

    const serperKey = (map["serper_api_key"] ?? "").trim();
    const otpKey = (map["otp_api_key"] ?? "").trim();

    return {
      authorized: true,
      settings: {
        hasSerperKey: Boolean(serperKey),
        serperKeyMask: server.maskSecret(serperKey),
        hasOtpKey: Boolean(otpKey),
        otpKeyMask: server.maskSecret(otpKey),
        otpApiUrl: (map["otp_api_url"] ?? "https://api.otp.com/api/v1").trim(),
        otpLocale: (map["otp_locale"] ?? "tr").trim(),
        updatedAt: latestUpdated,
      },
    };
  },
);

const updateApiSettingsSchema = z.object({
  serperApiKey: z.string().trim().max(512).optional(),
  clearSerperKey: z.boolean().optional(),
  otpApiKey: z.string().trim().max(512).optional(),
  clearOtpKey: z.boolean().optional(),
  otpApiUrl: z.string().trim().url("Geçerli bir OTP.com API URL adresi girin.").max(256),
  otpLocale: z.string().trim().min(2).max(10),
});

export const updateApiSettingsFn = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => updateApiSettingsSchema.parse(input))
  .handler(async ({ data }) => {
    const [{ supabaseAdmin }, server] = await Promise.all([
      import("@/integrations/supabase/client.server"),
      import("./promax.server"),
    ]);

    const session = await server.getCurrentBusinessSession();
    if (!session || !session.isAdmin) {
      return { ok: false as const, error: "Bu ayarları yalnızca yetkili yöneticiler güncelleyebilir." };
    }

    const nowIso = new Date().toISOString();
    const updates: Array<{ key: string; value: string; is_secret: boolean; updated_by_phone: string; updated_at: string }> = [
      { key: "otp_api_url", value: data.otpApiUrl, is_secret: false, updated_by_phone: session.phoneE164, updated_at: nowIso },
      { key: "otp_locale", value: data.otpLocale, is_secret: false, updated_by_phone: session.phoneE164, updated_at: nowIso },
    ];

    if (data.clearSerperKey) {
      updates.push({ key: "serper_api_key", value: "", is_secret: true, updated_by_phone: session.phoneE164, updated_at: nowIso });
    } else if (data.serperApiKey) {
      updates.push({ key: "serper_api_key", value: data.serperApiKey, is_secret: true, updated_by_phone: session.phoneE164, updated_at: nowIso });
    }

    if (data.clearOtpKey) {
      updates.push({ key: "otp_api_key", value: "", is_secret: true, updated_by_phone: session.phoneE164, updated_at: nowIso });
    } else if (data.otpApiKey) {
      updates.push({ key: "otp_api_key", value: data.otpApiKey, is_secret: true, updated_by_phone: session.phoneE164, updated_at: nowIso });
    }

    const { error } = await supabaseAdmin
      .from("system_settings")
      .upsert(updates, { onConflict: "key" });

    if (error) {
      return { ok: false as const, error: "Ayarlar veritabanına kaydedilemedi." };
    }
    return { ok: true as const };
  });