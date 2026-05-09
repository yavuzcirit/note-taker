'use client'

import { useState } from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { DotsVerticalIcon } from '@/components/atoms/icons'
import { Document } from '@/types'

interface DocumentItemProps {
  doc: Document
  active: boolean
  onDelete: (id: string) => void
}

export function DocumentItem({ doc, active, onDelete }: DocumentItemProps) {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <div
      className={cn(
        'group relative flex items-center rounded-md px-2 py-1.5 text-sm transition-colors',
        active
          ? 'bg-gray-200 text-gray-900 dark:bg-gray-700 dark:text-gray-100'
          : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700',
      )}
    >
      <span className="mr-2 text-base">{doc.icon ?? '📄'}</span>
      <Link href={`/workspace/document/${doc.id}`} className="flex-1 truncate">
        {doc.title || 'Untitled'}
      </Link>

      <button
        onClick={(e) => {
          e.preventDefault()
          setMenuOpen((o) => !o)
        }}
        className="ml-1 hidden h-6 w-6 items-center justify-center rounded p-0.5 text-gray-400 hover:bg-gray-200 hover:text-gray-600 group-hover:flex dark:hover:bg-gray-600"
        aria-label="Document options"
      >
        <DotsVerticalIcon className="h-4 w-4" />
      </button>

      {menuOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
          <div className="absolute right-0 top-8 z-50 min-w-[160px] overflow-hidden rounded-lg border border-gray-200 bg-white shadow-xl dark:border-gray-700 dark:bg-gray-800">
            <button
              onClick={() => {
                onDelete(doc.id)
                setMenuOpen(false)
              }}
              className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
            >
              Move to Trash
            </button>
          </div>
        </>
      )}
    </div>
  )
}
