import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Hash, Plus, TrendingUp } from "lucide-react";
import toast from "react-hot-toast";
import { hashtagsApi } from "../api/domain";
import Spinner from "../components/Spinner";
import { compactNumber } from "../utils/format";

export default function Hashtags() {
  const qc = useQueryClient();
  const [name, setName] = useState("");

  const list = useQuery({
    queryKey: ["hashtags-all"],
    queryFn: () => hashtagsApi.list({ limit: 60 }).then((r) => r.data || []),
  });

  const create = useMutation({
    mutationFn: () => hashtagsApi.create({ name: name.replace(/^#/, "").toLowerCase() }),
    onSuccess: () => {
      toast.success("Hashtag creado");
      setName("");
      qc.invalidateQueries({ queryKey: ["hashtags-all"] });
    },
  });

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <header className="flex items-center gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold">Hashtags</h1>
          <p className="ig-text-soft text-sm">Descubre y crea etiquetas (rúbrica: crear nodo 1 label)</p>
        </div>
        <div className="ml-auto flex gap-2">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="nuevo hashtag"
            className="ig-input w-44"
          />
          <button onClick={() => name && create.mutate()} className="ig-btn-accent">
            <Plus size={14} /> Crear
          </button>
        </div>
      </header>

      {list.isLoading ? <Spinner /> : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {(list.data || []).map((h) => (
            <Link key={h.name} to={`/hashtag/${h.name}`} className="ig-card p-4 hover:bg-ig-elevated">
              <div className="flex items-center gap-2 font-semibold mb-1">
                <Hash size={14} /> {h.name}
                {h.isTrending && <TrendingUp size={12} className="text-ig-link ml-auto" />}
              </div>
              <div className="text-xs ig-text-dim">
                {compactNumber(h.postsCount || 0)} posts · {compactNumber(h.followersCount || 0)} seguidores
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
