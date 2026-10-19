import { useHashRoute } from './useHashRoute'

export function App() {
  const route = useHashRoute()
  if (route === '/components') return <main style={{ padding: 32 }}>Components — coming in step 2</main>
  return <main style={{ padding: 32 }}>MeteoCast v1.1 — setup ok</main>
}
