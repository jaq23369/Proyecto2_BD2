import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import {
  TrendingUp, Crown, Heart, Users, Frown, Activity, BadgeCheck, Hash
} from "lucide-react";
import { queriesApi } from "../api/queries";
import Avatar from "../components/Avatar";
import Spinner from "../components/Spinner";
import { compactNumber, timeAgo, cx } from "../utils/format";

const OWNER_COLORS = {
  Joel: "border-pink-500/40 text-pink-400",
  Nery: "border-blue-500/40 text-blue-400",
  Luis: "border-emerald-500/40 text-emerald-400",
};

export default function Explore() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold mb-1">Explorar</h1>
        <p className="ig-text-soft">
          Las 6 consultas Cypher de la rúbrica, presentadas como secciones de descubrimiento.
        </p>
      </header>

      <div className="grid lg:grid-cols-2 gap-6">
        <Section
          owner="Joel"
          icon={Crown}
          title="Top Influencers"
          subtitle="Usuarios con más seguidores"
          query={() => queriesApi.topInfluencers(10)}
          render={(rows) => (
            <ul className="divide-y divide-ig-border">
              {rows.map((r, i) => (
                <li key={r.userId} className="flex items-center gap-3 py-2.5">
                  <span className="w-6 text-center text-sm font-bold ig-grad-text">{i + 1}</span>
                  <Avatar user={{ username: r.username, userId: r.userId }} size={36} ring />
                  <Link to={`/profile/${r.userId}`} className="flex-1 min-w-0">
                    <div className="font-semibold text-sm truncate">{r.username}</div>
                    <div className="text-xs ig-text-dim">@{r.userId}</div>
                  </Link>
                  <div className="text-sm font-semibold">{compactNumber(r.followers)}</div>
                </li>
              ))}
            </ul>
          )}
        />

        <Section
          owner="Joel"
          icon={TrendingUp}
          title="Hashtags en tendencia"
          subtitle="Más usados en los últimos 10000 días"
          query={() => queriesApi.trendingHashtags(10000, 10)}
          render={(rows) => (
            <div className="grid grid-cols-2 gap-2">
              {rows.map((r) => (
                <Link
                  key={r.hashtag}
                  to={`/hashtag/${r.hashtag}`}
                  className="ig-surface p-3 rounded-xl hover:bg-ig-elevated"
                >
                  <div className="font-semibold text-sm flex items-center gap-1"><Hash size={12} />{r.hashtag}</div>
                  <div className="text-xs ig-text-dim">{compactNumber(r.uses)} usos</div>
                </Link>
              ))}
            </div>
          )}
        />

        <Section
          owner="Nery"
          icon={Heart}
          title="Posts más gustados"
          subtitle="Ordenados por likes activos"
          query={() => queriesApi.mostLikedPosts(10)}
          render={(rows) => (
            <ul className="divide-y divide-ig-border">
              {rows.map((p) => (
                <li key={p.postId} className="py-3">
                  <Link to={`/post/${p.postId}`} className="block">
                    <div className="flex items-center justify-between gap-3 mb-1">
                      <span className="text-xs ig-text-dim">por @{p.author || "?"}</span>
                      <span className="text-xs font-semibold">♥ {compactNumber(p.likes)}</span>
                    </div>
                    <p className="text-sm line-clamp-2">{p.content}</p>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        />

        <Section
          owner="Nery"
          icon={Users}
          title="Grupos más grandes"
          subtitle="Por cantidad de miembros"
          query={() => queriesApi.largestGroups(10)}
          render={(rows) => (
            <ul className="divide-y divide-ig-border">
              {rows.map((g) => (
                <li key={g.groupId}>
                  <Link to={`/groups/${g.groupId}`} className="flex items-center gap-3 py-2.5 hover:bg-ig-elevated px-2 -mx-2 rounded-lg">
                    <div className="w-10 h-10 rounded-xl bg-ig-gradient grid place-items-center text-white font-bold">
                      {g.name?.[0]?.toUpperCase() || "G"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-sm truncate">{g.name}</div>
                      <div className="text-xs ig-text-dim truncate">{g.description || "sin descripción"}</div>
                    </div>
                    <div className="text-sm font-semibold">{compactNumber(g.members)}</div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        />

        <Section
          owner="Luis"
          icon={Frown}
          title="Comentarios negativos"
          subtitle="Sentiment = 'negative', moderación"
          query={() => queriesApi.negativeComments(15)}
          render={(rows) => (
            <ul className="divide-y divide-ig-border max-h-[420px] overflow-auto">
              {rows.map((c) => (
                <li key={c.commentId} className="py-2.5">
                  <p className="text-sm line-clamp-2">"{c.content}"</p>
                  <div className="text-xs ig-text-dim mt-1 flex items-center gap-2">
                    <span>@{c.author || "?"}</span>
                    <span>·</span>
                    <span>{timeAgo(c.createdAt)}</span>
                    <span className="ig-pill text-ig-danger">negative</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        />

        <Section
          owner="Luis"
          icon={Activity}
          title="Usuarios más activos"
          subtitle="Posts + comentarios sumados"
          query={() => queriesApi.mostActiveUsers(10)}
          render={(rows) => (
            <ul className="divide-y divide-ig-border">
              {rows.map((u, i) => (
                <li key={u.userId} className="flex items-center gap-3 py-2.5">
                  <span className="w-6 text-center text-sm font-bold ig-grad-text">{i + 1}</span>
                  <Avatar user={{ username: u.username, userId: u.userId }} size={36} ring />
                  <Link to={`/profile/${u.userId}`} className="flex-1 min-w-0">
                    <div className="font-semibold text-sm truncate">{u.username}</div>
                    <div className="text-xs ig-text-dim">{u.posts} posts · {u.comments} comentarios</div>
                  </Link>
                  <div className="text-sm font-semibold">{u.activity}</div>
                </li>
              ))}
            </ul>
          )}
        />
      </div>
    </div>
  );
}

function Section({ owner, icon: Icon, title, subtitle, query, render }) {
  const q = useQuery({
    queryKey: [`q-${title}`],
    queryFn: () => query().then((r) => r.data || []),
  });
  return (
    <section className="ig-card p-5">
      <header className="flex items-start gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-ig-elevated grid place-items-center">
          <Icon size={18} />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h2 className="font-semibold">{title}</h2>
            <span className={cx("ig-pill border", OWNER_COLORS[owner])}>{owner}</span>
          </div>
          <p className="text-xs ig-text-soft">{subtitle}</p>
        </div>
      </header>
      {q.isLoading ? <div className="grid place-items-center py-8"><Spinner /></div>
        : !q.data || q.data.length === 0 ? <div className="text-center py-6 ig-text-soft text-sm">Sin resultados</div>
        : render(q.data)}
    </section>
  );
}
