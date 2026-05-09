'use client'

import { useEffect } from 'react'
import { useSocket } from './useSocket'
import { usePresenceStore } from '@/store/presence.store'
import { useActivityStore } from '@/store/activity.store'

export function usePresence(documentId: string) {
  const socket = useSocket()
  const { setUsers, addUser, removeUser } = usePresenceStore()
  const { addEvent } = useActivityStore()
  const users = usePresenceStore((s) => s.usersByDoc[documentId] ?? [])

  useEffect(() => {
    socket.on('presence:list', ({ documentId: id, users }) => {
      if (id === documentId) setUsers(id, users)
    })

    socket.on('presence:joined', ({ documentId: id, user }) => {
      if (id === documentId) addUser(id, user)
    })

    socket.on('presence:left', ({ documentId: id, userId }) => {
      if (id === documentId) removeUser(id, userId)
    })

    socket.on('activity:event', ({ documentId: id, event }) => {
      if (id === documentId) addEvent(id, event)
    })

    return () => {
      socket.off('presence:list')
      socket.off('presence:joined')
      socket.off('presence:left')
      socket.off('activity:event')
    }
  }, [documentId, socket, setUsers, addUser, removeUser, addEvent])

  return users
}
