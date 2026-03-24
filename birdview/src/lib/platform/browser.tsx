import { StrictMode, type ComponentType } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'

export function mountBrowserApp(App: ComponentType) {
  const rootElement = document.getElementById('root')

  if (!rootElement) {
    throw new Error('Browser root element "#root" was not found.')
  }

  createRoot(rootElement).render(
    <StrictMode>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </StrictMode>
  )
}
