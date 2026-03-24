import { create } from 'zustand'

type WorkspaceStore = {
  selectedThemeKeyByCompanyId: Record<string, string>
  setSelectedTheme: (companyId: string, themeKey: string) => void
}

export const useWorkspaceStore = create<WorkspaceStore>((set) => ({
  selectedThemeKeyByCompanyId: {},
  setSelectedTheme: (companyId, themeKey) =>
    set((state) => ({
      selectedThemeKeyByCompanyId: {
        ...state.selectedThemeKeyByCompanyId,
        [companyId]: themeKey,
      },
    })),
}))
