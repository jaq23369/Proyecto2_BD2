import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Users, Plus, Lock, Globe, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { groupsApi } from "../api/domain";
import Spinner from "../components/Spinner";
import Modal from "../components/Modal";
import { compactNumber, timeAgo } from "../utils/format";

export default function Groups() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", description: "", isPrivate: false, categories: "" });

  const list = useQuery({
    queryKey: ["groups-all"],
    queryFn: () => groupsApi.list({ limit: 50 }).then((r) => r.data || []),
  });

  const create = useMutation({
    mutationFn: () => groupsApi.create({
      name: form.name,
      description: form.description,
      isPrivate: form.isPrivate,
      categories: form.categories.split(",").map((s) => s.trim()).filter(Boolean),
    }),
    onSuccess: () => {
      toast.success("Grupo creado");
      qc.invalidateQueries({ queryKey: ["groups-all"] });
      setOpen(false);
      setForm({ name: "", description: "", isPrivate: false, categories: "" });
    },
  });

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <header className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Grupos</h1>
          <p className="ig-text-soft text-sm">Comunidades del grafo</p>
        </div>
        <button className="ig-btn-accent" onClick={() => setOpen(true)}>
          <Plus size={14} /> Crear grupo
        </button>
      </header>

      {list.isLoading ? <Spinner /> : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {(list.data || []).map((g) => (
            <Link key={g.groupId} to={`/groups/${g.groupId}`} className="ig-card p-5 hover:bg-ig-elevated transition">
              <div className="flex items-start gap-3 mb-3">
                <div className="w-12 h-12 rounded-2xl bg-ig-gradient grid place-items-center text-white font-bold">
                  {g.name?.[0]?.toUpperCase() || "G"}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold truncate flex items-center gap-1">
                    {g.name}
                    {g.isPrivate ? <Lock size={11} className="ig-text-dim" /> : <Globe size={11} className="ig-text-dim" />}
                  </div>
                  <div className="text-xs ig-text-dim">{compactNumber(g.membersCount || 0)} miembros</div>
                </div>
              </div>
              <p className="text-sm ig-text-soft line-clamp-2 mb-3 min-h-[40px]">{g.description || "Sin descripción"}</p>
              {g.categories?.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {g.categories.slice(0, 3).map((c) => <span key={c} className="ig-pill">{c}</span>)}
                </div>
              )}
            </Link>
          ))}
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title="Crear nuevo grupo">
        <div className="p-5 space-y-3">
          <input className="ig-input w-full" placeholder="Nombre del grupo" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <textarea className="ig-input w-full min-h-[100px]" placeholder="Descripción" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <input className="ig-input w-full" placeholder="categorías (coma)" value={form.categories} onChange={(e) => setForm({ ...form, categories: e.target.value })} />
          <label className="flex items-center gap-2 px-3 py-2 ig-input cursor-pointer">
            <input type="checkbox" checked={form.isPrivate} onChange={(e) => setForm({ ...form, isPrivate: e.target.checked })} />
            <span className="text-sm">Grupo privado</span>
          </label>
          <button onClick={() => form.name && create.mutate()} disabled={create.isPending} className="ig-btn-accent w-full">
            {create.isPending ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />} Crear grupo
          </button>
        </div>
      </Modal>
    </div>
  );
}
