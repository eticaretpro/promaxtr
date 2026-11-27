import { useState, type FormEvent } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { FolderPlus, Check, Loader2, Layers } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  createGroupFn,
  listGroupsFn,
  saveBusinessesToGroupFn,
} from "@/lib/promax-groups.functions";

interface SaveToGroupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  businessIds: string[];
  businessLabel?: string | undefined;
  onSaved?: () => void;
}

export function SaveToGroupDialog({
  open,
  onOpenChange,
  businessIds,
  businessLabel,
  onSaved,
}: SaveToGroupDialogProps) {
  const queryClient = useQueryClient();
  const fetchGroups = useServerFn(listGroupsFn);
  const createGroup = useServerFn(createGroupFn);
  const saveToGroup = useServerFn(saveBusinessesToGroupFn);

  const [selectedGroupId, setSelectedGroupId] = useState<string>("");
  const [newGroupName, setNewGroupName] = useState("");
  const [creating, setCreating] = useState(false);
  const [saving, setSaving] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["promax-groups"],
    queryFn: () => fetchGroups(),
    enabled: open,
  });

  const groups = data?.groups ?? [];
  const activeGroupId = selectedGroupId || groups[0]?.id || "";

  async function handleCreateGroup(e: FormEvent) {
    e.preventDefault();
    if (newGroupName.trim().length < 2) return;
    setCreating(true);
    try {
      const res = await createGroup({ data: { name: newGroupName.trim(), color: "blue" } });
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      await queryClient.invalidateQueries({ queryKey: ["promax-groups"] });
      setSelectedGroupId(res.group.id);
      setNewGroupName("");
      toast.success(`"${res.group.name}" grubu oluşturuldu.`);
    } finally {
      setCreating(false);
    }
  }

  async function handleSave() {
    if (!activeGroupId || businessIds.length === 0) return;
    setSaving(true);
    try {
      const res = await saveToGroup({
        data: { groupId: activeGroupId, businessIds },
      });
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      await queryClient.invalidateQueries({ queryKey: ["promax-groups"] });
      toast.success(`${res.savedCount} işletme "${res.groupName}" grubuna kaydedildi.`);
      onSaved?.();
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">İşletme Grubuna Kaydet</DialogTitle>
          <DialogDescription>
            {businessIds.length === 1 && businessLabel
              ? `"${businessLabel}" işletmesini hangi grubunuza eklemek istersiniz?`
              : `Seçili ${businessIds.length} işletmeyi toplu olarak kaydetmek istediğiniz grubu seçin.`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-6 text-sm text-muted-foreground">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Gruplarınız yükleniyor...
            </div>
          ) : groups.length > 0 ? (
            <div className="max-h-52 space-y-2 overflow-y-auto pr-1">
              {groups.map((g) => {
                const selected = activeGroupId === g.id;
                return (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => setSelectedGroupId(g.id)}
                    className={`flex w-full items-center justify-between rounded-xl border px-3.5 py-2.5 text-left transition-colors ${
                      selected
                        ? "border-primary bg-secondary text-foreground"
                        : "border-border bg-card hover:bg-muted/60"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Layers className="h-4 w-4 shrink-0 text-primary" />
                      <div className="truncate">
                        <div className="truncate text-sm font-medium">{g.name}</div>
                        <div className="text-xs text-muted-foreground">{g.itemCount} işletme</div>
                      </div>
                    </div>
                    {selected && <Check className="h-4 w-4 shrink-0 text-primary" />}
                  </button>
                );
              })}
            </div>
          ) : (
            <p className="rounded-xl border border-dashed border-border bg-surface-subtle p-3.5 text-center text-xs text-muted-foreground">
              Henüz bir işletme grubunuz yok. Aşağıdan ilk grubunuzu oluşturun.
            </p>
          )}

          <form onSubmit={handleCreateGroup} className="flex gap-2">
            <Input
              value={newGroupName}
              onChange={(e) => setNewGroupName(e.target.value)}
              placeholder="Yeni grup adı (örn: Kadıköy Potansiyeller)"
              className="rounded-xl h-10"
            />
            <Button
              type="submit"
              variant="outline"
              disabled={creating || newGroupName.trim().length < 2}
              className="rounded-xl h-10 shrink-0"
            >
              {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <FolderPlus className="h-4 w-4" />}
            </Button>
          </form>

          <Button
            type="button"
            onClick={handleSave}
            disabled={saving || !activeGroupId}
            className="w-full rounded-full h-11 font-medium"
          >
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {businessIds.length > 1
              ? `${businessIds.length} İşletmeyi Gruba Kaydet`
              : "Gruba Kaydet"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}