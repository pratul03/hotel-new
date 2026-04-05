import { create } from 'zustand'
import type { User } from '@/types/user'
import type { WorkspaceMode } from '@/lib/crmNavigation'

type UserRole = User['role']
type WorkspacePreference = Partial<Record<UserRole, WorkspaceMode>>

interface UIState {
  sidebarOpen: boolean
  setSidebarOpen: (open: boolean) => void
  toggleSidebar: () => void
  mobileMenuOpen: boolean
  setMobileMenuOpen: (open: boolean) => void
  activeModal: string | null
  setActiveModal: (modal: string | null) => void
  workspacePreference: WorkspacePreference
  setWorkspacePreference: (role: UserRole, workspace: WorkspaceMode) => void
}

export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: true,
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  mobileMenuOpen: false,
  setMobileMenuOpen: (open) => set({ mobileMenuOpen: open }),
  activeModal: null,
  setActiveModal: (modal) => set({ activeModal: modal }),
  workspacePreference: {},
  setWorkspacePreference: (role, workspace) =>
    set((state) => ({
      workspacePreference: {
        ...state.workspacePreference,
        [role]: workspace,
      },
    })),
}))
