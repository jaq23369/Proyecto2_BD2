# Frontend React + Vite — Red Social Neo4j

Guía completa para construir el frontend que consume **todos** los endpoints del backend Flask y permite demostrar cada punto de la rúbrica del Proyecto 2 (Base de Datos 2). Sigue esto al pie de la letra para sacar 100/100 (más extras).

---

## 1. Contexto

- **Backend ya corriendo** en `http://localhost:5000` (Flask + Neo4j AuraDB).
- **AuraDB ya cargada** con 6720 nodos / ~21k relaciones (seed idempotente).
- **CORS** ya habilitado para `http://localhost:5173` y `http://localhost:3000` en `Backend/.env`.
- Convención de respuestas backend:
  ```json
  { "ok": true,  "data": ... }
  { "ok": false, "error": { "code": "...", "message": "..." } }
  ```

El frontend debe **mapear 1-a-1 cada criterio de rúbrica a una pantalla o acción** para que la demo sea limpia.

---

## 2. Stack

| Pieza | Versión / paquete |
|---|---|
| Build | **Vite 5** |
| Framework | **React 18** + JavaScript (puedes usar TS si quieres, no es obligatorio) |
| Routing | `react-router-dom` v6 |
| HTTP | `axios` |
| Estado servidor | `@tanstack/react-query` v5 |
| Forms | `react-hook-form` |
| UI | **Tailwind CSS** + `@headlessui/react` (rápido y limpio) |
| Iconos | `lucide-react` |
| Visualización grafo (extra) | `react-force-graph-2d` |
| Notificaciones | `react-hot-toast` |

> El curso **no evalúa la estética del frontend**, pero un dashboard con tabs por criterio facilita la presentación.

---

## 3. Setup inicial

```bash
cd /home/luis/Escritorio/Proyecto2_BD2
npm create vite@latest Frontend -- --template react
cd Frontend
npm install
npm install axios react-router-dom @tanstack/react-query react-hook-form \
            react-hot-toast lucide-react @headlessui/react react-force-graph-2d
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

Configurar Tailwind en `tailwind.config.js`:
```js
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: { extend: {} },
  plugins: [],
};
```

En `src/index.css` agregar al inicio:
```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

Crear `Frontend/.env`:
```
VITE_API_URL=http://localhost:5000/api
```

Correr:
```bash
npm run dev   # http://localhost:5173
```

---

## 4. Estructura de carpetas sugerida

```
Frontend/
├── .env
├── index.html
├── package.json
├── tailwind.config.js
├── vite.config.js
└── src/
    ├── main.jsx                 # Router + QueryClient
    ├── App.jsx                  # Layout con sidebar
    ├── index.css
    ├── api/
    │   ├── client.js            # axios + manejo de errores
    │   ├── nodes.js
    │   ├── relationships.js
    │   ├── ingest.js
    │   ├── queries.js
    │   ├── gds.js
    │   └── domain.js            # users/posts/comments/groups/etc
    ├── components/
    │   ├── Sidebar.jsx
    │   ├── NodeForm.jsx         # form dinámico por label
    │   ├── PropertyEditor.jsx   # add/update/delete props bulk-aware
    │   ├── RelationshipForm.jsx
    │   ├── DataTable.jsx
    │   ├── JsonViewer.jsx
    │   └── ToastProvider.jsx
    ├── hooks/
    │   ├── useNodes.js          # react-query hooks
    │   ├── useRelationships.js
    │   ├── useQueries.js
    │   └── useGDS.js
    ├── pages/
    │   ├── Dashboard.jsx        # status del seed (rúbrica 5000+, conexo)
    │   ├── NodesCRUD.jsx        # criterios crear 1-label / 2+labels / 5+props / visualizar
    │   ├── NodeProperties.jsx   # add/update/delete props (single + bulk)
    │   ├── RelationshipsCRUD.jsx
    │   ├── RelationshipProperties.jsx
    │   ├── DeleteNodes.jsx
    │   ├── DeleteRelationships.jsx
    │   ├── Ingest.jsx           # subir CSV
    │   ├── DemoQueries.jsx      # las 6 consultas Cypher
    │   ├── GDS.jsx              # PageRank, NodeSimilarity, Louvain
    │   ├── GraphView.jsx        # extra: visualización grafo
    │   └── DomainExplorer.jsx   # users/posts/comments en UX real
    ├── schema/
    │   └── labels.js            # whitelist replicada del backend
    └── utils/
        └── format.js
```

