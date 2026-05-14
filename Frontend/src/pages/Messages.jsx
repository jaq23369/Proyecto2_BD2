import { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Send, MessageCircle, Lock, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { messagesApi, usersApi } from "../api/domain";
import { useCurrentUser } from "../auth/CurrentUser";
import Avatar from "../components/Avatar";
import EmptyState from "../components/EmptyState";
import Spinner from "../components/Spinner";
import { timeAgo, cx } from "../utils/format";

export default function Messages() {
  const { user } = useCurrentUser();
  const { userId: peerId } = useParams();
  const nav = useNavigate();

  const sentQ = useQuery({ queryKey: ["sent", user.userId], queryFn: () => messagesApi.sent(user.userId).then((r) => r.data || []) });
  const receivedQ = useQuery({ queryKey: ["received", user.userId], queryFn: () => messagesApi.received(user.userId).then((r) => r.data || []) });

  const followingQ = useQuery({
    queryKey: ["following-msg", user.userId],
    queryFn: () => usersApi.following(user.userId, { limit: 50 }).then((r) => r.data || []),
  });

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 grid md:grid-cols-[280px_1fr] gap-0 ig-card overflow-hidden min-h-[70vh]">
      <aside className="border-r ig-border overflow-y-auto">
        <header className="px-4 py-3 border-b ig-border">
          <div className="font-semibold">{user.username}</div>
          <div className="text-xs ig-text-dim">Mensajes directos</div>
        </header>
        {(followingQ.data || []).length === 0 && (
          <div className="p-6 text-sm ig-text-soft text-center">
            Sigue a alguien para mandarle mensajes
          </div>
        )}
        {(followingQ.data || []).map((u) => (
          <Link
            key={u.userId}
            to={`/messages/${u.userId}`}
            className={cx(
              "flex items-center gap-3 px-3 py-2.5 hover:bg-ig-elevated transition",
              peerId === u.userId && "bg-ig-elevated"
            )}
          >
            <Avatar user={u} size={44} ring />
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-sm truncate">{u.username}</div>
              <div className="text-xs ig-text-dim truncate">@{u.userId}</div>
            </div>
          </Link>
        ))}
      </aside>

      {peerId ? (
        <Thread peerId={peerId} sent={sentQ.data} received={receivedQ.data} />
      ) : (
        <div className="grid place-items-center p-10">
          <EmptyState icon={MessageCircle} title="Tus mensajes" hint="Selecciona una conversación o sigue a alguien para empezar." />
        </div>
      )}
    </div>
  );
}

function Thread({ peerId, sent = [], received = [] }) {
  const { user } = useCurrentUser();
  const qc = useQueryClient();
  const [text, setText] = useState("");

  const peerQ = useQuery({ queryKey: ["user", peerId], queryFn: () => usersApi.get(peerId).then((r) => r.data) });

  const send = useMutation({
    mutationFn: () => messagesApi.create({
      fromUserId: user.userId,
      toUserId: peerId,
      content: text,
      isEncrypted: false,
      channel: "dm",
    }),
    onSuccess: () => {
      setText("");
      qc.invalidateQueries({ queryKey: ["sent"] });
      qc.invalidateQueries({ queryKey: ["received"] });
    },
  });

  // unimos sent+received y filtramos los relacionados al peer (heurística por timestamp)
  const merged = [...(sent || []), ...(received || [])]
    .sort((a, b) => (a.sentAt || "").localeCompare(b.sentAt || ""));

  return (
    <section className="flex flex-col">
      <header className="px-4 py-3 border-b ig-border flex items-center gap-3">
        <Avatar user={peerQ.data} size={36} ring />
        <div className="flex-1">
          <div className="font-semibold text-sm">{peerQ.data?.username || peerId}</div>
          <div className="text-xs ig-text-dim">@{peerId}</div>
        </div>
      </header>

      <div className="flex-1 overflow-auto p-4 space-y-2">
        {merged.length === 0 && (
          <div className="text-center ig-text-soft text-sm py-10">
            Sin mensajes aún. Saluda 👋
          </div>
        )}
        {merged.map((m, i) => {
          const mine = sent?.some((x) => x.messageId === m.messageId);
          return (
            <div key={m.messageId || i} className={cx("flex", mine ? "justify-end" : "justify-start")}>
              <div
                className={cx(
                  "max-w-[70%] px-3 py-2 rounded-2xl text-sm",
                  mine ? "bg-ig-link text-white" : "bg-ig-elevated"
                )}
              >
                <div>{m.content}</div>
                <div className={cx("text-[10px] mt-0.5 flex items-center gap-1", mine ? "text-white/70" : "ig-text-dim")}>
                  {m.isEncrypted && <Lock size={9} />}
                  {timeAgo(m.sentAt)}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <footer className="border-t ig-border p-3 flex gap-2">
        <input
          className="ig-input flex-1"
          placeholder={`Mensaje a ${peerQ.data?.username || peerId}`}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && text.trim() && send.mutate()}
        />
        <button
          onClick={() => text.trim() && send.mutate()}
          disabled={!text.trim() || send.isPending}
          className="ig-btn-primary"
        >
          {send.isPending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
        </button>
      </footer>
    </section>
  );
}
