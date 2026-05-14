import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Save, Trash2, Plus, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { useCurrentUser } from "../auth/CurrentUser";
import { usersApi } from "../api/domain";
import { nodesApi } from "../api/nodes";
import Avatar from "../components/Avatar";

export default function EditProfile() {
  const { user, login, refresh } = useCurrentUser();
  const nav = useNavigate();
  const qc = useQueryClient();
  const [form, setForm] = useState(user);
  const [newKey, setNewKey] = useState("");
  const [newVal, setNewVal] = useState("");
  const [delKey, setDelKey] = useState("");

  useEffect(() => { setForm(user); }, [user]);
  if (!user) return null;
  const set = (k) => (e) =>
    setForm((f) => ({ ...f, [k]: e.target.type === "checkbox" ? e.target.checked : e.target.value }));

  const update = useMutation({
    mutationFn: () => {
      const body = {
        bio: form.bio ?? "",
        profilePicUrl: form.profilePicUrl ?? "",
        isVerified: !!form.isVerified,
        username: form.username,
        email: form.email,
        interests: Array.isArray(form.interests)
          ? form.interests
          : String(form.interests || "").split(",").map((s) => s.trim()).filter(Boolean),
      };
      return usersApi.update(user.userId, body);
    },
    onSuccess: (res) => {
      login(res.data);
      qc.invalidateQueries();
      toast.success("Perfil actualizado");
    },
  });

  const addProp = useMutation({
    mutationFn: () =>
      nodesApi.updateProps("User", user.userId, { [newKey]: coerce(newVal) }),
    onSuccess: () => {
      toast.success(`+${newKey}`);
      setNewKey(""); setNewVal("");
      refresh();
    },
  });

  const removeProp = useMutation({
    mutationFn: () => nodesApi.removeProps("User", user.userId, [delKey]),
    onSuccess: () => {
      toast.success(`-${delKey}`);
      setDelKey("");
      refresh();
    },
  });

  return (
    <div className="max-w-2xl mx-auto px-6 py-8">
      <h1 className="text-2xl font-bold mb-6">Editar perfil</h1>

      <div className="ig-card p-6 mb-6">
        <div className="flex items-center gap-4 mb-6">
          <Avatar user={form} size={80} ring />
          <div className="flex-1">
            <div className="font-semibold">{form.username}</div>
            <input
              className="ig-input w-full mt-2"
              placeholder="URL de foto de perfil"
              value={form.profilePicUrl || ""}
              onChange={set("profilePicUrl")}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Username"><input className="ig-input w-full" value={form.username || ""} onChange={set("username")} /></Field>
          <Field label="Email"><input className="ig-input w-full" value={form.email || ""} onChange={set("email")} /></Field>
          <Field label="Bio" full>
            <textarea className="ig-input w-full min-h-[80px]" value={form.bio || ""} onChange={set("bio")} />
          </Field>
          <Field label="Intereses (coma)">
            <input
              className="ig-input w-full"
              value={Array.isArray(form.interests) ? form.interests.join(", ") : (form.interests || "")}
              onChange={(e) => setForm((f) => ({ ...f, interests: e.target.value }))}
            />
          </Field>
          <Field label="Fecha nacimiento">
            <input className="ig-input w-full" type="date" value={form.birthDate || "2000-01-01"} onChange={set("birthDate")} />
          </Field>
          <Field label="Verificado" full>
            <label className="flex items-center gap-2 px-3 py-2 ig-input cursor-pointer">
              <input type="checkbox" checked={!!form.isVerified} onChange={set("isVerified")} />
              <span className="text-sm">Cuenta verificada</span>
            </label>
          </Field>
        </div>

        <div className="flex justify-end mt-6">
          <button onClick={() => update.mutate()} disabled={update.isPending} className="ig-btn-primary">
            {update.isPending ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} Guardar cambios
          </button>
        </div>
      </div>

      <div className="ig-card p-6">
        <h2 className="font-semibold mb-1">Propiedades dinámicas (rúbrica: gestión props nodos)</h2>
        <p className="ig-text-soft text-sm mb-4">
          Añadir o eliminar propiedades arbitrarias del nodo <code>:User</code>.
        </p>

        <div className="grid grid-cols-[1fr_1fr_auto] gap-2 mb-3">
          <input className="ig-input" placeholder="key (ej. website)" value={newKey} onChange={(e) => setNewKey(e.target.value)} />
          <input className="ig-input" placeholder='value (true / 42 / "texto" / [a,b])' value={newVal} onChange={(e) => setNewVal(e.target.value)} />
          <button onClick={() => newKey && addProp.mutate()} className="ig-btn-ghost"><Plus size={14} /> Añadir</button>
        </div>

        <div className="grid grid-cols-[1fr_auto] gap-2">
          <input className="ig-input" placeholder="key a eliminar" value={delKey} onChange={(e) => setDelKey(e.target.value)} />
          <button onClick={() => delKey && removeProp.mutate()} className="ig-btn-danger"><Trash2 size={14} /> Eliminar</button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children, full }) {
  return (
    <label className={full ? "col-span-2" : ""}>
      <div className="text-xs ig-text-soft mb-1">{label}</div>
      {children}
    </label>
  );
}

function coerce(v) {
  const s = String(v).trim();
  if (s === "true") return true;
  if (s === "false") return false;
  if (/^-?\d+$/.test(s)) return parseInt(s);
  if (/^-?\d+\.\d+$/.test(s)) return parseFloat(s);
  if (s.startsWith("[") && s.endsWith("]")) {
    try { return JSON.parse(s); } catch {}
    return s.slice(1, -1).split(",").map((x) => x.trim()).filter(Boolean);
  }
  return s;
}