---

## 5. Cliente HTTP base — `src/api/client.js`

```js
import axios from "axios";
import toast from "react-hot-toast";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  timeout: 30000,
});

api.interceptors.response.use(
  (res) => res.data, // { ok: true, data: ... } pasa tal cual
  (err) => {
    const payload = err.response?.data;
    const msg = payload?.error?.message || err.message;
    toast.error(msg);
    return Promise.reject(payload || { ok: false, error: { message: msg } });
  }
);
```

> Cada handler de UI espera `res.data` (porque el interceptor ya devolvió `res.data` de axios → el `data` de la API queda en `res.data`).

---

## 6. Schema replicado — `src/schema/labels.js`

> Esto debe coincidir **literalmente** con `Backend/db/schema.py`. Si cambia, sincronizar.

```js
export const LABELS = ["User","Post","Comment","Hashtag","Group","Message","Media","Notification"];

export const RELATIONSHIP_TYPES = [
  "FOLLOWS","BLOCKED","MEMBER_OF","POSTED","LIKED","COMMENTED","SENT",
  "TAGGED_WITH","CONTAINS","REPLIED_TO","HAS_MEDIA","RECEIVED","ABOUT","SAVED","SHARED_IN"
];

export const ID_PROPERTY = {
  User: "userId", Post: "postId", Comment: "commentId", Hashtag: "name",
  Group: "groupId", Message: "messageId", Media: "mediaId", Notification: "notificationId",
};

// Plantillas de payload por label (todos los tipos requeridos: String, Int, Float, Bool, List, Date)
export const LABEL_TEMPLATES = {
  User: {
    userId: "u_demo", username: "demo", email: "demo@demo.com", bio: "",
    profilePicUrl: "", isVerified: false, followersCount: 0, followingCount: 0,
    interests: [], birthDate: "2000-01-01", createdAt: "2026-05-05",
  },
  Post: {
    postId: "p_demo", content: "demo", location: "GT", mediaUrls: [],
    isPublic: true, likesCount: 0, commentsCount: 0,
    createdAt: "2026-05-05", updatedAt: "2026-05-05",
  },
  Comment: {
    commentId: "c_demo", content: "demo", isEdited: false,
    likesCount: 0, sentiment: "neutral",
    createdAt: "2026-05-05", updatedAt: "2026-05-05",
  },
  Hashtag: {
    name: "demo", postsCount: 0, followersCount: 0,
    isTrending: false, relatedTopics: [], createdAt: "2026-05-05",
  },
  Group: {
    groupId: "g_demo", name: "demo", description: "",
    isPrivate: false, membersCount: 0, categories: [], createdAt: "2026-05-05",
  },
  Message: {
    messageId: "m_demo", content: "demo", isRead: false,
    mediaUrl: "", reactionType: "", sentAt: "2026-05-05", readAt: "2026-05-05",
  },
  Media: {
    mediaId: "md_demo", url: "https://x", type: "image",
    sizeKB: 1.5, format: "png", uploadedAt: "2026-05-05",
  },
  Notification: {
    notificationId: "nx_demo", type: "info", isRead: false,
    priority: "low", message: "", createdAt: "2026-05-05",
  },
};

// Para crear relaciones — 3 props mínimas por tipo
export const REL_PROP_TEMPLATES = {
  FOLLOWS:    { since: "2026-05-05", notificationsEnabled: true, mutualFriendsCount: 0 },
  BLOCKED:    { blockedAt: "2026-05-05", reason: "spam", isPermanent: false },
  MEMBER_OF:  { joinedAt: "2026-05-05", role: "member", contributionScore: 0.0 },
  POSTED:     { postedAt: "2026-05-05", device: "web", location: "GT" },
  LIKED:      { likedAt: "2026-05-05", reactionType: "like", isActive: true },
  COMMENTED:  { commentedAt: "2026-05-05", isFirstComment: false, device: "web" },
  SENT:       { sentAt: "2026-05-05", isEncrypted: true, channel: "direct" },
  TAGGED_WITH:{ taggedAt: "2026-05-05", relevanceScore: 0.5, isPrimary: false },
  CONTAINS:   { addedAt: "2026-05-05", isVisible: true, moderationStatus: "ok" },
  REPLIED_TO: { repliedAt: "2026-05-05", isDirectMention: false, notifiedParent: true },
  HAS_MEDIA:  { attachedAt: "2026-05-05", isPrimary: true, caption: "" },
  RECEIVED:   { receivedAt: "2026-05-05", isRead: false, notificationType: "info" },
  ABOUT:      { linkedAt: "2026-05-05", context: "", targetType: "Post" },
  SAVED:      { savedAt: "2026-05-05", note: "", isPrivate: false },
  SHARED_IN:  { sharedAt: "2026-05-05", caption: "", visibleToMembers: true },
};
```

