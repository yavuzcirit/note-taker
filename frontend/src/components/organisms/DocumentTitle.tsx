'use client'

import { useEffect, useRef, useState } from 'react'
import { useUpdateDocument } from '@/hooks/useDocuments'
import { useSocket } from '@/hooks/useSocket'

interface DocumentTitleProps {
  documentId: string
  initialTitle: string
  readOnly?: boolean
}

export function DocumentTitle({ documentId, initialTitle, readOnly }: DocumentTitleProps) {
  const [title, setTitle] = useState(initialTitle)
  const { mutate: update } = useUpdateDocument()
  const socket = useSocket()
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  useEffect(() => {
    setTitle(initialTitle)
  }, [initialTitle])

  useEffect(() => {
    socket.on('doc:title-updated', ({ documentId: id, title: next }) => {
      if (id === documentId) setTitle(next)
    })
    return () => {
      socket.off('doc:title-updated')
    }
  }, [documentId, socket])

  const handleChange = (value: string) => {
    setTitle(value)
    clearTimeout(saveTimerRef.current)
    saveTimerRef.current = setTimeout(() => {
      const safe = value.trim() || 'Untitled'
      update({ id: documentId, data: { title: safe } })
      socket.emit('doc:title-update', { documentId, title: safe })
    }, 800)
  }

  if (readOnly) {
    return (
      <h1 className="px-8 pt-12 pb-2 text-4xl font-bold text-gray-900 dark:text-gray-100">
        {title || 'Untitled'}
      </h1>
    )
  }

  return (
    <input
      type="text"
      value={title}
      onChange={(e) => handleChange(e.target.value)}
      placeholder="Untitled"
      className="w-full bg-transparent px-8 pt-12 pb-2 text-4xl font-bold text-gray-900 placeholder:text-gray-300 focus:outline-none dark:text-gray-100 dark:placeholder:text-gray-600"
    />
  )
}
