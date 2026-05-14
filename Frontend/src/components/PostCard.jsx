import { Heart, MessageCircle, Bookmark, Share2, MapPin, MoreHorizontal } from "lucide-react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { useState, useEffect } from "react";
import Avatar from "./Avatar";
import { postsApi } from "../api/domain";
import { useCurrentUser } from "../auth/CurrentUser";
import { timeAgo, compactNumber, cx } from "../utils/format";

export default function PostCard({ post, author }) {
  const { user } = useCurrentUser();
  const qc = useQueryClient();
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  const [likes, setLikes] = useState(post?.likesCount || 0);

  // Check if the current user already liked this post
  const likedQ = useQuery({
    queryKey: ["check-liked", post.postId, user?.userId],
    queryFn: () => postsApi.checkLiked(post.postId, user.userId).then((r) => r.data?.liked || false),
    enabled: !!user?.userId && !!post?.postId,
  });

  useEffect(() => {
    if (likedQ.data !== undefined) setLiked(likedQ.data);
  }, [likedQ.data]);

  const likeMut = useMutation({
    mutationFn: () =>
      liked
        ? postsApi.unlike(post.postId, user.userId)
        : postsApi.like(post.postId, user.userId),
    onSuccess: (res) => {
      const data = res.data;
      if (data?.likesCount !== undefined) setLikes(data.likesCount);
      else setLikes((n) => n + (liked ? -1 : 1));
      setLiked((v) => !v);
      qc.invalidateQueries({ queryKey: ["feed"] });
      qc.invalidateQueries({ queryKey: ["check-liked", post.postId, user?.userId] });
    },
  });

  const saveMut = useMutation({
    mutationFn: () => postsApi.save(post.postId, user.userId),
    onSuccess: () => {
      setSaved(true);
      toast.success("Guardado");
    },
  });

  const onLike = () => {
    if (!user) return toast.error("Inicia sesión primero");
    likeMut.mutate();
  };
  const onSave = () => {
    if (!user) return toast.error("Inicia sesión primero");
    saveMut.mutate();
  };

  const authorLink = author?.userId ? `/profile/${author.userId}` : "#";
  const text = post.content || "";
  const hashtagged = text.split(/(\s+)/).map((part, i) =>
    /^#[\p{L}0-9_]+$/u.test(part) ? (
      <Link key={i} to={`/hashtag/${part.slice(1).toLowerCase()}`} className="text-ig-link hover:underline">
        {part}
      </Link>
    ) : (
      <span key={i}>{part}</span>
    )
  );

  return (
    <article className="ig-card overflow-hidden">
      <header className="flex items-center gap-3 px-4 py-3">
        <Link to={authorLink}>
          <Avatar user={author} size={36} ring />
        </Link>
        <div className="flex-1 min-w-0">
          <Link to={authorLink} className="font-semibold text-sm hover:underline">
            {author?.username || "usuario"}
          </Link>
          <div className="text-xs ig-text-dim flex items-center gap-1.5">
            {post.location && (
              <>
                <MapPin size={11} />
                <span>{post.location}</span>
                <span>·</span>
              </>
            )}
            <span>{timeAgo(post.createdAt)}</span>
            {!post.isPublic && <span className="ig-pill ml-1">privado</span>}
          </div>
        </div>
        <button className="p-1.5 rounded-lg hover:bg-ig-elevated">
          <MoreHorizontal size={18} />
        </button>
      </header>

      {Array.isArray(post.mediaUrls) && post.mediaUrls[0] ? (
        <div className="bg-black aspect-square overflow-hidden">
          <img src={post.mediaUrls[0]} alt="" className="w-full h-full object-cover" />
        </div>
      ) : (
        <div className="px-4 pb-1">
          <Link to={`/post/${post.postId}`} className="block py-3 text-[15px] leading-relaxed">
            {hashtagged}
          </Link>
        </div>
      )}

      <div className="px-3 pt-2 pb-1 flex items-center gap-1">
        <button onClick={onLike} className="p-2 rounded-full hover:bg-ig-elevated">
          <Heart size={22} className={cx("transition", liked && "fill-ig-danger text-ig-danger")} />
        </button>
        <Link to={`/post/${post.postId}`} className="p-2 rounded-full hover:bg-ig-elevated">
          <MessageCircle size={22} />
        </Link>
        <button className="p-2 rounded-full hover:bg-ig-elevated" onClick={() => {
          navigator.clipboard?.writeText(`${location.origin}/post/${post.postId}`);
          toast.success("Link copiado");
        }}>
          <Share2 size={22} />
        </button>
        <button onClick={onSave} className="p-2 rounded-full hover:bg-ig-elevated ml-auto">
          <Bookmark size={22} className={cx(saved && "fill-ig-text")} />
        </button>
      </div>

      <div className="px-4 pb-1 text-sm font-semibold">
        {compactNumber(likes)} me gusta
      </div>

      {post.mediaUrls?.[0] && text && (
        <div className="px-4 pb-2 text-sm">
          <Link to={authorLink} className="font-semibold mr-2">{author?.username || "usuario"}</Link>
          <span>{hashtagged}</span>
        </div>
      )}

      <Link to={`/post/${post.postId}`} className="block px-4 pb-3 text-xs ig-text-dim hover:underline">
        Ver los {compactNumber(post.commentsCount || 0)} comentarios
      </Link>
    </article>
  );
}
