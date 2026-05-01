# Fases del Backend — Red Social Neo4j

Este documento divide el backend de [Plan_backed.md](../Diseño/Plan_backed.md) en **3 fases secuenciales**. Cada fase tiene un responsable principal, criterios de "listo" y una **plantilla de reporte** que el responsable llena al terminar. La siguiente fase **no inicia** hasta que el reporte sea revisado y aprobado por los otros dos integrantes.

**Equipo:** Joel Jaquez · Nery Molina · Luis Gonzalez
**Entrega final:** martes 5 mayo 2026, 18:59

---

## Flujo de trabajo

```
Fase 1 (cimientos) ──▶ Reporte 1 ──▶ Revisión ──▶ ✅ aprobado
                                                       │
Fase 2 (CRUD + seed) ◀─────────────────────────────────┘
        │
        ▼
   Reporte 2 ──▶ Revisión ──▶ ✅ aprobado
                                   │
Fase 3 (consultas + GDS + entrega) ◀┘
        │
        ▼
   Reporte 3 ──▶ Revisión final ──▶ entrega
```

Reglas:
1. Cada fase tiene un **dueño** que coordina y un **co-piloto** que apoya. El tercero revisa.
2. Al cerrar la fase, el dueño llena el **Reporte de cierre** al final de la sección.
3. Los otros dos verifican los criterios de "listo" y marcan ✅ o ❌ en la sección de revisión.
4. Si hay ❌, se documenta el bloqueo y se itera; **no se avanza** hasta resolverlo.
5. Cada fase termina con un **commit etiquetado** (`fase-1-ok`, `fase-2-ok`, `fase-3-ok`).

---

## Fase 1 — Cimientos (Día 1–2: 30 abr – 1 may)

**Dueño:** Luis · **Co-piloto:** Joel · **Revisor:** Nery

### Objetivo
Dejar el esqueleto del backend funcionando: Flask arranca, conecta a AuraDB, los constraints existen, y las utilidades base (errores, respuestas, validación, whitelist de schema) están listas para que la Fase 2 solo escriba lógica de dominio.

