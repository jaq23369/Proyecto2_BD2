# Plan — Backend Flask para Red Social en Neo4j

## Context

**Proyecto:** Proyecto 2 de Base de Datos 2 (CC3089, UVG, Sección 20). Caso de uso aprobado: **Red Social en Neo4j**, según diseño en `Diseño/Proyecto2neo02.md`. Equipo de 3: Joel Jaquez, Nery Molina, Luis Gonzalez. Entrega: martes **5 de mayo 2026 18:59**, presentación 5–8 mayo.

**Estado actual del repo:** sólo existen `Diseño/Proyecto2neo02.md`, `Diseño/grafo_red_social_neo4j.png` e `Instrucciones/Proyecto_2_Neo4j.md`. No hay código todavía.

**Por qué este plan:** la rúbrica otorga 70 pts a la *aplicación funcional* (CRUD de nodos y relaciones, gestión bulk de propiedades, eliminación, consultas Cypher), 10 pts a la carga CSV/seed, 10 pts a un algoritmo de Graph Data Science (extra) y 10 pts al frontend (extra). El backend Flask es el motor de todo eso y debe exponer un mapeo 1-a-1 con cada criterio para que la demostración sea limpia. Este plan diseña una arquitectura que cubre los 100 pts base + los 10 pts del extra de GDS, dejando el frontend para un plan separado.

**Decisiones tomadas con el usuario:**
- Base de datos: **AuraDB Free** (sin plugin GDS). El extra de PageRank/Louvain/NodeSimilarity se ejecutará en una **Neo4j Sandbox local** con GDS para la demo.
- Validación: **pydantic v2**.
- Frontend: se decide en otro plan; este backend expone una API REST consumible por cualquier cliente (Postman, React, etc.).

---

## Arquitectura y stack

- **Lenguaje:** Python 3.11+
- **Framework:** Flask 3 + flask-cors
- **Driver:** `neo4j` 5.23 (oficial)
- **Validación:** pydantic v2
- **Seed/data:** Faker + pandas + networkx (validar conexidad)
- **Tests:** pytest + pytest-flask + colección Postman

Estructura del repo (carpeta nueva `Backend/` al lado de `Diseño/`):

```
Backend/
├── app.py                      # create_app + entrypoint
├── config.py                   # carga .env, Settings
├── requirements.txt
├── .env.example                # plantilla pública
├── .gitignore                  # excluye .env, seed/data/, __pycache__
├── README.md
├── db/
│   ├── neo4j_client.py         # singleton driver + run_read / run_write
│   ├── constraints.cypher      # CONSTRAINT/INDEX iniciales
│   └── schema.py               # whitelist de labels y propiedades
├── api/                        # blueprints
│   ├── nodes.py                # /api/nodes (genérico)
│   ├── relationships.py        # /api/relationships (genérico)
│   ├── users.py posts.py comments.py hashtags.py groups.py
│   ├── messages.py media.py notifications.py
│   ├── queries.py              # 6 consultas Cypher demo
│   ├── gds.py                  # PageRank, NodeSimilarity, Louvain
│   └── ingest.py               # carga CSV + seed completo
├── services/
│   ├── node_service.py
│   ├── rel_service.py
│   ├── csv_service.py
│   └── gds_service.py
├── schemas/                    # pydantic v2
│   ├── node_schemas.py rel_schemas.py csv_schemas.py
├── utils/
│   ├── responses.py            # ok / created / no_content / error
│   ├── cypher_builder.py       # SET/REMOVE dinámicos validados
│   └── errors.py               # excepciones tipadas + handlers
├── seed/
│   ├── generate_csvs.py        # Faker -> data/*.csv (5520+ nodos)
│   ├── load_to_aura.py         # ingesta directa a AuraDB
│   └── data/                   # CSVs (en .gitignore)
└── tests/
    ├── conftest.py
    ├── test_nodes.py test_relationships.py test_queries.py
    └── postman_collection.json
```

---

## Capa Neo4j — `Backend/db/`

`db/neo4j_client.py`:
- Singleton del `GraphDatabase.driver(...)` creado al iniciar la app, cerrado con `atexit`.
- Helpers: `run_read(cypher, params)` y `run_write(cypher, params)` con `session.execute_read/write`.
- **Reglas no negociables:** todas las queries usan parámetros (`$prop`, `$ids`); labels y tipos de relación dinámicos se validan contra whitelist en `db/schema.py` antes de interpolarse en el Cypher (evita inyección).

