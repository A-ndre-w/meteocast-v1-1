import { useMemo, useRef, useState } from 'react'
import { LayerPanel } from '../components/LayerPanel/LayerPanel'
import { Logo } from '../components/Logo/Logo'
import { MapView, type MapViewHandle } from '../components/MapView/MapView'
import { ModePill } from '../components/ModePill/ModePill'
import { NotificationBell } from '../components/NotificationBell/NotificationBell'
import { Rail } from '../components/Rail/Rail'
import { Readout } from '../components/Readout/Readout'
import { SearchBar } from '../components/SearchBar/SearchBar'
import { Timebar } from '../components/Timebar/Timebar'
import { Toast } from '../components/Toast/Toast'
import { ZoomControl } from '../components/ZoomControl/ZoomControl'
import { groups, instantAvailable, isPatchy, location, stations, stationValues, streamDayAvailable, streamInstantAvailable, valueAt } from '../data'
import { breaksOf } from '../scale'
import { useMeteo } from '../state/useMeteo'
import {
  dayWindow,
  fmtDayMedium,
  fmtOffset,
  fmtStamp,
  modeOf,
  NOW,
  pad2,
} from '../time'
import { modeLabel } from '../types'
import styles from './MapScreen.module.css'
import { toastFor } from './notices'

const days = dayWindow()

/** Focus the first element that exists among the selectors (skip links). */
function focusFirst(...selectors: string[]) {
  for (const sel of selectors) {
    const el = document.querySelector<HTMLElement>(sel)
    if (el) return el.focus()
  }
}

