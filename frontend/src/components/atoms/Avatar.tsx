import { cn, getInitials } from '@/lib/utils'

interface AvatarProps {
  name: string
  avatarUrl?: string | null
  color?: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function Avatar({
  name,
  avatarUrl,
  color = '#3b82f6',
  size = 'md',
  className,
}: AvatarProps) {
  const sizes = { sm: 'h-6 w-6 text-xs', md: 'h-8 w-8 text-sm', lg: 'h-10 w-10 text-base' }

  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={name}
        title={name}
        className={cn('rounded-full object-cover ring-2 ring-white', sizes[size], className)}
      />
    )
  }

  return (
    <div
      title={name}
      className={cn(
        'flex items-center justify-center rounded-full font-semibold text-white ring-2 ring-white',
        sizes[size],
        className,
      )}
      style={{ backgroundColor: color }}
    >
      {getInitials(name)}
    </div>
  )
}
