export interface User {
  id: string
  email: string
  name: string
  avatarUrl: string | null
  createdAt: string
}

export interface Document {
  id: string
  title: string
  icon: string | null
  position: number
  createdAt: string
  updatedAt: string
}

export interface DocumentFull extends Document {
  content: unknown
  ownerId: string
  isDeleted: boolean
}

export interface TrashedDocument {
  id: string
  title: string
  icon: string | null
  deletedAt: string
}

export interface Version {
  id: string
  title: string
  createdAt: string
  createdBy: { id: string; name: string }
}

export interface VersionFull extends Version {
  contentJson: unknown
  yjsSnapshot: unknown
}

export interface ShareLink {
  id: string
  token: string
  permission: 'READ' | 'EDIT'
  expiresAt: string | null
  createdAt: string
}

export interface PresenceUser {
  userId: string
  name: string
  avatarUrl: string | null
  color: string
}

export interface ActivityEvent {
  type: 'joined' | 'left' | 'edited' | 'version_created' | 'title_changed'
  userId: string
  userName: string
  timestamp: string
  meta?: Record<string, unknown>
}

export interface VersionMeta {
  id: string
  documentId: string
  title: string
  createdAt: string
  createdBy: { id: string; name: string }
}
