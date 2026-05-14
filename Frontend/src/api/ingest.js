import { api } from "./client";

export const ingestApi = {
  status: () => api.get("/ingest/status"),
  seed: () => api.post("/ingest/seed"),
  uploadCsv: (file, target, mode = "nodes") => {
    const fd = new FormData();
    fd.append("file", file);
    fd.append("target", target);
    fd.append("mode", mode);
    return api.post("/ingest/csv", fd, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
};
