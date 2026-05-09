'use client'

import { useActivityStore } from '@/store/activity.store'
import { ActivityItem } from '@/components/molecules/ActivityItem'

export function ActivityFeed({ documentId }: { documentId: string }) {
  const events = useActivityStore((s) => s.eventsByDoc[documentId] ?? [])

  if (events.length === 0) {
    return <p className="px-4 py-6 text-sm text-gray-400">No activity yet.</p>
  }

  return (
    <ul className="divide-y divide-gray-100 dark:divide-gray-700">
      {events.map((event, i) => (
        <ActivityItem key={i} event={event} />
      ))}
    </ul>
  )
}
