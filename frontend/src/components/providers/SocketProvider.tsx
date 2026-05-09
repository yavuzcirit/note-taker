'use client'

import { createContext, useEffect, useRef } from 'react'
import { Socket } from 'socket.io-client'
import { getSocket } from '@/lib/socket'
import { ServerToClientEvents, ClientToServerEvents } from '@/types/socket-events'

type AppSocket = Socket<ServerToClientEvents, ClientToServerEvents>

export const SocketContext = createContext<AppSocket | null>(null)

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const socketRef = useRef<AppSocket>(getSocket())

  useEffect(() => {
    const socket = socketRef.current
    socket.connect()
    return () => {
      socket.disconnect()
    }
  }, [])

  return <SocketContext.Provider value={socketRef.current}>{children}</SocketContext.Provider>
}
