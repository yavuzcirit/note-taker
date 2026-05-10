import { notFound, redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { Metadata } from 'next'
import { SharedDocumentClient } from './SharedDocumentClient'

interface PageProps {
  params: Promise<{ token: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { token } = await params
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/share/${token}`, {
      cache: 'no-store',
    })
    if (!res.ok) return { title: 'Shared Document' }
    const data = await res.json()
    return { title: (data.document?.title || 'Untitled') + ' (shared)' }
  } catch {
    return { title: 'Shared Document' }
  }
}

export default async function SharedDocumentPage({ params }: PageProps) {
  const { token } = await params

  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/share/${token}`, {
    cache: 'no-store',
  })

  if (!res.ok) notFound()

  const data = await res.json()

  // Authenticated users with edit permission get the full collaborative workspace editor.
  if (data.permission === 'EDIT') {
    const cookieStore = await cookies()
    if (cookieStore.has('access_token')) {
      redirect(`/workspace/document/${data.document.id}`)
    }
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <header className="border-b border-gray-200 px-6 py-4 dark:border-gray-700">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">
            {data.document?.title || 'Untitled'}
          </h1>
          <span className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-600 dark:bg-gray-700 dark:text-gray-400">
            {data.permission === 'READ' ? 'View only' : 'Can edit'}
          </span>
        </div>
      </header>
      <SharedDocumentClient token={token} document={data.document} permission={data.permission} />
    </div>
  )
}
