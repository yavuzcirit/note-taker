'use client'

import { useTrashedDocuments, useRestoreDocument, usePermanentDelete } from '@/hooks/useDocuments'
import { Button } from '@/components/atoms/Button'
import { Spinner } from '@/components/atoms/Spinner'
import { formatDate } from '@/lib/utils'

export function TrashPageClient() {
  const { data: docs, isLoading } = useTrashedDocuments()
  const { mutate: restore, isPending: restoring } = useRestoreDocument()
  const { mutate: permanentDelete, isPending: deleting } = usePermanentDelete()

  return (
    <div className="mx-auto max-w-2xl px-6 py-12">
      <h1 className="mb-6 text-2xl font-bold text-gray-900 dark:text-gray-100">Trash</h1>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Spinner />
        </div>
      ) : docs?.length === 0 ? (
        <p className="text-center text-gray-400">Trash is empty.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {docs?.map((doc) => (
            <li
              key={doc.id}
              className="flex items-center justify-between gap-4 rounded-xl border border-gray-200 bg-white px-4 py-3 dark:border-gray-700 dark:bg-gray-800"
            >
              <div>
                <p className="font-medium text-gray-900 dark:text-gray-100">
                  {doc.icon && <span className="mr-2">{doc.icon}</span>}
                  {doc.title || 'Untitled'}
                </p>
                <p className="text-xs text-gray-500">Deleted {formatDate(doc.deletedAt)}</p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  loading={restoring}
                  onClick={() => restore(doc.id)}
                >
                  Restore
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  loading={deleting}
                  onClick={() => permanentDelete(doc.id)}
                >
                  Delete forever
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
