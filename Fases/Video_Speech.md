# Speech del Video — Proyecto 2 Neo4j (Red Social)

**Duración objetivo:** ≤ 10 min
**Equipo:** Joel Jaquez · Nery Molina · Luis Gonzalez
**Caso de uso:** Red Social sobre Neo4j AuraDB
**Modalidad:** explicativo — se muestra el código, el diseño y resultados ya cargados; no se ejecutan comandos en vivo.

El orden sigue la rúbrica de [Instrucciones/Proyecto_2_Neo4j.md](../Instrucciones/Proyecto_2_Neo4j.md).

---

## Qué tener abierto en pantalla (capturas/ventanas)

- **Neo4j Browser** con AuraDB conectado y un `MATCH (n) RETURN n LIMIT 50` ya ejecutado para mostrar el grafo visualmente.
- **VSCode** con estos archivos abiertos en pestañas:
  - [Backend/db/schema.py](../Backend/db/schema.py) — whitelist de labels, relaciones y propiedades
  - [Backend/api/nodes.py](../Backend/api/nodes.py), [Backend/api/relationships.py](../Backend/api/relationships.py)
  - [Backend/api/queries.py](../Backend/api/queries.py) — las 6 consultas
  - [Backend/api/gds.py](../Backend/api/gds.py) — extra GDS
  - [Backend/seed/generate_csvs.py](../Backend/seed/generate_csvs.py)
- **Diagrama del grafo** (de [Diseño/Proyecto2neo02.md](../Diseño/Proyecto2neo02.md)) como imagen.
- **Postman** abierto con la colección `tests/postman_collection.json` para mostrar las carpetas por punto de rúbrica (sin ejecutar).
- **Capturas previas** de respuestas reales del API (curl o Postman) para mostrar evidencia.

---

## 0. Intro (0:00 – 0:30)

> "Hola, somos Joel, Nery y Luis. Para el Proyecto 2 implementamos una **red social** sobre Neo4j AuraDB, expuesta como un backend REST en Flask. En este video vamos a explicar el diseño del grafo y cómo cada parte de la rúbrica está cubierta, mostrando el código y la base de datos ya cargada."

**En pantalla:** diagrama del grafo + vista del grafo en Neo4j Browser.

---

## 1. Modelado de datos (0:30 – 2:00)

### 1.1 Caso de uso (5 pts)
> "Elegimos **Red Social**. El grafo modela 8 entidades: Usuarios, Publicaciones, Comentarios, Hashtags, Grupos, Mensajes, Media y Notificaciones. Las relaciones representan interacciones sociales reales como seguir, comentar, dar like, pertenecer a grupos o enviar mensajes."

**Mostrar:** diagrama del modelo.

### 1.2 Labels y propiedades — 8 labels, ≥5 props c/u (5 pts)
> "Definimos **8 labels distintas**, supera el mínimo de 5. Cada una tiene al menos 5 propiedades documentadas en `db/schema.py`. Por ejemplo, `User` tiene userId, username, email, bio, isVerified, followersCount, interests, birthDate, createdAt — más de 9 propiedades."

**Mostrar:** archivo `db/schema.py`, scrollear por `LABEL_PROPERTIES`.

### 1.3 Relaciones — 15 tipos, ≥3 props c/u (5 pts)
> "Tenemos **15 tipos de relaciones**, supera el mínimo de 10: FOLLOWS, BLOCKED, POSTED, LIKED, COMMENTED, CONTAINS, REPLIED_TO, TAGGED_WITH, MEMBER_OF, SENT, HAS_MEDIA, RECEIVED, SAVED, SHARED_IN y ABOUT. Cada una tiene 3 o más propiedades — por ejemplo FOLLOWS guarda `since`, `notificationsEnabled` y `mutualFriendsCount`."

**Mostrar:** `db/schema.py` lista `RELATIONSHIP_TYPES` y propiedades por relación.

### 1.4 Tipos de datos: String, Float, Integer, Boolean, List, Date (5 pts)
> "Cubrimos los 6 tipos de datos: texto en `username`, entero en `followersCount`, flotante en `score` de PageRank, booleano en `isVerified`, lista en `interests`, y fecha en `createdAt`. La capa de servicio hace coerción explícita para que Neo4j almacene cada tipo correctamente."

**Mostrar:** captura de un nodo `User` en Neo4j Browser donde se vean los tipos.

---

## 2. Set de datos (2:00 – 2:45)

