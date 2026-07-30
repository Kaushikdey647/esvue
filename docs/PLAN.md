# esvue — Elasticsearch Cluster Observability UI

**Status:** Planning (handoff doc)  
**Repo:** `/Users/kaushik.dey1/WebProjects/esvue`  
**Stack (existing):** Vue 3.5, Vite 8, Pinia 4, TypeScript  
**Target cluster:** `shopsy2-cluster` (ES 8.19.7) via port-forward `localhost:9200`  
**API reference:** `loadrunner/Shopsy v2.postman_collection.json` → `es-index → Observability` (63 read-only curls)

---

## 1. Problem & goal

Oncall engineers need a **read-only, beautiful dashboard** to triage ES incidents without running 20+ curls or digging through Postman. Primary workflows (from Jul 2026 misc RCA):

| Workflow | Signals |
| --- | --- |
| **Quick triage** | Cluster health, unassigned shards, elected master, pending tasks |
| **Node health** | CPU, heap, disk %, uptime, rack group (`g7`/`g9`/`g12`) |
| **Shard status** | UNASSIGNED / RELOCATING / INITIALIZING, per-index drill-down |
| **Allocation** | Disk watermarks, allocation explain, recovery progress |
| **Search pressure** | Search thread pool queue + rejects (misc incident symptom) |
| **Index / alias** | `products_live_misc` → `products_v3_misc`, doc counts, segment pressure |

**Non-goals for v1:** writes (index/create/delete), reroute, index management, Prometheus/Grafana integration, multi-cluster auth.

---

## 2. Architecture options

### A. Vue SPA + Vite dev proxy (recommended v1)

```
Browser → esvue (Vite :5173) → proxy /api/es → localhost:9200
```

- **Pros:** Minimal code, matches port-forward workflow, fast to ship
- **Cons:** Proxy only in dev unless you add a tiny prod proxy

### B. Vue SPA + optional Node proxy package

Same UI; `server/proxy.ts` (or separate `esvue-proxy`) for prod / shared team use.

- **Pros:** Credentials stay server-side, CORS solved everywhere
- **Cons:** Extra deployable

### C. Nuxt with server routes

ES calls from Nitro server routes.

- **Pros:** Auth, SSR, API in one repo
- **Cons:** Heavier than needed for internal oncall tool

**Recommendation:** **A for MVP**, design API client behind `EsClient` interface so **B** is a one-file swap later.

---

## 3. Tech additions (next chat)

| Package | Why |
| --- | --- |
| `vue-router` | Views per observability category |
| `@tanstack/vue-table` | Sortable/filterable `_cat` tables (uptime, disk, queue) |
| `tailwindcss` + `@tailwindcss/vite` | Fast, consistent ops UI |
| (optional) `@vueuse/core` | `useIntervalFn` polling, `useLocalStorage` for ES URL |

**Avoid for v1:** charting libs (no time-series from ES `_cat` alone), component libraries heavier than needed.

---

## 4. CORS & connection

- ES does **not** expose browser CORS for arbitrary origins.
- **Dev:** `vite.config.ts` proxy:

```ts
server: {
  proxy: {
    '/api/es': {
      target: 'http://localhost:9200',
      changeOrigin: true,
      rewrite: (p) => p.replace(/^\/api\/es/, ''),
    },
  },
}
```

- **UI:** Settings drawer — `ES base URL` default `/api/es` (dev) or full URL if proxy deployed.
- **Safety:** Read-only allowlist of paths (`_cat/*`, `_cluster/health`, `_nodes/stats/*`, `_cluster/allocation/explain` POST only). Block `PUT`, `DELETE`, `_bulk`, index creation.

---

## 5. Information architecture (screens)

```
┌─────────────────────────────────────────────────────────┐
│  esvue          shopsy2-cluster  🟡 YELLOW   ⟳ 30s     │
├──────────┬──────────────────────────────────────────────┤
│ Overview │  [health cards] [master] [unassigned: 2]    │
│ Nodes    │                                              │
│ Shards   │           main content area                  │
│ Disk     │                                              │
│ Threads  │                                              │
│ Indices  │                                              │
│ Explain  │                                              │
│ Settings │                                              │
└──────────┴──────────────────────────────────────────────┘
```

### 5.1 Overview (Quick Triage)

