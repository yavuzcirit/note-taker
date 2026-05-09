import api from '@/lib/api'
import { Version, VersionFull } from '@/types'

export async function listVersions(documentId: string): Promise<Version[]> {
  const { data } = await api.get<Version[]>(`/documents/${documentId}/versions`)
  return data
}

export async function getVersion(documentId: string, versionId: string): Promise<VersionFull> {
  const { data } = await api.get<VersionFull>(`/documents/${documentId}/versions/${versionId}`)
  return data
}

export async function restoreVersion(documentId: string, versionId: string): Promise<void> {
  await api.post(`/documents/${documentId}/versions/${versionId}/restore`)
}