/** The prototype screen (Figma: Screens 01–03). */
export function MapScreen() {
  const { state, view, layer, actions } = useMeteo()
  const { sel } = view
  const mode = modeOf(sel) // rule 1
  const group = groups.find((g) => g.id === view.groupId)!
  const daily = layer.interval === 'day' // rule 6

  // Rule 9: Live shows "Updated HH:MM"; late data is "stale" with its delay; missing data is "—".
  const value = valueAt(layer.id, sel)
  // Memoised: the map redraws its field only when the data or the instant change.
  const network = useMemo(() => {
    const values = stationValues(layer, sel)
    return stations.map((s, i) => ({ ...s, value: values[i] }))
  }, [layer, sel])
  const mapRef = useRef<MapViewHandle>(null)
  const [zoomRange, setZoomRange] = useState({ canIn: true, canOut: true })
  // UX audit H8: while focus is in the timeline, the slider and the day chips announce the new time themselves.
  const [timelineFocus, setTimelineFocus] = useState(false)
  // Data classes shared by the map and the Readout legend (src/scale.ts).
  const breaks = useMemo(() => breaksOf(layer.scale.max, layer.unit, isPatchy(layer)), [layer])
  const pin = useMemo(() => ({ pos: location.pin, label: location.name, value }), [value])
  const stale = mode === 'live' && value !== null && layer.liveDelayMin !== undefined
  const updatedAt = NOW.hour * 60 - (stale ? layer.liveDelayMin! : 0)
  const readoutTime =
    mode === 'live' ? `${pad2(Math.floor(updatedAt / 60))}:${pad2(updatedAt % 60)}` : daily ? fmtDayMedium(sel.day) : fmtStamp(sel)

  // Rule 8: what the stream (layer + twin) can show on the timeline.
  const unavailableHours = Array.from({ length: 24 }, (_, h) => h).filter((h) => !streamInstantAvailable(layer, { day: sel.day, hour: h }))

  const toast = state.notice && toastFor(state.notice)

  return (
    <main className={styles.screen}>
      {/* WCAG 2.4.1: the timeline is the last block in the tab order (stop 39 of 40). UX audit H4. */}
      <div className={styles.skip}>
        <button type="button" className={styles.skipLink} onClick={() => focusFirst('[aria-label="Timeline"] [role="slider"]', '[aria-label="Timeline"] [data-daystrip] [aria-pressed="true"]')}>
          Skip to timeline
        </button>
        <button type="button" className={styles.skipLink} onClick={() => focusFirst('nav[aria-label$=" layers"] [aria-pressed="true"]', 'nav[aria-label$=" layers"] button')}>
          Skip to layers
        </button>
      </div>

      <MapView
        mode={mode}
        ramp={layer.scale.ramp}
        breaks={breaks}
        unit={layer.unit}
        patchy={isPatchy(layer)}
        layerName={layer.name}
        stations={network}
        pin={pin}
        onZoomRange={(canIn, canOut) => setZoomRange({ canIn, canOut })}
        ref={mapRef}
      />

      <h1 className="visually-hidden">MeteoCast</h1>

      <div className={styles.logo} data-map-obstacle>
        <Logo />
      </div>

      <div className={styles.rail} data-map-obstacle>
        <Rail
          groups={groups}
          selectedGroupId={view.groupId}
          onSelect={actions.selectGroup}
          onAdd={() => actions.notInPrototype('Creating presets')}
        />
      </div>

      <div className={styles.panel} data-map-obstacle>
        <LayerPanel
          group={group}
          selectedStreamId={layer.stream}
          cursor={mode}
          isAvailable={(s) => s.layers.some((l) => instantAvailable(l, sel))}
          onSelect={actions.selectStream}
        />
      </div>

      {/* Rule 2: the ModePill is one of the three mode signals; hidden in Live. */}
      <div className={styles.pill} data-map-obstacle>
        <ModePill mode={mode} time={fmtStamp(sel)} relative={fmtOffset(sel)} onBackToLive={actions.goNow} />
      </div>

      {toast && state.notice && (
        <div className={styles.toast}>
          <Toast
            key={state.notice.key}
            mode={toast.mode}
            tone={toast.tone}
            message={toast.message}
            onUndo={toast.undo && (() => actions.undo(toast.undo!))}
            onClose={actions.dismissNotice}
            // key 0 = opened by a QA scenario: keep it on screen for the comparison.
            duration={state.notice.key === 0 ? 0 : undefined}
          />
        </div>
      )}

      <div className={styles.top} data-map-obstacle>
        <SearchBar onSearch={() => actions.notInPrototype('Search')} onLocate={() => actions.notInPrototype('Locating you')} />
        <NotificationBell count={3} onClick={() => actions.notInPrototype('The alerts panel')} />
      </div>

      <div className={styles.readout} data-map-obstacle>
        <Readout
          mode={mode}
          offset={fmtOffset(sel)}
          location={location.name}
          coords={location.coords}
          layer={layer.name}
          value={value}
          unit={layer.unit}
          time={readoutTime}
          state={value === null ? 'noData' : stale ? 'stale' : 'updated'}
          delayMin={layer.liveDelayMin}
          scale={{ ...layer.scale, breaks }}
        />
      </div>

      <div className={styles.zoom} data-map-obstacle>
        <ZoomControl
          onZoomIn={() => mapRef.current?.zoomIn()}
          onZoomOut={() => mapRef.current?.zoomOut()}
          canZoomIn={zoomRange.canIn}
          canZoomOut={zoomRange.canOut}
        />
      </div>

      <div
        className={styles.timebar}
        data-map-obstacle
        onFocus={() => setTimelineFocus(true)}
        onBlur={(e) => setTimelineFocus(e.currentTarget.contains(e.relatedTarget))}
      >
        <Timebar
          mode={mode}
          selectedDay={sel.day}
          selectedHour={sel.hour}
          interval={layer.interval}
          days={days.map((d) => ({ ...d, unavailable: !streamDayAvailable(layer, d.day) }))}
          offset={fmtOffset(sel)}
          nowHour={NOW.hour}
          unavailableHours={unavailableHours}
          playing={state.playing}
          speed={state.speed}
          onSelectDay={actions.selectDay}
          onSelectHour={actions.selectHour}
          onStepHour={actions.stepHour}
          onStepDay={actions.stepDay}
          atStart={sel.day === days[0].day && (daily || sel.hour === 0)}
          atEnd={sel.day === days[days.length - 1].day && (daily || sel.hour === 23)}
          onNow={actions.goNow}
          onTogglePlay={actions.togglePlay}
          onSpeedChange={actions.setSpeed}
        />
      </div>

      <a className={styles.componentsLink} href="#/components" data-map-obstacle>
        Components
      </a>

      {/* Announces what the map now shows when layer, time or mode change (not on every Play frame). Silent while
          the timeline has focus: its controls announce the time already, once per key press (UX audit H8). */}
      <p className="visually-hidden" aria-live={timelineFocus ? 'off' : 'polite'}>
        {!state.playing &&
          `${layer.name}, ${daily ? fmtDayMedium(sel.day) : fmtStamp(sel)}, ${modeLabel[mode]}`}
      </p>
    </main>
  )
}
