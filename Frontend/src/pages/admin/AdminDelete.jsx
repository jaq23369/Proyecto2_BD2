import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Trash2, Loader2, AlertTriangle } from "lucide-react";
import toast from "react-hot-toast";
import { nodesApi } from "../../api/nodes";
import { relsApi } from "../../api/relationships";
import { LABELS, RELATIONSHIP_TYPES } from "../../schema/labels";

export default function AdminDelete() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <header className="mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2"><Trash2 size={20} /> Eliminación masiva</h1>
        <p className="ig-text-soft text-sm">DELETE de nodos y relaciones (rúbrica: 5+5 pts)</p>
      </header>

      <div className="ig-card p-4 mb-6 flex items-start gap-3 border-l-4 border-l-ig-danger">
        <AlertTriangle size={18} className="text-ig-danger shrink-0 mt-0.5" />
        <div className="text-sm">
          Estas operaciones son <strong>irreversibles</strong>. <code>DETACH DELETE</code> elimina el nodo y todas sus relaciones.
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <DeleteOneNode />
        <DeleteManyNodes />
        <DeleteOneRel />
        <DeleteManyRels />
      </div>
    </div>
  );
}

function DeleteOneNode() {
  const [label, setLabel] = useState("Hashtag");
  const [id, setId] = useState("");
  const m = useMutation({
    mutationFn: () => nodesApi.deleteOne(label, id),
    onSuccess: () => toast.success(`Eliminado ${label} ${id}`),
  });
  return (
    <Box title="Eliminar 1 nodo" code="DELETE /api/nodes/:label/:id" danger>
      <div className="grid grid-cols-2 gap-2">
        <select value={label} onChange={(e) => setLabel(e.target.value)} className="ig-input">
          {LABELS.map((l) => <option key={l}>{l}</option>)}
        </select>
        <input value={id} onChange={(e) => setId(e.target.value)} placeholder="id" className="ig-input" />
      </div>
      <button onClick={() => id && confirm(`Eliminar ${label} ${id}?`) && m.mutate()} className="ig-btn-danger w-full mt-3" disabled={m.isPending}>
        {m.isPending ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />} Eliminar
      </button>
    </Box>
  );
}

function DeleteManyNodes() {
  const [label, setLabel] = useState("Hashtag");
  const [ids, setIds] = useState("");
  const m = useMutation({
    mutationFn: () => nodesApi.deleteMany(label, ids.split(",").map((s) => s.trim()).filter(Boolean)),
    onSuccess: (res) => toast.success(`Eliminados ${res.data?.deleted ?? 0} nodos`),
  });
  return (
    <Box title="Eliminar muchos nodos" code="DELETE /api/nodes" danger>
      <select value={label} onChange={(e) => setLabel(e.target.value)} className="ig-input w-full mb-2">
        {LABELS.map((l) => <option key={l}>{l}</option>)}
      </select>
      <textarea value={ids} onChange={(e) => setIds(e.target.value)} placeholder="ids separados por coma" className="ig-input w-full min-h-[80px]" />
      <button onClick={() => ids && m.mutate()} className="ig-btn-danger w-full mt-3" disabled={m.isPending}>
        {m.isPending ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />} Eliminar lote
      </button>
    </Box>
  );
}

function DeleteOneRel() {
  const [relId, setRelId] = useState("");
  const m = useMutation({
    mutationFn: () => relsApi.deleteOne(relId),
    onSuccess: () => toast.success("Relación eliminada"),
  });
  return (
    <Box title="Eliminar 1 relación" code="DELETE /api/relationships/:relId" danger>
      <input value={relId} onChange={(e) => setRelId(e.target.value)} placeholder="elementId(r) — copiar de POST relationships" className="ig-input w-full" />
      <button onClick={() => relId && m.mutate()} className="ig-btn-danger w-full mt-3" disabled={m.isPending}>
        {m.isPending ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />} Eliminar
      </button>
    </Box>
  );
}

function DeleteManyRels() {
  const [type, setType] = useState("FOLLOWS");
  const [filtersText, setFiltersText] = useState('{"reactionType":"like"}');
  const m = useMutation({
    mutationFn: () => relsApi.deleteMany({ type, filters: filtersText ? JSON.parse(filtersText) : null }),
    onSuccess: (res) => toast.success(`Eliminadas ${res.data?.deleted ?? 0} relaciones`),
  });
  return (
    <Box title="Eliminar muchas relaciones por filtro" code="DELETE /api/relationships" danger>
      <select value={type} onChange={(e) => setType(e.target.value)} className="ig-input w-full mb-2">
        {RELATIONSHIP_TYPES.map((t) => <option key={t}>{t}</option>)}
      </select>
      <textarea value={filtersText} onChange={(e) => setFiltersText(e.target.value)} placeholder='{"reactionType":"like"}' className="ig-input w-full min-h-[80px] font-mono text-xs" />
      <button onClick={() => m.mutate()} className="ig-btn-danger w-full mt-3" disabled={m.isPending}>
        {m.isPending ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />} Eliminar por filtro
      </button>
    </Box>
  );
}

function Box({ title, code, children, danger }) {
  return (
    <section className="ig-card p-5">
      <div className="mb-3">
        <h3 className="font-semibold">{title}</h3>
        <code className="text-xs ig-text-dim">{code}</code>
      </div>
      {children}
    </section>
  );
}
