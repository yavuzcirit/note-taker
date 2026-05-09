'use client'

import { useEffect, useRef } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Collaboration from '@tiptap/extension-collaboration'
import CollaborationCursor from '@tiptap/extension-collaboration-cursor'
import Placeholder from '@tiptap/extension-placeholder'
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight'
import { common, createLowlight } from 'lowlight'
import { Awareness } from 'y-protocols/awareness'
import { encodeAwarenessUpdate, applyAwarenessUpdate } from 'y-protocols/awareness'
import { SlashCommand } from './extensions/SlashCommand'
import { EditorToolbar } from './EditorToolbar'
import { useCollaboration } from '@/hooks/useCollaboration'
import { useSocket } from '@/hooks/useSocket'
import { useUpdateDocument } from '@/hooks/useDocuments'
import { debounce } from '@/lib/debounce'
import { Spinner } from '@/components/atoms/Spinner'
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
  const { ydoc, synced } = useCollaboration(documentId)
  const { mutate: updateDoc } = useUpdateDocument()
  const awarenessRef = useRef<Awareness | null>(null)

  const debouncedSave = useRef(
    debounce((content: unknown) => {
      updateDoc({ id: documentId, data: { content } })
    }, 1500),
  ).current

  const editor = useEditor(
    {
      extensions: [
        StarterKit.configure({ undoRedo: false }),
        Placeholder.configure({
          placeholder: ({ node }) =>
            node.type.name === 'heading' ? 'Heading' : "Type '/' for commands…",
        }),
        CodeBlockLowlight.configure({ lowlight }),
        SlashCommand,
        ...(ydoc
          ? [
              Collaboration.configure({ document: ydoc }),
              CollaborationCursor.configure({
                provider: {
                  awareness: (() => {
                    if (!awarenessRef.current && ydoc) {
                      const awareness = new Awareness(ydoc)
                      awareness.setLocalStateField('user', {
                        name: user.name,
                        color: stringToColor(user.id),
                      })

                      awareness.on(
                        'update',
                        ({ added, updated, removed }: { added: number[]; updated: number[]; removed: number[] }) => {
                          const changed = [...added, ...updated, ...removed]
                          if (!changed.length) return
                          const update = encodeAwarenessUpdate(awareness, changed)
                          socket.emit('awareness:update', {
                            documentId,
                            awarenessUpdate: update.buffer as ArrayBuffer,
                          })
                        },
                      )

                      socket.on('awareness:update', ({ documentId: id, awarenessUpdate }) => {
                        if (id !== documentId) return
                        applyAwarenessUpdate(
                          awareness,
                          new Uint8Array(awarenessUpdate as ArrayBuffer),
                          'remote',
                        )
                      })

                      awarenessRef.current = awareness
                    }
                    return awarenessRef.current!
                  })(),
                },
                user: { name: user.name, color: stringToColor(user.id) },
              }),
            ]
          : []),
      ],
      editorProps: {
        attributes: {
          class:
            'prose prose-gray dark:prose-invert max-w-none focus:outline-none min-h-[calc(100vh-200px)] px-8 py-6',
        },
      },
      content: !ydoc && initialContent ? initialContent : undefined,
      onUpdate: ({ editor }) => {
        debouncedSave(editor.getJSON())
      },
    },
    [ydoc],
  )

  useEffect(() => {
    return () => {
      awarenessRef.current?.destroy()
      awarenessRef.current = null
    }
  }, [])

  if (!synced && !editor) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-gray-400">
          <Spinner className="h-6 w-6" />
          <span className="text-sm">Connecting…</span>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col">
      {editor && <EditorToolbar editor={editor} />}
      <EditorContent editor={editor} />
    </div>
  )
}
