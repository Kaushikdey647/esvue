# esvue

Read-only Elasticsearch cluster observability UI for oncall triage.

## Stack

Vue 3 + Vite + Pinia + Tailwind + TanStack Table. Talks to ES via Vite proxy `/api/es` → `http://localhost:9200`.

## Connect (port-forward)

1. Open [bastion console](http://console.bastion-prod.fkcloud.in/#), set DC and app id, get approval.
2. Install cert and tunnel:

```sh
fkst-cli installCert
ssh -L 9200:localhost:9200 <bastion-or-host-ip>
```

3. Run the app:

```sh
npm install
npm run dev
```

4. Open the login page. Leave IP blank for `localhost`, port `9200`. The IP field is for display + tunnel help — the proxy always targets `localhost:9200`.

## Features

- Overview: cluster health, master, unassigned strip, yellow/red indices
- Nodes / Shards / Disk / Threads / Indices / Explain / Tasks
- Shared context chips: index, alias, rack group (defaults `products_v3_misc`, `products_live_misc`, `g12`)
- Left-click entity chips to navigate; right-click for navigate + inspect drawers
- Auto-refresh every 60s (pause in top bar); press `r` to refresh
- Read-only allowlist — no writes, deletes, or `_search`

## Scripts

```sh
npm run dev
npm run build
npm test
npm run lint
```
