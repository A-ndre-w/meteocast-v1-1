import { lazy, Suspense } from 'react'
import { ComponentsPage } from './pages/ComponentsPage'
import { MapScreen } from './pages/MapScreen'
import { useHashRoute } from './useHashRoute'

// Design QA compares with the Figma exports in /assets, which only the dev server serves.
const QaPage = import.meta.env.DEV ? lazy(() => import('./pages/QaPage').then((m) => ({ default: m.QaPage }))) : null
// The bare base map for the Figma screens (scripts/export-basemap.mjs).
const BasemapPage = import.meta.env.DEV ? lazy(() => import('./pages/BasemapPage').then((m) => ({ default: m.BasemapPage }))) : null

export function App() {
  const route = useHashRoute()
  if (route === '/components') return <ComponentsPage />
  if (route === '/qa' && QaPage)
    return (
      <Suspense>
        <QaPage />
      </Suspense>
    )
  if (route === '/basemap' && BasemapPage)
    return (
      <Suspense>
        <BasemapPage />
      </Suspense>
    )
  return <MapScreen />
}