---

## 7. Mapeo COMPLETO de endpoints → módulos API

> ⚠️ **Convenciones críticas del backend** (descubiertas en testing):
> - **DELETE** de propiedades usa **`keys`** (NO `properties`).
> - **Bulk DELETE** de props de relaciones usa **`rel_id`** (NO `relId`).
> - El identificador de relación es `elementId(r)` (driver Neo4j 5.x).
> - Listas y fechas se envían como JSON real (no string serializado).

### 7.1 `src/api/nodes.js`

```js
import { api } from "./client";

export const nodesApi = {
  create: (labels, properties)               => api.post("/nodes", { labels, properties }),
  getOne: (label, id)                        => api.get(`/nodes/${label}/${id}`),
  list:   (params)                           => api.get("/nodes", { params }), // {label, limit, offset, ...filters}
  aggregate: (params)                        => api.get("/nodes/aggregate", { params }), // {label, groupBy}
  updateProps: (label, id, properties)       => api.patch(`/nodes/${label}/${id}/properties`, { properties }),
  bulkUpdateProps: (items)                   => api.patch("/nodes/properties/bulk", { items }),
  // items: [{ label, id, properties: {...} }, ...]
  removeProps: (label, id, keys)             => api.delete(`/nodes/${label}/${id}/properties`, { data: { keys } }),
  bulkRemoveProps: (items)                   => api.delete("/nodes/properties/bulk", { data: { items } }),
  // items: [{ label, id, keys: [...] }, ...]
  deleteOne: (label, id, detach = true)      => api.delete(`/nodes/${label}/${id}`, { params: { detach } }),
  deleteMany: (label, ids)                   => api.delete("/nodes", { data: { label, ids } }),
};
```

### 7.2 `src/api/relationships.js`

```js
import { api } from "./client";

export const relsApi = {
  create: ({ from_label, from_id, to_label, to_id, type, properties }) =>
    api.post("/relationships", { from_label, from_id, to_label, to_id, type, properties }),
  list: (params)                             => api.get("/relationships", { params }), // {type, fromLabel, toLabel, limit}
  updateProps: (relId, properties)           => api.patch(`/relationships/${encodeURIComponent(relId)}/properties`, { properties }),
  bulkUpdateProps: (items)                   => api.patch("/relationships/properties/bulk", { items }),
  // items: [{ rel_id, properties: {...} }, ...]
  removeProps: (relId, keys)                 => api.delete(`/relationships/${encodeURIComponent(relId)}/properties`, { data: { keys } }),
  bulkRemoveProps: (items)                   => api.delete("/relationships/properties/bulk", { data: { items } }),
  // items: [{ rel_id, keys: [...] }, ...]
  deleteOne: (relId)                         => api.delete(`/relationships/${encodeURIComponent(relId)}`),
  deleteMany: (filter)                       => api.delete("/relationships", { data: filter }),
  // filter: { type, fromLabel, fromId, toLabel, toId } — los que apliquen
};
```

### 7.3 `src/api/ingest.js`

```js
import { api } from "./client";

export const ingestApi = {
  status: ()                  => api.get("/ingest/status"),
  seed: ()                    => api.post("/ingest/seed"),  // recarga TODOS los CSVs
  uploadCsv: (file, target, mode = "nodes") => {
    const fd = new FormData();
    fd.append("file", file);
    fd.append("target", target);   // label o tipo de relación
    fd.append("mode", mode);       // "nodes" | "relationships"
    return api.post("/ingest/csv", fd, { headers: { "Content-Type": "multipart/form-data" } });
  },
};
```

### 7.4 `src/api/queries.js`

