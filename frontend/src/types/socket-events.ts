import { PresenceUser, ActivityEvent, VersionMeta } from './index'

export interface ServerToClientEvents {
  'doc:joined': (payload: { documentId: string; yjsState: ArrayBuffer; awareness: ArrayBuffer }) => void
  'yjs:update': (payload: { documentId: string; update: ArrayBuffer }) => void
  'awareness:update': (payload: { documentId: string; awarenessUpdate: ArrayBuffer }) => void
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