`db/schema.py` exporta:
- `LABELS = {"User","Post","Comment","Hashtag","Group","Message","Media","Notification"}`
- `RELATIONSHIP_TYPES = {"FOLLOWS","BLOCKED",...}` (los 17 del diseño)
- `LABEL_PROPERTIES = {"User": {"userId","username",...}, ...}` derivado literal de `Diseño/Proyecto2neo02.md`.

`db/constraints.cypher` (ejecutado una vez por `flask init-db`):
- UNIQUE en cada idProp (`userId`, `postId`, `commentId`, `hashtag.name`, `groupId`, `messageId`, `mediaId`, `notificationId`)
- INDEX en `User.username` y `Post.createdAt`.

---

## API REST

**Estilo: híbrido.** Endpoints genéricos para mapear 1-a-1 con la rúbrica, endpoints de dominio para UX/demo. Ambos comparten servicios para evitar duplicación.

Convención de respuesta:
```json
{ "ok": true, "data": ... }
{ "ok": false, "error": { "code": "...", "message": "..." } }
```

### Genéricos — `api/nodes.py`

| Método | Ruta | Cypher representativo | Rúbrica |
|---|---|---|---|
| POST | `/api/nodes` | `CREATE (n:LabelA:LabelB $props) RETURN n` | crear-1-label, crear-2+labels, crear-5+props (15 pts) |
| GET | `/api/nodes/:label/:id` | `MATCH (n:Label {idProp:$id}) RETURN n` | visualización 1 nodo |
| GET | `/api/nodes` | `MATCH (n:Label) WHERE ... RETURN n SKIP $offset LIMIT $limit` | visualización muchos |
| GET | `/api/nodes/aggregate` | `MATCH (n:Label) RETURN n.k, count(*)` | consulta agregada |
| PATCH | `/api/nodes/:label/:id/properties` | `SET n += $props` | gestión props nodo (add/update) |
| PATCH | `/api/nodes/properties/bulk` | `UNWIND $items AS it MATCH(n) SET n += it.props` | bulk add/update (10 pts) |
| DELETE | `/api/nodes/:label/:id/properties` | `REMOVE n.k1, n.k2` (construido tras whitelist) | eliminar props |
| DELETE | `/api/nodes/properties/bulk` | bulk REMOVE | eliminar props bulk |
| DELETE | `/api/nodes/:label/:id?detach=true` | `DETACH DELETE n` | eliminar 1 nodo |
| DELETE | `/api/nodes` | `MATCH WHERE n.idProp IN $ids DETACH DELETE n` | eliminar múltiples (5 pts) |

### Genéricos — `api/relationships.py`

| Método | Ruta | Cypher | Rúbrica |
|---|---|---|---|
| POST | `/api/relationships` | `MATCH (a),(b) CREATE (a)-[r:TYPE $props]->(b)` | crear relación 3+ props (5 pts) |
| GET | `/api/relationships` | filtros por tipo / props | visualización |
| PATCH | `/api/relationships/:relId/properties` | `WHERE elementId(r)=$relId SET r += $props` | gestión rel props |
| PATCH | `/api/relationships/properties/bulk` | bulk SET | bulk (10 pts) |
| DELETE | `/api/relationships/:relId/properties` | REMOVE r.k1,... | eliminar props rel |
| DELETE | `/api/relationships/properties/bulk` | bulk REMOVE | eliminar props bulk |
| DELETE | `/api/relationships/:relId` | `DELETE r` | eliminar 1 rel |
| DELETE | `/api/relationships` | filtro tipo+props | eliminar múltiples (5 pts) |

Identificador de rel: `elementId(r)` (driver 5.x).

### Dominio (UX y demo)

`api/users.py`: POST/GET/PATCH/DELETE estándar + acciones (`/follow`, `/block`, `/join/:groupId`, `/feed`, `/followers`, `/following`).
`api/posts.py`: estándar + `/like`, `/comments`, `/tag/:hashtag`, `/save`, `/share/:groupId`, `/media`.
`api/comments.py`: estándar + `/reply`.
`api/hashtags.py`, `api/groups.py`, `api/messages.py`, `api/media.py`, `api/notifications.py`: estándar + acciones específicas (ver tabla detallada en sección "Endpoints de dominio" del briefing).

