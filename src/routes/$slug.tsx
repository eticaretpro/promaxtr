import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  CheckCircle2,
  Copy,
  Globe,
  MapPin,
  MessageCircle,
  Phone,
  Plus,
  ShieldCheck,
  Star,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { SaveToGroupDialog } from "@/components/save-to-group-dialog";
import { usePromaxSession } from "@/components/promax-session-context";
import { getBusinessBySlugFn } from "@/lib/promax-search.functions";
import { resolveBusinessThumbnail } from "@/lib/business-images";

export const Route = createFileRoute("/$slug")({
  loader: ({ params }) => getBusinessBySlugFn({ data: { slug: params.slug } }),
  head: ({ loaderData, params }) => {
    const biz = loaderData?.business;
    if (!biz) {
      return {
        meta: [
          { title: "İşletme Bulunamadı — Promax" },
          { name: "robots", content: "noindex" },
        ],
      };
    }
    const title = `${biz.title} — ${biz.district}, ${biz.province} | Promax`;
    const description = `${biz.title} (${biz.category}) iletişim bilgileri, 05xx cep telefonu ve adres detayları — we.tc/${params.slug}`;
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary_large_image" },
      ],
    };
  },
  component: BusinessProfilePage,
});

function BusinessProfilePage() {
  const { business, related } = Route.useLoaderData();
  const { user, openLoginModal } = usePromaxSession();
  const [saveOpen, setSaveOpen] = useState(false);

  if (!business) {
    return (
      <div className="mx-auto max-w-xl px-4 py-20 text-center">
        <h1 className="font-display text-2xl font-bold text-foreground">İşletme Sayfası Bulunamadı</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Aradığınız işletme bağlantısı henüz sistemde kayıtlı değil.
        </p>
        <Button asChild className="mt-6 rounded-full px-6">
          <Link to="/">Arama Motoruna Dön</Link>
        </Button>
      </div>
    );
  }

  const cover = resolveBusinessThumbnail(business.thumbnailUrl, business.category);
  const waDigits = business.mobilePhoneE164.replace(/\D/g, "");
  const publicShortUrl = `https://we.tc/${business.slug}`;

  async function handleCopyShortUrl() {
    await navigator.clipboard.writeText(publicShortUrl);
    toast.success(`${publicShortUrl} panoya kopyalandı.`);
  }

  function handleSave() {
    if (!user) {
      toast.info("İşletmeyi gruba kaydetmek için önce 05xx OTP ile giriş yapın.");
      openLoginModal();
      return;
    }
    setSaveOpen(true);
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-7 sm:px-7 sm:py-9">
      <Link
        to="/"
        className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Arama Sonuçlarına Dön
      </Link>

      <article className="mt-4 overflow-hidden rounded-3xl border border-border bg-card shadow-sm">
        <div className="relative h-56 w-full bg-muted sm:h-72">
          <img
            src={cover}
            alt={business.title}
            width={992}
            height={672}
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-foreground/75 via-foreground/20 to-transparent" />
          <div className="absolute bottom-5 left-5 right-5 flex flex-wrap items-end justify-between gap-3">
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-card/95 px-3 py-0.5 text-xs font-semibold text-foreground">
                  {business.category}
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-verified px-2.5 py-0.5 text-xs font-medium text-verified-foreground">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  {business.isVerified ? "Doğrulanmış Üye" : "05xx Kayıtlı Üye"}
                </span>
              </div>
              <h1 className="font-display text-2xl font-bold text-primary-foreground sm:text-3xl">
                {business.title}
              </h1>
            </div>

            {business.rating !== null && (
              <div className="inline-flex items-center gap-1.5 rounded-full bg-card/95 px-3.5 py-1.5 text-sm font-semibold text-foreground shadow-sm">
                <Star className="h-4 w-4 fill-rating text-rating" />
                <span>{business.rating.toFixed(1)}</span>
                <span className="text-xs font-normal text-muted-foreground">
                  ({business.reviewCount} yorum)
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 p-6 md:grid-cols-12">
          <div className="space-y-4 md:col-span-7">
            <div className="rounded-2xl border border-border bg-surface-subtle p-4 space-y-3">
              <div className="flex items-start gap-3">
                <Phone className="mt-0.5 h-4 w-4 shrink-0 text-verified" />
                <div>
                  <div className="text-xs text-muted-foreground">Doğrulanabilir Cep Telefonu</div>
                  <a
                    href={`tel:${business.mobilePhoneE164}`}
                    className="text-base font-bold text-foreground hover:text-primary"
                  >
                    {business.mobilePhone}
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <div>
                  <div className="text-xs text-muted-foreground">Adres</div>
                  <p className="text-sm font-medium text-foreground">{business.address}</p>
                  <p className="text-xs text-muted-foreground">
                    {business.district}, {business.province}
                  </p>
                </div>
              </div>

              {business.website && (
                <div className="flex items-start gap-3">
                  <Globe className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <div>
                    <div className="text-xs text-muted-foreground">Web Sitesi</div>
                    <a
                      href={business.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-medium text-primary underline underline-offset-2"
                    >
                      {business.website}
                    </a>
                  </div>
                </div>
              )}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-border px-4 py-3 text-xs">
              <div className="truncate">
                <span className="text-muted-foreground">İşletme Sayfa Adresi: </span>
                <span className="font-semibold text-primary">we.tc/{business.slug}</span>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => void handleCopyShortUrl()}
                className="h-8 rounded-full text-xs"
              >
                <Copy className="mr-1.5 h-3.5 w-3.5" />
                Linki Kopyala
              </Button>
            </div>
          </div>

          <div className="flex flex-col gap-2.5 md:col-span-5">
            <Button asChild className="h-11 w-full rounded-full font-semibold">
              <a href={`tel:${business.mobilePhoneE164}`}>
                <Phone className="mr-2 h-4 w-4" />
                Hemen Ara ({business.mobilePhone})
              </a>
            </Button>
            <Button asChild variant="outline" className="h-11 w-full rounded-full font-medium">
              <a
                href={`https://wa.me/${waDigits}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <MessageCircle className="mr-2 h-4 w-4 text-verified" />
                WhatsApp ile İletişime Geç
              </a>
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={handleSave}
              className="h-11 w-full rounded-full font-medium"
            >
              <Plus className="mr-2 h-4 w-4" />
              Gruba Kaydet
            </Button>

            {!business.claimedAt && (
              <div className="mt-2 rounded-2xl border border-primary/20 bg-secondary/60 p-4 text-xs">
                <div className="flex items-center gap-1.5 font-semibold text-foreground">
                  <ShieldCheck className="h-4 w-4 text-primary" />
                  Bu işletme size mi ait?
                </div>
                <p className="mt-1 text-muted-foreground">
                  {business.mobilePhone} numaranıza SMS OTP kodu alarak profilinizi doğrulayıp yönetebilirsiniz.
                </p>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => openLoginModal(business.mobilePhone)}
                  className="mt-3 w-full rounded-full text-xs font-medium"
                >
                  05xx OTP ile İşletmeyi Doğrula
                </Button>
              </div>
            )}
          </div>
        </div>
      </article>

      {related.length > 0 && (
        <section className="mt-8">
          <h2 className="font-display text-lg font-semibold text-foreground">
            {business.district} Bölgesindeki Diğer 05xx İşletmeler
          </h2>
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
            {related.map((item) => (
              <Link
                key={item.id}
                to="/$slug"
                params={{ slug: item.slug }}
                className="rounded-2xl border border-border bg-card p-3.5 transition-colors hover:border-primary/40 hover:shadow-xs"
              >
                <div className="text-[11px] font-medium text-muted-foreground">{item.category}</div>
                <div className="mt-0.5 truncate font-display text-sm font-semibold text-foreground">
                  {item.title}
                </div>
                <div className="mt-1 text-xs font-medium text-primary">{item.mobilePhone}</div>
              </Link>
            ))}
          </div>
        </section>
      )}

      <SaveToGroupDialog
        open={saveOpen}
        onOpenChange={setSaveOpen}
        businessIds={[business.id]}
        businessLabel={business.title}
      />
    </div>
  );
}