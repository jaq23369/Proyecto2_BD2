import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Bell, Heart, MessageCircle, UserPlus, Info, AlertCircle, Trash2, Check } from "lucide-react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { notificationsApi } from "../api/domain";
import EmptyState from "../components/EmptyState";
import Spinner from "../components/Spinner";
import { timeAgo, cx } from "../utils/format";

const ICONS = {
  like: Heart,
  comment: MessageCircle,
  follow: UserPlus,
  info: Info,
  alert: AlertCircle,
};

export default function Notifications() {
  const qc = useQueryClient();
  const list = useQuery({
    queryKey: ["all-notifications"],
    queryFn: () => notificationsApi.list({ limit: 80 }).then((r) => r.data || []),
  });

  const markRead = useMutation({
    mutationFn: (id) => notificationsApi.update(id, { isRead: true }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["all-notifications"] }),
  });

  const remove = useMutation({
    mutationFn: (id) => notificationsApi.remove(id),
    onSuccess: () => {
      toast.success("Eliminada");
      qc.invalidateQueries({ queryKey: ["all-notifications"] });
    },
  });

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <header className="flex items-center gap-3 mb-6">
        <Bell size={24} />
        <h1 className="text-2xl font-bold">Notificaciones</h1>
      </header>

      {list.isLoading ? <Spinner /> :
        list.data?.length === 0 ? (
          <EmptyState icon={Bell} title="Sin notificaciones" />
        ) : (
          <div className="ig-card divide-y divide-ig-border">
            {list.data.map((n) => {
              const Icon = ICONS[n.type?.toLowerCase()] || Bell;
              return (
                <Link
                  key={n.notificationId}
                  to={`/notifications/${n.notificationId}`}
                  className={cx(
                    "flex items-start gap-3 px-4 py-3 hover:bg-ig-elevated",
                    !n.isRead && "bg-ig-link/5"
                  )}
                >
                  <div className={cx(
                    "w-10 h-10 rounded-full grid place-items-center shrink-0",
                    n.priority === "high" ? "bg-ig-danger/20 text-ig-danger" : "bg-ig-elevated"
                  )}>
                    <Icon size={16} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm">{n.message}</div>
                    <div className="text-xs ig-text-dim flex items-center gap-2 mt-0.5">
                      <span className="ig-pill">{n.type}</span>
                      <span>{timeAgo(n.createdAt)}</span>
                      {!n.isRead && <span className="text-ig-link">• nueva</span>}
                    </div>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    {!n.isRead && (
                      <button onClick={(e) => { e.preventDefault(); markRead.mutate(n.notificationId); }} className="p-1.5 rounded-lg hover:bg-ig-elevated">
                        <Check size={14} />
                      </button>
                    )}
                    <button onClick={(e) => { e.preventDefault(); remove.mutate(n.notificationId); }} className="p-1.5 rounded-lg hover:bg-ig-elevated">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
    </div>
  );
}
