import { SpinnerIcon } from './icons'
import { cn } from '@/lib/utils'

export function Spinner({ className }: { className?: string }) {
  return <SpinnerIcon className={cn('h-5 w-5 animate-spin text-gray-400', className)} />
}
