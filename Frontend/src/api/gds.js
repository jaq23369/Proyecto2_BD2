import { api } from "./client";

export const gdsApi = {
  pageRank: (topN = 20) => api.post("/gds/pagerank", { topN }),
  nodeSimilarity: (userId, topK = 10) =>
    api.post("/gds/node-similarity", { userId, topK }),
  communities: (topN = 20) => api.post("/gds/communities", { topN }),
  dropGraph: (graphName) => api.delete(`/gds/graph/${graphName}`),
};
