import { cx, avatarColor, initials } from "../utils/format";

export default function Avatar({ user, size = 40, ring = false, className }) {
  const username = user?.username || user?.userId || "?";
  const url = user?.profilePicUrl;
  const dim = { width: size, height: size, fontSize: size * 0.4 };
  const inner = url ? (
    <img
      src={url}
      alt={username}
      className="w-full h-full object-cover"
      onError={(e) => { e.currentTarget.style.display = "none"; }}
    />
  ) : (
    <div className={cx("w-full h-full bg-gradient-to-br grid place-items-center text-white font-bold", avatarColor(username))}>
      {initials(username)}
    </div>
  );
  return (
    <div
      style={dim}
      className={cx(
        "rounded-full overflow-hidden shrink-0",
        ring && "p-[2px] bg-ig-gradient",
        className
      )}
    >
      <div className={cx("rounded-full overflow-hidden w-full h-full", ring && "border-2 border-ig-bg")}>
        {inner}
      </div>
    </div>
  );
}
