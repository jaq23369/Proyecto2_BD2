import { Link } from "react-router-dom";
import { BadgeCheck } from "lucide-react";
import Avatar from "./Avatar";

export default function UserRow({ user, right, subtitle }) {
  if (!user) return null;
  return (
    <div className="flex items-center gap-3 py-2">
      <Link to={`/profile/${user.userId}`}>
        <Avatar user={user} size={44} ring />
      </Link>
      <div className="flex-1 min-w-0">
        <Link to={`/profile/${user.userId}`} className="flex items-center gap-1 font-semibold text-sm hover:underline">
          <span className="truncate">{user.username}</span>
          {user.isVerified && <BadgeCheck size={14} className="text-ig-link shrink-0" />}
        </Link>
        <div className="text-xs ig-text-dim truncate">{subtitle ?? user.bio ?? user.email}</div>
      </div>
      {right}
    </div>
  );
}
