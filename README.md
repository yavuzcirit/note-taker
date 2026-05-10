# Note Taker — Real-Time Collaborative Editor

A full-stack real-time collaborative note-taking application inspired by Notion, built with Next.js 15, Node.js/Express, PostgreSQL, and Yjs CRDT.

---

## Tech Stack

| Layer | Choice |
|---|---|
| Frontend | Next.js 15 (App Router), TypeScript, Tailwind CSS v4 |
| Rich Text | TipTap v2 + Yjs Collaboration extension |
| CRDT / Offline | Yjs + y-indexeddb |
| Server State | TanStack Query v5 |
| Client State | Zustand v5 |
| Backend | Node.js + Express, TypeScript |
| Real-time | Socket.io v4 (custom Yjs transport) |
| Database | PostgreSQL 16 + Prisma ORM |
| Auth | JWT — httpOnly cookies, access + refresh tokens |
| Containers | Docker + Docker Compose |

---

## Architecture

### Frontend — Next.js 15 App Router

**Atomic Design** — `atoms` (Button, Input, Avatar, Modal, Badge, Spinner, Icons) → `molecules` (DocumentItem, VersionItem, ToolbarButton, ActivityItem) → `organisms` (Editor, Sidebar, LoginForm, VersionHistory, ShareModal, ActivityFeed). Pages are pure Server Components with no `'use client'`; only interactive organisms carry the directive.

**SSR** — sidebar document list, document metadata (`generateMetadata`), and initial editor content are all fetched server-side with auth cookies. No client-side waterfall on first load.

**Icons** — all SVGs live in a single `components/atoms/icons/index.tsx` and are imported from there across the codebase.

### Backend — Node.js + Express

Layered as `routes → controllers → services → Prisma`. No business logic in controllers.

- **Yjs service** — in-memory `Map<documentId, Y.Doc>`. Hydrates from `documents.yjsState` (Postgres) on first socket join. Debounced DB flush every 2 s on updates. Persists and frees memory when the last user leaves a document room.
- **Socket.io** on `/collaboration` namespace — Yjs binary sync, awareness (cursors/presence), title broadcasts, version snapshots, activity feed.
- **JWT** — 15-min access token + 7-day refresh token, both in `httpOnly; SameSite` cookies. Refresh tokens stored as SHA-256 hashes. Socket handshake uses the same access token.

### Database

| Table | Purpose |
|---|---|
| `users` | Auth, name, avatar |
| `documents` | Title, TipTap JSON (SSR cache), Yjs binary state, soft-delete |
| `versions` | Full Yjs snapshots + TipTap JSON per version |
| `share_links` | UUID token, READ/EDIT permission, optional expiry |
| `refresh_tokens` | SHA-256 hashed, TTL enforced |

---

## Real-Time Sync — Yjs + Socket.io

`y-websocket` was not used because it runs a separate raw WebSocket server with no auth. Instead Yjs is wired directly through Socket.io, giving unified JWT middleware.

**Edit flow:**
1. User types → TipTap mutation → `Y.Doc` emits `update` (binary delta)
2. Client emits `yjs:update` with the delta as `ArrayBuffer`
3. Server applies `Y.applyUpdate(doc, delta, 'remote')` → merges into the in-memory doc
4. Server broadcasts the same delta to all other sockets in the room
5. Peers apply `Y.applyUpdate(clientDoc, delta, 'remote')` → TipTap re-renders

The `'remote'` origin tag prevents update listeners from re-emitting received deltas (no echo loops).

**Offline:** `y-indexeddb` persists the Y.Doc locally. On reconnect, state vectors are exchanged and Yjs merges local + server edits automatically — no manual conflict resolution.

**Awareness (cursors):** `y-protocols/awareness` binary updates travel over `awareness:update` socket events. `@tiptap/extension-collaboration-cursor` renders per-user colored carets.

### Conflict resolution tradeoffs

| Approach | Pros | Cons |
|---|---|---|
| **Yjs CRDT** (chosen) | Conflict-free, offline, battle-tested | Binary state harder to inspect |
| Operational Transform | Simpler server logic | Hard to implement correctly, no offline |
| Last-write-wins | Simplest | Loses concurrent edits |

---

## Setup

### Prerequisites

- Docker + Docker Compose
- Node.js 22+ (local dev only)

### Docker — one command

```bash
cp .env.example backend/.env
# Set strong values for JWT_ACCESS_SECRET and JWT_REFRESH_SECRET in backend/.env

docker compose up
```

Frontend → `http://localhost:3000` · Backend → `http://localhost:4000`

> Postgres is exposed on **port 5434** (5432 was occupied on the dev machine).

### Local Development