```js
import { api } from "./client";

export const queriesApi = {
  topInfluencers:    (limit = 10)               => api.get("/queries/top-influencers", { params: { limit } }),
  trendingHashtags:  (days = 30, limit = 10)    => api.get("/queries/trending-hashtags", { params: { days, limit } }),
  mostLikedPosts:    (limit = 10)               => api.get("/queries/most-liked-posts", { params: { limit } }),
  largestGroups:     (limit = 10)               => api.get("/queries/largest-groups", { params: { limit } }),
  negativeComments:  (limit = 10)               => api.get("/queries/negative-comments", { params: { limit } }),
  mostActiveUsers:   (limit = 10)               => api.get("/queries/most-active-users", { params: { limit } }),
};
```

> 💡 Para `trending-hashtags` usar `days=10000` durante la demo si el seed tiene fechas viejas (verificado contra AuraDB real).

### 7.5 `src/api/gds.js`

```js
import { api } from "./client";

export const gdsApi = {
  pageRank:       (topN = 20)                  => api.post("/gds/pagerank", { topN }),
  nodeSimilarity: (userId, topK = 10)          => api.post("/gds/node-similarity", { userId, topK }),
  communities:    (topN = 20)                  => api.post("/gds/communities", { topN }),
  dropGraph:      (graphName)                  => api.delete(`/gds/graph/${graphName}`),
};
```

> ⚠️ **Aura Free no tiene plugin GDS**. Para que estos endpoints respondan, levantar Neo4j Sandbox/Desktop con plugin GDS y apuntar `Backend/.env` a esa instancia. La UI debe manejar el error con un banner explicativo: "GDS requiere instancia con plugin Graph Data Science".

### 7.6 `src/api/domain.js` — endpoints de dominio (UX/demo)

```js
import { api } from "./client";

export const usersApi = {
  list:        (params) => api.get("/users", { params }),
  get:         (id)     => api.get(`/users/${id}`),
  create:      (body)   => api.post("/users", body),
  update:      (id, b)  => api.patch(`/users/${id}`, b),
  remove:      (id)     => api.delete(`/users/${id}`),
  follow:      (id, t)  => api.post(`/users/${id}/follow/${t}`),
  unfollow:    (id, t)  => api.delete(`/users/${id}/follow/${t}`),
  block:       (id, t)  => api.post(`/users/${id}/block/${t}`),
  unblock:     (id, t)  => api.delete(`/users/${id}/block/${t}`),
  joinGroup:   (id, g)  => api.post(`/users/${id}/join/${g}`),
  leaveGroup:  (id, g)  => api.delete(`/users/${id}/join/${g}`),
  feed:        (id)     => api.get(`/users/${id}/feed`),
  followers:   (id)     => api.get(`/users/${id}/followers`),
  following:   (id)     => api.get(`/users/${id}/following`),
};

export const postsApi = {
  list:    (params) => api.get("/posts", { params }),
  get:     (id)     => api.get(`/posts/${id}`),
  create:  (body)   => api.post("/posts", body),
  update:  (id, b)  => api.patch(`/posts/${id}`, b),
  remove:  (id)     => api.delete(`/posts/${id}`),
  like:    (id, userId) => api.post(`/posts/${id}/like`, { userId }),
  unlike:  (id, userId) => api.delete(`/posts/${id}/like`, { data: { userId } }),
  comments:(id)     => api.get(`/posts/${id}/comments`),
  tag:     (id, h)  => api.post(`/posts/${id}/tag/${h}`),
  save:    (id, userId) => api.post(`/posts/${id}/save`, { userId }),
  share:   (id, g)  => api.post(`/posts/${id}/share/${g}`),
  media:   (id)     => api.get(`/posts/${id}/media`),
};

export const commentsApi = {
  list: (params) => api.get("/comments", { params }),
  get:  (id)     => api.get(`/comments/${id}`),
  create:(body)  => api.post("/comments", body),
  update:(id,b)  => api.patch(`/comments/${id}`, b),
  remove:(id)    => api.delete(`/comments/${id}`),
  reply: (id,b)  => api.post(`/comments/${id}/reply`, b),
};

export const hashtagsApi = {
  list:   (params) => api.get("/hashtags", { params }),
  get:    (name)   => api.get(`/hashtags/${name}`),
  create: (body)   => api.post("/hashtags", body),
  update: (n,b)    => api.patch(`/hashtags/${n}`, b),
  remove: (n)      => api.delete(`/hashtags/${n}`),
  posts:  (n)      => api.get(`/hashtags/${n}/posts`),
};

export const groupsApi = {
  list:   (params)=> api.get("/groups", { params }),
  get:    (id)    => api.get(`/groups/${id}`),
  create: (body)  => api.post("/groups", body),
  update: (id,b)  => api.patch(`/groups/${id}`, b),
  remove: (id)    => api.delete(`/groups/${id}`),
  members:(id)    => api.get(`/groups/${id}/members`),
  posts:  (id)    => api.get(`/groups/${id}/posts`),
};

export const messagesApi = {
  list: (params) => api.get("/messages", { params }),
  get:  (id)     => api.get(`/messages/${id}`),
  create:(body)  => api.post("/messages", body),
  update:(id,b)  => api.patch(`/messages/${id}`, b),
  remove:(id)    => api.delete(`/messages/${id}`),
  sent:    (uid) => api.get(`/messages/sent/${uid}`),
  received:(uid) => api.get(`/messages/received/${uid}`),
};

export const mediaApi = {
  list:   (params)        => api.get("/media", { params }),
  get:    (id)            => api.get(`/media/${id}`),
  create: (body)          => api.post("/media", body),
  update: (id,b)          => api.patch(`/media/${id}`, b),
  remove: (id)            => api.delete(`/media/${id}`),
  attachToPost:    (id,p) => api.post(`/media/${id}/attach/post/${p}`),
  attachToMessage: (id,m) => api.post(`/media/${id}/attach/message/${m}`),
};

export const notificationsApi = {
  list:   (params)=> api.get("/notifications", { params }),
  get:    (id)    => api.get(`/notifications/${id}`),
  create: (body)  => api.post("/notifications", body),
  update: (id,b)  => api.patch(`/notifications/${id}`, b),
  remove: (id)    => api.delete(`/notifications/${id}`),
  about:  (id)    => api.get(`/notifications/${id}/about`),
};

export const healthApi = () => api.get("/health");
```

