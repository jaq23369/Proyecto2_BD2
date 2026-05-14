import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Brain, Crown, UserPlus, Users, AlertTriangle, Loader2 } from "lucide-react";
import { gdsApi } from "../../api/gds";
import { compactNumber } from "../../utils/format";

export default function AdminGDS() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <header className="mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2"><Brain size={20} /> Graph Data Science</h1>
        <p className="ig-text-soft text-sm">PageRank · Node Similarity · Louvain (extra +10 pts)</p>
      </header>

      <div className="ig-card p-4 mb-6 flex items-start gap-3 border-l-4 border-l-ig-warning">
        <AlertTriangle size={18} className="text-ig-warning shrink-0 mt-0.5" />
        <div className="text-sm">
          <strong>Aura Free no incluye GDS.</strong> Estos endpoints requieren Neo4j Sandbox/Desktop con
          plugin <code>Graph Data Science</code> instalado. Configura <code>Backend/.env</code> apuntando a esa instancia.
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-5">
        <PageRankCard />
        <NodeSimilarityCard />
        <CommunitiesCard />
      </div>
    </div>
  );
}

function PageRankCard() {
  const [topN, setTopN] = useState(20);
  const m = useMutation({ mutationFn: () => gdsApi.pageRank(topN).then((r) => r.data) });
  return (
    <Card icon={Crown} color="text-ig-accent bg-ig-accent/15" title="PageRank" desc="Identifica los usuarios más influyentes.">
      <div className="flex items-end gap-2 mb-3">
        <label className="block flex-1">
          <div className="text-xs ig-text-soft mb-1">topN</div>
          <input type="number" value={topN} onChange={(e) => setTopN(+e.target.value)} className="ig-input w-full" />
        </label>
        <button onClick={() => m.mutate()} disabled={m.isPending} className="ig-btn-primary">
          {m.isPending ? <Loader2 size={14} className="animate-spin" /> : "Run"}
        </button>
      </div>
      <ResultList data={m.data} render={(r, i) => (
        <li key={r.userId || i} className="flex justify-between text-sm py-1.5">
          <span>#{i + 1} <strong>{r.username || r.userId}</strong></span>
          <span className="font-mono ig-text-soft">{Number(r.score).toFixed(4)}</span>
        </li>
      )} />
    </Card>
  );
}

function NodeSimilarityCard() {
  const [userId, setUserId] = useState("u_0");
  const [topK, setTopK] = useState(10);
  const m = useMutation({ mutationFn: () => gdsApi.nodeSimilarity(userId, topK).then((r) => r.data) });
  return (
    <Card icon={UserPlus} color="text-ig-link bg-ig-link/15" title="Node Similarity" desc="Sugiere usuarios similares (recomendación).">
      <div className="grid grid-cols-2 gap-2 mb-3">
        <input value={userId} onChange={(e) => setUserId(e.target.value)} placeholder="userId" className="ig-input col-span-2" />
        <input type="number" value={topK} onChange={(e) => setTopK(+e.target.value)} className="ig-input" />
        <button onClick={() => m.mutate()} disabled={m.isPending} className="ig-btn-primary">
          {m.isPending ? <Loader2 size={14} className="animate-spin" /> : "Run"}
        </button>
      </div>
      <ResultList data={m.data} render={(r, i) => (
        <li key={r.targetId || i} className="flex justify-between text-sm py-1.5">
          <span><strong>{r.targetUsername || r.targetId}</strong></span>
          <span className="font-mono ig-text-soft">{Number(r.similarity).toFixed(3)}</span>
        </li>
      )} />
    </Card>
  );
}

function CommunitiesCard() {
  const [topN, setTopN] = useState(10);
  const m = useMutation({ mutationFn: () => gdsApi.communities(topN).then((r) => r.data) });
  return (
    <Card icon={Users} color="text-emerald-400 bg-emerald-500/15" title="Comunidades (Louvain)" desc="Detecta clusters de usuarios.">
      <div className="flex items-end gap-2 mb-3">
        <label className="block flex-1">
          <div className="text-xs ig-text-soft mb-1">topN</div>
          <input type="number" value={topN} onChange={(e) => setTopN(+e.target.value)} className="ig-input w-full" />
        </label>
        <button onClick={() => m.mutate()} disabled={m.isPending} className="ig-btn-primary">
          {m.isPending ? <Loader2 size={14} className="animate-spin" /> : "Run"}
        </button>
      </div>
      <ResultList data={m.data} render={(r, i) => (
        <li key={r.communityId || i} className="flex justify-between text-sm py-1.5">
          <span>Comunidad <strong>{r.communityId}</strong></span>
          <span className="font-mono ig-text-soft">{compactNumber(r.size)} miembros</span>
        </li>
      )} />
    </Card>
  );
}

function Card({ icon: Icon, color, title, desc, children }) {
  return (
    <section className="ig-card p-5">
      <div className={`w-10 h-10 rounded-xl ${color} grid place-items-center mb-3`}><Icon size={18} /></div>
      <h3 className="font-semibold">{title}</h3>
      <p className="text-xs ig-text-soft mb-3">{desc}</p>
      {children}
    </section>
  );
}

function ResultList({ data, render }) {
  if (!data) return null;
  if (!data.length) return <div className="text-xs ig-text-dim text-center py-4">Sin resultados</div>;
  return (
    <ul className="divide-y divide-ig-border max-h-[280px] overflow-auto">
      {data.map(render)}
    </ul>
  );
}
