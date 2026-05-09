'use client'

import { usePresence } from '@/hooks/usePresence'
import { Avatar } from '@/components/atoms/Avatar'

export function PresenceBar({ documentId }: { documentId: string }) {
  const users = usePresence(documentId)

  if (users.length === 0) return null

  const visible = users.slice(0, 5)
  const overflow = users.length - visible.length

  return (
    <div className="flex items-center gap-1.5">
      <div className="flex -space-x-2">
        {visible.map((u) => (
          <Avatar key={u.userId} name={u.name} avatarUrl={u.avatarUrl} color={u.color} size="sm" />
        ))}
      </div>
      {overflow > 0 && <span className="text-xs text-gray-500">+{overflow}</span>}
    </div>
  )
}