---

## 8. Mapeo Rúbrica → Pantalla → Acción demo

| Pts | Criterio | Página | Botón / acción que muestras |
|---:|---|---|---|
| 5 | Caso de uso adecuado (red social) | `Dashboard` | Diagrama del grafo + métricas |
| 5 | ≥5 labels, ≥5 props c/u | `Dashboard` | Tarjetas con `LABELS` y conteo desde `/api/ingest/status` |
| 5 | ≥10 tipos de relación, ≥3 props | `RelationshipsCRUD` | Selector con 15 tipos + form con 3 props |
| 5 | Tipos de datos (str/int/float/bool/list/date) | `NodesCRUD` | Form crear `User` que muestra cada tipo en su input |
| 5 | Carga CSV | `Ingest` | Drag & drop → `uploadCsv` |
| 2 | Datos pre-cargados | `Dashboard` | `/api/ingest/status` total = 6720 |
| 2 | ≥5000 nodos | `Dashboard` | mismo |
| 1 | Grafo conexo | `Dashboard` | nota + visualización en `GraphView` |
| 5 | Crear nodo 1 label | `NodesCRUD` tab "1 label" | Crear `Hashtag` |
| 5 | Crear nodo 2+ labels | `NodesCRUD` tab "Multi-label" | Crear `User+Notification` (template combinado) |
| 5 | Crear nodo 5+ props | `NodesCRUD` tab "5+ props" | Crear `User` con 11 props |
| 5 | Visualizar 1 / muchos / agregado | `NodesCRUD` tabs Get | `getOne`, `list`, `aggregate` |
| 10 | Gestión props nodos (add/upd/del + bulk) | `NodeProperties` | Tabs: ADD/UPDATE/DELETE — single + bulk |
| 5 | Crear rel 3+ props | `RelationshipsCRUD` | `FOLLOWS` u_0→u_2 con 3 props |
| 10 | Gestión props rel (add/upd/del + bulk) | `RelationshipProperties` | Tabs análogos |
| 5 | Eliminar 1 / muchos nodos | `DeleteNodes` | Single + lista de IDs |
| 5 | Eliminar 1 / muchas rel | `DeleteRelationships` | Por relId + por filtro |
| 15 | 4-6 consultas Cypher | `DemoQueries` | 6 botones, 1 por consulta. **Cada integrante sus 2** |
| **+10** | GDS extra | `GDS` | PageRank top-20, NodeSimilarity, Louvain |
| +10 | Frontend excepcional | toda la app | Tailwind + tabs + grafo |

