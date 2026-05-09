import api from '@/lib/api'
import { ShareLink } from '@/types'

export async function createShareLink(
  documentId: string,
  permission: 'READ' | 'EDIT' = 'READ',
  expiresAt?: string,
): Promise<ShareLink> {
  const { data } = await api.post<ShareLink>(`/documents/${documentId}/share`, {
    permission,
    expiresAt,
  })
  return data
}

export async function listShareLinks(documentId: string): Promise<ShareLink[]> {
  const { data } = await api.get<ShareLink[]>(`/documents/${documentId}/share`)
  return data
}

export async function revokeShareLink(documentId: string, linkId: string): Promise<void> {
  await api.delete(`/documents/${documentId}/share/${linkId}`)
}

export async function resolveShareToken(
  token: string,
): Promise<{ permission: 'READ' | 'EDIT'; document: unknown }> {
  const { data } = await api.get(`/share/${token}`)
  return data
}
