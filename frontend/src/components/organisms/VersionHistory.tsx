'use client'

import { useState } from 'react'
import { useVersionHistory } from '@/hooks/useVersionHistory'
import { useSocket } from '@/hooks/useSocket'
import { useQueryClient } from '@tanstack/react-query'
import * as versionService from '@/services/version.service'
import { Button } from '@/components/atoms/Button'
import { Spinner } from '@/components/atoms/Spinner'
import { XIcon } from '@/components/atoms/icons'
import { VersionItem } from '@/components/molecules/VersionItem'

interface VersionHistoryProps {
  documentId: string
  onClose: () => void
}

export function VersionHistory({ documentId, onClose }: VersionHistoryProps) {
  const { data: versions, isLoading } = useVersionHistory(documentId)
  const socket = useSocket()
  const queryClient = useQueryClient()
  const [restoring, setRestoring] = useState<string | null>(null)

  const handleSaveNow = () => {
    socket.emit('version:create', { documentId })
    setTimeout(() => queryClient.invalidateQueries({ queryKey: ['versions', documentId] }), 500)
  }

  const handleRestore = async (versionId: string) => {
    setRestoring(versionId)
    try {
      await versionService.restoreVersion(documentId, versionId)
      queryClient.invalidateQueries({ queryKey: ['document', documentId] })
      onClose()
    } finally {
      setRestoring(null)
    }
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3 dark:border-gray-700">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Version History</h3>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={handleSaveNow}>
            Save now
          </Button>
          <button
            onClick={onClose}
            className="rounded p-1 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <XIcon className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Spinner />
          </div>
        ) : versions?.length === 0 ? (
          <p className="px-4 py-6 text-sm text-gray-400">No versions saved yet.</p>
        ) : (
          <ul className="divide-y divide-gray-100 dark:divide-gray-700">
            {versions?.map((v) => (
              <VersionItem
                key={v.id}
                version={v}
                loading={restoring === v.id}
                onRestore={handleRestore}
              />
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