**Total: 90 base + 20 extras = hasta 110/100 (rúbrica permite hasta 120).**

---

## 9. Ejemplo de página clave — `NodesCRUD.jsx` (esqueleto)

```jsx
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { nodesApi } from "../api/nodes";
import { LABELS, LABEL_TEMPLATES, ID_PROPERTY } from "../schema/labels";
import toast from "react-hot-toast";

export default function NodesCRUD() {
  const qc = useQueryClient();
  const [label, setLabel] = useState("Hashtag");
  const [extraLabel, setExtraLabel] = useState("");
  const [props, setProps] = useState(LABEL_TEMPLATES.Hashtag);

  const create = useMutation({
    mutationFn: () => {
      const labels = extraLabel ? [label, extraLabel] : [label];
      return nodesApi.create(labels, props);
    },
    onSuccess: (res) => {
      toast.success("Nodo creado");
      qc.invalidateQueries({ queryKey: ["nodes"] });
      console.log(res.data);
    },
  });

  const list = useQuery({
    queryKey: ["nodes", label],
    queryFn: () => nodesApi.list({ label, limit: 10 }).then((r) => r.data),
  });

  const aggregate = useQuery({
    queryKey: ["agg", label],
    queryFn: () => nodesApi.aggregate({ label, groupBy: "isPublic" }).then((r) => r.data),
    enabled: label === "Post",
  });

  return (
    <div className="grid grid-cols-2 gap-4">
      <section>
        <h2>Crear nodo</h2>
        <select value={label} onChange={(e) => {
          setLabel(e.target.value);
          setProps(LABEL_TEMPLATES[e.target.value]);
        }}>
          {LABELS.map((l) => <option key={l}>{l}</option>)}
        </select>
        <select value={extraLabel} onChange={(e) => setExtraLabel(e.target.value)}>
          <option value="">— sin segunda label —</option>
          {LABELS.filter((l) => l !== label).map((l) => <option key={l}>{l}</option>)}
        </select>

        {Object.entries(props).map(([k, v]) => (
          <PropInput key={k} name={k} value={v} onChange={(nv) => setProps((p) => ({ ...p, [k]: nv }))} />
        ))}

        <button onClick={() => create.mutate()}>Crear</button>
      </section>

      <section>
        <h2>Listado ({label})</h2>
        <pre>{JSON.stringify(list.data, null, 2)}</pre>
        {label === "Post" && (
          <>
            <h3>Aggregate por isPublic</h3>
            <pre>{JSON.stringify(aggregate.data, null, 2)}</pre>
          </>
        )}
      </section>
    </div>
  );
}

function PropInput({ name, value, onChange }) {
  if (typeof value === "boolean")
    return <label><input type="checkbox" checked={value} onChange={(e) => onChange(e.target.checked)} /> {name}</label>;
  if (typeof value === "number")
    return <label>{name} <input type="number" value={value} onChange={(e) => onChange(Number(e.target.value))} /></label>;
  if (Array.isArray(value))
    return <label>{name} (CSV) <input value={value.join(",")} onChange={(e) => onChange(e.target.value.split(",").map(s=>s.trim()).filter(Boolean))} /></label>;
  return <label>{name} <input value={value} onChange={(e) => onChange(e.target.value)} /></label>;
}
```

---

## 10. Página `DemoQueries.jsx`

