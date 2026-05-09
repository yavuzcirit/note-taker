import { create } from 'zustand'
import { PresenceUser } from '@/types'

interface PresenceState {
  usersByDoc: Record<string, PresenceUser[]>
  setUsers: (documentId: string, users: PresenceUser[]) => void
  addUser: (documentId: string, user: PresenceUser) => void
  removeUser: (documentId: string, userId: string) => void
  clearDoc: (documentId: string) => void
}

export const usePresenceStore = create<PresenceState>((set) => ({
  usersByDoc: {},

  setUsers: (documentId, users) =>
    set((s) => ({ usersByDoc: { ...s.usersByDoc, [documentId]: users } })),

  addUser: (documentId, user) =>
    set((s) => {
      const existing = s.usersByDoc[documentId] ?? []
      const filtered = existing.filter((u) => u.userId !== user.userId)
      return { usersByDoc: { ...s.usersByDoc, [documentId]: [...filtered, user] } }
    }),

  removeUser: (documentId, userId) =>
    set((s) => ({
      usersByDoc: {
        ...s.usersByDoc,
        [documentId]: (s.usersByDoc[documentId] ?? []).filter((u) => u.userId !== userId),
      },
    })),

  clearDoc: (documentId) =>
    set((s) => {
      const next = { ...s.usersByDoc }
      delete next[documentId]
      return { usersByDoc: next }
    }),
}))
