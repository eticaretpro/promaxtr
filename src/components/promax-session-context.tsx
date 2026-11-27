import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { getSessionFn, logoutFn } from "@/lib/promax-auth.functions";
import type { SessionUserDTO } from "@/lib/promax-types";
import { OtpLoginDialog } from "./otp-login-dialog";

interface PromaxSessionContextValue {
  user: SessionUserDTO | null;
  isLoading: boolean;
  openLoginModal: (prefillPhone?: string) => void;
  refreshSession: () => Promise<void>;
  logout: () => Promise<void>;
}

const PromaxSessionContext = createContext<PromaxSessionContextValue | null>(null);

export function PromaxSessionProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const fetchSession = useServerFn(getSessionFn);
  const doLogout = useServerFn(logoutFn);

  const [loginOpen, setLoginOpen] = useState(false);
  const [prefillPhone, setPrefillPhone] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["promax-session"],
    queryFn: () => fetchSession(),
    staleTime: 60_000,
  });

  const user = data?.user ?? null;

  const openLoginModal = useCallback((phone?: string) => {
    setPrefillPhone(phone ?? "");
    setLoginOpen(true);
  }, []);

  const refreshSession = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: ["promax-session"] });
    await queryClient.invalidateQueries({ queryKey: ["promax-groups"] });
    await queryClient.invalidateQueries({ queryKey: ["promax-recent-searches"] });
  }, [queryClient]);

  const logout = useCallback(async () => {
    await queryClient.cancelQueries();
    await doLogout();
    queryClient.setQueryData(["promax-session"], { user: null });
    queryClient.removeQueries({ queryKey: ["promax-groups"] });
    queryClient.removeQueries({ queryKey: ["promax-api-settings"] });
    toast.success("Oturumunuz kapatıldı.");
  }, [doLogout, queryClient]);

  return (
    <PromaxSessionContext.Provider
      value={{ user, isLoading, openLoginModal, refreshSession, logout }}
    >
      {children}
      <OtpLoginDialog
        open={loginOpen}
        onOpenChange={setLoginOpen}
        initialPhone={prefillPhone}
        onSuccess={async (loggedInUser) => {
          queryClient.setQueryData(["promax-session"], { user: loggedInUser });
          await refreshSession();
          setLoginOpen(false);
          toast.success(`${loggedInUser.businessTitle} olarak giriş yapıldı.`);
        }}
      />
    </PromaxSessionContext.Provider>
  );
}

export function usePromaxSession() {
  const ctx = useContext(PromaxSessionContext);
  if (!ctx) throw new Error("usePromaxSession must be used inside PromaxSessionProvider");
  return ctx;
}