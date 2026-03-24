import type { ReactNode } from 'react'

import {
  getSurfaceUiConfig,
  type SurfaceId,
} from '../../modules/shared/ui/surfaces/config'
import { SurfaceUiContext } from './surface-ui-context'

export function SurfaceUiProvider({
  surface,
  children,
}: {
  surface: SurfaceId
  children: ReactNode
}) {
  return (
    <SurfaceUiContext.Provider value={getSurfaceUiConfig(surface)}>
      {children}
    </SurfaceUiContext.Provider>
  )
}
