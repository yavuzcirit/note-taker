'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useDocuments, useCreateDocument, useSoftDelete } from '@/hooks/useDocuments'
import { useAuth, useLogout } from '@/hooks/useAuth'
import { DocumentItem } from '@/components/molecules/DocumentItem'
import { Button } from '@/components/atoms/Button'
import { Spinner } from '@/components/atoms/Spinner'
import { DocumentIcon, PlusIcon, TrashIcon, LogOutIcon } from '@/components/atoms/icons'
import { cn } from '@/lib/utils'

export function Sidebar() {
  const { data: docs, isLoading } = useDocuments()
  const { mutate: create, isPending: creating } = useCreateDocument()
  const { mutate: deleteDoc } = useSoftDelete()
  const { user } = useAuth()
  const { mutate: logout } = useLogout()
  const pathname = usePathname()

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-blue-600 text-white">
            <DocumentIcon className="h-4 w-4" />
          </div>
          <span className="truncate text-sm font-semibold text-gray-900 dark:text-gray-100">
            {user?.name ?? 'Workspace'}
          </span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => create()}
          loading={creating}
          title="New document"
        >
          <PlusIcon className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto px-2 pb-2">
        <p className="mb-1 px-2 pt-2 text-xs font-medium uppercase tracking-wider text-gray-400">
          Documents
        </p>

        {isLoading ? (
          <div className="flex justify-center py-4">
            <Spinner />
          </div>
        ) : docs?.length === 0 ? (
          <p className="px-2 py-3 text-xs text-gray-400">No documents yet.</p>
        ) : (
          docs?.map((doc) => (
            <DocumentItem
              key={doc.id}
              doc={doc}
              active={pathname === `/workspace/document/${doc.id}`}
              onDelete={deleteDoc}
            />
          ))
        )}

        <Link
          href="/workspace/trash"
          className={cn(
            'mt-2 flex items-center gap-2 rounded-md px-2 py-1.5 text-xs text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700',
            pathname === '/workspace/trash' && 'bg-gray-100 dark:bg-gray-700',
          )}
        >
          <TrashIcon className="h-3.5 w-3.5" />
          Trash
        </Link>
      </div>

      <div className="border-t border-gray-200 px-4 py-3 dark:border-gray-700">
        <div className="flex items-center justify-between gap-2">
          <span className="min-w-0 truncate text-xs text-gray-500">{user?.email}</span>
          <button
            onClick={() => logout()}
            title="Sign out"
            className="shrink-0 rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700"
          >
            <LogOutIcon className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