- Status badge: green / yellow / red from `_cluster/health`
- Cards: `active_shards_percent`, `unassigned_shards`, `relocating_shards`, `pending_tasks`
- Elected master from `_cat/master`
- **Alert strip** for UNASSIGNED shards (table, top 10) from `_cat/shards` filtered client-side
- Auto-refresh: 30s default, pause toggle

### 5.2 Nodes

- Table from `_cat/nodes` with columns: name, role, master, heap%, cpu%, load_1m, disk%, disk avail, **uptime**
- **Sortable** columns (client-side; mirrors `s=uptime:desc` curl behavior)
- Filter: rack group from `_cat/nodeattrs` where `attr=group`
- Row highlight: master `*`, heap > 85%, disk > 85%
- Click row → side panel: breakers, open search contexts (`_nodes/stats` subset)

### 5.3 Shards

- Table: index, shard, pri/rep, state, unassigned.reason, docs, store, node
- Filters: index (`{{es_index}}` default `products_v3_misc`), state (UNASSIGNED / STARTED / RELOCATING)
- Preset chips: `products_live_misc`, `kids_toys`, `kitchen_appliances`
- Color: UNASSIGNED = red, RELOCATING = blue, INITIALIZING = amber

### 5.4 Disk & Allocation

- Table from `_cat/allocation` sorted by `disk.avail` asc (tightest first)
- Progress bars for `disk.percent` with watermark lines at 85% / 90% (from `_cluster/settings` disk thresholds)
- Recovery panel: `_cat/recovery` for selected index
- Segments count for selected index (`_cat/segments/{index}`) — segment pressure indicator

### 5.5 Thread Pools

- Table: node, search active/queue/rejected, write queue
- **Heat:** queue > 50 warn, > 200 critical (misc RCA thresholds)
- Optional: filter to rack group nodes (g12 misc holders)

### 5.6 Indices & Aliases

- `_cat/indices/products*` with health, pri, rep, docs, store
- Alias resolver: pick `products_live_misc` → show backing index
- Link shard row → Shards view filtered

### 5.7 Allocation Explain

- Form: index, shard, primary (bool)
- POST `_cluster/allocation/explain` → pretty JSON viewer
- Presets: misc shard 3, kids_toys, kitchen_appliances (from RCA)

### 5.8 Settings

- ES base URL, poll interval, default index/alias
- Connection test (Ping `/`)
- “Production — read only” banner toggle

---

## 6. Data layer

### 6.1 `_cat` text parsing

`_cat` APIs return **tab-separated text**, not JSON. Add `parseCatTable(text): Record<string,string>[]` using header row from `?v`.

```ts
// parsers/cat.ts
export function parseCatTable(raw: string): CatRow[]
```

### 6.2 Typed models (`src/types/`)

- `ClusterHealth`, `CatNode`, `CatShard`, `CatAllocation`, `CatThreadPool`, `CatIndex`, `CatAlias`, `AllocationExplain`

### 6.3 API module (`src/api/es/`)

One function per endpoint group; map 1:1 to Postman Observability folders:

| Module | Endpoints |
| --- | --- |
| `cluster.ts` | health, state, stats, settings, pending_tasks, master |
| `nodes.ts` | cat nodes, nodeattrs, nodes/stats subsets |
| `shards.ts` | cat shards, routing table, index settings |
| `allocation.ts` | cat allocation, recovery, segments, explain |
| `threadPools.ts` | cat thread_pool/* |
| `indices.ts` | cat indices, aliases, count, stats |

### 6.4 Pinia stores

| Store | Responsibility |
| --- | --- |
| `connection` | base URL, connected, version, poll interval |
| `cluster` | health, master, pending tasks |
| `nodes` | nodes + nodeattrs merged by name |
| `shards` | all shards, derived unassigned list |
| `allocation` | disk table, watermarks |
| `threadPools` | search/write pools |
| `indices` | indices + aliases |

Fetch orchestration: `useClusterRefresh()` composable triggers parallel fetches, handles errors per section (degraded card vs full-page fail).

---

## 7. UI design direction

**Aesthetic:** Dark ops dashboard — not Kibana-cluttered, not generic admin template.

| Element | Direction |
| --- | --- |
| Background | `#0f1419` / `#1a1f26` |
| Status | green `#3dd68c`, yellow `#f5a623`, red `#ff5c5c` |
| Typography | `IBM Plex Sans` + `JetBrains Mono` for tables |
| Cards | Subtle border, no heavy shadows |
| Tables | Sticky header, zebra optional, mono for node names |
| Motion | Minimal — pulse on status change only |

**Components to build:**

- `StatusBadge`, `MetricCard`, `DataTable` (TanStack wrapper), `DiskBar`, `QueueHeatCell`, `JsonPanel`, `ConnectionBanner`, `AppShell` (sidebar + top bar)

---

## 8. Implementation phases (for next chat)

### Phase 0 — Scaffold (½ day)

- [ ] Add router, tailwind, tanstack table, vueuse
- [ ] Vite proxy + `EsClient` with read-only guard
- [ ] `parseCatTable` + tests (fixture strings from real curl output)
- [ ] App shell + Settings + connection test

### Phase 1 — Overview + Nodes (1 day)

- [ ] Overview dashboard with health cards + unassigned strip
- [ ] Nodes table with sort/filter/rack group
- [ ] Polling composable

### Phase 2 — Shards + Disk (1 day)

- [ ] Shards view with filters and presets
- [ ] Allocation/disk with watermark settings
- [ ] Index selector persisted in localStorage

### Phase 3 — Threads + Indices + Explain (1 day)

- [ ] Thread pool heat table
- [ ] Indices/aliases browser
- [ ] Allocation explain form + JSON viewer

### Phase 4 — Polish (½ day)

- [ ] Error states, empty states, loading skeletons
- [ ] Keyboard shortcut `r` refresh
- [ ] README with port-forward instructions
- [ ] Optional: export table as CSV

---

## 9. Project structure (target)

```
esvue/
├── docs/
│   └── PLAN.md                 ← this file
├── src/
│   ├── api/es/
│   │   ├── client.ts           # fetch wrapper, read-only guard
│   │   ├── cluster.ts
│   │   ├── nodes.ts
│   │   ├── shards.ts
│   │   ├── allocation.ts
│   │   ├── threadPools.ts
│   │   └── indices.ts
│   ├── parsers/
│   │   └── cat.ts
│   ├── stores/
│   │   ├── connection.ts
│   │   ├── cluster.ts
│   │   ├── nodes.ts
│   │   ├── shards.ts
│   │   └── ...
│   ├── composables/
│   │   ├── useClusterRefresh.ts
│   │   └── usePolling.ts
│   ├── components/
│   │   ├── layout/
│   │   ├── tables/
│   │   └── ui/
│   ├── views/
│   │   ├── OverviewView.vue
│   │   ├── NodesView.vue
│   │   ├── ShardsView.vue
│   │   ├── DiskView.vue
│   │   ├── ThreadsView.vue
│   │   ├── IndicesView.vue
│   │   ├── ExplainView.vue
│   │   └── SettingsView.vue
│   ├── types/
│   ├── router/
│   ├── App.vue
│   └── main.ts
└── vite.config.ts              # proxy
```

---

## 10. Handoff prompt for next chat

Copy-paste into the implementation chat:

> Build **esvue** per `docs/PLAN.md`. Vue 3 + Vite + Pinia + Tailwind + TanStack Table. Read-only ES observability UI proxying to `localhost:9200` via Vite `/api/es`. Implement Phase 0 + Phase 1 first (shell, cat parser, Overview, Nodes). API surface mirrors Postman `es-index → Observability`. Dark ops dashboard aesthetic. Sortable node table including uptime column.

---

## 11. Open decisions (pick in implementation chat)

1. **Poll interval default:** 30s vs 60s (prod ES load)
2. **Prod deployment:** dev-only tool vs ship with tiny Node proxy
3. **Auth:** none (port-forward) vs basic auth header in settings for future
4. **Multi-cluster:** single connection vs saved profiles (defer v2)

---

## 12. Success criteria

- [ ] Connect to port-forwarded `shopsy2-cluster` in < 5s
- [ ] Overview shows yellow + 2 unassigned shards (kids_toys, kitchen_appliances) without curls
- [ ] Nodes table sorts by uptime desc in one click
- [ ] Shards filtered to `products_v3_misc` shows all STARTED (post-RCA)
- [ ] Search thread pool queue visible for g12 nodes
- [ ] Zero write endpoints callable from UI
