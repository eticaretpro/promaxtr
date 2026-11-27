import { Link } from "@tanstack/react-router";
import { MapPin, Phone, Star, CheckCircle2, ExternalLink, Plus } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { resolveBusinessThumbnail } from "@/lib/business-images";
import type { BusinessDTO } from "@/lib/promax-types";

interface BusinessRowCardProps {
  business: BusinessDTO;
  selected: boolean;
  onToggleSelect: (id: string) => void;
  onSaveClick: (business: BusinessDTO) => void;
}

export function BusinessRowCard({
  business,
  selected,
  onToggleSelect,
  onSaveClick,
}: BusinessRowCardProps) {
  const thumb = resolveBusinessThumbnail(business.thumbnailUrl, business.category);

  return (
    <article
      className={`group flex flex-col gap-4 rounded-2xl border bg-card p-4 transition-all sm:flex-row sm:items-center sm:px-5 sm:py-4 ${
        selected
          ? "border-primary/60 bg-secondary/40 shadow-sm"
          : "border-border hover:border-primary/35 hover:shadow-sm"
      }`}
    >
      <div className="flex items-start gap-3.5 sm:items-center">
        <Checkbox
          checked={selected}
          onCheckedChange={() => onToggleSelect(business.id)}
          aria-label={`${business.title} seç`}
          className="mt-1 rounded-[4px] sm:mt-0"
        />
        <Link
          to="/$slug"
          params={{ slug: business.slug }}
          className="relative h-20 w-28 shrink-0 overflow-hidden rounded-xl bg-muted sm:h-[88px] sm:w-[126px]"
        >
          <img
            src={thumb}
            alt={business.title}
            loading="lazy"
            width={252}
            height={176}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        </Link>
      </div>

      <div className="min-w-0 flex-1 space-y-1.5">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="inline-flex items-center rounded-full bg-secondary px-2.5 py-0.5 font-medium text-secondary-foreground">
            {business.category}
          </span>
          {business.rating !== null && (
            <span className="inline-flex items-center gap-1 font-medium text-foreground">
              <Star className="h-3.5 w-3.5 fill-rating text-rating" />
              {business.rating.toFixed(1)}
              <span className="font-normal text-muted-foreground">({business.reviewCount})</span>
            </span>
          )}
          {business.isVerified && (
            <span className="inline-flex items-center gap-1 rounded-full bg-verified-surface px-2 py-0.5 text-[11px] font-medium text-verified">
              <CheckCircle2 className="h-3 w-3" />
              Doğrulanmış Üye
            </span>
          )}
        </div>

        <h3 className="font-display text-lg font-semibold leading-snug text-foreground">
          <Link
            to="/$slug"
            params={{ slug: business.slug }}
            className="transition-colors hover:text-primary"
          >
            {business.title}
          </Link>
        </h3>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px]">
          <a
            href={`tel:${business.mobilePhoneE164}`}
            className="inline-flex items-center gap-1.5 font-semibold text-foreground hover:text-primary"
          >
            <Phone className="h-3.5 w-3.5 text-verified" />
            {business.mobilePhone}
          </a>
          <Link
            to="/$slug"
            params={{ slug: business.slug }}
            className="inline-flex items-center gap-1 text-primary underline decoration-primary/40 underline-offset-2 hover:decoration-primary"
          >
            we.tc/{business.slug}
          </Link>
        </div>

        <p className="flex items-start gap-1.5 text-xs text-muted-foreground">
          <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground/75" />
          <span className="line-clamp-1">{business.address}</span>
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-2 pt-1 sm:flex-col sm:items-end sm:pt-0">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => onSaveClick(business)}
          className="h-9 flex-1 rounded-full px-4 text-xs font-medium sm:flex-none"
        >
          <Plus className="mr-1 h-3.5 w-3.5" />
          Gruba Kaydet
        </Button>
        <Button
          asChild
          variant="ghost"
          size="sm"
          className="h-8 rounded-full px-3 text-xs text-muted-foreground hover:text-foreground"
        >
          <Link to="/$slug" params={{ slug: business.slug }}>
            Sayfayı Gör
            <ExternalLink className="ml-1 h-3 w-3" />
          </Link>
        </Button>
      </div>
    </article>
  );
}