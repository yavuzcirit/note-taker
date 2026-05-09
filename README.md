# Note Taker — Real-Time Collaborative Editor

A full-stack real-time collaborative note-taking application built with Next.js 15, Node.js/Express, PostgreSQL, and Yjs CRDT.

---

## Architecture

### Frontend — Next.js 15 (App Router)

- **Atomic Design** — components organized as `atoms` → `molecules` → `organisms`. Pages are pure Server Components; only interactive leaf components carry `'use client'`.
- **SSR** — document metadata, initial content, and sidebar data are server-rendered via direct Prisma queries or server-side `fetch` with auth cookies. Zero client-side waterfalls on first load.
- **TanStack Query v5** — server state (document list, versions, share links) with optimistic updates.
- **Zustand v5** — client/real-time state: presence users per document, activity feed events, UI panel state.
- **TipTap v2** — block-based rich text editor. Slash commands (`/heading`, `/code`, `/bullet`, etc.) via a custom TipTap `Extension` + Tippy.js floating menu.
- **Yjs + y-indexeddb** — CRDT state on the client, persisted to IndexedDB for offline support.

### Backend — Node.js + Express

- **Service layer** — `routes → controllers → services → Prisma`. No business logic in controllers.
- **Socket.io v4** on `/collaboration` namespace — handles Yjs binary updates, awareness (cursors/presence), title changes, version creation.
- **Yjs service** — maintains an in-memory `Map<documentId, Y.Doc>`. On first join it hydrates from PostgreSQL (`documents.yjsState`). On last leave it persists back and frees memory. Debounced DB flush (2s) on each update.
- **JWT auth** — access token (15 min) + refresh token (7 days). Both stored in `httpOnly; SameSite` cookies. Refresh tokens hashed with SHA-256 before DB storage. Socket handshake verified via the same JWT.

### Database — PostgreSQL + Prisma

| Table | Purpose |
|---|---|
| `users` | Auth, name, avatar |
| `documents` | Title, TipTap JSON content (for SSR), Yjs binary state, soft-delete |
| `versions` | Yjs snapshots + TipTap JSON per version, author, timestamp |
| `share_links` | UUID token, READ/EDIT permission, optional expiry |
| `refresh_tokens` | SHA-256 hashed tokens, TTL |

---

## Real-Time Sync — Yjs + Socket.io (CRDT Approach)

Instead of using `y-websocket` (raw WebSocket), Yjs is wired manually through Socket.io. This enables JWT authentication on every WebSocket connection.

**Data flow for an edit:**
1. User types → TipTap mutation → `Y.Doc` fires `update` event (binary delta)
2. Client emits `yjs:update` to server with the delta (`ArrayBuffer`)
3. Server applies `Y.applyUpdate(serverYdoc, delta, 'remote')` — merges into the in-memory doc
4. Server broadcasts the same delta to all other sockets in the room
5. Peers apply `Y.applyUpdate(clientYdoc, delta, 'remote')` → TipTap re-renders

The `origin: 'remote'` flag prevents re-broadcasting received updates (no echo loops).

**Offline support:** `y-indexeddb` persists the Y.Doc locally. On reconnect, `doc:join` exchanges state vectors and Yjs automatically merges any diverged local edits with the server state — zero manual conflict resolution needed (CRDT guarantee).

**Awareness (cursors):** `y-protocols/awareness` binary protocol sent over `awareness:update` socket events. `@tiptap/extension-collaboration-cursor` renders remote cursors with per-user colors.

### Tradeoffs vs alternatives

| Approach | Pros | Cons |
|---|---|---|
| **Yjs CRDT** (chosen) | Conflict-free, offline support, battle-tested | Binary state harder to inspect/debug |
| OT (Operational Transform) | Simpler server logic | Hard to implement correctly, no offline |
| Delta-based (last-write-wins) | Simplest | Loses concurrent edits |

---

## Setup

### Prerequisites
- Docker + Docker Compose
- Node.js 22+ (for local dev)

### Docker (recommended)

```bash
cp .env.example backend/.env
# Edit backend/.env — set strong JWT secrets

docker compose up
```

App available at `http://localhost:3000`.

### Local Development

```bash
# 1. Start Postgres
docker compose up -d postgres

# 2. Backend
cd backend
cp ../.env.example .env   # edit DATABASE_URL port if needed
npm install
npx prisma migrate dev
npm run dev

# 3. Frontend
cd frontend
npm install --legacy-peer-deps
npm run dev
```

---

## Features

### Core
- ✅ Create, rename, delete (soft delete) documents with sidebar
- ✅ Restore deleted documents from Trash
- ✅ Block-based rich text editor: headings H1–H3, paragraph, bullet list, ordered list, code block, blockquote, divider
- ✅ Slash commands: type `/` anywhere to open command palette
- ✅ Auto-save (debounced 1.5s) to PostgreSQL
- ✅ Real-time multi-user collaboration via Yjs + Socket.io
- ✅ Presence indicators (avatars + per-user colored cursors)
- ✅ Document version history: manual + auto snapshots every 30 min
- ✅ Restore to any previous version
- ✅ JWT authentication with httpOnly cookies + refresh token rotation
- ✅ User-scoped workspaces (all queries filtered by `ownerId`)

### Bonus
- ✅ CRDT conflict-free sync (Yjs)
- ✅ Offline support (y-indexeddb, auto-merge on reconnect)
- ✅ Document sharing — generate READ or EDIT links with optional expiry
- ✅ Real-time activity feed per document

---

## API

`POST /api/v1/auth/register` `POST /api/v1/auth/login` `POST /api/v1/auth/refresh` `POST /api/v1/auth/logout` `GET /api/v1/auth/me`

`GET|POST /api/v1/documents` `GET|PATCH|DELETE /api/v1/documents/:id` `POST /api/v1/documents/:id/restore` `DELETE /api/v1/documents/:id/permanent`

`GET|POST /api/v1/documents/:id/versions` `POST /api/v1/documents/:id/versions/:vid/restore`

`GET|POST|DELETE /api/v1/documents/:id/share` `GET /api/v1/share/:token`

---

## AI Tool Usage

**Tool used:** Claude Code (claude-sonnet-4-6) via the VSCode extension.

**Where it helped:**
- Scaffolding boilerplate (package.json, tsconfig, Prisma schema, Express middleware) quickly and correctly
- Generating the Yjs ↔ Socket.io integration pattern — the `origin` flag trick to prevent echo loops is subtle and the model produced it correctly first try
- TypeScript type plumbing for Socket.io generic parameters (complex nested generics)

**Where it fell short / required correction:**
- Initially put `'use client'` at page level — corrected to enforce Server Component pages with `'use client'` only on organism-level components
- Used `history: false` in StarterKit which is the old TipTap API — the new v2 uses `undoRedo: false`, caught and fixed after type check
- Generated components without atomic design separation — restructured into `atoms / molecules / organisms` hierarchy after feedback
- SVG icons were inlined inline everywhere — consolidated into a single `atoms/icons/index.tsx` export file

**Decisions overridden:**
- The model suggested `y-websocket` as a separate server; chose to embed Yjs into Socket.io handlers instead for unified auth middleware
- Suggested `history` option for StarterKit — corrected to `undoRedo` after inspecting TipTap v2 type definitions
