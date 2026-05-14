import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Hash, TrendingUp } from "lucide-react";
import { hashtagsApi } from "../api/domain";
import Spinner from "../components/Spinner";
import EmptyState from "../components/EmptyState";
import { compactNumber, timeAgo } from "../utils/format";

export default function Hashtag() {
  const { name } = useParams();
  const tagQ = useQuery({
    queryKey: ["hashtag", name],
    queryFn: () => hashtagsApi.get(name).then((r) => r.data),
  });
  const postsQ = useQuery({
    queryKey: ["hashtag-posts", name],
    queryFn: () => hashtagsApi.posts(name).then((r) => r.data || []),
  });
  if (tagQ.isLoading) return <div className="p-10 grid place-items-center"><Spinner /></div>;

  const t = tagQ.data;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <header className="flex items-center gap-5 mb-8">
        <div className="w-24 h-24 rounded-full bg-ig-gradient grid place-items-center">
          <Hash size={42} className="text-white" />
        </div>
        <div className="flex-1">
          <h1 className="text-2xl font-bold mb-1">#{name}</h1>
          {t && (
            <div className="flex flex-wrap gap-3 text-sm">
              <span><strong>{compactNumber(t.postsCount || 0)}</strong> posts</span>
              <span><strong>{compactNumber(t.followersCount || 0)}</strong> seguidores</span>
              {t.isTrending && <span className="ig-pill text-ig-link"><TrendingUp size={11} /> trending</span>}
            </div>
          )}
          {t?.relatedTopics?.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {t.relatedTopics.slice(0, 5).map((r) => (
                <Link key={r} to={`/hashtag/${r.toLowerCase()}`} className="ig-pill">#{r}</Link>
              ))}
            </div>
          )}
        </div>
      </header>

      <h2 className="ig-section-title mb-3">Publicaciones recientes</h2>
      {postsQ.isLoading ? (
        <div className="p-10 grid place-items-center"><Spinner /></div>
      ) : (postsQ.data || []).length === 0 ? (
        <EmptyState icon={Hash} title="Sin posts" hint={`Aún no hay publicaciones con #${name}`} />
      ) : (
        <div className="grid grid-cols-3 gap-1">
          {postsQ.data.map((p) => (
            <Link key={p.postId} to={`/post/${p.postId}`} className="aspect-square bg-ig-elevated overflow-hidden relative group">
              {p.mediaUrls?.[0] ? (
                <img src={p.mediaUrls[0]} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="p-3 text-xs ig-text-soft overflow-hidden">{p.content}</div>
              )}
              <div className="absolute bottom-1 left-1 text-[10px] text-white/80">{timeAgo(p.createdAt)}</div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
