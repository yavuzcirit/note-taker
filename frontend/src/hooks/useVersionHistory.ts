'use client'

import { useQuery } from '@tanstack/react-query'
import * as versionService from '@/services/version.service'

export function useVersionHistory(documentId: string) {
  return useQuery({
    queryKey: ['versions', documentId],
    queryFn: () => versionService.listVersions(documentId),
    staleTime: 30 * 1000,
  })
}

export function useVersion(documentId: string, versionId: string | null) {
  return useQuery({
    queryKey: ['version', documentId, versionId],
    queryFn: () => versionService.getVersion(documentId, versionId!),
    enabled: !!versionId,
  })
}
