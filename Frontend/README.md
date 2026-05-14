# Neogram · Frontend Red Social Neo4j

Frontend **React 18 + Vite 5 + TailwindCSS** para el Proyecto 2 de Bases de
Datos 2. Consume todos los endpoints del backend Flask (`http://localhost:5000/api`)
y mapea cada criterio de la rúbrica a una pantalla.

Estética: **Instagram dark mode** (Neogram).

---

## 1. Requisitos

- Node.js ≥ 18
- npm ≥ 9
- Backend Flask corriendo en `http://localhost:5000` (con CORS habilitado para `http://localhost:5173`)
- Neo4j AuraDB con el seed cargado (~6720 nodos / ~21k relaciones)

## 2. Instalación

```bash
cd Frontend
cp .env.example .env       # ajusta VITE_API_URL si tu backend está en otro puerto
npm install
npm run dev                # http://localhost:5173
```

Build de producción:

```bash
npm run build
npm run preview
```

## 3. Estructura

```
Frontend/
├── index.html
├── package.json
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
├── public/favicon.svg
└── src/
    ├── main.jsx                 # Router + QueryClient + Toaster
    ├── App.jsx                  # Layout con Sidebar
    ├── index.css                # Tailwind + tema Instagram dark
    ├── api/
    │   ├── client.js            # axios + interceptor de errores
    │   ├── nodes.js
    │   ├── relationships.js
    │   ├── ingest.js
    │   ├── queries.js
    │   ├── gds.js
    │   └── domain.js            # users/posts/comments/groups/etc.
    ├── components/
    │   ├── Sidebar.jsx          # nav + health-check + toggle tema
    │   ├── PageHeader.jsx
    │   ├── StatCard.jsx
    │   ├── DataTable.jsx
    │   ├── Tabs.jsx
    │   ├── PropInput.jsx        # input dinámico por tipo (str/int/float/bool/list/date)
    │   ├── JsonViewer.jsx
    │   └── GraphMini.jsx
    ├── pages/
    │   ├── Dashboard.jsx
    │   ├── NodesCRUD.jsx
    │   ├── NodeProperties.jsx
    │   ├── RelationshipsCRUD.jsx
    │   ├── RelationshipProperties.jsx
    │   ├── DeleteNodes.jsx
    │   ├── DeleteRelationships.jsx
    │   ├── Ingest.jsx
    │   ├── DemoQueries.jsx
    │   ├── GDS.jsx
    │   ├── GraphView.jsx
    │   └── DomainExplorer.jsx
    ├── schema/labels.js
    └── utils/format.js
```

## 4. Mapeo Rúbrica → Pantalla

| Pts | Criterio | Pantalla |
|---:|---|---|
| 5 | Caso de uso (red social) | `Dashboard` |
| 5 | ≥5 labels, ≥5 props c/u | `Dashboard`, `NodesCRUD` |
| 5 | ≥10 tipos de relación, ≥3 props | `RelationshipsCRUD` |
| 5 | Tipos de datos (str/int/float/bool/list/date) | `NodesCRUD · 5+ props` |
| 5 | Carga CSV | `Ingest` |
| 2 | Datos pre-cargados | `Dashboard` |
| 2 | ≥5000 nodos | `Dashboard` |
| 1 | Grafo conexo | `Dashboard` + `GraphView` |
| 5 | Crear nodo 1 label | `NodesCRUD · Crear · 1 label` |
| 5 | Crear nodo 2+ labels | `NodesCRUD · Crear · 2+ labels` |
| 5 | Crear nodo 5+ props | `NodesCRUD · Crear · 5+ propiedades` |
| 5 | Visualizar (1/many/agg) | `NodesCRUD · Get/List/Aggregate` |
| 10 | Props nodos (add/upd/del + bulk) | `NodeProperties` |
| 5 | Crear rel con 3+ props | `RelationshipsCRUD · Crear` |
| 10 | Props rel (add/upd/del + bulk) | `RelationshipProperties` |
| 5 | Eliminar 1 / muchos nodos | `DeleteNodes` |
| 5 | Eliminar 1 / muchas rel | `DeleteRelationships` |
| 15 | 6 consultas Cypher | `DemoQueries` |
| +10 | GDS | `GDS` |
| +10 | Frontend excepcional | toda la app |

**Total: 90 base + 20 extras = hasta 110/100.**

## 5. Convenciones críticas (descubiertas en testing)

- DELETE de propiedades usa `keys` (no `properties`)
- Bulk DELETE de props de relaciones usa `rel_id` (no `relId`)
- El identificador de relación es `elementId(r)` (driver Neo4j 5.x)
- `trending-hashtags` usa `days=10000` por default para que la demo no devuelva
  array vacío con fechas viejas

## 6. Tema

Toggle claro/oscuro disponible en el footer del sidebar. Por defecto: **dark**.

## 7. Demo: cómo presentar

1. Verifica que backend responda: `Sidebar → indicador "Backend online"`.
2. **Dashboard** → muestra el seed cargado, distribución por label, y el
   grafo en miniatura.
3. **Nodos · CRUD** → tab por tab demuestra creación con 1 label, multi-label,
   5+ propiedades, y los tres tipos de visualización.
4. **Propiedades de nodos / relaciones** → demuestra single y bulk.
5. **Carga CSV** → drag & drop un CSV y muestra status.
6. **Consultas Cypher** → ejecuta cada una de las 6 queries.
7. **GDS** → si tienes Sandbox con plugin GDS levantado, ejecuta PageRank.
8. **Visualización** → grafo force-directed full-screen como cierre.
