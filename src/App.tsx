import { ComponentsPage } from './pages/ComponentsPage'
import { useHashRoute } from './useHashRoute'

export function App() {
  const route = useHashRoute()
  if (route === '/components') return <ComponentsPage />
  return (
    <main style={{ padding: 32 }}>
      MeteoCast v1.1 — prototype screen arrives in step 4. <a href="#/components">Components →</a>
    </main>
  )
}
