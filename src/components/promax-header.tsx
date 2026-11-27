import { Link } from "@tanstack/react-router";
import { ChevronDown, Layers, KeyRound, LogOut, ExternalLink, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { usePromaxSession } from "./promax-session-context";

export function PromaxHeader() {
  const { user, openLoginModal, logout } = usePromaxSession();

  return (
    <header className="sticky top-0 z-30 border-b border-border/80 bg-card/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-7">
        <Link
          to="/"
          className="flex items-center gap-2.5 font-display text-[19px] font-bold tracking-tight text-foreground transition-opacity hover:opacity-85"
        >
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-xs font-extrabold text-primary-foreground shadow-sm">
            P
          </span>
          <span>Promax</span>
        </Link>

        <nav className="flex items-center gap-2.5 sm:gap-5">
          <Link
            to="/gruplarim"
            className="whitespace-nowrap text-xs font-medium text-muted-foreground transition-colors hover:text-foreground sm:text-sm [&.active]:text-primary"
          >
            Kayıtlı Gruplarım
          </Link>

          {user?.isAdmin && (
            <Link
              to="/ayarlar"
              className="hidden items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground sm:inline-flex [&.active]:text-primary"
            >
              <Settings className="h-3.5 w-3.5" />
              API Ayarları
            </Link>
          )}

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="secondary" className="h-9 rounded-full px-3.5 text-xs sm:text-sm font-medium">
                  <span className="h-2 w-2 rounded-full bg-verified" />
                  <span className="max-w-[140px] truncate">{user.businessTitle}</span>
                  <ChevronDown className="h-3.5 w-3.5 opacity-60" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-60 rounded-xl">
                <DropdownMenuLabel className="font-normal">
                  <div className="font-semibold text-foreground">{user.businessTitle}</div>
                  <div className="text-xs text-muted-foreground">{user.phoneDisplay}</div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/$slug" params={{ slug: user.businessSlug }} className="cursor-pointer">
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Sayfam: we.tc/{user.businessSlug}
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/gruplarim" className="cursor-pointer">
                    <Layers className="mr-2 h-4 w-4" />
                    Kayıtlı Gruplarım
                  </Link>
                </DropdownMenuItem>
                {user.isAdmin && (
                  <DropdownMenuItem asChild>
                    <Link to="/ayarlar" className="cursor-pointer">
                      <KeyRound className="mr-2 h-4 w-4" />
                      API Ayarları
                    </Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => void logout()}
                  className="cursor-pointer text-destructive focus:text-destructive"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Çıkış Yap
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button
              type="button"
              onClick={() => openLoginModal()}
              className="h-9 whitespace-nowrap rounded-full px-3 text-[11px] font-medium shadow-sm sm:px-4 sm:text-[13px]"
            >
              İşletme Girişi (05xx OTP)
            </Button>
          )}
        </nav>
      </div>
    </header>
  );
}