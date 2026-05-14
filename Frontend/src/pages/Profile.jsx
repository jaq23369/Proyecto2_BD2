import { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  BadgeCheck, MapPin, Calendar, Settings, MessageCircle, UserPlus, UserMinus,
  Ban, Image as ImageIcon, Bookmark, Tag, Grid3x3,
} from "lucide-react";
import toast from "react-hot-toast";
import { usersApi, postsApi } from "../api/domain";
import { relsApi } from "../api/relationships";
import { useCurrentUser } from "../auth/CurrentUser";
import Avatar from "../components/Avatar";
import UserRow from "../components/UserRow";
import Modal from "../components/Modal";
import Spinner from "../components/Spinner";
import EmptyState from "../components/EmptyState";
import { compactNumber, timeAgo, cx } from "../utils/format";

export default function Profile() {
  const { userId } = useParams();
  const { user: me, refresh } = useCurrentUser();
  const nav = useNavigate();
  const qc = useQueryClient();
  const isMe = me?.userId === userId;
  const [modal, setModal] = useState(null);
  const [tab, setTab] = useState("posts");

  const userQ = useQuery({
    queryKey: ["user", userId],
    queryFn: () => usersApi.get(userId).then((r) => r.data),
  });

  const followersQ = useQuery({
    queryKey: ["followers", userId],
    queryFn: () => usersApi.followers(userId, { limit: 50 }).then((r) => r.data || []),
  });

  const followingQ = useQuery({
    queryKey: ["following-list", userId],
    queryFn: () => usersApi.following(userId, { limit: 50 }).then((r) => r.data || []),
  });

  // ¿yo lo sigo?
  const meFollowsQ = useQuery({
    queryKey: ["me-follows", me?.userId, userId],
    queryFn: () => usersApi.following(me.userId, { limit: 200 }).then((r) => r.data || []),
    enabled: !!me && !isMe,
  });
  const iFollow = !!meFollowsQ.data?.find((u) => u.userId === userId);

  const followMut = useMutation({
    mutationFn: () =>
      iFollow ? usersApi.unfollow(me.userId, userId) : usersApi.follow(me.userId, userId),
    onSuccess: () => {
      toast.success(iFollow ? "Dejaste de seguir" : "Ahora sigues");
      qc.invalidateQueries({ queryKey: ["me-follows"] });
      qc.invalidateQueries({ queryKey: ["followers", userId] });
      qc.invalidateQueries({ queryKey: ["following", userId] });
    },
  });

  const blockMut = useMutation({
    mutationFn: () => usersApi.block(me.userId, userId),
    onSuccess: () => toast.success("Usuario bloqueado"),
  });

  const deleteMut = useMutation({
    mutationFn: () => usersApi.remove(userId),
    onSuccess: () => {
      toast.success("Cuenta eliminada");
      if (isMe) { nav("/login"); }
    },
  });

  if (userQ.isLoading) {
    return <div className="p-10 grid place-items-center"><Spinner /></div>;
  }
  if (!userQ.data) {
    return (
      <div className="p-10">
        <EmptyState title="Usuario no encontrado" hint={`No existe un User con id ${userId}`} />
      </div>
    );
  }
  const u = userQ.data;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <header className="grid md:grid-cols-[180px_1fr] gap-8 items-start mb-10">
        <div className="flex justify-center">
          <Avatar user={u} size={150} ring />
        </div>

        <div>
          <div className="flex items-center gap-3 flex-wrap mb-3">
            <h1 className="text-2xl font-light flex items-center gap-2">
              {u.username}
              {u.isVerified && <BadgeCheck size={20} className="text-ig-link" />}
            </h1>

            {isMe ? (
              <>
                <Link to={`/profile/${userId}/edit`} className="ig-btn-ghost ig-btn-sm">
                  <Settings size={14} /> Editar perfil
                </Link>
                <button
                  className="ig-btn-danger ig-btn-sm"
                  onClick={() => {
                    if (confirm("¿Eliminar tu cuenta? Esto borra el nodo User y todas sus relaciones.")) deleteMut.mutate();
                  }}
                >
                  Eliminar cuenta
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => followMut.mutate()}
                  className={cx(iFollow ? "ig-btn-ghost" : "ig-btn-primary", "ig-btn-sm")}
                >
                  {iFollow ? <><UserMinus size={14} /> Siguiendo</> : <><UserPlus size={14} /> Seguir</>}
                </button>
                <Link to={`/messages/${userId}`} className="ig-btn-ghost ig-btn-sm">
                  <MessageCircle size={14} /> Mensaje
                </Link>
                <button onClick={() => blockMut.mutate()} className="ig-btn-ghost ig-btn-sm">
                  <Ban size={14} /> Bloquear
                </button>
              </>
            )}
          </div>

          <div className="flex gap-6 mb-3 text-sm">
            <button onClick={() => setModal("posts-count")} className="hover:underline">
              <strong>{compactNumber(u.postsCount || 0)}</strong> publicaciones
            </button>
            <button onClick={() => setModal("followers")} className="hover:underline">
              <strong>{compactNumber((followersQ.data || []).length)}</strong> seguidores
            </button>
            <button onClick={() => setModal("following")} className="hover:underline">
              <strong>{compactNumber((followingQ.data || []).length)}</strong> seguidos
            </button>
          </div>

          {u.bio && <p className="text-sm whitespace-pre-line max-w-prose mb-2">{u.bio}</p>}

          <div className="flex flex-wrap gap-3 text-xs ig-text-soft">
            <span className="inline-flex items-center gap-1"><MapPin size={12} /> {u.userId}</span>
            {u.birthDate && <span className="inline-flex items-center gap-1"><Calendar size={12} /> nac. {u.birthDate}</span>}
            {u.createdAt && <span className="inline-flex items-center gap-1"><Calendar size={12} /> se unió {u.createdAt}</span>}
            <span className="ig-pill">{u.email}</span>
            {Array.isArray(u.interests) && u.interests.slice(0, 4).map((i) => (
              <span key={i} className="ig-pill">#{i}</span>
            ))}
          </div>
        </div>
      </header>

      <div className="border-t ig-border mb-2">
        <div className="flex justify-center gap-1 -mt-px">
          {[
            { id: "posts", label: "Publicaciones", icon: Grid3x3 },
            { id: "saved", label: "Guardado", icon: Bookmark },
            { id: "tagged", label: "Etiquetado", icon: Tag },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={cx(
                "flex items-center gap-2 px-6 py-3 text-xs font-semibold uppercase tracking-wider transition border-t-2",
                tab === t.id ? "border-ig-text text-ig-text" : "border-transparent ig-text-dim hover:text-ig-text"
              )}
            >
              <t.icon size={12} /> {t.label}
            </button>
          ))}
        </div>
      </div>

      {tab === "posts" && <UserPostsGrid userId={userId} />}
      {tab === "saved" && (
        <div className="mt-6">
          <EmptyState icon={Bookmark} title="Posts guardados" hint="(Disponible vía /api/users/.../saved en backend — UI pendiente)" />
        </div>
      )}
      {tab === "tagged" && (
        <div className="mt-6">
          <EmptyState icon={Tag} title="Posts etiquetados" hint="Próximamente" />
        </div>
      )}

      <Modal open={modal === "followers"} onClose={() => setModal(null)} title="Seguidores">
        <div className="px-3 py-2 max-h-[60vh] overflow-auto">
          {(followersQ.data || []).length === 0 && <div className="p-6 ig-text-soft text-sm text-center">Sin seguidores aún</div>}
          {(followersQ.data || []).map((f) => (
            <UserRow key={f.userId} user={f} />
          ))}
        </div>
      </Modal>

      <Modal open={modal === "following"} onClose={() => setModal(null)} title="Siguiendo">
        <div className="px-3 py-2 max-h-[60vh] overflow-auto">
          {(followingQ.data || []).length === 0 && <div className="p-6 ig-text-soft text-sm text-center">No sigue a nadie aún</div>}
          {(followingQ.data || []).map((f) => (
            <UserRow key={f.userId} user={f} />
          ))}
        </div>
      </Modal>
    </div>
  );
}