### Consultas demo — `api/queries.py` (15 pts, 2 por integrante)

| Ruta | Cypher | Owner |
|---|---|---|
| GET `/api/queries/top-influencers` | `MATCH (u:User)<-[:FOLLOWS]-(f) RETURN u.username, count(f) AS followers ORDER BY followers DESC LIMIT $limit` | Joel |
| GET `/api/queries/trending-hashtags` | `MATCH (p:Post)-[:TAGGED_WITH]->(h) WHERE p.createdAt >= date() - duration({days:$days}) RETURN h.name, count(p) AS uses ORDER BY uses DESC` | Joel |
| GET `/api/queries/most-liked-posts` | `MATCH (p:Post)<-[l:LIKED]-() WHERE l.isActive RETURN p, count(l) AS likes ORDER BY likes DESC` | Nery |
| GET `/api/queries/largest-groups` | `MATCH (u:User)-[:MEMBER_OF]->(g:Group) RETURN g, count(u) AS members ORDER BY members DESC` | Nery |
| GET `/api/queries/negative-comments` | `MATCH (c:Comment) WHERE c.sentiment='negative' RETURN c ORDER BY c.createdAt DESC` | Luis |
| GET `/api/queries/most-active-users` | `MATCH (u:User) OPTIONAL MATCH (u)-[:POSTED]->(p) OPTIONAL MATCH (u)-[:COMMENTED]->(c) RETURN u, count(DISTINCT p)+count(DISTINCT c) AS activity ORDER BY activity DESC` | Luis |

### GDS (extra +10 pts) — `api/gds.py`

Se corre contra **Sandbox local** (AuraDB Free no trae GDS):
- POST `/api/gds/pagerank` body `{topN:20}` — proyecta `User-FOLLOWS`, corre `gds.pageRank.stream`.
- POST `/api/gds/node-similarity` body `{userId, topK:10}` — proyecta `User-LIKED-Post` bipartito, `gds.nodeSimilarity.stream`.
- POST `/api/gds/communities` (Louvain) — proyecta `User-FOLLOWS` undirected, `gds.louvain.stream`.
- DELETE `/api/gds/graph/:name` — `gds.graph.drop`.

Patrón seguro (drop + project + stream) en cada llamada.

### Carga CSV — `api/ingest.py`

- POST `/api/ingest/csv` (multipart, campos `file`, `target`, `mode=nodes|relationships`).
- POST `/api/ingest/seed` — corre la ingesta completa desde `seed/data/*.csv`.
- GET `/api/ingest/status` — `MATCH (n) RETURN labels(n)[0], count(*)`.

Implementación: `pandas.read_csv` → validación pydantic por fila → chunks de 1000 → `UNWIND $rows ...` con `MERGE` (idempotente) en `services/csv_service.py`.

---

## Seed data — `Backend/seed/`

**Volumen objetivo (6720 nodos, supera 5000):**
1200 User + 1800 Post + 1400 Comment + 200 Hashtag + 120 Group + 500 Message + 300 Media + 1200 Notification.

**Conexidad garantizada:**
1. Cadena base FOLLOWS: `user_i → user_(i+1)` para todos.
2. ~5000 follows aleatorios adicionales.
3. Cada Post enlaza POSTED a un User existente; cada Comment conecta a Post (CONTAINS) y User (COMMENTED).
4. Cada Hashtag aparece en ≥1 TAGGED_WITH (forzado).
5. Cada Group con ≥5 MEMBER_OF.
6. Media 1:1 a Post o Message.
7. Notifications: cada User recibe ≥1, cada una ABOUT a Post/Comment.
8. Validación final con `networkx.is_connected`; si falla, añadir FOLLOWS entre componentes hasta unirlos.

**CSVs generados (24 archivos):** 8 de nodos + 16 de relaciones (incluye `has_media_post`, `has_media_msg`, `about_post`, `about_comment` separados; `follows`, `liked`, `commented`, `posted`, `contains`, `tagged_with`, `replied_to`, `member_of`, `sent`, `received`, `saved`, `shared_in`, `blocked`).

`seed/load_to_aura.py` invoca `services/csv_service.py` directo (no por HTTP) para que el seed corra sin levantar Flask.

