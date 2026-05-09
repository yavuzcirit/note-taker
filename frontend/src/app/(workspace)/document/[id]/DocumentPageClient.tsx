'use client'

import { useState } from 'react'
import { DocumentTitle } from '@/components/organisms/DocumentTitle'
import { Editor } from '@/components/organisms/editor/Editor'
import { PresenceBar } from '@/components/organisms/PresenceBar'
import { VersionHistory } from '@/components/organisms/VersionHistory'
import { ShareModal } from '@/components/organisms/ShareModal'
import { ActivityFeed } from '@/components/organisms/ActivityFeed'
import { Button } from '@/components/atoms/Button'
import { ClockIcon, ShareIcon, ActivityIcon } from '@/components/atoms/icons'
import { DocumentFull, User } from '@/types'

interface DocumentPageClientProps {
  documentId: string
  initialDoc: DocumentFull
  user: User
}

type RightPanel = 'versions' | 'activity' | null

export function DocumentPageClient({ documentId, initialDoc, user }: DocumentPageClientProps) {
  const [rightPanel, setRightPanel] = useState<RightPanel>(null)
  const [shareOpen, setShareOpen] = useState(false)

  const togglePanel = (panel: RightPanel) => {
    setRightPanel((prev) => (prev === panel ? null : panel))
  }

  return (
    <div className="flex h-full flex-col">
      <header className="flex items-center justify-between border-b border-gray-200 px-4 py-2 dark:border-gray-700">
        <PresenceBar documentId={documentId} />
        <div className="flex items-center gap-1.5">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => togglePanel('activity')}
            title="Activity feed"
          >
            <ActivityIcon className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => togglePanel('versions')}
            title="Version history"
          >
            <ClockIcon className="h-4 w-4" />
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setShareOpen(true)}
          >
            <ShareIcon className="h-4 w-4" />
            Share
          </Button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <div className="flex flex-1 flex-col overflow-y-auto">
          <DocumentTitle
            documentId={documentId}
            initialTitle={initialDoc.title}
          />
          <Editor
            documentId={documentId}
            user={user}
            initialContent={initialDoc.content}
          />
        </div>

        {rightPanel && (
          <aside className="w-72 shrink-0 overflow-y-auto border-l border-gray-200 dark:border-gray-700">
            {rightPanel === 'versions' && (
              <VersionHistory
                documentId={documentId}
                onClose={() => setRightPanel(null)}
              />
            )}
            {rightPanel === 'activity' && (
              <div className="flex h-full flex-col">
                <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3 dark:border-gray-700">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                    Activity
                  </h3>
                  <button
                    onClick={() => setRightPanel(null)}
                    className="rounded p-1 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    ✕
                  </button>
                </div>
                <ActivityFeed documentId={documentId} />
              </div>
            )}
          </aside>
        )}
      </div>

      <ShareModal
        documentId={documentId}
        open={shareOpen}
        onClose={() => setShareOpen(false)}
      />
    </div>
  )
}
