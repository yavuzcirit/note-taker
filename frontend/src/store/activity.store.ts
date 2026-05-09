import { create } from 'zustand'
import { ActivityEvent } from '@/types'

interface ActivityState {
  eventsByDoc: Record<string, ActivityEvent[]>
  addEvent: (documentId: string, event: ActivityEvent) => void
  clearDoc: (documentId: string) => void
}

export const useActivityStore = create<ActivityState>((set) => ({
  eventsByDoc: {},

  addEvent: (documentId, event) =>
    set((s) => {
      const existing = s.eventsByDoc[documentId] ?? []
      const next = [event, ...existing].slice(0, 50)
      return { eventsByDoc: { ...s.eventsByDoc, [documentId]: next } }
    }),

  clearDoc: (documentId) =>
    set((s) => {
      const next = { ...s.eventsByDoc }
      delete next[documentId]
      return { eventsByDoc: next }
    }),
}))
