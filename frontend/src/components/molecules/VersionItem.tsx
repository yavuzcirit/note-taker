'use client'

import { Version } from '@/types'
import { Button } from '@/components/atoms/Button'
import { formatDate } from '@/lib/utils'

interface VersionItemProps {
  version: Version
  loading: boolean
  onRestore: (id: string) => void
}

export function VersionItem({ version, loading, onRestore }: VersionItemProps) {
  return (
    <li className="flex items-start justify-between gap-2 px-4 py-3">
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-gray-900 dark:text-gray-100">
          {version.title || 'Untitled'}
        </p>
        <p className="text-xs text-gray-500">
          {formatDate(version.createdAt)} · {version.createdBy.name}
        </p>
      </div>
      <Button variant="ghost" size="sm" loading={loading} onClick={() => onRestore(version.id)}>
        Restore
      </Button>
    </li>
  )
}