---

## Validación, errores y config

`schemas/node_schemas.py` (pydantic v2): `CreateNodePayload`, `UpdatePropsPayload`, `RemovePropsPayload`, `BulkUpdatePayload`. Cada handler hace `Payload(**request.json)`; los errores de validación se convierten a 400 JSON por handler global.

`utils/errors.py`: `NotFoundError`, `ValidationFailed`, `ConflictError`, `InvalidLabelError`, `Neo4jServiceError`, registrados en `app.py` con `@app.errorhandler`.

`.env.example`:
```
NEO4J_URI=neo4j+s://<id>.databases.neo4j.io
NEO4J_USER=neo4j
NEO4J_PASSWORD=changeme
FLASK_DEBUG=1
PORT=5000
CORS_ORIGINS=http://localhost:5173,http://localhost:3000
MAX_CSV_SIZE_MB=50
```

`app.py::create_app()` registra blueprints, CORS, error handlers, y el comando CLI `flask init-db` (corre `db/constraints.cypher`).

---

## Mapa rúbrica → endpoint (para presentación)

| Punto rúbrica | Endpoint a demostrar | Pts |
|---|---|---|
| Crear nodo 1 label | POST `/api/nodes` `{labels:["Hashtag"], properties:{...}}` | 5 |
| Crear nodo 2+ labels | POST `/api/nodes` `{labels:["User","VerifiedUser"]}` | 5 |
| Crear nodo 5+ props | POST `/api/nodes` con 11 props User | 5 |
| Visualizar 1 / muchos / agregado | GET `/api/nodes/User/:id`, `/api/nodes?label=Post`, `/api/nodes/aggregate` | 5 |
| Gestión props nodos | PATCH/DELETE `/api/nodes/.../properties` y `/properties/bulk` | 10 |
| Crear rel 3+ props | POST `/api/relationships` (FOLLOWS) | 5 |
| Gestión props rel | PATCH/DELETE `/api/relationships/...` | 10 |
| Eliminar 1 / muchos nodos | DELETE `/api/nodes/...` | 5 |
| Eliminar 1 / muchas rel | DELETE `/api/relationships/...` | 5 |
| 4-6 consultas Cypher | GET `/api/queries/...` (las 6) | 15 |
| Carga CSV nodos+rel | POST `/api/ingest/csv` con `users.csv` y `follows.csv` | 5 |
| Datos previos cargados | GET `/api/ingest/status` muestra ≥5000 | 2 |
| 5000+ nodos / conexo | mismo + diagrama de Bloom | 3 |
| GDS (extra) | POST `/api/gds/pagerank` en sandbox local | 10 |

---

## Reparto y calendario (6 días)

**Día 1 — jue 30 abr (todos juntos):** estructura de carpetas, `requirements.txt`, `.env.example`, `db/neo4j_client.py`, `config.py`, `app.py` con `/api/health`, `db/constraints.cypher`, `db/schema.py`, instancia AuraDB Free creada y conectada.

**Día 2 — vie 1 may (paralelo):**
- Joel: `services/node_service.py` + `api/nodes.py` (genérico) + `test_nodes.py`.
- Nery: `services/rel_service.py` + `api/relationships.py` (genérico) + `test_relationships.py`.
- Luis: `seed/generate_csvs.py` + validación de conexidad con networkx + CSVs reales en `seed/data/`.

**Día 3 — sáb 2 may (paralelo):**
- Joel: `services/csv_service.py` + `api/ingest.py` + cargar 6720 nodos a AuraDB.
- Nery: `api/users.py`, `api/posts.py`, `api/comments.py`, `api/hashtags.py`.
- Luis: `api/groups.py`, `api/messages.py`, `api/media.py`, `api/notifications.py`.

**Día 4 — dom 3 may:**
- Joel: `api/queries.py` con las 6 consultas + Postman collection ordenada por punto de rúbrica.
- Nery: `api/gds.py` + montar Sandbox local con GDS + script de carga al sandbox.
- Luis: schemas pydantic en todos los blueprints + manejo de errores + README.md.

**Día 5 — lun 4 may:** ensayo de presentación (cada uno demuestra sus 2 consultas + 1/3 de CRUD), grabar video ≤10 min, escribir documento PDF reusando `Diseño/Proyecto2neo02.md`, último push.