### Tareas
- [ ] Crear estructura `Backend/` según [Plan_backed.md:29-68](../Diseño/Plan_backed.md#L29-L68)
- [ ] [Backend/requirements.txt](../Backend/requirements.txt) con flask, flask-cors, neo4j 5.23, pydantic v2, faker, pandas, networkx, pytest
- [ ] [Backend/.env.example](../Backend/.env.example) con las 6 variables del plan
- [ ] [Backend/.gitignore](../Backend/.gitignore) excluyendo `.env`, `seed/data/`, `__pycache__`, `.venv`
- [ ] [Backend/config.py](../Backend/config.py) cargando `.env` con clase `Settings`
- [ ] [Backend/db/neo4j_client.py](../Backend/db/neo4j_client.py) — singleton del driver + helpers `run_read` / `run_write` + cierre con `atexit`
- [ ] [Backend/db/schema.py](../Backend/db/schema.py) — `LABELS`, `RELATIONSHIP_TYPES`, `LABEL_PROPERTIES` (whitelist literal del diseño)
- [ ] [Backend/db/constraints.cypher](../Backend/db/constraints.cypher) — UNIQUE en cada idProp + INDEX en `User.username` y `Post.createdAt`
- [ ] [Backend/utils/responses.py](../Backend/utils/responses.py) — helpers `ok`, `created`, `no_content`, `error`
- [ ] [Backend/utils/errors.py](../Backend/utils/errors.py) — excepciones tipadas + handlers globales
- [ ] [Backend/utils/cypher_builder.py](../Backend/utils/cypher_builder.py) — construcción segura de SET/REMOVE dinámicos validados contra whitelist
- [ ] [Backend/schemas/node_schemas.py](../Backend/schemas/node_schemas.py) y [Backend/schemas/rel_schemas.py](../Backend/schemas/rel_schemas.py) — pydantic base
- [ ] [Backend/app.py](../Backend/app.py) con `create_app()`, CORS, blueprints registrados (vacíos por ahora), `/api/health` que pingea Neo4j, y comando CLI `flask init-db`
- [ ] AuraDB Free creada, credenciales en `.env` real (no commiteado)
- [ ] [Backend/seed/generate_csvs.py](../Backend/seed/generate_csvs.py) genera los 24 CSVs (8 nodos + 16 relaciones) con Faker
- [ ] Validación `networkx.is_connected` corre sobre los CSVs y reporta `True`

### Criterios de "listo" (binarios, todos deben cumplirse)
1. `pip install -r requirements.txt` instala sin errores en venv limpio.
2. `flask init-db` corre y termina con "constraints created".
3. `flask run` levanta el servidor en `:5000`.
4. `curl http://localhost:5000/api/health` → `{"ok":true,"data":{"neo4j":"up"}}`.
5. `python seed/generate_csvs.py` produce 24 archivos en `seed/data/` y la última línea imprime `is_connected = True` sobre el grafo.
6. El total de nodos generados ≥ 5000 (el plan apunta a 6720).
7. Cypher injection cerrada: cualquier label o tipo de relación que llegue por API se valida contra `db/schema.py` antes de interpolarse.
8. `git push` con tag `fase-1-ok` ejecutado.

### Reporte de cierre — Fase 1

> **Quien cierra la fase llena esta sección antes de notificar al equipo.**

- **Cerrada por:** Luis Gonzalez
- **Fecha/hora:** 2026-04-30 ~18:50
- **Commit:** `12f9cf6` (hash)
- **Tag:** `fase-1-ok`

**Qué se hizo (resumen 3-5 bullets):**
- Estructura `Backend/` completa: `db/`, `api/`, `services/`, `schemas/`, `utils/`, `seed/`, `tests/`
- `db/neo4j_client.py` con singleton driver conectado a AuraDB Free, helpers `run_read`/`run_write`, cierre automático con `atexit`
- `db/schema.py` con whitelist completa de labels, tipos de relación y propiedades derivada literalmente del diseño; `utils/cypher_builder.py` que valida contra esa whitelist antes de cualquier interpolación en Cypher
- `app.py` con `create_app()`, CORS, `/api/health` verificado en vivo contra AuraDB (responde `{"ok":true,"data":{"neo4j":"up"}}`), y comando `flask init-db` que ejecuta los 10 statements de `constraints.cypher`
- `seed/generate_csvs.py` genera 6720 nodos en 24 CSVs (8 nodos + 16 relaciones) con Faker; valida grafo conexo con networkx (`is_connected = True`) en ~1 segundo

**Qué quedó fuera de alcance (si aplica):**
- Los CSVs están en `seed/data/` (gitignore); la carga a AuraDB es tarea de Fase 2 (Joel)

**Cambios respecto al plan original:**
- El plan original decía `NEO4J_USER` en el `.env`; AuraDB usa `NEO4J_USERNAME` — se corrigió en `config.py` y `.env.example`
- El plan hablaba de 16 CSVs de relaciones con `about_post` y `about_comment` separados; se unificaron en `about.csv` con columna `targetType` para mantener el total en 16 y simplificar la carga

**Decisiones tomadas sobre la marcha:**
- Se usó `pydantic-settings` para cargar `.env` con validación de tipos en `config.py` (más robusto que `python-dotenv` directo)
- El singleton del driver no se inicializa al importar sino al primer uso (lazy init), evitando errores si el `.env` no existe en tiempo de tests

**Métricas:**
- Nodos generados en CSVs: **6720** (User=1200, Post=1800, Comment=1400, Hashtag=200, Group=120, Message=500, Media=300, Notification=1200)
- Tiempo de `generate_csvs.py`: **~1.0 s**
- `is_connected`: **True**
- Endpoints expuestos por ahora: solo `/api/health`

**Cómo verificarlo localmente:** (comandos exactos para que los revisores reproduzcan)
```bash
cd Backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
# pegar credenciales reales en .env (pedir a Luis)
FLASK_APP=app.py flask init-db          # debe imprimir: constraints created
FLASK_APP=app.py flask run &
curl http://localhost:5000/api/health   # {"ok":true,"data":{"neo4j":"up"}}
python seed/generate_csvs.py            # última línea: is_connected = True
```

**Bloqueos / dudas pendientes:**
- Ninguno. AuraDB Free conectada y funcional.

### Revisión Fase 1

| Revisor | Verificó criterios 1-8 | Comentarios | Aprueba |
|---|---|---|---|
| Joel | [ ] | | [ ] ✅ / [ ] ❌ |
| Nery | [ ] | | [ ] ✅ / [ ] ❌ |

**¿Avanzamos a Fase 2?** [ ] Sí [ ] No, iterar

---

## Fase 2 — CRUD genérico, dominio y carga de datos (Día 2–3: 1–2 may)

**Dueño:** Joel · **Co-pilotos:** Nery (relaciones + dominio top), Luis (dominio bottom + ingesta) · **Revisor cruzado:** los tres entre sí

### Objetivo
Que la API REST quede completa: CRUD genérico de nodos y relaciones, endpoints de dominio para los 8 labels, ingesta de CSVs, y la base de datos AuraDB con ≥5000 nodos cargados de forma idempotente.

### Tareas (paralelas; cada quien marca las suyas)

**Joel — núcleo genérico + ingesta**
- [ ] [Backend/services/node_service.py](../Backend/services/node_service.py) — CRUD de nodos, bulk ops, agregaciones
- [ ] [Backend/api/nodes.py](../Backend/api/nodes.py) — los 10 endpoints del [Plan_backed.md:102-113](../Diseño/Plan_backed.md#L102-L113)
- [ ] [Backend/services/csv_service.py](../Backend/services/csv_service.py) — `pandas.read_csv` + validación pydantic + chunks 1000 + `UNWIND/MERGE`
- [ ] [Backend/api/ingest.py](../Backend/api/ingest.py) — POST `/api/ingest/csv`, POST `/api/ingest/seed`, GET `/api/ingest/status`
- [ ] [Backend/seed/load_to_aura.py](../Backend/seed/load_to_aura.py) llama a `csv_service` directo (sin HTTP)
- [ ] **Cargar 6720 nodos a AuraDB Free** y verificar con `GET /api/ingest/status`

**Nery — relaciones + dominio "top"**
- [ ] [Backend/services/rel_service.py](../Backend/services/rel_service.py) — CRUD de relaciones por `elementId(r)`
- [ ] [Backend/api/relationships.py](../Backend/api/relationships.py) — los 8 endpoints del [Plan_backed.md:117-126](../Diseño/Plan_backed.md#L117-L126)
- [ ] [Backend/api/users.py](../Backend/api/users.py) — CRUD + `/follow`, `/block`, `/join/:groupId`, `/feed`, `/followers`, `/following`
- [ ] [Backend/api/posts.py](../Backend/api/posts.py) — CRUD + `/like`, `/comments`, `/tag/:hashtag`, `/save`, `/share/:groupId`, `/media`
- [ ] [Backend/api/comments.py](../Backend/api/comments.py) — CRUD + `/reply`
- [ ] [Backend/api/hashtags.py](../Backend/api/hashtags.py) — CRUD + posts asociados

**Luis — dominio "bottom" + schemas/errores**
- [ ] [Backend/api/groups.py](../Backend/api/groups.py) — CRUD + miembros + posts compartidos
- [ ] [Backend/api/messages.py](../Backend/api/messages.py) — CRUD + `/sent`, `/received`
- [ ] [Backend/api/media.py](../Backend/api/media.py) — CRUD + asociar a Post/Message
- [ ] [Backend/api/notifications.py](../Backend/api/notifications.py) — CRUD + `/about/:targetId`
- [ ] Schemas pydantic completos por blueprint (todos los handlers usan `Payload(**request.json)`)
- [ ] Manejo de errores conectado: cada excepción tipada produce JSON 4xx/5xx coherente

### Criterios de "listo"
1. **Todos los endpoints genéricos** de [Plan_backed.md:102-126](../Diseño/Plan_backed.md#L102-L126) responden 2xx con datos reales.
2. **Todos los endpoints de dominio** están implementados (no stubs).
3. `POST /api/ingest/seed` carga los 24 CSVs sin errores en una corrida limpia.
4. `GET /api/ingest/status` reporta ≥5000 nodos en AuraDB.
5. **Re-ejecutar el seed no duplica datos** (idempotencia vía `MERGE`).
6. Toda query Cypher usa parámetros (`$prop`, `$ids`); ningún label/tipo se interpola sin pasar por whitelist.
7. Errores de validación pydantic devuelven 400 con cuerpo `{"ok":false,"error":{...}}`.
8. `git push` con tag `fase-2-ok`.

### Reporte de cierre — Fase 2

- **Cerrada por:** _____________ (dueño consolida con co-pilotos)
- **Fecha/hora:** _____________
- **Commit:** `_____________`
- **Tag:** `fase-2-ok`

**Qué hizo cada integrante:**
- Joel: 
- Nery: 
- Luis: 

**Endpoints expuestos (conteo por blueprint):**
- `/api/nodes`: ___ rutas
- `/api/relationships`: ___ rutas
- `/api/users`: ___ · `/api/posts`: ___ · `/api/comments`: ___ · `/api/hashtags`: ___
- `/api/groups`: ___ · `/api/messages`: ___ · `/api/media`: ___ · `/api/notifications`: ___
- `/api/ingest`: ___ rutas

**Estado de AuraDB tras `seed`:**
- Total nodos: ___ (objetivo ≥5000)
- Conteo por label: User=___, Post=___, Comment=___, Hashtag=___, Group=___, Message=___, Media=___, Notification=___
- Total relaciones: ___
- `is_connected` confirmado en grafo cargado: [ ] sí

**Cambios respecto al plan original:**
- 

**Decisiones de diseño:**
- 

**Cómo verificarlo localmente:**
```bash
# tras .env real cargado
flask run &
curl -X POST http://localhost:5000/api/ingest/seed
curl http://localhost:5000/api/ingest/status
# probar al menos 1 endpoint genérico y 1 de dominio
```

**Bloqueos / dudas pendientes:**
- 

### Revisión Fase 2

| Revisor | Verificó criterios 1-8 | Probó endpoints clave | Comentarios | Aprueba |
|---|---|---|---|---|
| Joel (auto-cierre) | [ ] | [ ] | | [ ] ✅ |
| Nery | [ ] | [ ] | | [ ] ✅ / [ ] ❌ |
| Luis | [ ] | [ ] | | [ ] ✅ / [ ] ❌ |

**¿Avanzamos a Fase 3?** [ ] Sí [ ] No, iterar

---

## Fase 3 — Consultas Cypher, GDS, tests y entrega (Día 4–6: 3–5 may)

**Dueño:** Nery · **Co-pilotos:** Joel (queries + Postman), Luis (tests + docs) · **Revisor:** los tres

### Objetivo
Cerrar los puntos de rúbrica restantes (consultas demo, GDS extra, tests, documentación) y dejar el repo listo para presentar y entregar.

### Tareas

**Joel — consultas + Postman**
- [ ] [Backend/api/queries.py](../Backend/api/queries.py) con las 6 queries del [Plan_backed.md:140-146](../Diseño/Plan_backed.md#L140-L146):
  - `GET /api/queries/top-influencers` (Joel)
  - `GET /api/queries/trending-hashtags` (Joel)
  - `GET /api/queries/most-liked-posts` (Nery)
  - `GET /api/queries/largest-groups` (Nery)
  - `GET /api/queries/negative-comments` (Luis)
  - `GET /api/queries/most-active-users` (Luis)
- [ ] [Backend/tests/postman_collection.json](../Backend/tests/postman_collection.json) **organizada por punto de rúbrica** (carpetas con el nombre del criterio)

**Nery — GDS en sandbox**
- [ ] Levantar **Neo4j Sandbox local** con plugin GDS instalado
- [ ] Cargar dump/seed al sandbox
- [ ] [Backend/services/gds_service.py](../Backend/services/gds_service.py) con patrón `drop + project + stream`
- [ ] [Backend/api/gds.py](../Backend/api/gds.py) con los 4 endpoints del [Plan_backed.md:150-154](../Diseño/Plan_backed.md#L150-L154)
- [ ] Probar `pageRank`, `nodeSimilarity`, `louvain` y devolver top-N

**Luis — tests + docs + entregables**
- [ ] [Backend/tests/conftest.py](../Backend/tests/conftest.py) con fixture de app y cliente Flask
- [ ] [Backend/tests/test_nodes.py](../Backend/tests/test_nodes.py) cubriendo cada endpoint genérico
- [ ] [Backend/tests/test_relationships.py](../Backend/tests/test_relationships.py)
- [ ] [Backend/tests/test_queries.py](../Backend/tests/test_queries.py) — 1 test por consulta demo
- [ ] [Backend/README.md](../Backend/README.md) — instalación, `.env`, `init-db`, seed, run, tests, mapa rúbrica→endpoint
- [ ] **Documento PDF** reusando [Diseño/Proyecto2neo02.md](../Diseño/Proyecto2neo02.md) + capturas
- [ ] **Video ≤10 min** demostrando cada punto de rúbrica en orden

### Criterios de "listo"
1. `pytest -v` corre con ≥30 tests verdes cubriendo cada criterio de la rúbrica.
2. Las 6 consultas Cypher devuelven datos reales del seed (no listas vacías).
3. `POST /api/gds/pagerank` en sandbox local devuelve top-20 usuarios con `score`.
4. La colección Postman tiene una carpeta llamada "Demo" donde cada request mapea a 1 punto de rúbrica y todos responden 2xx.
5. README documenta cómo correr todo desde cero en <10 min.
6. PDF + video grabados y subidos.
7. Cada integrante puede demostrar **sus 2 consultas + 1/3 del CRUD** sin asistencia.
8. `git push` con tag `fase-3-ok` y entrega oficial antes del **5 mayo 18:59**.

### Reporte de cierre — Fase 3

- **Cerrada por:** Nery (consolida)
- **Fecha/hora:** _____________
- **Commit:** `_____________`
- **Tag:** `fase-3-ok`

**Cobertura final de rúbrica (autoevaluación):**

| Punto rúbrica | Pts máx | Endpoint/artefacto demostrable | Pts auto |
|---|---|---|---|
| Crear nodo 1 label | 5 | | |
| Crear nodo 2+ labels | 5 | | |
| Crear nodo 5+ props | 5 | | |
| Visualizar 1/muchos/agregado | 5 | | |
| Gestión props nodos (add/upd/del + bulk) | 10 | | |
| Crear rel 3+ props | 5 | | |
| Gestión props rel (add/upd/del + bulk) | 10 | | |
| Eliminar 1/muchos nodos | 5 | | |
| Eliminar 1/muchas rel | 5 | | |
| 4-6 consultas Cypher | 15 | | |
| Carga CSV nodos+rel | 5 | | |
| Datos previos cargados | 2 | | |
| 5000+ nodos / conexo | 3 | | |
| GDS (extra) | 10 | | |
| **Total** | **90 + 10 extra** | | |

**Resultados de tests:**
- Tests totales: ___
- Pass: ___ · Fail: ___
- Cobertura: ___ %

**Resultado GDS (sandbox):**
- PageRank top-20 obtenido: [ ] sí
- NodeSimilarity probado: [ ] sí
- Louvain probado: [ ] sí

**Material de entrega:**
- README: [ ] · PDF: [ ] · Video: [ ] · Postman: [ ] · Repo limpio: [ ]

**Cambios de último momento:**
- 

**Bloqueos / problemas en la presentación:**
- 

### Revisión final

| Revisor | Tests pasan localmente | Probó endpoint suyo de demo | Aprueba entrega |
|---|---|---|---|
| Joel | [ ] | [ ] | [ ] ✅ |
| Nery (auto-cierre) | [ ] | [ ] | [ ] ✅ |
| Luis | [ ] | [ ] | [ ] ✅ |

**¿Listos para entregar?** [ ] Sí [ ] No, qué falta: _____________

---

## Reglas operativas

- **Branching:** rama por fase (`fase-1`, `fase-2`, `fase-3`); merge a `main` solo cuando la fase está aprobada.
- **Commits:** mensajes en español, prefijo con `[F1]`, `[F2]`, `[F3]` para identificar la fase.
- **Comunicación de cierre:** quien cierra una fase escribe en el chat del equipo: *"Fase X cerrada, reporte llenado en `Fases/Fases_Backend.md`, esperando review"*.
- **Si una fase se atrasa más de 1 día respecto al calendario:** se documenta en el reporte y se renegocia el alcance (qué baja a Fase 3 / qué se recorta).
- **Nadie toca código de una fase futura** hasta que la actual esté aprobada (evita conflicts y trabajo perdido).