```bash
# Terminal 1 — Postgres
docker compose up -d postgres

# Terminal 2 — Backend
cd backend
cp ../.env.example .env          # DATABASE_URL uses port 5434 by default
npm install
npx prisma migrate dev
npm run dev                      # http://localhost:4000

# Terminal 3 — Frontend
cd frontend
npm install --legacy-peer-deps   # TipTap peer dep resolution
npm run dev                      # http://localhost:3000
```

### Debug mode

```bash
cd backend
node --inspect -r tsx/cjs src/index.ts
# Attach VS Code debugger to localhost:9229
```

---

## Features

### Core Requirements

| Feature | Status |
|---|---|
| Create / rename / delete documents | ✅ |
| Sidebar document list | ✅ |
| Soft delete + restore from Trash | ✅ |
| Block-based editor — H1–H3, paragraph, bullet, ordered, code block, blockquote, divider | ✅ |
| Slash commands (`/heading`, `/code`, `/bullet`, …) | ✅ |
| Auto-save with debounce (1.5 s) | ✅ |
| Real-time multi-user sync via Yjs + Socket.io | ✅ |
| Presence indicators — avatars + colored remote cursors | ✅ |
| Version history — auto (30 min) + manual snapshots | ✅ |
| Restore to any previous version | ✅ |
| JWT auth — httpOnly cookies, refresh token rotation | ✅ |
| User-scoped workspaces | ✅ |

### Bonus Features

| Feature | Status |
|---|---|
| Conflict-free CRDT sync (Yjs) | ✅ |
| Offline support + auto-merge on reconnect | ✅ |
| Document sharing — READ or EDIT links, optional expiry | ✅ |
| Real-time activity feed per document | ✅ |

---

## API Reference

### Auth — `/api/v1/auth`

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/register` | — | Create account, set auth cookies |
| POST | `/login` | — | Sign in, set auth cookies |
| POST | `/refresh` | cookie | Rotate refresh token |
| POST | `/logout` | ✓ | Revoke refresh token, clear cookies |
| GET | `/me` | ✓ | Current user profile |

### Documents — `/api/v1/documents`

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/` | ✓ | List all non-deleted documents |
| POST | `/` | ✓ | Create document |
| GET | `/trash` | ✓ | List soft-deleted documents |
| GET | `/:id` | ✓ | Get document with content |
| PATCH | `/:id` | ✓ | Update title / icon / content |
| DELETE | `/:id` | ✓ | Soft delete |
| POST | `/:id/restore` | ✓ | Restore from trash |
| DELETE | `/:id/permanent` | ✓ | Hard delete |

### Versions — `/api/v1/documents/:id/versions`

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/` | ✓ | List version history |
| GET | `/:vid` | ✓ | Get version content |
| POST | `/:vid/restore` | ✓ | Restore to this version |

### Sharing — `/api/v1/documents/:id/share`

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/` | ✓ | Create share link |
| GET | `/` | ✓ | List share links |
| DELETE | `/:lid` | ✓ | Revoke share link |
| GET | `/api/v1/share/:token` | — | Resolve public token |

### Socket.io — `/collaboration`

| Direction | Event | Payload |
|---|---|---|
| C → S | `doc:join` | `{ documentId }` |
| C → S | `doc:leave` | `{ documentId }` |
| C → S | `yjs:update` | `{ documentId, update: ArrayBuffer }` |
| C → S | `awareness:update` | `{ documentId, awarenessUpdate: ArrayBuffer }` |
| C → S | `doc:title-update` | `{ documentId, title }` |
| C → S | `version:create` | `{ documentId }` |
| S → C | `doc:joined` | `{ documentId, yjsState, awareness }` |
| S → C | `yjs:update` | `{ documentId, update }` — broadcast to room |
| S → C | `presence:list/joined/left` | user info |
| S → C | `activity:event` | `{ documentId, event }` |
| S → C | `version:created` | `{ documentId, version }` |

---

## AI Tool Usage

**Tool:** Claude Code (claude-sonnet-4-6) via the VS Code extension.

**Where it was useful:**
- Yjs ↔ Socket.io transport wiring — the `origin` flag pattern to prevent echo loops is non-obvious and was produced correctly on the first attempt
- TypeScript generic plumbing for Socket.io typed namespaces
- Scaffolding repetitive boilerplate (Prisma schema, Express middleware, Zustand stores)

**Where it required correction:**
- Added `'use client'` at page level — enforced Server Component pages; `'use client'` moved to organism components only
- Used `StarterKit.configure({ history: false })` — TipTap v2 renamed this to `undoRedo: false`; caught by the type checker
- Scattered SVG literals across components — consolidated into `atoms/icons/index.tsx`
- Generated flat component structure — restructured into Atomic Design (`atoms / molecules / organisms`)

**Decisions overridden:**
- Suggested a standalone `y-websocket` server; replaced with a custom Socket.io transport so the same JWT middleware covers both HTTP and WebSocket
