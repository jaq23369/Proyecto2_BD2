import { api } from "./client";

export const relsApi = {
  create: ({ from_label, from_id, to_label, to_id, type, properties }) =>
    api.post("/relationships", {
      from_label,
      from_id,
      to_label,
      to_id,
      type,
      properties,
    }),
  list: (params) => api.get("/relationships", { params }),
  updateProps: (relId, properties) =>
    api.patch(
      `/relationships/${encodeURIComponent(relId)}/properties`,
      { properties }
    ),
  bulkUpdateProps: (items) =>
    api.patch("/relationships/properties/bulk", { items }),
  removeProps: (relId, keys) =>
    api.delete(`/relationships/${encodeURIComponent(relId)}/properties`, {
      data: { keys },
    }),
  bulkRemoveProps: (items) =>
    api.delete("/relationships/properties/bulk", { data: { items } }),
  deleteOne: (relId) =>
    api.delete(`/relationships/${encodeURIComponent(relId)}`),
  deleteMany: (filter) => api.delete("/relationships", { data: filter }),
};
