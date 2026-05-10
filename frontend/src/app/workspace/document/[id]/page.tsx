import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { Metadata } from 'next'
import { DocumentPageClient } from './DocumentPageClient'

interface PageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params
  const cookieStore = await cookies()
  const token = cookieStore.get('access_token')?.value

  if (!token) return { title: 'Document' }

  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/documents/${id}`, {
      headers: { Cookie: `access_token=${token}` },
      cache: 'no-store',
    })
    if (!res.ok) return { title: 'Document' }
    const doc = await res.json()
    return { title: doc.title || 'Untitled' }
  } catch {
    return { title: 'Document' }
  }
}

export default async function DocumentPage({ params }: PageProps) {
  const { id } = await params
  const cookieStore = await cookies()
  const token = cookieStore.get('access_token')?.value

  if (!token) redirect('/login')

  let initialDoc = null
  let user = null

  try {
    const [docRes, userRes] = await Promise.all([
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/documents/${id}`, {
        headers: { Cookie: `access_token=${token}` },
        cache: 'no-store',
      }),
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/me`, {
        headers: { Cookie: `access_token=${token}` },
        cache: 'no-store',
      }),
    ])

    if (docRes.status === 401 || userRes.status === 401) redirect('/login')
    if (!docRes.ok) redirect('/workspace')

    initialDoc = await docRes.json()
    user = await userRes.json()
  } catch {
    redirect('/workspace')
  }

  return <DocumentPageClient documentId={id} initialDoc={initialDoc} user={user} />
}
