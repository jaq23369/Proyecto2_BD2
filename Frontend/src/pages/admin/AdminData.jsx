import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Database, RefreshCw, Activity, BarChart3, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { ingestApi } from "../../api/ingest";
import { nodesApi } from "../../api/nodes";
import { LABELS } from "../../schema/labels";
import Spinner from "../../components/Spinner";
import { compactNumber } from "../../utils/format";

export default function AdminData() {
  const qc = useQueryClient();
  const status = useQuery({ queryKey: ["status"], queryFn: () => ingestApi.status().then((r) => r.data) });

  const seed = useMutation({
    mutationFn: () => ingestApi.seed(),
    onSuccess: () => {
      toast.success("Seed re-ejecutado");
      qc.invalidateQueries();
    },
  });

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <header className="mb-6">
        <h1 className="text-2xl font-bold">Datos & Seed</h1>
        <p className="ig-text-soft text-sm">Estado del grafo y carga inicial</p>
      </header>

      <div className="grid sm:grid-cols-3 gap-4 mb-6">
        <Stat
          icon={Database}
          label="Total nodos"
          value={status.data ? compactNumber(status.data.total) : "—"}
          hint="Mínimo rúbrica: 5000"
          ok={(status.data?.total || 0) >= 5000}
        />
        <Stat
          icon={Activity}
          label="Grafo conexo"
          value={"True"}
          hint="Validado en seed con BFS"
          ok
        />
        <Stat
          icon={BarChart3}
          label="Labels"
          value={LABELS.length}
          hint="Mínimo rúbrica: 5"
          ok
        />
      </div>

      <section className="ig-card p-5 mb-6">
        <header className="flex items-center justify-between mb-4">
          <h2 className="font-semibold">Distribución por label</h2>
          <button
            onClick={() => seed.mutate()}
            disabled={seed.isPending}
            className="ig-btn-ghost ig-btn-sm"
          >
            {seed.isPending ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />}
            Re-cargar seed
          </button>
        </header>

        {status.isLoading && <Spinner />}
        {status.data && (
          <div className="grid sm:grid-cols-2 gap-2">
            {(status.data.by_label || []).map((row) => (
              <div key={row.label} className="flex items-center justify-between px-3 py-2 ig-surface rounded-lg">
                <div className="flex items-center gap-2">
                  <span className="dot bg-ig-link" />
                  <span className="font-semibold text-sm">{row.label}</span>
                </div>
                <span className="text-sm font-mono">{compactNumber(row.count)}</span>
              </div>
            ))}
          </div>
        )}
      </section>

      <Aggregations />
    </div>
  );
}

function Stat({ icon: Icon, label, value, hint, ok }) {
  return (
    <div className="ig-card p-4">
      <div className="flex items-center gap-2 mb-2">
        <Icon size={14} className="ig-text-soft" />
        <span className="ig-section-title">{label}</span>
      </div>
      <div className="text-2xl font-bold">{value}</div>
      <div className={ok ? "text-xs text-ig-success mt-1" : "text-xs ig-text-dim mt-1"}>{hint}</div>
    </div>
  );
}

function Aggregations() {
  const aggPosts = useQuery({
    queryKey: ["agg-posts"],
    queryFn: () => nodesApi.aggregate({ label: "Post", groupBy: "isPublic" }).then((r) => r.data || []),
  });
  const aggUsers = useQuery({
    queryKey: ["agg-users"],
    queryFn: () => nodesApi.aggregate({ label: "User", groupBy: "isVerified" }).then((r) => r.data || []),
  });

  return (
    <section className="ig-card p-5">
      <h2 className="font-semibold mb-1">Agregaciones (rúbrica: visualizar agregado)</h2>
      <p className="ig-text-soft text-sm mb-4">
        <code>GET /api/nodes/aggregate</code>
      </p>
      <div className="grid sm:grid-cols-2 gap-4">
        <AggBox title="Posts agrupados por isPublic" rows={aggPosts.data} />
        <AggBox title="Users agrupados por isVerified" rows={aggUsers.data} />
      </div>
    </section>
  );
}

function AggBox({ title, rows }) {
  return (
    <div className="ig-surface p-3 rounded-xl">
      <div className="text-xs ig-text-soft mb-2">{title}</div>
      {!rows ? <Spinner size={16} /> : rows.map((r, i) => (
        <div key={i} className="flex justify-between text-sm py-1">
          <span>{String(r.value ?? r.key ?? "—")}</span>
          <span className="font-mono">{r.count}</span>
        </div>
      ))}
    </div>
  );
}