```jsx
import { useQuery } from "@tanstack/react-query";
import { queriesApi } from "../api/queries";

const QUERIES = [
  { id: "top-influencers",   label: "Top influencers (Joel)",    fn: () => queriesApi.topInfluencers(20) },
  { id: "trending-hashtags", label: "Trending hashtags (Joel)",  fn: () => queriesApi.trendingHashtags(10000, 20) },
  { id: "most-liked-posts",  label: "Most liked posts (Nery)",   fn: () => queriesApi.mostLikedPosts(20) },
  { id: "largest-groups",    label: "Largest groups (Nery)",     fn: () => queriesApi.largestGroups(20) },
  { id: "negative-comments", label: "Negative comments (Luis)",  fn: () => queriesApi.negativeComments(20) },
  { id: "most-active-users", label: "Most active users (Luis)",  fn: () => queriesApi.mostActiveUsers(20) },
];

export default function DemoQueries() {
  return QUERIES.map((q) => <QueryCard key={q.id} {...q} />);
}

function QueryCard({ id, label, fn }) {
  const { data, refetch, isFetching } = useQuery({
    queryKey: [id], queryFn: () => fn().then((r) => r.data), enabled: false,
  });
  return (
    <div>
      <h3>{label}</h3>
      <button onClick={() => refetch()} disabled={isFetching}>Ejecutar</button>
      <pre>{JSON.stringify(data, null, 2)}</pre>
    </div>
  );
}
```

---

## 11. Página `Ingest.jsx`

```jsx
import { useState } from "react";
import { ingestApi } from "../api/ingest";
import { LABELS, RELATIONSHIP_TYPES } from "../schema/labels";

export default function Ingest() {
  const [file, setFile] = useState(null);
  const [target, setTarget] = useState("User");
  const [mode, setMode] = useState("nodes");
  const [status, setStatus] = useState(null);

  return (
    <div>
      <button onClick={() => ingestApi.status().then((r) => setStatus(r.data))}>Ver status</button>
      <pre>{JSON.stringify(status, null, 2)}</pre>

      <h3>Subir CSV</h3>
      <select value={mode} onChange={(e) => setMode(e.target.value)}>
        <option value="nodes">nodes</option><option value="relationships">relationships</option>
      </select>
      <select value={target} onChange={(e) => setTarget(e.target.value)}>
        {(mode === "nodes" ? LABELS : RELATIONSHIP_TYPES).map((x) => <option key={x}>{x}</option>)}
      </select>
      <input type="file" accept=".csv" onChange={(e) => setFile(e.target.files[0])} />
      <button disabled={!file} onClick={() => ingestApi.uploadCsv(file, target, mode)}>Subir</button>

      <h3>Recargar seed completo</h3>
      <button onClick={() => ingestApi.seed()}>POST /api/ingest/seed</button>
    </div>
  );
}
```

---

## 12. Routing — `src/main.jsx`

```jsx
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "react-hot-toast";
import "./index.css";

import Dashboard from "./pages/Dashboard";
import NodesCRUD from "./pages/NodesCRUD";
import NodeProperties from "./pages/NodeProperties";
import RelationshipsCRUD from "./pages/RelationshipsCRUD";
import RelationshipProperties from "./pages/RelationshipProperties";
import DeleteNodes from "./pages/DeleteNodes";
import DeleteRelationships from "./pages/DeleteRelationships";
import Ingest from "./pages/Ingest";
import DemoQueries from "./pages/DemoQueries";
import GDS from "./pages/GDS";
import GraphView from "./pages/GraphView";
import DomainExplorer from "./pages/DomainExplorer";

const qc = new QueryClient();

const NAV = [
  ["/",                        "Dashboard"],
  ["/nodes",                   "Nodos CRUD (5/5/5/5)"],
  ["/node-properties",         "Props nodos (10)"],
  ["/relationships",           "Relaciones CRUD (5)"],
  ["/relationship-properties", "Props relaciones (10)"],
  ["/delete-nodes",            "Eliminar nodos (5)"],
  ["/delete-relationships",    "Eliminar rel (5)"],
  ["/ingest",                  "Carga CSV (5)"],
  ["/queries",                 "Consultas Cypher (15)"],
  ["/gds",                     "GDS (+10)"],
  ["/graph",                   "Visualización"],
  ["/domain",                  "Explorer dominio"],
];

ReactDOM.createRoot(document.getElementById("root")).render(
  <QueryClientProvider client={qc}>
    <BrowserRouter>
      <div className="flex">
        <aside className="w-64 p-4 border-r min-h-screen">
          <h1 className="font-bold mb-4">Red Social Neo4j</h1>
          {NAV.map(([to, label]) => (
            <Link key={to} to={to} className="block py-1 hover:underline">{label}</Link>
          ))}
        </aside>
        <main className="flex-1 p-6">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/nodes" element={<NodesCRUD />} />
            <Route path="/node-properties" element={<NodeProperties />} />
            <Route path="/relationships" element={<RelationshipsCRUD />} />
            <Route path="/relationship-properties" element={<RelationshipProperties />} />
            <Route path="/delete-nodes" element={<DeleteNodes />} />
            <Route path="/delete-relationships" element={<DeleteRelationships />} />
            <Route path="/ingest" element={<Ingest />} />
            <Route path="/queries" element={<DemoQueries />} />
            <Route path="/gds" element={<GDS />} />
            <Route path="/graph" element={<GraphView />} />
            <Route path="/domain" element={<DomainExplorer />} />
          </Routes>
        </main>
      </div>
      <Toaster position="top-right" />
    </BrowserRouter>
  </QueryClientProvider>
);
```

