'use client'

import { useEffect, useRef, useState } from 'react'
import * as Y from 'yjs'
import { IndexeddbPersistence } from 'y-indexeddb'
import { useSocket } from './useSocket'

interface CollaborationState {
  ydoc: Y.Doc | null
  synced: boolean
}

export function useCollaboration(documentId: string): CollaborationState {
  const socket = useSocket()
  const [synced, setSynced] = useState(false)
  const ydocRef = useRef<Y.Doc | null>(null)
  const persistenceRef = useRef<IndexeddbPersistence | null>(null)
  const [, forceRender] = useState(0)

  useEffect(() => {
    const ydoc = new Y.Doc()
    ydocRef.current = ydoc
    forceRender((n) => n + 1)

    const persistence = new IndexeddbPersistence(`doc-${documentId}`, ydoc)
    persistenceRef.current = persistence

    persistence.on('synced', () => {
      socket.emit('doc:join', { documentId })
    })

    socket.on('doc:joined', ({ documentId: id, yjsState }) => {
      if (id !== documentId) return
      const update = new Uint8Array(yjsState as ArrayBuffer)
      if (update.length > 0) {
        Y.applyUpdate(ydoc, update, 'remote')
      }
      setSynced(true)
    })

    socket.on('yjs:update', ({ documentId: id, update }) => {
      if (id !== documentId) return
      Y.applyUpdate(ydoc, new Uint8Array(update as ArrayBuffer), 'remote')
    })

    const handleUpdate = (update: Uint8Array, origin: unknown) => {
      if (origin === 'remote' || origin === 'load' || origin === 'restore') return
      socket.emit('yjs:update', { documentId, update: update.buffer as ArrayBuffer })
    }

    ydoc.on('update', handleUpdate)

    return () => {
      socket.emit('doc:leave', { documentId })
      socket.off('doc:joined')
      socket.off('yjs:update')
      ydoc.off('update', handleUpdate)
      ydoc.destroy()
      persistence.destroy()
      ydocRef.current = null
      persistenceRef.current = null
      setSynced(false)
    }
  }, [documentId, socket])

  return { ydoc: ydocRef.current, synced }
}
