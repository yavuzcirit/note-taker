'use client'

import { useContext } from 'react'
import { SocketContext } from '@/components/providers/SocketProvider'

export function useSocket() {
  const ctx = useContext(SocketContext)
  if (!ctx) throw new Error('useSocket must be used within SocketProvider')
  return ctx
}