---

## 13. Visualización del grafo (extra para impresionar)

`GraphView.jsx` con `react-force-graph-2d`:

```jsx
import ForceGraph2D from "react-force-graph-2d";
import { useEffect, useState } from "react";
import { nodesApi } from "../api/nodes";
import { relsApi } from "../api/relationships";

export default function GraphView() {
  const [graph, setGraph] = useState({ nodes: [], links: [] });

  useEffect(() => {
    Promise.all([
      nodesApi.list({ label: "User", limit: 50 }),
      relsApi.list({ type: "FOLLOWS", limit: 200 }),
    ]).then(([users, rels]) => {
      const nodes = users.data.map((u) => ({ id: u.userId, label: u.username }));
      const ids = new Set(nodes.map((n) => n.id));
      const links = rels.data
        .filter((r) => ids.has(r.from) && ids.has(r.to))
        .map((r) => ({ source: r.from, target: r.to }));
      setGraph({ nodes, links });
    });
  }, []);

  return <ForceGraph2D graphData={graph} nodeLabel="label" width={900} height={600} />;
}
```

---

## 14. Checklist antes de la presentación

```
[ ] Backend corriendo: cd Backend && .venv/bin/flask --app app.py run
[ ] AuraDB con seed cargado: curl localhost:5000/api/ingest/status → total: 6720
[ ] Frontend corriendo: cd Frontend && npm run dev → http://localhost:5173
[ ] Tab por tab, cada criterio de rúbrica responde 200 OK con datos visibles
[ ] (Extra) Sandbox local con plugin GDS levantado y .env apuntando ahí para demo de PageRank
[ ] Postman collection lista como respaldo
[ ] Cada integrante sabe sus 2 consultas (DemoQueries):
    - Joel: top-influencers, trending-hashtags
    - Nery: most-liked-posts, largest-groups
    - Luis: negative-comments, most-active-users
```

---

## 15. Errores comunes y cómo resolverlos

| Error | Causa | Solución |
|---|---|---|
| CORS bloqueado | Backend no está corriendo o `CORS_ORIGINS` distinto | `.env` backend incluye `http://localhost:5173`; reiniciar Flask |
| `400 VALIDATION_FAILED keys missing` | Estás mandando `properties` en DELETE de props | Cambia a `keys: [...]` |
| `400` en bulk DELETE props rel | Mandaste `relId` | Usa `rel_id` en `items[].rel_id` |
| `Date is not JSON serializable` | Backend ya parcheado en `db/neo4j_client.py` (`_jsonable`) | Reiniciar Flask después de pull |
| `gds.graph.project` falla | AuraDB Free no tiene plugin GDS | Apuntar `.env` a Sandbox/Desktop con GDS |
| `trending-hashtags` retorna `[]` | Filtro `createdAt >= date() - duration({days})` filtra todo | En la UI mandar `days=10000` por default para la demo |
| `ID inexistente` en crear rel | El nodo `from_id`/`to_id` no existe | Usa IDs reales del seed (`u_0`, `p_0`, etc.) |

---

## 16. Resumen final

- Backend listo, 36/36 tests verdes, 6720 nodos en AuraDB, grafo conexo verificado.
- Frontend Vite + React siguiendo este documento debe construirse en **1 día de trabajo** y cubre **toda la rúbrica + extras**.
- Cada pantalla mapea explícitamente a un criterio → durante la presentación basta con hacer "tour" por el sidebar.
- Postman como red de seguridad si la UI falla en vivo.

🎯 **Meta: 90 base + 10 GDS + 10 frontend = 110/100.**
