import { useParams, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Users, Lock, Globe, UserPlus, UserMinus } from "lucide-react";
import toast from "react-hot-toast";
import { groupsApi, usersApi } from "../api/domain";
import { useCurrentUser } from "../auth/CurrentUser";
import Avatar from "../components/Avatar";
import UserRow from "../components/UserRow";
import PostCard from "../components/PostCard";
import Spinner from "../components/Spinner";
import EmptyState from "../components/EmptyState";
import { compactNumber } from "../utils/format";

export default function GroupDetail() {
  const { groupId } = useParams();
  const { user } = useCurrentUser();
  const qc = useQueryClient();

  const groupQ = useQuery({ queryKey: ["group", groupId], queryFn: () => groupsApi.get(groupId).then((r) => r.data) });
  const membersQ = useQuery({ queryKey: ["group-members", groupId], queryFn: () => groupsApi.members(groupId).then((r) => r.data || []) });
  const postsQ = useQuery({ queryKey: ["group-posts", groupId], queryFn: () => groupsApi.posts(groupId).then((r) => r.data || []) });

  const isMember = membersQ.data?.some((m) => m.user?.userId === user.userId);

  const join = useMutation({
    mutationFn: () =>
      isMember
        ? usersApi.leaveGroup(user.userId, groupId)
        : usersApi.joinGroup(user.userId, groupId),
    onSuccess: () => {
      toast.success(isMember ? "Saliste del grupo" : "Te uniste");
      qc.invalidateQueries({ queryKey: ["group-members", groupId] });
    },
  });

  if (groupQ.isLoading) return <div className="p-10 grid place-items-center"><Spinner /></div>;
  const g = groupQ.data;
  if (!g) return <EmptyState title="Grupo no encontrado" />;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <header className="ig-card p-6 mb-6">
        <div className="flex items-start gap-5 flex-wrap">
          <div className="w-20 h-20 rounded-2xl bg-ig-gradient grid place-items-center text-white text-3xl font-bold shrink-0">
            {g.name?.[0]?.toUpperCase() || "G"}
          </div>
          <div className="flex-1 min-w-[200px]">
            <h1 className="text-2xl font-bold flex items-center gap-2">
              {g.name}
              {g.isPrivate ? <Lock size={16} className="ig-text-dim" /> : <Globe size={16} className="ig-text-dim" />}
            </h1>
            <p className="ig-text-soft text-sm mt-1">{g.description}</p>
            <div className="flex gap-3 mt-3 text-sm">
              <span><strong>{compactNumber(g.membersCount || membersQ.data?.length || 0)}</strong> miembros</span>
              <span><strong>{compactNumber(postsQ.data?.length || 0)}</strong> posts</span>
            </div>
            {g.categories?.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-3">
                {g.categories.map((c) => <span key={c} className="ig-pill">{c}</span>)}
              </div>
            )}
          </div>
          <button
            onClick={() => join.mutate()}
            className={isMember ? "ig-btn-ghost" : "ig-btn-primary"}
          >
            {isMember ? <><UserMinus size={14} /> Salir</> : <><UserPlus size={14} /> Unirme</>}
          </button>
        </div>
      </header>

      <div className="grid lg:grid-cols-[1fr_280px] gap-6">
        <section>
          <h2 className="ig-section-title mb-3">Posts compartidos</h2>
          {postsQ.isLoading ? <Spinner /> :
            postsQ.data?.length === 0 ? <EmptyState icon={Users} title="Sin posts compartidos aquí" /> :
              <div className="space-y-4">
                {postsQ.data.map((p) => <PostCard key={p.postId} post={p} />)}
              </div>}
        </section>
        <aside>
          <h2 className="ig-section-title mb-3">Miembros</h2>
          <div className="ig-card divide-y divide-ig-border">
            {membersQ.data?.slice(0, 20).map((m) => (
              <div key={m.user.userId} className="px-3">
                <UserRow user={m.user} subtitle={m.role} />
              </div>
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
}
