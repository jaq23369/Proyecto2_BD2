# Backend Flask - Red Social Neo4j

Backend REST para el Proyecto 2 de Base de Datos 2. Modela una red social sobre Neo4j/AuraDB con usuarios, publicaciones, comentarios, hashtags, grupos, mensajes, media y notificaciones.

## Requisitos

- Python 3.11+
- Neo4j AuraDB Free para la demo principal
- Neo4j local/Sandbox con plugin Graph Data Science para los endpoints `/api/gds/*`

## Instalacion

```bash
cd Backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
```

Crear `.env` desde `.env.example`:

```env
NEO4J_URI=neo4j+s://<id>.databases.neo4j.io
NEO4J_USERNAME=neo4j
NEO4J_PASSWORD=<password>
NEO4J_DATABASE=neo4j
FLASK_DEBUG=1
PORT=5000
```

## Arranque

```bash
flask --app app.py init-db
flask --app app.py run --port 5000
```

Verificar:

```bash
curl http://localhost:5000/api/health
```

## Seed CSV

```bash
python seed/generate_csvs.py
python seed/load_to_aura.py
```

Estado:

```bash
curl http://localhost:5000/api/ingest/status
```

La meta del seed es cargar 6720 nodos y un grafo conexo, superando el requisito de 5000 nodos.

## Tests

```bash
pytest -v
```

Los tests no requieren AuraDB: usan mocks sobre los servicios para validar que los endpoints de Fase 3 y CRUD respondan con el contrato HTTP esperado.

## Consultas Cypher De Demo

Cada integrante presenta dos consultas:

| Integrante | Endpoint | Proposito |
|---|---|---|
| Joel | `GET /api/queries/top-influencers` | Usuarios con mas seguidores |
| Joel | `GET /api/queries/trending-hashtags` | Hashtags mas usados recientemente |
| Nery | `GET /api/queries/most-liked-posts` | Publicaciones con mas likes |
| Nery | `GET /api/queries/largest-groups` | Grupos con mas miembros |
| Luis | `GET /api/queries/negative-comments` | Comentarios con sentimiento negativo |
| Luis | `GET /api/queries/most-active-users` | Usuarios mas activos |

## Graph Data Science

AuraDB Free no incluye GDS. Para el extra, usar Neo4j Desktop/Sandbox local con el plugin GDS y la misma data cargada.

Endpoints:

```bash
curl -X POST http://localhost:5000/api/gds/pagerank -H "Content-Type: application/json" -d "{\"topN\":20}"
curl -X POST http://localhost:5000/api/gds/node-similarity -H "Content-Type: application/json" -d "{\"userId\":\"u_1\",\"topK\":10}"
curl -X POST http://localhost:5000/api/gds/communities -H "Content-Type: application/json" -d "{\"topN\":20}"
```

## Mapa Rubrica A Endpoint

| Criterio | Endpoint |
|---|---|
| Crear nodo 1 label | `POST /api/nodes` con `labels:["Hashtag"]` |
| Crear nodo 2+ labels | `POST /api/nodes` con `labels:["User","Notification"]` y propiedades de ambas labels |
| Crear nodo con 5+ propiedades | `POST /api/nodes` con payload completo |
| Visualizar 1 nodo | `GET /api/nodes/User/u_1` |
| Visualizar muchos nodos | `GET /api/nodes?label=Post&limit=10` |
| Agregaciones | `GET /api/nodes/aggregate?label=Post&groupBy=isPublic` |
| Gestion propiedades nodos | `PATCH/DELETE /api/nodes/.../properties` y bulk |
| Crear relacion con 3+ propiedades | `POST /api/relationships` |
| Gestion propiedades relaciones | `PATCH/DELETE /api/relationships/.../properties` y bulk |
| Eliminar nodos | `DELETE /api/nodes/User/u_1`, `DELETE /api/nodes` |
| Eliminar relaciones | `DELETE /api/relationships/<relId>`, `DELETE /api/relationships` |
| Consultas Cypher | `GET /api/queries/*` |
| Carga CSV | `POST /api/ingest/seed`, `POST /api/ingest/csv` |
| GDS extra | `POST /api/gds/pagerank`, `node-similarity`, `communities` |
