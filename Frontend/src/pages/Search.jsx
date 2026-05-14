import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search as SearchIcon, User as UserIcon, Hash, FileText, Users } from "lucide-react";
import { Link } from "react-router-dom";
import { usersApi, hashtagsApi, postsApi, groupsApi } from "../api/domain";
import Avatar from "../components/Avatar";
import { compactNumber, cx } from "../utils/format";

export default function Search() {
  const [q, setQ] = useState("");
  const [tab, setTab] = useState("users");

  const users = useQuery({ queryKey: ["s-users"], queryFn: () => usersApi.list({ limit: 100 }).then((r) => r.data || []) });
  const tags = useQuery({ queryKey: ["s-tags"], queryFn: () => hashtagsApi.list({ limit: 100 }).then((r) => r.data || []) });
  const posts = useQuery({ queryKey: ["s-posts"], queryFn: () => postsApi.list({ limit: 100 }).then((r) => r.data || []) });
  const groups = useQuery({ queryKey: ["s-groups"], queryFn: () => groupsApi.list({ limit: 100 }).then((r) => r.data || []) });

  const needle = q.trim().toLowerCase();
  const fUsers = (users.data || []).filter((u) => !needle || `${u.username} ${u.userId} ${u.email}`.toLowerCase().includes(needle));
  const fTags = (tags.data || []).filter((h) => !needle || h.name.toLowerCase().includes(needle));
  const fPosts = (posts.data || []).filter((p) => !needle || (p.content || "").toLowerCase().includes(needle));
  const fGroups = (groups.data || []).filter((g) => !needle || `${g.name} ${g.description || ""}`.toLowerCase().includes(needle));

  const TABS = [
    { id: "users", icon: UserIcon, label: `Usuarios · ${fUsers.length}` },
    { id: "hashtags", icon: Hash, label: `Hashtags · ${fTags.length}` },
    { id: "posts", icon: FileText, label: `Posts · ${fPosts.length}` },
    { id: "groups", icon: Users, label: `Grupos · ${fGroups.length}` },
  ];

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="relative mb-4">
        <SearchIcon size={16} className="absolute left-4 top-1/2 -translate-y-1/2 ig-text-dim" />
        <input
          autoFocus
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar usuarios, hashtags, posts, grupos..."
          className="ig-input w-full pl-11 py-3 text-base"
        />
      </div>

      <div className="flex gap-1 p-1 bg-ig-elevated rounded-xl mb-5 overflow-x-auto">
        {TABS.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)} className={cx("ig-tab whitespace-nowrap flex items-center gap-1.5", tab === t.id && "ig-tab-active")}>
            <t.icon size={13} /> {t.label}
          </button>
        ))}
      </div>

      <div className="ig-card divide-y divide-ig-border">
        {tab === "users" && fUsers.slice(0, 50).map((u) => (
          <Link key={u.userId} to={`/profile/${u.userId}`} className="flex items-center gap-3 px-4 py-3 hover:bg-ig-elevated">
            <Avatar user={u} size={40} ring />
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-sm">{u.username}</div>
              <div className="text-xs ig-text-dim truncate">{u.bio || u.email}</div>
            </div>
          </Link>
        ))}
        {tab === "hashtags" && fTags.slice(0, 50).map((h) => (
          <Link key={h.name} to={`/hashtag/${h.name}`} className="flex items-center gap-3 px-4 py-3 hover:bg-ig-elevated">
            <div className="w-10 h-10 rounded-full bg-ig-elevated grid place-items-center"><Hash size={16} /></div>
            <div className="flex-1">
              <div className="font-semibold text-sm">#{h.name}</div>
              <div className="text-xs ig-text-dim">{compactNumber(h.postsCount || 0)} posts</div>
            </div>
          </Link>
        ))}
        {tab === "posts" && fPosts.slice(0, 50).map((p) => (
          <Link key={p.postId} to={`/post/${p.postId}`} className="block px-4 py-3 hover:bg-ig-elevated">
            <div className="text-sm line-clamp-2">{p.content}</div>
            <div className="text-xs ig-text-dim mt-0.5">♥ {p.likesCount} · 💬 {p.commentsCount}</div>
          </Link>
        ))}
        {tab === "groups" && fGroups.slice(0, 50).map((g) => (
          <Link key={g.groupId} to={`/groups/${g.groupId}`} className="flex items-center gap-3 px-4 py-3 hover:bg-ig-elevated">
            <div className="w-10 h-10 rounded-xl bg-ig-gradient grid place-items-center text-white font-bold">{g.name?.[0]?.toUpperCase() || "G"}</div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-sm truncate">{g.name}</div>
              <div className="text-xs ig-text-dim">{compactNumber(g.membersCount || 0)} miembros</div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
