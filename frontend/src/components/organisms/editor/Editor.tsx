'use client'

import { useEffect, useMemo, useRef } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import { Extension } from '@tiptap/core'
import StarterKit from '@tiptap/starter-kit'
import Collaboration from '@tiptap/extension-collaboration'
import Placeholder from '@tiptap/extension-placeholder'
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight'
import { common, createLowlight } from 'lowlight'
import { yCursorPlugin } from '@tiptap/y-tiptap'
import type { Awareness } from 'y-protocols/awareness'
import { SlashCommand } from './extensions/SlashCommand'
import { EditorToolbar } from './EditorToolbar'
import { useCollaboration } from '@/hooks/useCollaboration'
import { useSocket } from '@/hooks/useSocket'
import { useUpdateDocument } from '@/hooks/useDocuments'
import { debounce } from '@/lib/debounce'
import { User } from '@/types'

const lowlight = createLowlight(common)

function stringToColor(str: string): string {
  const colors = [
    '#ef4444', '#f97316', '#eab308', '#22c55e',
    '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899',
  ]
  let hash = 0
  for (const char of str) hash = char.charCodeAt(0) + ((hash << 5) - hash)
  return colors[Math.abs(hash) % colors.length]
}

interface EditorProps {
  documentId: string
  user: User
  initialContent?: unknown
}

export function Editor({ documentId, user, initialContent }: EditorProps) {
  const socket = useSocket()
  const { ydoc } = useCollaboration(documentId)
  const { mutate: updateDoc } = useUpdateDocument()
  const awarenessRef = useRef<Awareness | null>(null)

  const debouncedSave = useRef(
    debounce((content: unknown) => {
      updateDoc({ id: documentId, data: { content } })
    }, 1500),
  ).current

  // Create awareness once (render-phase, before useEditor's first effect fires).
  if (!awarenessRef.current) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { Awareness: AwarenessClass } = require('y-protocols/awareness') as typeof import('y-protocols/awareness')
    const awareness: Awareness = new AwarenessClass(ydoc)
    awareness.setLocalStateField('user', { name: user.name, color: stringToColor(user.id) })
    awarenessRef.current = awareness
  }

  // Wire awareness ↔ socket with proper cleanup.
  useEffect(() => {
    const awareness = awarenessRef.current!
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { encodeAwarenessUpdate, applyAwarenessUpdate } = require('y-protocols/awareness') as typeof import('y-protocols/awareness')

    const handleAwarenessChange = ({ added, updated, removed }: { added: number[]; updated: number[]; removed: number[] }) => {
      const changed = [...added, ...updated, ...removed]
      if (!changed.length) return
      const update = encodeAwarenessUpdate(awareness, changed)
      socket.emit('awareness:update', { documentId, awarenessUpdate: update.buffer as ArrayBuffer })
    }

    const handleSocketAwareness = ({ documentId: id, awarenessUpdate }: { documentId: string; awarenessUpdate: ArrayBuffer }) => {
      if (id !== documentId) return
      applyAwarenessUpdate(awareness, new Uint8Array(awarenessUpdate), 'remote')
    }

    awareness.on('update', handleAwarenessChange)
    socket.on('awareness:update', handleSocketAwareness)
    return () => {
      awareness.off('update', handleAwarenessChange)
      socket.off('awareness:update', handleSocketAwareness)
    }
  }, [documentId, socket])

  // Memoize extensions so the array reference is stable across renders.
  // Without this, Tiptap v3 calls editor.setOptions() on every render (because
  // compareOptions sees new object references), which tears down and recreates
  // the ySyncPlugin binding on every render — breaking live sync entirely.
  const extensions = useMemo(() => [
    StarterKit.configure({ undoRedo: false }),
    Placeholder.configure({
      placeholder: ({ node }) =>
        node.type.name === 'heading' ? 'Heading' : "Type '/' for commands…",
    }),
    CodeBlockLowlight.configure({ lowlight }),
    SlashCommand,
    Collaboration.configure({ document: ydoc }),
    Extension.create({
      name: 'collaborationCursor',
      addProseMirrorPlugins: () => [yCursorPlugin(awarenessRef.current!)],
    }),
  // ydoc is stable (from useState in useCollaboration), so this runs once.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  ], [ydoc])

  const editor = useEditor(
    {
      extensions,
      editorProps: {
        attributes: {
          class:
            'prose prose-gray dark:prose-invert max-w-none focus:outline-none min-h-[calc(100vh-200px)] px-8 py-6',
        },
      },
      immediatelyRender: false,
      onUpdate: ({ editor }) => {
        debouncedSave(editor.getJSON())
      },
    },
    [],
  )

  useEffect(() => {
    return () => {
      awarenessRef.current?.destroy()
      awarenessRef.current = null
    }
  }, [])

  return (
    <div className="flex flex-col">
      {editor && <EditorToolbar editor={editor} />}
      <EditorContent editor={editor} />
    </div>
  )
}
