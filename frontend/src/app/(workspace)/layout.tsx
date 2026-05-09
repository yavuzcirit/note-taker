import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { Sidebar } from '@/components/organisms/Sidebar'
import { SocketProvider } from '@/components/providers/SocketProvider'

export default async function WorkspaceLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies()
  if (!cookieStore.has('access_token')) redirect('/login')

  return (
    <SocketProvider>
      <div className="flex h-screen overflow-hidden">
        <aside className="hidden w-64 shrink-0 border-r border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800 md:flex md:flex-col">
          <Sidebar />
        </aside>
        <main className="flex flex-1 flex-col overflow-hidden">{children}</main>
      </div>
    </SocketProvider>
  )
}
