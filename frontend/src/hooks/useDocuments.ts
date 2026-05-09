'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import * as documentService from '@/services/document.service'

export function useDocuments() {
  return useQuery({
    queryKey: ['documents'],
    queryFn: documentService.listDocuments,
    staleTime: 30 * 1000,
  })
}

export function useTrashedDocuments() {
  return useQuery({
    queryKey: ['documents', 'trash'],
    queryFn: documentService.listTrashed,
    staleTime: 30 * 1000,
  })
}

export function useCreateDocument() {
  const queryClient = useQueryClient()
  const router = useRouter()

  return useMutation({
    mutationFn: documentService.createDocument,
    onSuccess: (doc) => {
      queryClient.invalidateQueries({ queryKey: ['documents'] })
      router.push(`/workspace/document/${doc.id}`)
    },
  })
}

export function useSoftDelete() {
  const queryClient = useQueryClient()
  const router = useRouter()

  return useMutation({
    mutationFn: (id: string) => documentService.softDelete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] })
      router.push('/workspace')
    },
  })
}

export function useRestoreDocument() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => documentService.restoreDocument(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] })
      queryClient.invalidateQueries({ queryKey: ['documents', 'trash'] })
    },
  })
}

export function usePermanentDelete() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => documentService.permanentDelete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents', 'trash'] })
    },
  })
}

export function useUpdateDocument() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string
      data: Partial<{ title: string; content: unknown; icon: string | null }>
    }) => documentService.updateDocument(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['documents'] })
      queryClient.invalidateQueries({ queryKey: ['document', variables.id] })
    },
  })
}
