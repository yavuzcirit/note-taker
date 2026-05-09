import { ButtonHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

interface ToolbarButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean
}

export function ToolbarButton({ active, className, children, ...props }: ToolbarButtonProps) {
  return (
    <button
      className={cn(
        'flex h-8 w-8 items-center justify-center rounded-md text-sm font-medium transition-colors',
        active
          ? 'bg-gray-200 text-gray-900 dark:bg-gray-600 dark:text-gray-100'
          : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-100',
        className,
      )}
      {...props}
    >
      {children}
    </button>
  )
}
