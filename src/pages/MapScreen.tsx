import { LayerPanel } from '../components/LayerPanel/LayerPanel'
import { Logo } from '../components/Logo/Logo'
import { MapView } from '../components/MapView/MapView'
import { ModePill } from '../components/ModePill/ModePill'
import { NotificationBell } from '../components/NotificationBell/NotificationBell'
import { Rail } from '../components/Rail/Rail'
import { Readout } from '../components/Readout/Readout'
import { SearchBar } from '../components/SearchBar/SearchBar'
import { Timebar } from '../components/Timebar/Timebar'
import { Toast } from '../components/Toast/Toast'
import { ZoomControl } from '../components/ZoomControl/ZoomControl'
import { groups, location, mapPoints, pointValue, streamDayAvailable, streamInstantAvailable, valueAt } from '../data'
import { disabledReason } from '../state/rules'
import { useMeteo } from '../state/useMeteo'
import {
  dayWindow,
  fmtDayShort,
  fmtHour,
  fmtOffset,
  fmtPillTime,
  fmtReadoutTime,
  fmtRelative,
  modeOf,
  NOW,
  pad2,
} from '../time'
import { modeLabel } from '../types'
import styles from './MapScreen.module.css'
import { toastFor } from './notices'

const days = dayWindow()

/** The prototype screen (Figma: Screens 01–03). */
export function MapScreen() {
  const { state, view, layer, actions } = useMeteo()
  const { sel } = view
  const mode = modeOf(sel) // rule 1
  const group = groups.find((g) => g.id === view.groupId)!
  const daily = layer.interval === 'day' // rule 6

  // Rule 9: Live shows "Updated HH:MM"; late data is "stale" with its delay; missing data is "—".
  const value = valueAt(layer.id, sel)
  const stale = mode === 'live' && value !== null && layer.liveDelayMin !== undefined
  const updatedAt = NOW.hour * 60 - (stale ? layer.liveDelayMin! : 0)
  const readoutTime =
    mode === 'live' ? `${pad2(Math.floor(updatedAt / 60))}:${pad2(updatedAt % 60)}` : daily ? fmtDayShort(sel.day) : fmtReadoutTime(sel)

  // Rule 8: what the stream (layer + twin) can show on the timeline.
  const unavailableHours = Array.from({ length: 24 }, (_, h) => h).filter((h) => !streamInstantAvailable(layer, { day: sel.day, hour: h }))

  const toast = state.notice && toastFor(state.notice)

  return (
    <div className={styles.screen}>
      <MapView
        mode={mode}
        ramp={layer.scale.ramp}
        intensity={value === null ? null : Math.min(1, value / layer.scale.max)}
        labels={mapPoints.map((p) => ({ pos: p.pos, value: pointValue(layer.id, sel, p.factor), unit: layer.unit === 'mm' ? 'mm/h' : layer.unit }))}
        pin={{ pos: location.pin, label: location.name }}
        zoom={state.zoom}
      />

      <h1 className="visually-hidden">MeteoCast</h1>

      <div className={styles.logo}>
        <Logo />
      </div>

      <div className={styles.rail}>
        <Rail groups={groups} selectedGroupId={view.groupId} onSelect={actions.selectGroup} />
      </div>

      <div className={styles.panel}>
        <LayerPanel
          group={group}
          selectedLayerId={view.layerId}
          getDisabledReason={(l) => disabledReason(l, view)}
          onSelect={actions.selectLayer}
          onGoLive={actions.goLiveWith}
        />
      </div>

      {/* Rule 2: the ModePill is one of the three mode signals; hidden in Live. */}
      <div className={styles.pill}>
        <ModePill mode={mode} time={fmtPillTime(sel)} relative={fmtRelative(sel)} onBackToLive={actions.goNow} />
      </div>

      {toast && state.notice && (
        <div className={toast.tone === 'warning' ? styles.toastBottom : styles.toastTop}>
          <Toast
            key={state.notice.key}
            mode={toast.mode}
            tone={toast.tone}
            message={toast.message}
            onUndo={toast.undo && (() => actions.undo(toast.undo!))}
            onClose={actions.dismissNotice}
          />
        </div>
      )}

      <div className={styles.top}>
        <SearchBar />
        <NotificationBell count={3} />
      </div>

      <div className={styles.readout}>
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
          scale={layer.scale}
        />
      </div>

      <div className={styles.zoom}>
        <ZoomControl
          onZoomIn={() => actions.zoomBy(0.25)}
          onZoomOut={() => actions.zoomBy(-0.25)}
          canZoomIn={state.zoom < 2}
          canZoomOut={state.zoom > 1}
        />
      </div>

      <div className={styles.timebar}>
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
          onNow={actions.goNow}
          onTogglePlay={actions.togglePlay}
          onSpeedChange={actions.setSpeed}
        />
      </div>

      <a className={styles.componentsLink} href="#/components">
        Components
      </a>

      {/* Announces what the map now shows when layer, time or mode change (not on every Play frame). */}
      <p className="visually-hidden" aria-live="polite">
        {!state.playing &&
          `${layer.name}, ${fmtDayShort(sel.day)}${daily ? '' : ` ${fmtHour(sel.hour)}`}, ${modeLabel[mode]}`}
      </p>
    </div>
  )
}
