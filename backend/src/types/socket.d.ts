export interface SocketData {
  userId: string
  email: string
  name: string
  avatarUrl: string | null
}

export interface PresenceUser {
  userId: string
  name: string
  avatarUrl: string | null
  color: string
}

export interface VersionMeta {
  id: string
  documentId: string
  title: string
  createdAt: string
  createdBy: { id: string; name: string }
}

export interface ActivityEvent {
  type: 'joined' | 'left' | 'edited' | 'version_created' | 'title_changed'
  userId: string
  userName: string
  timestamp: string
  meta?: Record<string, unknown>
}

export interface ServerToClientEvents {
  'doc:joined': (payload: { documentId: string; yjsState: Buffer; awareness: Buffer }) => void
  'yjs:update': (payload: { documentId: string; update: Buffer }) => void
  'awareness:update': (payload: { documentId: string; awarenessUpdate: Buffer }) => void
  'doc:title-updated': (payload: { documentId: string; title: string }) => void
  'presence:list': (payload: { documentId: string; users: PresenceUser[] }) => void
  'presence:joined': (payload: { documentId: string; user: PresenceUser }) => void
  'presence:left': (payload: { documentId: string; userId: string }) => void
  'version:created': (payload: { documentId: string; version: VersionMeta }) => void
  'doc:saved': (payload: { documentId: string; savedAt: string }) => void
  'activity:event': (payload: { documentId: string; event: ActivityEvent }) => void
  error: (payload: { code: string; message: string }) => void
}

export interface ClientToServerEvents {
  'doc:join': (payload: { documentId: string }) => void
  'doc:leave': (payload: { documentId: string }) => void
  'yjs:update': (payload: { documentId: string; update: ArrayBuffer }) => void
  'awareness:update': (payload: { documentId: string; awarenessUpdate: ArrayBuffer }) => void
  'doc:title-update': (payload: { documentId: string; title: string }) => void
  'version:create': (payload: { documentId: string }) => void
}
