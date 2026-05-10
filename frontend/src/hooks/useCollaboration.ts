'use client'

import { useEffect, useState } from 'react'
import * as Y from 'yjs'
import { useSocket } from './useSocket'

interface CollaborationState {
  ydoc: Y.Doc
  synced: boolean
}

export function useCollaboration(documentId: string): CollaborationState {
  const socket = useSocket()
  const [synced, setSynced] = useState(false)

  // useState guarantees the same Y.Doc instance across ALL renders of this component,
  // including React Strict Mode's simulated cleanup/remount. useRef would be reset to
  // null by the cleanup, causing the socket handlers (second-pass) to use a DIFFERENT
  // doc than the one the editor's ySyncPlugin is observing — breaking live sync.
  const [ydoc] = useState(() => new Y.Doc())

  useEffect(() => {
    let joined = false

    const joinRoom = () => {
      joined = false
      setSynced(false)
      socket.emit('doc:join', { documentId })
    }

    const handleJoined = ({ documentId: id, yjsState }: { documentId: string; yjsState: ArrayBuffer }) => {
      if (id !== documentId) return
      const update = new Uint8Array(yjsState)
      if (update.length > 0) Y.applyUpdate(ydoc, update, 'remote')
      joined = true
      setSynced(true)
    }

    const handleYjsUpdate = ({ documentId: id, update }: { documentId: string; update: ArrayBuffer }) => {
      if (id !== documentId) return
      Y.applyUpdate(ydoc, new Uint8Array(update), 'remote')
    }

    const handleUpdate = (update: Uint8Array, origin: unknown) => {
      if (origin === 'remote' || !joined) return
      // slice() ensures we own the buffer even when Y.js returns a view into a larger one.
      socket.emit('yjs:update', { documentId, update: update.slice().buffer as ArrayBuffer })
    }

    socket.on('doc:joined', handleJoined)
    socket.on('yjs:update', handleYjsUpdate)
    socket.on('connect', joinRoom)
    ydoc.on('update', handleUpdate)

    if (socket.connected) joinRoom()

    return () => {
      joined = false
      socket.emit('doc:leave', { documentId })
      socket.off('doc:joined', handleJoined)
      socket.off('yjs:update', handleYjsUpdate)
      socket.off('connect', joinRoom)
      ydoc.off('update', handleUpdate)
      setSynced(false)
    }
  }, [documentId, socket, ydoc])

  return { ydoc, synced }
}
