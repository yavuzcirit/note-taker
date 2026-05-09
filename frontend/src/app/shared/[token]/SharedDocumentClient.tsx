'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight'
import { common, createLowlight } from 'lowlight'

const lowlight = createLowlight(common)

interface SharedDocumentClientProps {
  document: { content: unknown; title: string }
  permission: 'READ' | 'EDIT'
}

export function SharedDocumentClient({ document, permission }: SharedDocumentClientProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      CodeBlockLowlight.configure({ lowlight }),
    ],
    content: document.content as object,
    editable: permission === 'EDIT',
    editorProps: {
      attributes: {
        class:
          'prose prose-gray dark:prose-invert max-w-none focus:outline-none min-h-[calc(100vh-200px)] px-8 py-6',
      },
    },
  })

  return (
    <div className="mx-auto max-w-4xl">
      <EditorContent editor={editor} />
    </div>
  )
}
