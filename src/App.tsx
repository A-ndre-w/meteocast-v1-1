import { ComponentsPage } from './pages/ComponentsPage'
import { MapScreen } from './pages/MapScreen'
import { useHashRoute } from './useHashRoute'

export function App() {
  const route = useHashRoute()
  return route === '/components' ? <ComponentsPage /> : <MapScreen />
}
