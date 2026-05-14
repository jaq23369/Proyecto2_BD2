import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useNavigate, Navigate } from "react-router-dom";
import { Search, Sparkles, BadgeCheck, UserPlus, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { usersApi } from "../api/domain";
import { useCurrentUser } from "../auth/CurrentUser";
import Avatar from "../components/Avatar";
import { cx } from "../utils/format";

export default function Login() {
  const { user, login } = useCurrentUser();
  const nav = useNavigate();
  const [q, setQ] = useState("");
  const [tab, setTab] = useState("pick");

  const { data, isFetching } = useQuery({
    queryKey: ["users-pick"],
    queryFn: () => usersApi.list({ limit: 2000 }).then((r) => r.data || []),
  });

  const filtered = useMemo(() => {
    if (!data) return [];
    const needle = q.trim().toLowerCase();
    if (!needle) return data;
    return data.filter(
      (u) =>
        u.username?.toLowerCase().includes(needle) ||
        u.userId?.toLowerCase().includes(needle) ||
        u.email?.toLowerCase().includes(needle)
    );
  }, [data, q]);

  if (user) return <Navigate to="/" replace />;

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Hero */}
      <div className="hidden lg:flex relative overflow-hidden bg-grid items-center justify-center p-10">
        <div className="absolute inset-0 bg-gradient-to-br from-pink-600/20 via-purple-700/10 to-blue-600/20" />
        <div className="relative max-w-md text-center">
          <div className="font-display text-7xl ig-grad-text mb-4">Neogram</div>
          <p className="text-xl ig-text-soft mb-8">
            La red social que vive sobre Neo4j. Sigue, comparte, descubre — todo en un grafo.
          </p>
          <div className="grid grid-cols-3 gap-3 text-left">
            {[
              { k: "6,720+", v: "nodos" },
              { k: "21k+", v: "relaciones" },
              { k: "8", v: "labels" },
            ].map((s) => (
              <div key={s.v} className="ig-card p-4">
                <div className="text-2xl font-bold ig-grad-text">{s.k}</div>
                <div className="text-xs ig-text-dim uppercase tracking-wider">{s.v}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="flex flex-col justify-center p-8 sm:p-14">
        <div className="max-w-sm w-full mx-auto">
          <div className="font-display text-5xl ig-grad-text mb-2 lg:hidden text-center">Neogram</div>
          <h1 className="text-2xl font-bold mb-1">Bienvenido</h1>
          <p className="ig-text-soft text-sm mb-6">
            Selecciona un usuario existente del seed o crea el tuyo.
          </p>

          <div className="flex gap-1 p-1 bg-ig-elevated rounded-xl mb-5">
            <button
              className={cx("flex-1 ig-tab", tab === "pick" && "ig-tab-active")}
              onClick={() => setTab("pick")}
            >
              Iniciar sesión
            </button>
            <button
              className={cx("flex-1 ig-tab", tab === "new" && "ig-tab-active")}
              onClick={() => setTab("new")}
            >
              Crear cuenta
            </button>
          </div>

          {tab === "pick" ? (
            <>
              <div className="relative mb-3">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 ig-text-dim" />
                <input
                  className="ig-input w-full pl-9"
                  placeholder="Buscar @usuario o id"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                />
              </div>
              <div className="ig-card max-h-[420px] overflow-auto">
                {isFetching && (
                  <div className="p-4 text-center ig-text-soft text-sm flex items-center justify-center gap-2">
                    <Loader2 size={14} className="animate-spin" /> cargando...
                  </div>
                )}
                {!isFetching && filtered.length === 0 && (
                  <div className="p-6 text-center ig-text-soft text-sm">Sin resultados</div>
                )}
                {filtered.map((u) => (
                  <button
                    key={u.userId}
                    onClick={() => {
                      login(u);
                      toast.success(`Hola ${u.username}`);
                      nav("/");
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-ig-elevated transition text-left"
                  >
                    <Avatar user={u} size={40} ring />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1 font-semibold text-sm">
                        <span className="truncate">{u.username}</span>
                        {u.isVerified && <BadgeCheck size={12} className="text-ig-link shrink-0" />}
                      </div>
                      <div className="text-xs ig-text-dim truncate">{u.bio || u.email}</div>
                    </div>
                    <Sparkles size={14} className="ig-text-dim" />
                  </button>
                ))}
              </div>
            </>
          ) : (
            <NewUserForm onCreate={(u) => { login(u); nav("/"); }} />
          )}
        </div>
      </div>
    </div>
  );
}

function NewUserForm({ onCreate }) {
  const [form, setForm] = useState({
    username: "",
    email: "",
    bio: "",
    profilePicUrl: "",
    isVerified: false,
    interests: "",
    birthDate: "2000-01-01",
  });

  const create = useMutation({
    mutationFn: () =>
      usersApi.create({
        ...form,
        interests: form.interests
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
      }),
    onSuccess: (res) => {
      toast.success("Cuenta creada");
      onCreate(res.data);
    },
  });

  const set = (k) => (e) =>
    setForm((f) => ({ ...f, [k]: e.target.type === "checkbox" ? e.target.checked : e.target.value }));

  const valid = form.username.trim() && form.email.trim();

  return (
    <form
      onSubmit={(e) => { e.preventDefault(); if (valid) create.mutate(); }}
      className="space-y-3"
    >
      <input className="ig-input w-full" placeholder="username" value={form.username} onChange={set("username")} />
      <input className="ig-input w-full" placeholder="email" type="email" value={form.email} onChange={set("email")} />
      <input className="ig-input w-full" placeholder="bio" value={form.bio} onChange={set("bio")} />
      <input className="ig-input w-full" placeholder="URL de foto (opcional)" value={form.profilePicUrl} onChange={set("profilePicUrl")} />
      <input className="ig-input w-full" placeholder="intereses (separados por coma)" value={form.interests} onChange={set("interests")} />
      <div className="grid grid-cols-2 gap-3">
        <input className="ig-input w-full" type="date" value={form.birthDate} onChange={set("birthDate")} />
        <label className="flex items-center gap-2 px-3 py-2 ig-input cursor-pointer">
          <input type="checkbox" checked={form.isVerified} onChange={set("isVerified")} />
          <span className="text-sm">Verificado</span>
        </label>
      </div>
      <button disabled={!valid || create.isPending} className="ig-btn-accent w-full">
        {create.isPending ? <Loader2 size={16} className="animate-spin" /> : <UserPlus size={16} />}
        Crear cuenta
      </button>
      <p className="text-[11px] ig-text-dim text-center">
        Esto crea un nodo <code className="text-ig-text">:User</code> con 11 propiedades — cubre crear nodo 5+ props.
      </p>
    </form>
  );
}
