import { ActivityEvent } from '@/types'
import { formatDate } from '@/lib/utils'

const labels: Record<string, string> = {
  joined: 'joined',
  left: 'left',
  edited: 'made edits',
  version_created: 'saved a version',
  title_changed: 'renamed to',
}

export function ActivityItem({ event }: { event: ActivityEvent }) {
  return (
    <li className="px-4 py-2">
      <p className="text-xs text-gray-700 dark:text-gray-300">
        <span className="font-medium">{event.userName}</span>{' '}
        {labels[event.type] ?? event.type}
        {event.type === 'title_changed' && (
          <span className="font-medium"> &ldquo;{event.meta?.title as string}&rdquo;</span>
        )}
      </p>
      <p className="text-xs text-gray-400">{formatDate(event.timestamp)}</p>
    </li>
  )
}
