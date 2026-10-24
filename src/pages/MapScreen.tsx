import { useEffect, useMemo, useRef, useState } from 'react'
import { AlertPanel } from '../components/AlertPanel/AlertPanel'
import { LayerPanel } from '../components/LayerPanel/LayerPanel'
import { PresetEditor } from '../components/PresetEditor/PresetEditor'
import { Legend } from '../components/Legend/Legend'
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
import { coordsOf, finestStep, groupById, groupOf, groups, inNowcast, instantAvailable, sourceAt, stepOf, isPatchy, location, stations, stationValues, streamDayAvailable, streamInstantAvailable, valueAt } from '../data'
import { alerts, initiallyUnread } from '../data/alerts'
import { breaksOf, classOf } from '../scale'
import { presetStore, usePresets, type Preset } from '../state/presets'
import { useMeteo } from '../state/useMeteo'
import {
  addDays,
  dayWindow,
  fmtAgo,
  fmtDayMedium,
  fmtDayShort,
  fmtTime,
  fmtOffset,
  fmtStamp,
  minuteOfDay,
  minutesBetween,
  modeOf,
  NOW,
  pad2,
  shiftMinutes,
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
  // Alerts: the panel under the bell, and which ones are still unread (the bell's count).
  const [alertsOpen, setAlertsOpen] = useState(false)
  const [unread, setUnread] = useState<string[]>(initiallyUnread)
  const closeAlerts = (refocus = true) => {
    setAlertsOpen(false)
    if (refocus) requestAnimationFrame(() => document.querySelector<HTMLElement>('[aria-haspopup="dialog"][aria-label^="Alerts"]')?.focus())
  }
  // A click outside the panel (and outside the bell, which toggles it) closes it.
  useEffect(() => {
    if (!alertsOpen) return
    const onDown = (e: PointerEvent) => {
      const t = e.target as Element
      if (!t.closest('[data-alerts], [aria-label^="Alerts"]')) setAlertsOpen(false)
    }
    document.addEventListener('pointerdown', onDown)
    return () => document.removeEventListener('pointerdown', onDown)
  }, [alertsOpen])

  const presets = usePresets()
  // A default group or a user preset (a deleted preset in an old link falls back to the data's own group).
  const group = groupById(view.groupId) ?? groupOf(layer.id)
  const editedPreset = presets.find((p) => p.id === view.groupId)
  // The preset editor: null = closed; without a preset it creates one.
  const [editor, setEditor] = useState<{ preset?: Preset } | null>(null)
  const editorOpener = useRef<HTMLElement | null>(null)
  const openEditor = (preset?: Preset) => {
    editorOpener.current = document.activeElement as HTMLElement | null
    setEditor({ preset })
  }
  // Focus after closing: what opened the editor (Cancel), or the given place (the saved preset, the group after a delete).
  const closeEditor = (focus?: string) => {
    setEditor(null)
    requestAnimationFrame(() => {
      const opener = editorOpener.current
      const back =
        (focus && document.querySelector<HTMLElement>(focus)) ||
        (opener?.isConnected && opener !== document.body ? opener : document.querySelector<HTMLElement>('[aria-label="Create preset"]'))
      back?.focus()
    })
  }
  const daily = layer.interval === 'day' // rule 6

  // The selected point: any station of the network, Trento at the start. Its card sits by the pin. null = nothing
  // pinned: closing the card or clicking the map away from the stations leaves only the legend.
  const [selected, setSelected] = useState<string | null>(location.name)
  // Every station with its value at the selected instant (Trento's from its own series). Memoised: the map
  // redraws its field only when the data or the instant change.
  const network = useMemo(() => {
    const values = stationValues(layer, sel)
    return [{ name: location.name, pos: location.pin, value: valueAt(layer.id, sel) }, ...stations.map((s, i) => ({ ...s, value: values[i] }))]
  }, [layer, sel])
  // Rule 9: Live shows "Updated HH:MM"; late data is "stale" with its delay; missing data is "—".
  const value = network.find((s) => s.name === selected)?.value ?? null
  const mapRef = useRef<MapViewHandle>(null)
  const [zoomRange, setZoomRange] = useState({ canIn: true, canOut: true })
  // UX audit H8: while focus is in the timeline, the slider and the day chips announce the new time themselves.
  const [timelineFocus, setTimelineFocus] = useState(false)
  // Data classes shared by the map and the Readout legend (src/scale.ts).
  const breaks = useMemo(() => breaksOf(layer.scale.max, layer.unit, isPatchy(layer)), [layer])
  const stale = mode === 'live' && value !== null && layer.liveDelayMin !== undefined
  // Live: the last reading. Archive: when the step (5 minutes, the hour or the day) closed and was validated. Forecast: the last model
  // run, every 6 hours (00, 06, 12, 18).
  // The card's quiet date line: the instant of the value, short (late live data: the reading's time).
  const readingAt = NOW.hour * 60 - (stale ? layer.liveDelayMin! : 0)
  const cardTime =
    mode === 'live'
      ? `${fmtDayShort(sel.day)}, ${pad2(Math.floor(readingAt / 60))}:${pad2(readingAt % 60)}`
      : daily
        ? fmtDayShort(sel.day)
        : `${fmtDayShort(sel.day)}, ${fmtTime(sel)}`
  const updatedMinutes =
    mode === 'live'
      ? stale
        ? layer.liveDelayMin!
        : 0
      : mode === 'archive'
        ? minutesBetween(NOW, daily ? { day: addDays(sel.day, 1), hour: 0 } : shiftMinutes(sel, stepOf(layer, sel)))
        : inNowcast(layer, sel)
          ? 0
          : 60 * (NOW.hour % 6)
  const updatedHint =
    mode === 'live'
      ? 'Last reading of the station'
      : mode === 'archive'
        ? 'When this value was recorded'
        : inNowcast(layer, sel)
          ? `${sourceAt(layer, sel)} issued at ${pad2(NOW.hour)}:00, every 5 minutes`
          : `${layer.source} run at ${pad2(NOW.hour - (NOW.hour % 6))}:00`

  // Rule 8: what the stream (layer + twin) can show on the timeline.
  const unavailableHours = Array.from({ length: 24 }, (_, h) => h).filter((h) => !streamInstantAvailable(layer, { day: sel.day, hour: h }))

  const toast = state.notice && toastFor(state.notice)

  return (
    <main className={styles.screen}>
      {/* WCAG 2.4.1: the timeline is the last block in the tab order (stop 39 of 40). UX audit H4. */}
      <div className={styles.skip}>
        <button type="button" className={styles.skipLink} onClick={() => focusFirst('[aria-label="Timeline"] [role="slider"]', '[aria-label="Timeline"] [aria-haspopup="dialog"]')}>
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
        selected={selected}
        onSelect={setSelected}
        onClear={() => setSelected(null)}
        card={(docked, locate) => (
          <Readout
            mode={mode}
            location={selected!}
            coords={coordsOf(selected!)}
            layer={layer.name}
            value={value}
            unit={layer.unit}
            time={cardTime}
            updated={fmtAgo(updatedMinutes)}
            updatedHint={updatedHint}
            state={value === null ? 'noData' : stale ? 'stale' : 'updated'}
            swatch={{ ramp: layer.scale.ramp, level: classOf(value, breaks, isPatchy(layer)) }}
            onClose={() => setSelected(null)}
            onLocate={docked ? locate : undefined}
          />
        )}
        onZoomRange={(canIn, canOut) => setZoomRange({ canIn, canOut })}
        ref={mapRef}
      />

      <h1 className="visually-hidden">MeteoCast</h1>

      <div className={styles.logo} data-map-obstacle>
        <Logo />
      </div>

      <div className={styles.rail} data-map-obstacle>
        <Rail groups={groups} presets={presets} selectedGroupId={view.groupId} onSelect={actions.selectGroup} onAdd={() => openEditor()} />
      </div>

      {/* The preset editor takes the panel's place: the map and the Rail stay in view. */}
      <div className={styles.panel} data-map-obstacle>
        {editor ? (
          <PresetEditor
            key={editor.preset?.id ?? 'new'}
            preset={editor.preset}
            initialStreams={[layer.stream]}
            onSave={(p) => {
              const id = presetStore.save(p)
              actions.selectGroup(id)
              closeEditor('nav[aria-label="Layer groups"] [aria-pressed="true"]')
            }}
            onCancel={() => closeEditor()}
            onDelete={
              editor.preset &&
              (() => {
                actions.deletePreset(editor.preset!.id)
                closeEditor('nav[aria-label="Layer groups"] [aria-pressed="true"]')
              })
            }
          />
        ) : (
          <LayerPanel
            group={group}
            selectedStreamId={layer.stream}
            isAvailable={(s) => s.layers.some((l) => instantAvailable(l, sel))}
            onSelect={actions.selectStream}
            onEditPreset={editedPreset && (() => openEditor(editedPreset))}
          />
        )}
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
            onUndo={
              toast.undo &&
              (() => {
                const n = state.notice!
                if (n.type === 'presetDeleted') presetStore.restore(n.preset, n.index)
                actions.undo(toast.undo!)
              })
            }
            onClose={actions.dismissNotice}
            // key 0 = opened by a QA scenario: keep it on screen for the comparison.
            duration={state.notice.key === 0 ? 0 : undefined}
          />
        </div>
      )}

      <div className={styles.top} data-map-obstacle>
        <SearchBar onSearch={() => actions.notInPrototype('Search')} onLocate={() => actions.notInPrototype('Locating you')} />
        <NotificationBell count={unread.length} expanded={alertsOpen} onClick={() => (alertsOpen ? closeAlerts(false) : setAlertsOpen(true))} />
      </div>

      {alertsOpen && (
        <div className={styles.alerts} data-alerts data-map-obstacle>
          <AlertPanel
            alerts={alerts}
            unread={unread}
            onOpen={(a) => {
              // The alert on the map: its data at its instant, its station pinned; read from now on.
              actions.showAt(a.stream, a.at)
              if (a.station) setSelected(a.station)
              setUnread((u) => u.filter((id) => id !== a.id))
              closeAlerts()
            }}
            onMarkAllRead={() => setUnread([])}
            onManage={() => actions.notInPrototype('Managing alert subscriptions')}
            onClose={() => closeAlerts()}
          />
        </div>
      )}

      {/* The legend stays at the top right for scanning the whole map; the triangle marks the selected point. */}
      <div className={styles.legend} data-map-obstacle data-map-legend>
        <Legend layer={layer.name} unit={layer.unit} source={sourceAt(layer, sel)} ramp={layer.scale.ramp} max={layer.scale.max} breaks={breaks} value={value} />
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
          selectedMinute={minuteOfDay(sel)}
          stepMin={finestStep(layer)}
          offset={fmtOffset(sel)}
          interval={layer.interval}
          days={days.map((d) => ({ ...d, unavailable: !streamDayAvailable(layer, d.day) }))}
          nowHour={NOW.hour}
          unavailableHours={unavailableHours}
          playing={state.playing}
          speed={state.speed}
          onSelectDay={actions.selectDay}
          onSelectTime={actions.selectTime}
          onStep={actions.step}
          onStepHour={actions.stepHour}
          onStepDay={actions.stepDay}
          atStart={sel.day === days[0].day}
          atEnd={sel.day === days[days.length - 1].day}
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
          `${layer.name}${selected ? ` at ${selected}` : ''}, ${daily ? fmtDayMedium(sel.day) : fmtStamp(sel)}, ${modeLabel[mode]}`}
      </p>
    </main>
  )
}
