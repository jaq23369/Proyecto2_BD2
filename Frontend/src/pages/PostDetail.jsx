import { useParams, Link, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { Heart, MessageCircle, Bookmark, Share2, Send, Trash2, MapPin, MoreHorizontal, CornerDownRight } from "lucide-react";
import toast from "react-hot-toast";
import { postsApi, commentsApi } from "../api/domain";
import { useCurrentUser } from "../auth/CurrentUser";
import Avatar from "../components/Avatar";
import Spinner from "../components/Spinner";
import EmptyState from "../components/EmptyState";
import { timeAgo, compactNumber, cx } from "../utils/format";

export default function PostDetail() {
  const { postId } = useParams();
  const { user } = useCurrentUser();
  const qc = useQueryClient();
  const nav = useNavigate();
  const [reply, setReply] = useState({ to: null, text: "" });
  const [text, setText] = useState("");
  const [sentiment, setSentiment] = useState("neutral");

  const postQ = useQuery({
    queryKey: ["post", postId],
    queryFn: () => postsApi.get(postId).then((r) => r.data),
  });
  const authorQ = useQuery({
    queryKey: ["post-author", postId],
    queryFn: () => postsApi.author(postId).then((r) => r.data),
  });
  const commentsQ = useQuery({
    queryKey: ["comments", postId],
    queryFn: () => postsApi.comments(postId).then((r) => r.data || []),
  });

  const [liked, setLiked] = useState(false);

  const likedQ = useQuery({
    queryKey: ["check-liked", postId, user?.userId],
    queryFn: () => postsApi.checkLiked(postId, user.userId).then((r) => r.data?.liked || false),
    enabled: !!user?.userId && !!postId,
  });

  useEffect(() => {
    if (likedQ.data !== undefined) setLiked(likedQ.data);
  }, [likedQ.data]);

  const like = useMutation({
    mutationFn: () =>
      liked
        ? postsApi.unlike(postId, user.userId)
        : postsApi.like(postId, user.userId),
    onSuccess: () => {
      setLiked((v) => !v);
      qc.invalidateQueries({ queryKey: ["post", postId] });
      qc.invalidateQueries({ queryKey: ["check-liked", postId, user?.userId] });
    },
  });
  const save = useMutation({
    mutationFn: () => postsApi.save(postId, user.userId),
    onSuccess: () => toast.success("Guardado"),
  });
  const removeMut = useMutation({
    mutationFn: () => postsApi.remove(postId),
    onSuccess: () => { toast.success("Post eliminado"); nav("/"); },
  });
  const addComment = useMutation({
    mutationFn: () => commentsApi.create({
      userId: user.userId, postId, content: text, sentiment,
    }),
    onSuccess: () => { setText(""); qc.invalidateQueries({ queryKey: ["comments", postId] }); },
  });
  const replyComment = useMutation({
    mutationFn: () => commentsApi.reply(reply.to, {
      userId: user.userId, postId, content: reply.text, sentiment: "neutral",
    }),
    onSuccess: () => { setReply({ to: null, text: "" }); qc.invalidateQueries({ queryKey: ["comments", postId] }); },
  });

  if (postQ.isLoading) return <div className="p-10 grid place-items-center"><Spinner /></div>;
  if (!postQ.data) return <div className="p-10"><EmptyState title="Post no encontrado" /></div>;
  const p = postQ.data;
  const a = authorQ.data;
  const isOwner = a?.userId === user.userId;

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <div className="ig-card overflow-hidden grid md:grid-cols-[1fr_380px]">
        {/* Media side */}
        <div className="bg-black min-h-[320px] md:min-h-[600px] grid place-items-center p-6">
          {p.mediaUrls?.[0] ? (
            <img src={p.mediaUrls[0]} alt="" className="max-w-full max-h-[600px] object-contain" />
          ) : (
            <div className="text-center max-w-md">
              <div className="text-2xl font-light leading-relaxed whitespace-pre-line">
                {p.content}
              </div>
            </div>
          )}
        </div>

        {/* Comments side */}
        <div className="flex flex-col min-h-[600px]">
          <header className="flex items-center gap-3 px-4 py-3 border-b ig-border">
            <Link to={a ? `/profile/${a.userId}` : "#"}>
              <Avatar user={a} size={36} ring />
            </Link>
            <div className="flex-1 min-w-0">
              <Link to={a ? `/profile/${a.userId}` : "#"} className="font-semibold text-sm hover:underline">
                {a?.username || "usuario"}
              </Link>
              {p.location && (
                <div className="text-xs ig-text-dim flex items-center gap-1">
                  <MapPin size={10} /> {p.location}
                </div>
              )}
            </div>
            {isOwner && (
              <button onClick={() => confirm("¿Eliminar post?") && removeMut.mutate()} className="p-1.5 rounded-lg hover:bg-ig-elevated">
                <Trash2 size={16} />
              </button>
            )}
          </header>

          <div className="flex-1 overflow-auto px-4 py-3 space-y-3">
            {p.mediaUrls?.[0] && p.content && (
              <div className="flex gap-3 pb-3 border-b ig-border">
                <Avatar user={a} size={32} />
                <div className="flex-1 text-sm">
                  <Link to={a ? `/profile/${a.userId}` : "#"} className="font-semibold mr-2">{a?.username}</Link>
                  <span>{p.content}</span>
                  <div className="text-[11px] ig-text-dim mt-1">{timeAgo(p.createdAt)}</div>
                </div>
              </div>
            )}

            {commentsQ.isLoading && <Spinner />}
            {!commentsQ.isLoading && (commentsQ.data || []).length === 0 && (
              <div className="text-center ig-text-soft text-sm py-10">
                Sé el primero en comentar
              </div>
            )}

            {(commentsQ.data || []).map((c) => (
              <CommentItem key={c.commentId} c={c} onReply={() => setReply({ to: c.commentId, text: "" })} />
            ))}
          </div>

          <div className="px-4 py-2 border-t ig-border flex items-center gap-1">
            <button onClick={() => like.mutate()} className="p-2 rounded-full hover:bg-ig-elevated">
              <Heart size={22} className={cx("transition", liked && "fill-ig-danger text-ig-danger")} />
            </button>
            <button className="p-2 rounded-full hover:bg-ig-elevated">
              <MessageCircle size={22} />
            </button>
            <button
              className="p-2 rounded-full hover:bg-ig-elevated"
              onClick={() => { navigator.clipboard?.writeText(`${location.origin}/post/${postId}`); toast.success("Link copiado"); }}
            >
              <Share2 size={22} />
            </button>
            <button onClick={() => save.mutate()} className="p-2 rounded-full hover:bg-ig-elevated ml-auto">
              <Bookmark size={22} />
            </button>
          </div>

          <div className="px-4 py-1 text-sm font-semibold border-t ig-border">
            {compactNumber(p.likesCount || 0)} me gusta
          </div>
          <div className="px-4 pb-2 text-[11px] ig-text-dim">{timeAgo(p.createdAt)}</div>

          {reply.to ? (
            <div className="border-t ig-border p-2 flex items-center gap-2">
              <CornerDownRight size={14} className="ig-text-soft" />
              <input
                className="flex-1 bg-transparent outline-none text-sm"
                placeholder={`Responder al comentario...`}
                value={reply.text}
                onChange={(e) => setReply((r) => ({ ...r, text: e.target.value }))}
                autoFocus
              />
              <button className="text-xs font-semibold text-ig-link" onClick={() => reply.text.trim() && replyComment.mutate()}>
                Responder
              </button>
              <button className="text-xs ig-text-soft" onClick={() => setReply({ to: null, text: "" })}>X</button>
            </div>
          ) : (
            <div className="border-t ig-border p-2 flex items-center gap-2">
              <select value={sentiment} onChange={(e) => setSentiment(e.target.value)} className="bg-transparent text-xs ig-text-soft">
                <option>neutral</option>
                <option>positive</option>
                <option>negative</option>
              </select>
              <input
                className="flex-1 bg-transparent outline-none text-sm"
                placeholder="Añade un comentario..."
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && text.trim() && addComment.mutate()}
              />
              <button
                disabled={!text.trim() || addComment.isPending}
                onClick={() => addComment.mutate()}
                className="text-xs font-semibold text-ig-link disabled:opacity-40"
              >
                <Send size={14} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function CommentItem({ c, onReply }) {
  return (
    <div className="flex gap-3 py-1">
      <div className="w-8 h-8 rounded-full bg-ig-elevated grid place-items-center text-[10px] font-bold shrink-0">
        {(c.commentId || "?").slice(0, 2).toUpperCase()}
      </div>
      <div className="flex-1 text-sm min-w-0">
        <span className="font-semibold mr-2">@usuario</span>
        <span>{c.content}</span>
        <div className="text-[11px] ig-text-dim mt-0.5 flex items-center gap-3">
          <span>{timeAgo(c.createdAt)}</span>
          {c.sentiment && c.sentiment !== "neutral" && (
            <span className={cx("ig-pill", c.sentiment === "negative" && "text-ig-danger")}>{c.sentiment}</span>
          )}
          {c.likesCount > 0 && <span>{c.likesCount} likes</span>}
          <button onClick={onReply} className="hover:text-ig-text">Responder</button>
        </div>
      </div>
    </div>
  );
}
