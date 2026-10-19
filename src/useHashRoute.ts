import { useEffect, useState } from 'react'

/** Minimal hash router: '#/components?x=1' → '/components'. The query part is read by whoever needs it. */
export function useHashRoute() {
  const read = () => window.location.hash.replace(/^#/, '').split('?')[0] || '/'
  const [route, setRoute] = useState(read)
  useEffect(() => {
    const onChange = () => setRoute(read())
    window.addEventListener('hashchange', onChange)
    return () => window.removeEventListener('hashchange', onChange)
  }, [])
  return route
}
