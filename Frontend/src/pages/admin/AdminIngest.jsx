import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Upload, RefreshCw, FileText, Loader2, Database } from "lucide-react";
import toast from "react-hot-toast";
import { ingestApi } from "../../api/ingest";
import { LABELS, RELATIONSHIP_TYPES } from "../../schema/labels";
import Spinner from "../../components/Spinner";
import { compactNumber } from "../../utils/format";

export default function AdminIngest() {
  const qc = useQueryClient();
  const [file, setFile] = useState(null);
  const [mode, setMode] = useState("nodes");
  const [target, setTarget] = useState("User");
  const [drag, setDrag] = useState(false);

  const status = useQuery({ queryKey: ["status"], queryFn: () => ingestApi.status().then((r) => r.data) });

  const upload = useMutation({
    mutationFn: () => ingestApi.uploadCsv(file, target, mode),
    onSuccess: (res) => {
      toast.success(`Cargados ${res.data?.created ?? 0} ${mode}`);
      qc.invalidateQueries({ queryKey: ["status"] });
    },
  });

  const seed = useMutation({
    mutationFn: () => ingestApi.seed(),
    onSuccess: () => { toast.success("Seed completo OK"); qc.invalidateQueries(); },
  });

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <header className="mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2"><Upload size={20} /> Carga CSV</h1>
        <p className="ig-text-soft text-sm">Sube CSVs uno a uno, o re-ejecuta el seed completo (24 archivos).</p>
      </header>

      <div className="ig-card p-5 mb-6">
        <h2 className="font-semibold mb-3">Subir archivo individual</h2>

        <div className="grid grid-cols-2 gap-3 mb-4">
          <label className="block">
            <div className="text-xs ig-text-soft mb-1">Modo</div>
            <select value={mode} onChange={(e) => { setMode(e.target.value); setTarget(e.target.value === "nodes" ? "User" : "FOLLOWS"); }} className="ig-input w-full">
              <option value="nodes">Nodos</option>
              <option value="relationships">Relaciones</option>
            </select>
          </label>
          <label className="block">
            <div className="text-xs ig-text-soft mb-1">{mode === "nodes" ? "Label" : "Tipo de relación"}</div>
            <select value={target} onChange={(e) => setTarget(e.target.value)} className="ig-input w-full">
              {(mode === "nodes" ? LABELS : RELATIONSHIP_TYPES).map((l) => <option key={l}>{l}</option>)}
            </select>
          </label>
        </div>

        <div
          className={`border-2 border-dashed rounded-2xl p-8 text-center transition ${drag ? "border-ig-link bg-ig-link/5" : "border-ig-border"}`}
          onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
          onDragLeave={() => setDrag(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDrag(false);
            const f = e.dataTransfer.files?.[0];
            if (f) setFile(f);
          }}
        >
          <FileText size={28} className="mx-auto ig-text-dim mb-2" />
          {file ? (
            <div>
              <div className="font-semibold">{file.name}</div>
              <div className="text-xs ig-text-dim">{(file.size / 1024).toFixed(1)} KB · {file.type || "text/csv"}</div>
            </div>
          ) : (
            <div className="ig-text-soft text-sm">
              Arrastra tu CSV aquí o
              <label className="text-ig-link cursor-pointer mx-1">
                <input type="file" accept=".csv" hidden onChange={(e) => setFile(e.target.files?.[0])} />
                selecciónalo
              </label>
            </div>
          )}
        </div>

        <button
          disabled={!file || upload.isPending}
          onClick={() => upload.mutate()}
          className="ig-btn-primary mt-4"
        >
          {upload.isPending ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />} Subir
        </button>
      </div>

      <div className="ig-card p-5 mb-6">
        <h2 className="font-semibold mb-1">Re-ejecutar seed completo</h2>
        <p className="ig-text-soft text-sm mb-4">
          Carga los 24 CSVs (8 nodos + 16 relaciones) en orden. Idempotente vía <code>MERGE</code>.
        </p>
        <button
          onClick={() => seed.mutate()}
          disabled={seed.isPending}
          className="ig-btn-accent"
        >
          {seed.isPending ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
          POST /api/ingest/seed
        </button>
      </div>

      <div className="ig-card p-5">
        <h2 className="font-semibold mb-1 flex items-center gap-2"><Database size={16} /> Status actual</h2>
        {status.isLoading ? <Spinner /> : status.data && (
          <>
            <div className="text-2xl font-bold">{compactNumber(status.data.total)} nodos</div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3">
              {(status.data.by_label || []).map((row) => (
                <div key={row.label} className="ig-surface px-3 py-2 rounded-lg flex justify-between text-sm">
                  <span>{row.label}</span>
                  <span className="font-mono">{compactNumber(row.count)}</span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
