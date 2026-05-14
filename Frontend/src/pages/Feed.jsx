import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Sparkles, TrendingUp, PlusSquare, Database } from "lucide-react";
import { useCurrentUser } from "../auth/CurrentUser";
import { usersApi, postsApi } from "../api/domain";
import { queriesApi } from "../api/queries";
import { ingestApi } from "../api/ingest";
import PostCard from "../components/PostCard";
import UserRow from "../components/UserRow";
import Avatar from "../components/Avatar";
import EmptyState from "../components/EmptyState";
import Spinner from "../components/Spinner";
import { compactNumber } from "../utils/format";

export default function Feed() {
  const { user } = useCurrentUser();

  const feedQ = useQuery({
    queryKey: ["feed-authors", user.userId],
    queryFn: () => postsApi.feedWithAuthors(user.userId, 20).then((r) => r.data || []),
  });

  const recentQ = useQuery({
    queryKey: ["recent-authors"],
    queryFn: () => postsApi.recentWithAuthors(15).then((r) => r.data || []),
    enabled: !feedQ.isLoading && (feedQ.data?.length ?? 0) === 0,
  });

  const followingQ = useQuery({
    queryKey: ["following", user.userId],
    queryFn: () => usersApi.following(user.userId, { limit: 10 }).then((r) => r.data || []),
  });

  const stories = followingQ.data || [];
  const items = (feedQ.data?.length ? feedQ.data : recentQ.data) || [];

  return (
    <div className="grid xl:grid-cols-[minmax(0,1fr)_320px] gap-8 max-w-[1100px] mx-auto px-4 py-6">
      <div className="min-w-0">
        {stories.length > 0 && (
          <div className="ig-card p-4 mb-6">
            <div className="flex gap-4 overflow-x-auto">
              <Link to={`/profile/${user.userId}`} className="flex flex-col items-center gap-1 shrink-0 w-16">
                <div className="relative">
                  <Avatar user={user} size={56} />
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-ig-link border-2 border-ig-bg grid place-items-center">
                    <PlusSquare size={10} />
                  </div>
                </div>
                <span className="text-[11px] truncate max-w-full">Tu historia</span>
              </Link>
              {stories.map((s) => (
                <Link key={s.userId} to={`/profile/${s.userId}`} className="flex flex-col items-center gap-1 shrink-0 w-16">
                  <Avatar user={s} size={56} ring />
                  <span className="text-[11px] truncate max-w-full">{s.username}</span>
                </Link>
              ))}
            </div>
          </div>
        )}

        {feedQ.isLoading && (
          <div className="ig-card p-10 flex justify-center"><Spinner /></div>
        )}

        {!feedQ.isLoading && items.length === 0 && (
          <EmptyState
            icon={Sparkles}
            title="Tu feed está vacío"
            hint="Sigue a más usuarios o crea tu primer post."
            action={<Link to="/explore" className="ig-btn-accent">Explorar</Link>}
          />
        )}

        <div className="space-y-6">
          {items.map((it) => (
            <PostCard key={it.post.postId} post={it.post} author={it.author} />
          ))}
        </div>
      </div>

      <RightRail />
    </div>
  );
}

function RightRail() {
  const { user } = useCurrentUser();

  const trending = useQuery({
    queryKey: ["trending-rail"],
    queryFn: () => queriesApi.trendingHashtags(10000, 5).then((r) => r.data || []),
  });

  const suggestions = useQuery({
    queryKey: ["influencers-rail"],
    queryFn: () => queriesApi.topInfluencers(5).then((r) => r.data || []),
  });

  const status = useQuery({
    queryKey: ["status-rail"],
    queryFn: () => ingestApi.status().then((r) => r.data),
  });

  return (
    <aside className="hidden xl:block space-y-5 pt-2">
      <div className="flex items-center gap-3">
        <Avatar user={user} size={48} ring />
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-sm truncate">{user.username}</div>
          <div className="text-xs ig-text-dim truncate">{user.bio || user.email}</div>
        </div>
        <Link to={`/profile/${user.userId}/edit`} className="text-xs font-semibold text-ig-link">
          Editar
        </Link>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="ig-section-title">Sugerencias para ti</span>
          <Link to="/explore" className="text-xs font-semibold ig-text-soft hover:text-ig-text">Ver todas</Link>
        </div>
        <div className="ig-card divide-y divide-ig-border">
          {(suggestions.data || []).map((row) => (
            <div key={row.userId} className="px-3">
              <UserRow
                user={{ userId: row.userId, username: row.username }}
                subtitle={`${compactNumber(row.followers)} seguidores`}
                right={
                  <Link to={`/profile/${row.userId}`} className="text-xs font-semibold text-ig-link">
                    Ver
                  </Link>
                }
              />
            </div>
          ))}
        </div>
      </div>

      <div>
        <div className="flex items-center gap-2 mb-2">
          <TrendingUp size={14} className="ig-text-soft" />
          <span className="ig-section-title">Tendencias</span>
        </div>
        <div className="ig-card divide-y divide-ig-border">
          {(trending.data || []).map((h) => (
            <Link
              key={h.hashtag}
              to={`/hashtag/${h.hashtag}`}
              className="block px-4 py-3 hover:bg-ig-elevated"
            >
              <div className="font-semibold text-sm">#{h.hashtag}</div>
              <div className="text-xs ig-text-dim">{compactNumber(h.uses)} posts</div>
            </Link>
          ))}
        </div>
      </div>

      {status.data && (
        <div className="ig-card p-4 text-xs ig-text-soft">
          <div className="flex items-center gap-2 mb-2">
            <Database size={14} />
            <span className="font-semibold ig-text uppercase tracking-wider text-[10px]">Seed activo</span>
          </div>
          <div>{compactNumber(status.data.total)} nodos · grafo conexo</div>
        </div>
      )}
    </aside>
  );
}