### 2.1 Carga CSV (5 pts)
> "La carga es por CSV. El servicio `csv_service` lee con pandas, valida con Pydantic y aplica `UNWIND` + `MERGE` en chunks de mil. La operación es idempotente: re-correr el seed no duplica datos. Hay tres endpoints: `POST /api/ingest/csv`, `POST /api/ingest/seed` y `GET /api/ingest/status`."

**Mostrar:** archivo `services/csv_service.py` y la lista de 24 CSVs (8 nodos + 16 relaciones).

### 2.2 Datos previos cargados (2 pts) + ≥5000 nodos (2 pts) + Conexo (1 pt)
> "AuraDB ya tiene **6720 nodos** cargados antes de presentar — supera los 5000 requeridos. La distribución por label es 1200 Users, 1800 Posts, 1400 Comments, 200 Hashtags, 120 Groups, 500 Messages, 300 Media y 1200 Notifications. El grafo es **conexo**: el generador valida con BFS local antes de exportar los CSVs."

**Mostrar:** Neo4j Browser corriendo `MATCH (n) RETURN count(n)` con resultado 6720, y captura de `GET /api/ingest/status`.

---

## 3. Aplicación funcional — CRUD (2:45 – 6:00)

> "Toda la API CRUD pasa por dos blueprints genéricos — `/api/nodes` y `/api/relationships` — más blueprints de dominio por label. Cualquier label o tipo de relación que llegue por el API se valida contra la whitelist de `db/schema.py` antes de tocar Cypher: cierra inyección."

### 3.1 Crear nodo con 1 label (5 pts)
> "`POST /api/nodes` recibe `labels` y `properties`. Para una sola label, se manda por ejemplo `labels:[\"Hashtag\"]` con sus 6 propiedades."

**Mostrar:** request en Postman dentro de la carpeta "Crear nodo 1 label".

### 3.2 Crear nodo con 2+ labels (5 pts)
> "El mismo endpoint acepta múltiples labels — por ejemplo `labels:[\"User\",\"Notification\"]`. Validamos que las propiedades del payload pertenezcan a alguna de las labels declaradas."

**Mostrar:** payload en Postman.

### 3.3 Crear nodo con 5+ propiedades (5 pts)
> "El payload de `User` envía 10+ propiedades en una sola llamada — supera el mínimo de 5."

### 3.4 Visualización: 1 nodo, muchos, agregado (5 pts)
> "Tres operaciones distintas: `GET /api/nodes/User/u_1` para uno solo, `GET /api/nodes?label=Post&limit=10` con filtros y paginación para varios, y `GET /api/nodes/aggregate?label=Post&groupBy=isPublic` para agregaciones con `count`."

**Mostrar:** capturas de los tres responses.

### 3.5 Gestión de propiedades en nodos — 6 operaciones (10 pts)
> "Cubrimos las seis operaciones que pide la rúbrica: agregar/actualizar uno (`PATCH /api/nodes/<label>/<id>/properties`), agregar/actualizar varios (`PATCH /api/nodes/properties/bulk`), eliminar de uno (`DELETE /.../properties`) y eliminar de varios (`DELETE /api/nodes/properties/bulk`). Las dos primeras hacen agregar y actualizar al mismo tiempo porque Cypher `SET` cubre ambos casos."

**Mostrar:** las 4 rutas en `api/nodes.py` y su carpeta correspondiente en Postman.

### 3.6 Crear relación con 3+ propiedades (5 pts)
> "`POST /api/relationships` recibe nodo origen, nodo destino, tipo y propiedades. Por ejemplo, una relación `FOLLOWS` con `since`, `notificationsEnabled` y `mutualFriendsCount` — supera el mínimo de 3 propiedades. Devuelve el `elementId` de la relación, que usamos como identificador."

### 3.7 Gestión de propiedades en relaciones — 6 operaciones (10 pts)
> "Las mismas seis operaciones, sobre relaciones identificadas por `elementId`: `PATCH /api/relationships/<relId>/properties`, su variante bulk, y los dos `DELETE` análogos."

**Mostrar:** rutas en `api/relationships.py`.

### 3.8 Eliminación de nodos (5 pts)
> "`DELETE /api/nodes/<label>/<id>` borra uno y `DELETE /api/nodes` con un body `{label, ids:[...]}` borra varios. Se usa `DETACH DELETE` para limpiar también las relaciones colgadas."