**Día 6 — mar 5 may:** buffer para bugs encontrados en ensayo, entregar antes de 18:59.

---

## Verificación end-to-end

1. `cd Backend && python -m venv .venv && source .venv/bin/activate && pip install -r requirements.txt`
2. Copiar `.env.example` a `.env` con credenciales reales de AuraDB.
3. `flask init-db` — debe imprimir "constraints created".
4. `curl http://localhost:5000/api/health` → `{"ok":true,"data":{"neo4j":"up"}}`.
5. `python seed/generate_csvs.py` — genera 24 CSVs y reporta `is_connected = True`.
6. `python seed/load_to_aura.py` — carga a AuraDB; al final `GET /api/ingest/status` debe mostrar ≥5000 nodos.
7. `pytest -v` — todos los tests verdes (≥30 tests cubriendo cada criterio de la rúbrica).
8. Importar `tests/postman_collection.json` y correr la carpeta "Demo": cada request es 200 OK con datos.
9. Levantar Sandbox local con plugin GDS, cargar el dump, correr `POST /api/gds/pagerank` → top-20 usuarios con score.

---

## Archivos críticos a crear (por orden de dependencia)

- [Backend/requirements.txt](Backend/requirements.txt)
- [Backend/.env.example](Backend/.env.example)
- [Backend/config.py](Backend/config.py)
- [Backend/db/neo4j_client.py](Backend/db/neo4j_client.py)
- [Backend/db/schema.py](Backend/db/schema.py)
- [Backend/db/constraints.cypher](Backend/db/constraints.cypher)
- [Backend/utils/cypher_builder.py](Backend/utils/cypher_builder.py)
- [Backend/utils/errors.py](Backend/utils/errors.py)
- [Backend/utils/responses.py](Backend/utils/responses.py)
- [Backend/schemas/node_schemas.py](Backend/schemas/node_schemas.py)
- [Backend/schemas/rel_schemas.py](Backend/schemas/rel_schemas.py)
- [Backend/services/node_service.py](Backend/services/node_service.py)
- [Backend/services/rel_service.py](Backend/services/rel_service.py)
- [Backend/services/csv_service.py](Backend/services/csv_service.py)
- [Backend/api/nodes.py](Backend/api/nodes.py)
- [Backend/api/relationships.py](Backend/api/relationships.py)
- [Backend/api/ingest.py](Backend/api/ingest.py)
- [Backend/api/users.py](Backend/api/users.py)
- [Backend/api/posts.py](Backend/api/posts.py)
- [Backend/api/comments.py](Backend/api/comments.py)
- [Backend/api/hashtags.py](Backend/api/hashtags.py)
- [Backend/api/groups.py](Backend/api/groups.py)
- [Backend/api/messages.py](Backend/api/messages.py)
- [Backend/api/media.py](Backend/api/media.py)
- [Backend/api/notifications.py](Backend/api/notifications.py)
- [Backend/api/queries.py](Backend/api/queries.py)
- [Backend/api/gds.py](Backend/api/gds.py)
- [Backend/seed/generate_csvs.py](Backend/seed/generate_csvs.py)
- [Backend/seed/load_to_aura.py](Backend/seed/load_to_aura.py)
- [Backend/app.py](Backend/app.py)
- [Backend/tests/conftest.py](Backend/tests/conftest.py)
- [Backend/tests/test_nodes.py](Backend/tests/test_nodes.py)
- [Backend/tests/test_relationships.py](Backend/tests/test_relationships.py)
- [Backend/tests/test_queries.py](Backend/tests/test_queries.py)
- [Backend/tests/postman_collection.json](Backend/tests/postman_collection.json)

---

## Riesgos y mitigaciones

| Riesgo | Mitigación |
|---|---|
| AuraDB Free sin GDS | Sandbox local con dump cargado; documentar en README |
| Carga CSV lenta | Batch UNWIND chunks 1000; correr en seed offline, no en runtime |
| Grafo no conexo | Validación networkx + auto-corrección antes de cargar |
| Inyección Cypher | Whitelist estricta en `db/schema.py` |
| Re-ejecutar seed | `MERGE` en vez de `CREATE` (idempotente) |
| Olvidar punto en demo | Postman collection con carpetas nombradas por punto de rúbrica |
