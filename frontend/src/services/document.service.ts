import api from '@/lib/api'
import { Document, DocumentFull, TrashedDocument } from '@/types'

export async function listDocuments(): Promise<Document[]> {
  const { data } = await api.get<Document[]>('/documents')
  return data
}

export async function listTrashed(): Promise<TrashedDocument[]> {
  const { data } = await api.get<TrashedDocument[]>('/documents/trash')
  return data
}

export async function createDocument(): Promise<Document> {
  const { data } = await api.post<Document>('/documents')
  return data
}

export async function getDocument(id: string): Promise<DocumentFull> {
  const { data } = await api.get<DocumentFull>(`/documents/${id}`)
  return data
}

export async function updateDocument(
  id: string,
  updates: Partial<{ title: string; content: unknown; icon: string | null; position: number }>,
): Promise<Document> {
  const { data } = await api.patch<Document>(`/documents/${id}`, updates)
  return data
}

export async function softDelete(id: string): Promise<void> {
  await api.delete(`/documents/${id}`)
}

export async function restoreDocument(id: string): Promise<void> {
  await api.post(`/documents/${id}/restore`)
}

export async function permanentDelete(id: string): Promise<void> {
  await api.delete(`/documents/${id}/permanent`)
}
