import { create } from 'zustand'

type BackofficeStore = {
  activeTenantId: string | null
  setActiveTenantId: (tenantId: string | null) => void
}

export const useBackofficeStore = create<BackofficeStore>((set) => ({
  activeTenantId: null,
  setActiveTenantId: (activeTenantId) => set({ activeTenantId }),
}))
