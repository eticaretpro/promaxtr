import { useEffect, useState, type FormEvent } from "react";
import { useServerFn } from "@tanstack/react-start";
import { ShieldCheck, Smartphone, ArrowLeft, Loader2, KeyRound } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { requestOtpFn, verifyOtpFn } from "@/lib/promax-auth.functions";
import type { SessionUserDTO } from "@/lib/promax-types";

interface OtpLoginDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialPhone?: string;
  onSuccess: (user: SessionUserDTO) => void | Promise<void>;
}

export function OtpLoginDialog({
  open,
  onOpenChange,
  initialPhone = "",
  onSuccess,
}: OtpLoginDialogProps) {
  const requestOtp = useServerFn(requestOtpFn);
  const verifyOtp = useServerFn(verifyOtpFn);

  const [step, setStep] = useState<"phone" | "code">("phone");
  const [phone, setPhone] = useState(initialPhone);
  const [code, setCode] = useState("");
  const [verificationId, setVerificationId] = useState("");
  const [maskedPhone, setMaskedPhone] = useState("");
  const [businessTitle, setBusinessTitle] = useState("");
  const [otpMode, setOtpMode] = useState<"otp.com" | "sandbox">("sandbox");
  const [demoCode, setDemoCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (open) {
      setStep("phone");
      setPhone(initialPhone);
      setCode("");
      setError(null);
      setDemoCode(null);
    }
  }, [open, initialPhone]);

  async function handleRequestCode(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const res = await requestOtp({ data: { phone } });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setVerificationId(res.verificationId);
      setMaskedPhone(res.maskedPhone);
      setBusinessTitle(res.businessTitle);
      setOtpMode(res.mode);
      setDemoCode(res.demoCode);
      setCode("");
      setStep("code");
    } catch {
      setError("SMS doğrulama başlatılamadı. Lütfen numarayı kontrol edip tekrar deneyin.");
    } finally {
      setBusy(false);
    }
  }

  async function handleVerifyCode(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!/^\d{6}$/.test(code.trim())) {
      setError("Lütfen 6 haneli doğrulama kodunu eksiksiz girin.");
      return;
    }
    setBusy(true);
    try {
      const res = await verifyOtp({ data: { verificationId, code: code.trim() } });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      await onSuccess(res.user);
    } catch {
      setError("Kod doğrulanırken bir hata oluştu.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md rounded-2xl">
        <DialogHeader>
          <div className="mb-1 flex items-center gap-2 text-primary">
            <ShieldCheck className="h-5 w-5" />
            <span className="text-xs font-semibold uppercase tracking-wider">OTP.com +90 SMS Doğrulama</span>
          </div>
          <DialogTitle className="font-display text-xl">
            {step === "phone" ? "İşletme Girişi (05xx OTP)" : "SMS Kodunu Doğrulayın"}
          </DialogTitle>
          <DialogDescription>
            {step === "phone"
              ? "Arama motorundaki 05xx cep telefonu numarasına sahip işletmeler doğrudan üyedir. Yeni kayıt gerekmez."
              : `${businessTitle} (${maskedPhone}) için 6 haneli doğrulama kodunu girin.`}
          </DialogDescription>
        </DialogHeader>

        {step === "phone" ? (
          <form onSubmit={handleRequestCode} className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="otp-phone" className="text-sm font-medium text-foreground">
                İşletme Cep Telefonu (+90 5xx)
              </label>
              <div className="relative">
                <Smartphone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="otp-phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="0532 418 27 90"
                  className="pl-9 rounded-xl h-11"
                  autoFocus
                  required
                />
              </div>
            </div>

            <div className="rounded-xl border border-border bg-surface-subtle px-3.5 py-2.5 text-xs text-muted-foreground">
              Test için örnek işletme numarası:{" "}
              <button
                type="button"
                onClick={() => setPhone("0532 418 27 90")}
                className="font-semibold text-primary underline underline-offset-2 hover:opacity-80"
              >
                0532 418 27 90
              </button>{" "}
              (Moda Sahil Cafe · Yönetici)
            </div>

            {error && (
              <p className="rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
                {error}
              </p>
            )}

            <Button type="submit" disabled={busy} className="w-full rounded-full h-11 font-medium">
              {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Doğrulama Kodu Gönder
            </Button>
          </form>
        ) : (
          <form onSubmit={handleVerifyCode} className="space-y-4">
            {otpMode === "sandbox" && demoCode && (
              <div className="rounded-xl border border-primary/25 bg-secondary px-3.5 py-2.5 text-xs text-secondary-foreground">
                <div className="font-semibold">Test Modu (OTP.com API Anahtarı Henüz Girilmedi)</div>
                <div className="mt-1 flex items-center justify-between gap-2">
                  <span>Doğrulama kodunuz:</span>
                  <button
                    type="button"
                    onClick={() => setCode(demoCode)}
                    className="rounded-md bg-primary px-2.5 py-0.5 font-mono text-sm font-bold tracking-widest text-primary-foreground"
                  >
                    {demoCode}
                  </button>
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <label htmlFor="otp-code" className="text-sm font-medium text-foreground">
                6 Haneli SMS Kodu
              </label>
              <div className="relative">
                <KeyRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="otp-code"
                  inputMode="numeric"
                  maxLength={6}
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder="123456"
                  className="pl-9 rounded-xl h-11 tracking-[0.35em] font-mono text-base"
                  autoFocus
                  required
                />
              </div>
            </div>

            {error && (
              <p className="rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
                {error}
              </p>
            )}

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setStep("phone");
                  setError(null);
                }}
                className="rounded-full h-11"
              >
                <ArrowLeft className="mr-1.5 h-4 w-4" />
                Geri
              </Button>
              <Button type="submit" disabled={busy} className="flex-1 rounded-full h-11 font-medium">
                {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Doğrula ve Giriş Yap
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}