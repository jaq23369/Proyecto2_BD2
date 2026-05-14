import { api } from "./client";

export const nodesApi = {
  create: (labels, properties) => api.post("/nodes", { labels, properties }),
  getOne: (label, id) => api.get(`/nodes/${label}/${id}`),
  list: (params) => api.get("/nodes", { params }),
  aggregate: (params) => api.get("/nodes/aggregate", { params }),
  updateProps: (label, id, properties) =>
    api.patch(`/nodes/${label}/${id}/properties`, { properties }),
  bulkUpdateProps: (items) => api.patch("/nodes/properties/bulk", { items }),
  removeProps: (label, id, keys) =>
    api.delete(`/nodes/${label}/${id}/properties`, { data: { keys } }),
  bulkRemoveProps: (items) =>
    api.delete("/nodes/properties/bulk", { data: { items } }),
  deleteOne: (label, id, detach = true) =>
    api.delete(`/nodes/${label}/${id}`, { params: { detach } }),
  deleteMany: (label, ids) => api.delete("/nodes", { data: { label, ids } }),
};
