import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Image as ImageIcon, MapPin, Hash, Globe, Lock, Send, Loader2, Plus } from "lucide-react";
import toast from "react-hot-toast";
import { useCurrentUser } from "../auth/CurrentUser";
import { postsApi, hashtagsApi, groupsApi } from "../api/domain";
import Avatar from "../components/Avatar";
import { extractHashtags } from "../utils/format";

export default function NewPost() {
  const { user } = useCurrentUser();
  const nav = useNavigate();
  const [content, setContent] = useState("");
  const [location, setLocation] = useState("");
  const [mediaUrls, setMediaUrls] = useState([""]);
  const [isPublic, setIsPublic] = useState(true);
  const [shareInGroup, setShareInGroup] = useState("");

  const groupsQ = useQuery({
    queryKey: ["my-groups", user.userId],
    queryFn: () => groupsApi.list({ limit: 30 }).then((r) => r.data || []),
  });

  const tags = extractHashtags(content);

  const create = useMutation({
    mutationFn: async () => {
      const cleanMedia = mediaUrls.filter(Boolean);
      const res = await postsApi.create({
        userId: user.userId,
        content,
        location,
        mediaUrls: cleanMedia,
        isPublic,
      });
      const post = res.data;
      // tag hashtags
      for (const t of tags) {
        try { await hashtagsApi.create({ name: t }); } catch {}
        try { await postsApi.tag(post.postId, t); } catch {}
      }
      if (shareInGroup) {
        try { await postsApi.share(post.postId, shareInGroup); } catch {}
      }
      return post;
    },
    onSuccess: (post) => {
      toast.success("¡Publicado!");
      nav(`/post/${post.postId}`);
    },
  });

  const valid = content.trim().length > 0;

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Crear publicación</h1>

      <div className="ig-card p-5">
        <div className="flex items-start gap-3 mb-4">
          <Avatar user={user} size={44} ring />
          <div className="flex-1">
            <div className="font-semibold text-sm">{user.username}</div>
            <button
              onClick={() => setIsPublic((v) => !v)}
              className="ig-pill mt-1"
            >
              {isPublic ? <><Globe size={11} /> Público</> : <><Lock size={11} /> Privado</>}
            </button>
          </div>
        </div>

        <textarea
          autoFocus
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="¿Qué quieres compartir? Usa #hashtags para que se etiqueten automáticamente."
          className="ig-input w-full min-h-[160px] text-[15px] resize-y"
        />

        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {tags.map((t) => (
              <span key={t} className="ig-pill"><Hash size={10} />{t}</span>
            ))}
          </div>
        )}

        <div className="grid sm:grid-cols-2 gap-3 mt-4">
          <label className="block">
            <div className="text-xs ig-text-soft mb-1 flex items-center gap-1"><MapPin size={11} /> Ubicación</div>
            <input className="ig-input w-full" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Guatemala City, GT" />
          </label>
          <label className="block">
            <div className="text-xs ig-text-soft mb-1">Compartir en grupo (opcional)</div>
            <select className="ig-input w-full" value={shareInGroup} onChange={(e) => setShareInGroup(e.target.value)}>
              <option value="">— ninguno —</option>
              {(groupsQ.data || []).map((g) => (
                <option key={g.groupId} value={g.groupId}>{g.name}</option>
              ))}
            </select>
          </label>
        </div>

        <div className="mt-4">
          <div className="text-xs ig-text-soft mb-1 flex items-center gap-1"><ImageIcon size={11} /> URLs de media</div>
          {mediaUrls.map((u, i) => (
            <input
              key={i}
              className="ig-input w-full mb-2"
              value={u}
              onChange={(e) => setMediaUrls((arr) => arr.map((x, j) => j === i ? e.target.value : x))}
              placeholder="https://..."
            />
          ))}
          <button
            type="button"
            onClick={() => setMediaUrls((a) => [...a, ""])}
            className="ig-btn-ghost ig-btn-sm"
          >
            <Plus size={12} /> Añadir media
          </button>
        </div>

        <div className="flex justify-end gap-2 mt-6">
          <button onClick={() => nav(-1)} className="ig-btn-ghost">Cancelar</button>
          <button onClick={() => valid && create.mutate()} disabled={!valid || create.isPending} className="ig-btn-accent">
            {create.isPending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />} Publicar
          </button>
        </div>

        <p className="text-[11px] ig-text-dim mt-4">
          Crea un nodo <code>:Post</code> con 9 propiedades + relaciones <code>POSTED</code>, <code>TAGGED_WITH</code>, opcional <code>SHARED_IN</code>.
        </p>
      </div>
    </div>
  );
}
