import { createContext, useContext } from 'react'

import {
  getSurfaceUiConfig,
  type SurfaceUiConfig,
} from '../../modules/shared/ui/surfaces/config'

export const SurfaceUiContext = createContext<SurfaceUiConfig>(
  getSurfaceUiConfig('default')
)

export function useSurfaceUi() {
  return useContext(SurfaceUiContext)
}
