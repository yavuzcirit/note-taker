import { create } from 'zustand'

interface UIState {
  sidebarOpen: boolean
  activeDocumentId: string | null
  versionHistoryOpen: boolean
  shareModalOpen: boolean
  setSidebarOpen: (open: boolean) => void
  toggleSidebar: () => void
  setActiveDocumentId: (id: string | null) => void
  setVersionHistoryOpen: (open: boolean) => void
  setShareModalOpen: (open: boolean) => void
}

export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: true,
  activeDocumentId: null,
  versionHistoryOpen: false,
  shareModalOpen: false,
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setActiveDocumentId: (id) => set({ activeDocumentId: id }),
  setVersionHistoryOpen: (open) => set({ versionHistoryOpen: open }),
  setShareModalOpen: (open) => set({ shareModalOpen: open }),
}))