function UserPostsGrid({ userId }) {
  // We need posts authored by this user — use /relationships?type=POSTED filter is broken,
  // so we list all posts and filter; better use a dedicated query via the recent-with-authors then filter.
  const { data, isLoading } = useQuery({
    queryKey: ["user-posts", userId],
    queryFn: () => postsApi.recentWithAuthors(200).then((r) => r.data || []),
  });

  const mine = (data || []).filter((it) => it.author?.userId === userId);

  if (isLoading) return <div className="p-10 grid place-items-center"><Spinner /></div>;
  if (mine.length === 0) {
    return <EmptyState icon={ImageIcon} title="Sin publicaciones" hint="Cuando publiques aparecerán aquí." className="mt-6" />;
  }
  return (
    <div className="grid grid-cols-3 gap-1 mt-2">
      {mine.map((it) => (
        <Link
          key={it.post.postId}
          to={`/post/${it.post.postId}`}
          className="aspect-square bg-ig-elevated overflow-hidden relative group"
        >
          {it.post.mediaUrls?.[0] ? (
            <img src={it.post.mediaUrls[0]} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full p-3 text-xs ig-text-soft overflow-hidden">
              {it.post.content}
            </div>
          )}
          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-4 text-white text-sm font-semibold">
            <span>♥ {it.post.likesCount || 0}</span>
            <span>💬 {it.post.commentsCount || 0}</span>
          </div>
          <div className="absolute bottom-1 left-1 text-[10px] text-white/80">{timeAgo(it.post.createdAt)}</div>
        </Link>
      ))}
    </div>
  );
}
