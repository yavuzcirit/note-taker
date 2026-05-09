'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import * as shareService from '@/services/share.service'
import { ShareLink } from '@/types'
import { Button } from '@/components/atoms/Button'
import { Modal } from '@/components/atoms/Modal'
import { Badge } from '@/components/atoms/Badge'
import { CopyIcon, CheckIcon } from '@/components/atoms/icons'
import { formatDate } from '@/lib/utils'

interface ShareModalProps {
  documentId: string
  open: boolean
  onClose: () => void
}

export function ShareModal({ documentId, open, onClose }: ShareModalProps) {
  const queryClient = useQueryClient()
  const [permission, setPermission] = useState<'READ' | 'EDIT'>('READ')
  const [copied, setCopied] = useState<string | null>(null)

  const { data: links } = useQuery({
    queryKey: ['share-links', documentId],
    queryFn: () => shareService.listShareLinks(documentId),
    enabled: open,
  })

  const { mutate: create, isPending: creating } = useMutation({
    mutationFn: () => shareService.createShareLink(documentId, permission),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['share-links', documentId] }),
  })

  const { mutate: revoke } = useMutation({
    mutationFn: (linkId: string) => shareService.revokeShareLink(documentId, linkId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['share-links', documentId] }),
  })

  const copyLink = async (token: string) => {
    await navigator.clipboard.writeText(`${window.location.origin}/shared/${token}`)
    setCopied(token)
    setTimeout(() => setCopied(null), 2000)
  }

  return (
    <Modal open={open} onClose={onClose} title="Share Document">
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <select
            value={permission}
            onChange={(e) => setPermission(e.target.value as 'READ' | 'EDIT')}
            className="flex-1 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
          >
            <option value="READ">View only</option>
            <option value="EDIT">Can edit</option>
          </select>
          <Button onClick={() => create()} loading={creating}>
            Create link
          </Button>
        </div>

        {links && links.length > 0 && (
          <div className="flex flex-col gap-2">
            <p className="text-xs font-medium uppercase tracking-wider text-gray-400">Active links</p>
            {links.map((link: ShareLink) => (
              <div
                key={link.id}
                className="flex items-center justify-between gap-2 rounded-lg border border-gray-200 px-3 py-2 dark:border-gray-700"
              >
                <div className="min-w-0">
                  <Badge variant={link.permission === 'EDIT' ? 'success' : 'default'}>
                    {link.permission === 'READ' ? 'View only' : 'Can edit'}
                  </Badge>
                  <p className="mt-0.5 text-xs text-gray-400">
                    {formatDate(link.createdAt)}
                    {link.expiresAt && ` · Expires ${formatDate(link.expiresAt)}`}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-1.5">
                  <Button variant="secondary" size="sm" onClick={() => copyLink(link.token)}>
                    {copied === link.token ? (
                      <CheckIcon className="h-3.5 w-3.5" />
                    ) : (
                      <CopyIcon className="h-3.5 w-3.5" />
                    )}
                    {copied === link.token ? 'Copied' : 'Copy'}
                  </Button>
                  <Button variant="danger" size="sm" onClick={() => revoke(link.id)}>
                    Revoke
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Modal>
  )
}
