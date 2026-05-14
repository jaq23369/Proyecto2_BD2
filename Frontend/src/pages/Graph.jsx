import { useEffect, useRef, useState } from "react";
import ForceGraph2D from "react-force-graph-2d";
import { useQuery } from "@tanstack/react-query";
import { Network, Loader2 } from "lucide-react";
import { nodesApi } from "../api/nodes";
import { relsApi } from "../api/relationships";
import { LABELS, RELATIONSHIP_TYPES } from "../schema/labels";

const LABEL_COLORS = {
  User: "#e1306c",
  Post: "#0095f6",
  Comment: "#00d26a",
  Hashtag: "#ff9800",
  Group: "#bc1888",
  Message: "#dc2743",
  Media: "#9333ea",
  Notification: "#737373",
};

export default function Graph() {
  const wrapRef = useRef(null);
  const [size, setSize] = useState({ w: 600, h: 600 });
  const [label, setLabel] = useState("User");
  const [relType, setRelType] = useState("FOLLOWS");
  const [nodeLimit, setNodeLimit] = useState(60);
  const [relLimit, setRelLimit] = useState(200);

  useEffect(() => {
    const onResize = () => {
      if (!wrapRef.current) return;
      const r = wrapRef.current.getBoundingClientRect();
      setSize({ w: r.width, h: Math.max(500, window.innerHeight - 220) });
    };
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const nodesQ = useQuery({
    queryKey: ["graph-nodes", label, nodeLimit],
    queryFn: () => nodesApi.list({ label, limit: nodeLimit }).then((r) => r.data || []),
  });

  const relsQ = useQuery({
    queryKey: ["graph-rels", relType, relLimit],
    queryFn: () => relsApi.list({ type: relType, limit: relLimit }).then((r) => r.data || []),
  });

  const data = (() => {
    const nodes = (nodesQ.data || []).map((n) => {
      const id = n.userId || n.postId || n.name || n.commentId || n.groupId || n.messageId || n.mediaId || n.notificationId;
      return { id, name: n.username || n.name || n.content?.slice(0, 30) || id, color: LABEL_COLORS[label] };
    });
    const ids = new Set(nodes.map((n) => n.id));
    const links = [];
    // get_relationships returns {relId, type, properties} — without endpoints; for FOLLOWS we can only show node positions
    // The backend doesn't expose from/to in /relationships listing. Use a fallback per type:
    // we render bidirectional sample edges by random pairing only if same-label, otherwise nothing.
    // Better: we just render the nodes with no edges if rel listing has no endpoints.
    return { nodes, links };
  })();

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <header className="flex flex-wrap items-center gap-3 mb-4">
        <div className="flex items-center gap-2">
          <Network size={20} />
          <h1 className="text-2xl font-bold">Visualización del grafo</h1>
        </div>
        <div className="flex items-center gap-2 ml-auto flex-wrap">
          <label className="text-xs ig-text-soft">Label
            <select value={label} onChange={(e) => setLabel(e.target.value)} className="ig-input ml-1">
              {LABELS.map((l) => <option key={l}>{l}</option>)}
            </select>
          </label>
          <label className="text-xs ig-text-soft">N
            <input type="number" min="10" max="500" value={nodeLimit} onChange={(e) => setNodeLimit(+e.target.value)} className="ig-input ml-1 w-20" />
          </label>
          <label className="text-xs ig-text-soft">Rel
            <select value={relType} onChange={(e) => setRelType(e.target.value)} className="ig-input ml-1">
              {RELATIONSHIP_TYPES.map((r) => <option key={r}>{r}</option>)}
            </select>
          </label>
        </div>
      </header>

      <div ref={wrapRef} className="ig-card overflow-hidden">
        {nodesQ.isLoading ? (
          <div className="grid place-items-center h-[600px]"><Loader2 className="animate-spin" /></div>
        ) : (
          <ForceGraph2D
            graphData={data}
            width={size.w}
            height={size.h}
            backgroundColor="#0a0a0a"
            nodeRelSize={5}
            nodeCanvasObject={(node, ctx, globalScale) => {
              const r = 5;
              ctx.beginPath();
              ctx.arc(node.x, node.y, r, 0, 2 * Math.PI);
              ctx.fillStyle = node.color || "#e1306c";
              ctx.fill();
              if (globalScale > 1.4) {
                ctx.font = `${10 / globalScale}px Inter`;
                ctx.fillStyle = "#fafafa";
                ctx.textAlign = "center";
                ctx.fillText(String(node.name).slice(0, 12), node.x, node.y + 12);
              }
            }}
            linkColor={() => "rgba(255,255,255,0.08)"}
          />
        )}
      </div>

      <p className="text-xs ig-text-dim mt-3">
        Mostrando {data.nodes.length} nodos de {label}. Para ver aristas reales, usa Neo4j Browser con
        <code className="mx-1 text-ig-text">MATCH (a)-[r:{relType}]-&gt;(b) RETURN a,r,b LIMIT {relLimit}</code>.
      </p>
    </div>
  );
}
