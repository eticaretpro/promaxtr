import { useEffect, useState, type FormEvent } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { CheckCircle2, KeyRound, Loader2, Save, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { usePromaxSession } from "@/components/promax-session-context";
import { getApiSettingsFn, updateApiSettingsFn } from "@/lib/promax-auth.functions";

export const Route = createFileRoute("/ayarlar")({
  head: () => ({
    meta: [
      { title: "API Ayarları — Promax" },
      {
        name: "description",
        content: "Serper.dev Google Maps ve OTP.com SMS API bilgilerini Promax veritabanında güvenli şekilde yönetin.",
      },
      { property: "og:title", content: "API Ayarları — Promax" },
      {
        property: "og:description",
        content: "Serper.dev Google Maps ve OTP.com SMS API bilgilerini Promax veritabanında güvenli şekilde yönetin.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ApiSettingsPage,
});

function ApiSettingsPage() {
  const queryClient = useQueryClient();
  const { user, isLoading: sessionLoading, openLoginModal } = usePromaxSession();
  const fetchSettings = useServerFn(getApiSettingsFn);
  const saveSettings = useServerFn(updateApiSettingsFn);

  const [serperApiKey, setSerperApiKey] = useState("");
  const [otpApiKey, setOtpApiKey] = useState("");
  const [otpApiUrl, setOtpApiUrl] = useState("https://api.otp.com/api/v1");
  const [otpLocale, setOtpLocale] = useState("tr");
  const [saving, setSaving] = useState(false);

  const settingsQuery = useQuery({
    queryKey: ["promax-api-settings"],
    queryFn: () => fetchSettings(),
    enabled: Boolean(user?.isAdmin),
  });

  const settings = settingsQuery.data?.settings ?? null;

  useEffect(() => {
    if (settings) {
      setOtpApiUrl(settings.otpApiUrl || "https://api.otp.com/api/v1");
      setOtpLocale(settings.otpLocale || "tr");
    }
  }, [settings]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await saveSettings({
        data: {
          serperApiKey: serperApiKey.trim() || undefined,
          otpApiKey: otpApiKey.trim() || undefined,
          otpApiUrl: otpApiUrl.trim(),
          otpLocale: otpLocale.trim(),
        },
      });
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      setSerperApiKey("");
      setOtpApiKey("");
      await queryClient.invalidateQueries({ queryKey: ["promax-api-settings"] });
      await queryClient.invalidateQueries({ queryKey: ["promax-search"] });
      toast.success("API bilgileri veritabanına kaydedildi.");
    } finally {
      setSaving(false);
    }
  }

  async function handleClearKey(kind: "serper" | "otp") {
    setSaving(true);
    try {
      const res = await saveSettings({
        data: {
          clearSerperKey: kind === "serper",
          clearOtpKey: kind === "otp",
          otpApiUrl: otpApiUrl.trim() || "https://api.otp.com/api/v1",
          otpLocale: otpLocale.trim() || "tr",
        },
      });
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      await queryClient.invalidateQueries({ queryKey: ["promax-api-settings"] });
      toast.success("API anahtarı temizlendi.");
    } finally {
      setSaving(false);
    }
  }

  if (sessionLoading) {
    return (
      <div className="mx-auto flex max-w-3xl items-center justify-center px-4 py-20 text-sm text-muted-foreground">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        Yükleniyor...
      </div>
    );
  }

  if (!user || !user.isAdmin) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16">
        <div className="rounded-2xl border border-border bg-card p-8 text-center shadow-sm">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-secondary text-primary">
            <ShieldAlert className="h-6 w-6" />
          </div>
          <h1 className="mt-4 font-display text-2xl font-bold text-foreground">Yönetici API Ayarları</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Serper.dev ve OTP.com API bilgilerini veritabanında düzenlemek için yönetici olarak yetkilendirilmiş bir 05xx numarasıyla giriş yapın.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Button
              type="button"
              onClick={() => openLoginModal("0532 418 27 90")}
              className="rounded-full px-6"
            >
              Yönetici Girişi (05xx OTP)
            </Button>
            <Button asChild variant="outline" className="rounded-full px-5">
              <Link to="/">Anasayfaya Dön</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-7">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="max-w-xl">
          <h1 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-[28px]">
            API Ayarları
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Serper.dev Maps ve OTP.com SMS doğrulama anahtarları güvenli şekilde veritabanında saklanır ve yalnızca sunucu tarafında kullanılır.
          </p>
        </div>
        <Button asChild variant="outline" size="sm" className="rounded-full">
          <Link to="/">Aramaya Dön</Link>
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="mt-6 space-y-5">
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <KeyRound className="h-4 w-4 text-primary" />
              <h2 className="font-display text-base font-semibold text-foreground">
                Serper.dev Google Maps API
              </h2>
            </div>
            {settings?.hasSerperKey ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-verified-surface px-2.5 py-0.5 text-xs font-medium text-verified">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Kayıtlı ({settings.serperKeyMask})
              </span>
            ) : (
              <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs text-muted-foreground">
                Tanımlı Değil
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            Uç nokta: <span className="font-mono">https://google.serper.dev/maps</span> — Yalnızca 05xx cep telefonlu işletmeler kaydedilir.
          </p>
          <div className="flex gap-2">
            <Input
              type="password"
              value={serperApiKey}
              onChange={(e) => setSerperApiKey(e.target.value)}
              placeholder={settings?.hasSerperKey ? "Değiştirmek için yeni Serper API anahtarını girin" : "Serper.dev X-API-KEY"}
              className="rounded-xl h-10"
              autoComplete="off"
            />
            {settings?.hasSerperKey && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={saving}
                onClick={() => void handleClearKey("serper")}
                className="h-10 rounded-xl shrink-0 text-destructive"
              >
                Sil
              </Button>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <KeyRound className="h-4 w-4 text-primary" />
              <h2 className="font-display text-base font-semibold text-foreground">
                OTP.com +90 SMS Doğrulama API
              </h2>
            </div>
            {settings?.hasOtpKey ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-verified-surface px-2.5 py-0.5 text-xs font-medium text-verified">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Kayıtlı ({settings.otpKeyMask})
              </span>
            ) : (
              <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs text-muted-foreground">
                Test Modu (Sandbox)
              </span>
            )}
          </div>

          <div className="space-y-1.5">
            <label htmlFor="otp-api-key" className="text-xs font-medium text-foreground">
              OTP.com API Anahtarı (Bearer Token)
            </label>
            <div className="flex gap-2">
              <Input
                id="otp-api-key"
                type="password"
                value={otpApiKey}
                onChange={(e) => setOtpApiKey(e.target.value)}
                placeholder={settings?.hasOtpKey ? "Değiştirmek için yeni OTP.com anahtarını girin" : "otp_live_... veya otp_test_..."}
                className="rounded-xl h-10"
                autoComplete="off"
              />
              {settings?.hasOtpKey && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={saving}
                  onClick={() => void handleClearKey("otp")}
                  className="h-10 rounded-xl shrink-0 text-destructive"
                >
                  Sil
                </Button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="space-y-1.5 sm:col-span-2">
              <label htmlFor="otp-api-url" className="text-xs font-medium text-foreground">
                OTP.com API Temel Adresi
              </label>
              <Input
                id="otp-api-url"
                type="url"
                value={otpApiUrl}
                onChange={(e) => setOtpApiUrl(e.target.value)}
                className="rounded-xl h-10"
                required
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="otp-locale" className="text-xs font-medium text-foreground">
                SMS Dil Kodu
              </label>
              <Input
                id="otp-locale"
                value={otpLocale}
                onChange={(e) => setOtpLocale(e.target.value)}
                className="rounded-xl h-10"
                required
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <Button type="submit" disabled={saving} className="h-11 rounded-full px-6 font-semibold">
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Ayarları Veritabanına Kaydet
          </Button>
        </div>
      </form>
    </div>
  );
}