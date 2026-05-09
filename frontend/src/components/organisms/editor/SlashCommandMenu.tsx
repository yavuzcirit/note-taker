'use client'

import { forwardRef, useEffect, useImperativeHandle, useState } from 'react'
import { SuggestionProps } from '@tiptap/suggestion'
import { SlashCommandItem } from './extensions/SlashCommand'
import { cn } from '@/lib/utils'

interface Handle {
  onKeyDown: (props: { event: KeyboardEvent }) => boolean
}

export const SlashCommandMenu = forwardRef<Handle, SuggestionProps<SlashCommandItem>>(
  ({ items, command }, ref) => {
    const [selectedIndex, setSelectedIndex] = useState(0)

    useEffect(() => setSelectedIndex(0), [items])

    useImperativeHandle(ref, () => ({
      onKeyDown: ({ event }: { event: KeyboardEvent }) => {
        if (event.key === 'ArrowUp') {
          setSelectedIndex((i) => (i + items.length - 1) % items.length)
          return true
        }
        if (event.key === 'ArrowDown') {
          setSelectedIndex((i) => (i + 1) % items.length)
          return true
        }
        if (event.key === 'Enter') {
          const item = items[selectedIndex]
          if (item) command(item)
          return true
        }
        return false
      },
    }))

    if (!items.length) return null

    return (
      <div className="z-50 min-w-[240px] overflow-hidden rounded-lg border border-gray-200 bg-white shadow-xl dark:border-gray-700 dark:bg-gray-800">
        <div className="px-2 py-1.5 text-xs font-medium text-gray-400">Commands</div>
        {items.map((item, index) => (
          <button
            key={item.title}
            onClick={() => command(item)}
            className={cn(
              'flex w-full items-center gap-3 px-3 py-2 text-left text-sm transition-colors',
              index === selectedIndex
                ? 'bg-gray-100 dark:bg-gray-700'
                : 'hover:bg-gray-50 dark:hover:bg-gray-700',
            )}
          >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-gray-200 bg-gray-50 text-xs font-bold dark:border-gray-600 dark:bg-gray-700">
              {item.icon}
            </span>
            <div>
              <p className="font-medium text-gray-900 dark:text-gray-100">{item.title}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{item.description}</p>
            </div>
          </button>
        ))}
      </div>
    )
  },
)

SlashCommandMenu.displayName = 'SlashCommandMenu'
