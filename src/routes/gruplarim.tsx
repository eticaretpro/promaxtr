import { useState, type FormEvent } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  Copy,
  ExternalLink,
  FolderPlus,
  Layers,
  Loader2,
  Phone,
  ShieldCheck,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { usePromaxSession } from "@/components/promax-session-context";
import {
  createGroupFn,
  deleteGroupFn,
  listGroupsFn,
  removeBusinessFromGroupFn,
} from "@/lib/promax-groups.functions";
import { resolveBusinessThumbnail } from "@/lib/business-images";

export const Route = createFileRoute("/gruplarim")({
  head: () => ({
    meta: [
      { title: "Kayıtlı Gruplarım — Promax" },
      {
        name: "description",
        content: "Promax üzerinde kaydettiğiniz işletme gruplarını yönetin ve 05xx telefon listelerine ulaşın.",
      },
      { property: "og:title", content: "Kayıtlı Gruplarım — Promax" },
      {
        property: "og:description",
        content: "Promax üzerinde kaydettiğiniz işletme gruplarını yönetin ve 05xx telefon listelerine ulaşın.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: GroupsPage,
});

function GroupsPage() {
  const queryClient = useQueryClient();
  const { user, isLoading: sessionLoading, openLoginModal } = usePromaxSession();
  const fetchGroups = useServerFn(listGroupsFn);
  const createGroup = useServerFn(createGroupFn);
  const deleteGroup = useServerFn(deleteGroupFn);
  const removeSaved = useServerFn(removeBusinessFromGroupFn);

  const [selectedGroupId, setSelectedGroupId] = useState<string>("");
  const [groupName, setGroupName] = useState("");
  const [groupDescription, setGroupDescription] = useState("");
  const [creating, setCreating] = useState(false);

  const groupsQuery = useQuery({
    queryKey: ["promax-groups"],
    queryFn: () => fetchGroups(),
    enabled: Boolean(user),
  });

  const groups = groupsQuery.data?.groups ?? [];
  const activeGroup = groups.find((g) => g.id === selectedGroupId) ?? groups[0] ?? null;

  async function handleCreateGroup(e: FormEvent) {
    e.preventDefault();
    if (groupName.trim().length < 2) return;
    setCreating(true);
    try {
      const res = await createGroup({
        data: { name: groupName.trim(), description: groupDescription.trim(), color: "blue" },
      });
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      await queryClient.invalidateQueries({ queryKey: ["promax-groups"] });
      setSelectedGroupId(res.group.id);
      setGroupName("");
      setGroupDescription("");
      toast.success(`"${res.group.name}" grubu oluşturuldu.`);
    } finally {
      setCreating(false);
    }
  }

  async function handleDeleteGroup(groupId: string, name: string) {
    const res = await deleteGroup({ data: { groupId } });
    if (!res.ok) {
      toast.error(res.error);
      return;
    }
    await queryClient.invalidateQueries({ queryKey: ["promax-groups"] });
    if (selectedGroupId === groupId) setSelectedGroupId("");
    toast.success(`"${name}" grubu silindi.`);
  }

  async function handleRemoveItem(savedId: string) {
    const res = await removeSaved({ data: { savedId } });
    if (!res.ok) {
      toast.error(res.error);
      return;
    }
    await queryClient.invalidateQueries({ queryKey: ["promax-groups"] });
    toast.success("İşletme gruptan çıkarıldı.");
  }

  async function handleCopyPhones() {
    if (!activeGroup || activeGroup.items.length === 0) return;
    const text = activeGroup.items
      .map((item) => `${item.business.title} — ${item.business.mobilePhone}`)
      .join("\n");
    await navigator.clipboard.writeText(text);
    toast.success(`${activeGroup.items.length} numara panoya kopyalandı.`);
  }

  if (sessionLoading) {
    return (
      <div className="mx-auto flex max-w-6xl items-center justify-center px-4 py-20 text-sm text-muted-foreground">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        Oturum kontrol ediliyor...
      </div>
    );
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16">
        <div className="rounded-2xl border border-border bg-card p-8 text-center shadow-sm">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-secondary text-primary">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <h1 className="mt-4 font-display text-2xl font-bold text-foreground">Kayıtlı Gruplarım</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            İşletme gruplarınızı oluşturmak ve kaydettiğiniz 05xx işletmelere erişmek için SMS OTP ile giriş yapın.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Button type="button" onClick={() => openLoginModal()} className="rounded-full px-6">
              İşletme Girişi (05xx OTP)
            </Button>
            <Button asChild variant="outline" className="rounded-full px-5">
              <Link to="/">Aramaya Dön</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-7">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-[28px]">
            Kayıtlı Gruplarım
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {user.businessTitle} ({user.phoneDisplay}) hesabınıza kayıtlı işletme listeleri.
          </p>
        </div>
        <Button asChild variant="outline" size="sm" className="rounded-full">
          <Link to="/">Yeni İşletme Ara</Link>
        </Button>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-12">
        <aside className="space-y-4 lg:col-span-4">
          <form
            onSubmit={handleCreateGroup}
            className="space-y-3 rounded-2xl border border-border bg-card p-4 shadow-sm"
          >
            <div className="text-sm font-semibold text-foreground">Yeni İşletme Grubu</div>
            <Input
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="Grup adı (örn: Kadıköy Kafeler)"
              className="rounded-xl h-10"
              required
            />
            <Input
              value={groupDescription}
              onChange={(e) => setGroupDescription(e.target.value)}
              placeholder="Kısa açıklama (isteğe bağlı)"
              className="rounded-xl h-10"
            />
            <Button
              type="submit"
              disabled={creating || groupName.trim().length < 2}
              className="w-full rounded-full h-10 text-xs font-semibold"
            >
              {creating ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <FolderPlus className="mr-1.5 h-4 w-4" />}
              Grup Oluştur
            </Button>
          </form>

          <div className="space-y-2">
            {groups.map((group) => {
              const isActive = activeGroup?.id === group.id;
              return (
                <button
                  key={group.id}
                  type="button"
                  onClick={() => setSelectedGroupId(group.id)}
                  className={`flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-left transition-colors ${
                    isActive
                      ? "border-primary bg-secondary text-foreground shadow-xs"
                      : "border-border bg-card hover:bg-muted/50"
                  }`}
                >
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold">{group.name}</div>
                    {group.description && (
                      <div className="truncate text-xs text-muted-foreground">{group.description}</div>
                    )}
                  </div>
                  <span className="ml-3 shrink-0 rounded-full bg-background px-2.5 py-0.5 text-xs font-semibold text-foreground border border-border">
                    {group.itemCount}
                  </span>
                </button>
              );
            })}
          </div>
        </aside>

        <section className="lg:col-span-8">
          {groupsQuery.isLoading ? (
            <div className="flex items-center justify-center rounded-2xl border border-border bg-card py-16 text-sm text-muted-foreground">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Gruplar yükleniyor...
            </div>
          ) : activeGroup ? (
            <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border pb-4">
                <div>
                  <h2 className="font-display text-xl font-bold text-foreground">{activeGroup.name}</h2>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {activeGroup.description || `${activeGroup.itemCount} kayıtlı 05xx işletme`}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {activeGroup.items.length > 0 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => void handleCopyPhones()}
                      className="rounded-full text-xs"
                    >
                      <Copy className="mr-1.5 h-3.5 w-3.5" />
                      Numaraları Kopyala
                    </Button>
                  )}
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => void handleDeleteGroup(activeGroup.id, activeGroup.name)}
                    className="rounded-full text-xs text-destructive hover:text-destructive"
                  >
                    <Trash2 className="mr-1 h-3.5 w-3.5" />
                    Grubu Sil
                  </Button>
                </div>
              </div>

              {activeGroup.items.length === 0 ? (
                <div className="py-12 text-center">
                  <Layers className="mx-auto h-8 w-8 text-muted-foreground/50" />
                  <p className="mt-3 text-sm font-medium text-foreground">Bu grupta henüz işletme yok</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Anasayfadaki arama sonuçlarından tek tek veya toplu olarak işletme ekleyebilirsiniz.
                  </p>
                  <Button asChild size="sm" variant="outline" className="mt-4 rounded-full">
                    <Link to="/">İşletme Aramaya Git</Link>
                  </Button>
                </div>
              ) : (
                <div className="mt-4 divide-y divide-border">
                  {activeGroup.items.map((item) => (
                    <div key={item.savedId} className="flex flex-col gap-3 py-3.5 sm:flex-row sm:items-center">
                      <img
                        src={resolveBusinessThumbnail(item.business.thumbnailUrl, item.business.category)}
                        alt={item.business.title}
                        loading="lazy"
                        width={160}
                        height={112}
                        className="h-16 w-24 shrink-0 rounded-xl object-cover bg-muted"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="text-[11px] font-medium text-muted-foreground">
                          {item.business.category} · {item.business.district}, {item.business.province}
                        </div>
                        <Link
                          to="/$slug"
                          params={{ slug: item.business.slug }}
                          className="font-display text-base font-semibold text-foreground hover:text-primary"
                        >
                          {item.business.title}
                        </Link>
                        <div className="mt-1 flex flex-wrap items-center gap-3 text-xs">
                          <a
                            href={`tel:${item.business.mobilePhoneE164}`}
                            className="inline-flex items-center gap-1 font-semibold text-foreground hover:text-primary"
                          >
                            <Phone className="h-3 w-3 text-verified" />
                            {item.business.mobilePhone}
                          </a>
                          <Link
                            to="/$slug"
                            params={{ slug: item.business.slug }}
                            className="inline-flex items-center gap-1 text-primary underline underline-offset-2"
                          >
                            we.tc/{item.business.slug}
                            <ExternalLink className="h-3 w-3" />
                          </Link>
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => void handleRemoveItem(item.savedId)}
                        className="self-start rounded-full text-xs text-muted-foreground hover:text-destructive sm:self-center"
                      >
                        <Trash2 className="mr-1 h-3.5 w-3.5" />
                        Çıkar
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-border bg-card p-12 text-center">
              <Layers className="mx-auto h-9 w-9 text-muted-foreground/50" />
              <h2 className="mt-3 font-display text-lg font-semibold text-foreground">
                İlk İşletme Grubunuzu Oluşturun
              </h2>
              <p className="mt-1 text-xs text-muted-foreground">
                Sol taraftaki formdan yeni bir grup oluşturup aramalardan işletmeleri toplu olarak kaydedebilirsiniz.
              </p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}