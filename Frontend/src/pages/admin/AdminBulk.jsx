import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Layers, Plus, Trash2, Loader2, FileJson } from "lucide-react";
import toast from "react-hot-toast";
import { nodesApi } from "../../api/nodes";
import { relsApi } from "../../api/relationships";

const NODE_BULK_SAMPLE = [
  { label: "User", id: "u_0", properties: { bio: "Updated via bulk" } },
  { label: "User", id: "u_1", properties: { bio: "Also updated" } },
];
const NODE_BULK_DEL_SAMPLE = [
  { label: "User", id: "u_0", keys: ["bio"] },
  { label: "User", id: "u_1", keys: ["bio"] },
];
const REL_BULK_SAMPLE = [
  { rel_id: "PASTE_REL_ID", properties: { mutualFriendsCount: 5 } },
];
const REL_BULK_DEL_SAMPLE = [
  { rel_id: "PASTE_REL_ID", keys: ["mutualFriendsCount"] },
];

export default function AdminBulk() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <header className="mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2"><Layers size={20} /> Operaciones masivas</h1>
        <p className="ig-text-soft text-sm">
          Add/Update/Delete bulk de propiedades — cubre los 10+10 puntos de "gestión props nodos/relaciones".
        </p>
      </header>

      <div className="grid lg:grid-cols-2 gap-6">
        <BulkBox
          title="Nodos · Add/Update bulk"
          description="PATCH /api/nodes/properties/bulk"
          sample={NODE_BULK_SAMPLE}
          fn={(items) => nodesApi.bulkUpdateProps(items)}
          icon={Plus}
        />
        <BulkBox
          title="Nodos · Delete props bulk"
          description="DELETE /api/nodes/properties/bulk"
          sample={NODE_BULK_DEL_SAMPLE}
          fn={(items) => nodesApi.bulkRemoveProps(items)}
          icon={Trash2}
          danger
        />
        <BulkBox
          title="Relaciones · Add/Update bulk"
          description="PATCH /api/relationships/properties/bulk"
          sample={REL_BULK_SAMPLE}
          fn={(items) => relsApi.bulkUpdateProps(items)}
          icon={Plus}
        />
        <BulkBox
          title="Relaciones · Delete props bulk"
          description="DELETE /api/relationships/properties/bulk"
          sample={REL_BULK_DEL_SAMPLE}
          fn={(items) => relsApi.bulkRemoveProps(items)}
          icon={Trash2}
          danger
        />
      </div>
    </div>
  );
}

function BulkBox({ title, description, sample, fn, icon: Icon, danger }) {
  const [text, setText] = useState(JSON.stringify(sample, null, 2));
  const [result, setResult] = useState(null);

  const run = useMutation({
    mutationFn: async () => {
      const items = JSON.parse(text);
      return fn(items);
    },
    onSuccess: (res) => {
      setResult(res.data);
      toast.success("Bulk OK");
    },
    onError: (err) => toast.error(String(err?.error?.message || err)),
  });

  return (
    <section className="ig-card p-5">
      <header className="flex items-start gap-3 mb-3">
        <div className={`w-10 h-10 rounded-xl grid place-items-center ${danger ? "bg-ig-danger/15 text-ig-danger" : "bg-ig-link/15 text-ig-link"}`}>
          <Icon size={16} />
        </div>
        <div className="flex-1">
          <h2 className="font-semibold">{title}</h2>
          <code className="text-xs ig-text-dim">{description}</code>
        </div>
      </header>

      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        className="ig-input w-full font-mono text-xs min-h-[140px]"
      />

      <button
        onClick={() => run.mutate()}
        disabled={run.isPending}
        className={`mt-3 ${danger ? "ig-btn-danger" : "ig-btn-primary"}`}
      >
        {run.isPending ? <Loader2 size={14} className="animate-spin" /> : <Icon size={14} />} Ejecutar bulk
      </button>

      {result && (
        <div className="mt-3">
          <div className="ig-section-title mb-1 flex items-center gap-1"><FileJson size={11} /> Resultado</div>
          <pre className="ig-mono-block text-[11px]">{JSON.stringify(result, null, 2)}</pre>
        </div>
      )}
    </section>
  );
}
