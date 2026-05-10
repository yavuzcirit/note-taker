'use client'

import { useEffect, useRef } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight'
import { common, createLowlight } from 'lowlight'

const lowlight = createLowlight(common)
const POLL_INTERVAL = 5000
const IDLE_THRESHOLD = 10000 // don't overwrite if user typed in the last 10 s

interface SharedDocumentClientProps {
  token: string
  document: { content: unknown; title: string }
  permission: 'READ' | 'EDIT'
}

export function SharedDocumentClient({ token, document, permission }: SharedDocumentClientProps) {
  const lastTypedRef = useRef(0)

  const editor = useEditor({
    extensions: [
      StarterKit,
      CodeBlockLowlight.configure({ lowlight }),
    ],
    content: document.content as object,
    immediatelyRender: false,
    editable: permission === 'EDIT',
    editorProps: {
      attributes: {
        class:
          'prose prose-gray dark:prose-invert max-w-none focus:outline-none min-h-[calc(100vh-200px)] px-8 py-6',
      },
    },
    onUpdate: () => {
      lastTypedRef.current = Date.now()
    },
  }, [])

  // Poll for remote content updates. Skip the update if the user has typed recently
  // so we don't overwrite their work while they're actively editing.
  useEffect(() => {
    if (!editor) return
    const id = setInterval(async () => {
      if (Date.now() - lastTypedRef.current < IDLE_THRESHOLD) return
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/share/${token}`, {
          cache: 'no-store',
        })
        if (!res.ok) return
        const data = await res.json()
        const incoming = data?.document?.content
        if (!incoming) return
        const current = editor.getJSON()
        if (JSON.stringify(current) !== JSON.stringify(incoming)) {
          editor.commands.setContent(incoming, false)
        }
      } catch {
        // network error — skip silently
      }
    }, POLL_INTERVAL)
    return () => clearInterval(id)
  }, [editor, token])

  return (
    <div className="mx-auto max-w-4xl">
      <EditorContent editor={editor} />
    </div>
  )
}
