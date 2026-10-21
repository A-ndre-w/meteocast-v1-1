import { Map as MlMap } from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { useLayoutEffect, useRef } from 'react'
import { HOME, STYLE } from '../map/geo'

/**
 * Dev only (#/basemap): the base map alone in the 1440×840 design frame, at the design view.
 * scripts/export-basemap.mjs screenshots it into design-notes/basemap-1440x840.png for the Figma screens.
 */
export function BasemapPage() {
  const ref = useRef<HTMLDivElement>(null)
  useLayoutEffect(() => {
    const map = new MlMap({ container: ref.current!, style: STYLE, center: HOME.center, zoom: HOME.zoom, interactive: false, attributionControl: false })
    map.once('idle', () => document.body.setAttribute('data-map-idle', ''))
    return () => map.remove()
  }, [])
  return <div ref={ref} style={{ width: 1440, height: 840 }} />
}
