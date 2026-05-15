import { NavLink, Link, useNavigate } from "react-router-dom";
import {
  Home,
  Compass,
  Search,
  MessageCircle,
  Bell,
  PlusSquare,
  User as UserIcon,
  Network,
  LogOut,
  Hash,
  Users,
  Database,
  Upload,
  Brain,
  Trash2,
  Layers,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { useState } from "react";
import { useCurrentUser } from "../auth/CurrentUser";
import Avatar from "./Avatar";
import { cx } from "../utils/format";

const SOCIAL_NAV = [
  { to: "/", icon: Home, label: "Inicio", end: true },
  { to: "/explore", icon: Compass, label: "Explorar" },
  { to: "/search", icon: Search, label: "Buscar" },
  { to: "/messages", icon: MessageCircle, label: "Mensajes" },
  { to: "/notifications", icon: Bell, label: "Notificaciones" },
  { to: "/post/new", icon: PlusSquare, label: "Crear post" },
  { to: "/groups", icon: Users, label: "Grupos" },
  { to: "/hashtags", icon: Hash, label: "Hashtags" },
  { to: "/graph", icon: Network, label: "Grafo" },
];

const ADMIN_NAV = [
  { to: "/admin", icon: Database, label: "Datos & seed" },
  { to: "/admin/bulk", icon: Layers, label: "Props bulk" },
  { to: "/admin/ingest", icon: Upload, label: "Carga CSV" },
  { to: "/admin/gds", icon: Brain, label: "GDS algoritmos" },
  { to: "/admin/delete", icon: Trash2, label: "Eliminar masivo" },
];

export default function Sidebar() {
  const { user, logout } = useCurrentUser();
  const nav = useNavigate();
  const [adminOpen, setAdminOpen] = useState(false);

  return (
    <aside className="hidden md:flex flex-col w-64 shrink-0 border-r ig-border bg-ig-bg/80 backdrop-blur sticky top-0 h-screen">
      <div className="px-6 py-6">
        <Link to="/" className="font-display text-3xl ig-grad-text">Neogram</Link>
      </div>

      <nav className="flex-1 px-3 space-y-0.5 overflow-auto">
        {SOCIAL_NAV.map((it) => (
          <NavLink
            key={it.to}
            to={it.to}
            end={it.end}
            className={({ isActive }) => cx("ig-nav-link", isActive && "ig-nav-active")}
          >
            <it.icon size={20} />
            <span>{it.label}</span>
          </NavLink>
        ))}

        {user && (
          <NavLink
            to={`/profile/${user.userId}`}
            className={({ isActive }) => cx("ig-nav-link", isActive && "ig-nav-active")}
          >
            <UserIcon size={20} />
            <span>Perfil</span>
          </NavLink>
        )}

        <div className="pt-4 mt-4 border-t ig-border">
          <button
            onClick={() => setAdminOpen((v) => !v)}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs ig-text-dim uppercase tracking-wider hover:text-ig-text"
          >
            {adminOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            Admin
          </button>
          {adminOpen && (
            <div className="space-y-0.5 mt-1">
              {ADMIN_NAV.map((it) => (
                <NavLink
                  key={it.to}
                  to={it.to}
                  end={it.to === "/admin"}
                  className={({ isActive }) => cx("ig-nav-link text-[13px]", isActive && "ig-nav-active")}
                >
                  <it.icon size={18} />
                  <span>{it.label}</span>
                </NavLink>
              ))}
            </div>
          )}
        </div>
      </nav>

      {user && (
        <div className="p-3 border-t ig-border">
          <div className="flex items-center gap-2 px-2 py-2">
            <Link to={`/profile/${user.userId}`} className="flex items-center gap-2 flex-1 min-w-0">
              <Avatar user={user} size={32} ring />
              <div className="min-w-0">
                <div className="text-sm font-semibold truncate">{user.username}</div>
                <div className="text-[11px] ig-text-dim truncate">@{user.userId}</div>
              </div>
            </Link>
            <button
              onClick={() => { logout(); nav("/login"); }}
              className="p-2 rounded-lg hover:bg-ig-elevated"
              title="Cerrar sesión"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      )}
    </aside>
  );
}