### 3.9 Eliminación de relaciones (5 pts)
> "`DELETE /api/relationships/<relId>` borra una sola y `DELETE /api/relationships` con un array de IDs borra varias en una sola transacción."

---

## 4. Consultas Cypher — 6 queries, 2 por integrante (6:00 – 8:00)

> "Cada integrante diseñó dos consultas Cypher significativas sobre la red social. Están todas en `api/queries.py`."

### Joel
> "**Top Influencers** — usa `MATCH (u:User)<-[:FOLLOWS]-() RETURN u, count(*) AS followers ORDER BY followers DESC LIMIT 10` para devolver los usuarios con más seguidores. **Trending Hashtags** — combina `TAGGED_WITH` con la fecha de los posts para sacar los hashtags más usados en la última ventana de tiempo."

**Mostrar:** las dos queries en `api/queries.py` y captura del response.

### Nery
> "**Most Liked Posts** — recorre `LIKED` y agrupa por post, ordenando por número de likes para sacar el top de publicaciones. **Largest Groups** — cuenta los `MEMBER_OF` por grupo para devolver los grupos con más miembros."

**Mostrar:** queries y resultados.

### Luis
> "**Negative Comments** — filtra los comentarios cuya propiedad `sentiment` es negativa para identificar contenido con mala recepción. **Most Active Users** — combina posts publicados, comentarios escritos y likes dados en una sola query con `OPTIONAL MATCH` y suma los tres conteos para ranquear actividad total."

**Mostrar:** queries y resultados.

---

## 5. Extra — Graph Data Science (8:00 – 9:15)

> "Como extra implementamos tres algoritmos del Graph Data Science. AuraDB Free no incluye GDS, así que se ejecutan sobre una instancia local con el plugin instalado. Los tres siguen el patrón **drop + project + stream**: limpiamos el grafo proyectado en memoria, lo reconstruimos y leemos los resultados."

### PageRank
> "**`POST /api/gds/pagerank`** identifica los usuarios más influyentes según la estructura de FOLLOWS. Devuelve top-N con score."

### Node Similarity
> "**`POST /api/gds/node-similarity`** sugiere usuarios parecidos a uno dado, comparando vecinos en el grafo. Útil para recomendar a quién seguir."

### Louvain (comunidades)
> "**`POST /api/gds/communities`** detecta comunidades. Cada usuario queda asignado a un `communityId` y devolvemos las comunidades más grandes."

**Mostrar:** archivo `services/gds_service.py` con las 3 funciones, y capturas de los responses ya generados sobre la instancia local.

---

## 6. Cierre (9:15 – 9:45)

> "Para cerrar: el repositorio incluye 36 tests automatizados con `pytest` que validan el contrato HTTP de cada endpoint sin necesidad de AuraDB; un README con la guía de instalación, seed y demo; y una colección Postman organizada en carpetas que mapean directamente a los puntos de la rúbrica. La planificación se documentó en tres fases en `Fases/Fases_Backend.md`. Gracias."

**Mostrar:** README, carpetas de Postman organizadas por rúbrica, captura de `pytest -v` con 36 verdes.

---

## Mapa de tiempos

| Bloque | Inicio | Duración |
|---|---|---|
| Intro | 0:00 | 0:30 |
| Modelado de datos | 0:30 | 1:30 |
| Set de datos | 2:00 | 0:45 |
| CRUD nodos + props | 2:45 | 1:30 |
| CRUD relaciones + delete | 4:15 | 1:45 |
| 6 consultas Cypher | 6:00 | 2:00 |
| GDS extra | 8:00 | 1:15 |
| Cierre | 9:15 | 0:30 |
| **Total** | | **9:45** |

## Tips de grabación

- **No ejecutar nada en vivo:** todas las "respuestas" son capturas o Postman ya guardado. Esto evita esperas, errores de red y mantiene el ritmo.
- **Pantalla principal:** VSCode + Neo4j Browser. Ir alternando entre código y grafo a medida que se explica.
- **Zoom de fuente** a 16-18 pt en VSCode y terminal para que se lea claro.
- **Hablar pausado** sobre el código, no leer línea por línea — explicar la intención.
- **Cortes en post:** unir tomas si una sección sale larga; mantener el total bajo 10 min.
- Si se quiere mostrar UNA respuesta real en vivo (ej. `/api/ingest/status`), hacerlo solo una vez al inicio para validar que el sistema está activo, y de ahí en adelante todo capturas.
