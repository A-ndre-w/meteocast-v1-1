import { useState } from 'react'
import { DayStrip } from '../components/DayStrip/DayStrip'
import { LayerPanel } from '../components/LayerPanel/LayerPanel'
import { ModePill } from '../components/ModePill/ModePill'
import { Readout } from '../components/Readout/Readout'
import { Timebar, type Speed } from '../components/Timebar/Timebar'
import { ModeWord, Toast } from '../components/Toast/Toast'
import { groups, sectionOf } from '../data'
import {
  addDays,
  dayWindow,
  fmtOffset,
  fmtPillTime,
  fmtReadoutTime,
  fmtRelative,
  modeOf,
  NOW,
  shiftHours,
  type TimeSel,
} from '../time'
import styles from './ComponentsPage.module.css'
import { Specimen, Variant } from './Specimen'

const days = dayWindow()
const COORDS = '41.90° N, 12.50° E'
const rain = { max: 20, ramp: 'rain' as const }
const snow = { max: 100, ramp: 'snow' as const }

const ARCHIVE: TimeSel = { day: addDays(NOW.day, -1), hour: 13 }
const FORECAST: TimeSel = { day: addDays(NOW.day, 1), hour: 13 }

/** Static Timebar in a given state, with mode derived from the instant (rule 1). */
function TimebarAt({ sel, interval = 'hour', unavailableHours }: { sel: TimeSel; interval?: 'hour' | 'day'; unavailableHours?: number[] }) {
  return (
    <Timebar
      mode={modeOf(sel)}
      selectedDay={sel.day}
      selectedHour={sel.hour}
      interval={interval}
      days={days}
      offset={fmtOffset(sel)}
      nowHour={NOW.hour}
      unavailableHours={unavailableHours}
    />
  )
}

/** Interactive Timebar: arrows = hours, Shift+arrows = days, drag the track, Now. */
function TimebarPlayground() {
  const [sel, setSel] = useState<TimeSel>(NOW)
  const [speed, setSpeed] = useState<Speed>(1)
  const clampDay = (s: TimeSel) => (days.some((d) => d.day === s.day) ? s : sel)
  return (
    <Timebar
      mode={modeOf(sel)}
      selectedDay={sel.day}
      selectedHour={sel.hour}
      interval="hour"
      days={days}
      offset={fmtOffset(sel)}
      nowHour={NOW.hour}
      speed={speed}
      onSpeedChange={setSpeed}
      onSelectDay={(day) => setSel({ ...sel, day })}
      onSelectHour={(hour) => setSel({ ...sel, hour })}
      onStepHour={(d) => setSel(clampDay(shiftHours(sel, d)))}
      onStepDay={(d) => setSel(clampDay({ ...sel, day: addDays(sel.day, d) }))}
      onNow={() => setSel(NOW)}
    />
  )
}

export function BigSpecimens() {
  const water = groups[0]
  const snowGroup = groups[1]
  return (
    <>
      <Specimen
        name="DayStrip"
        figma="Daystrip · 2010:10400"
        props="days, selectedDay, mode, onSelect"
        note="Arrows move the selection by one day. Unavailable days come from the layer’s modes and horizon (rule 8)."
      >
        <Variant label="live · today selected" wide>
          <DayStrip days={days} selectedDay={NOW.day} mode="live" />
        </Variant>
        <Variant label="forecast · Fri selected · Snow probability (horizon 3 days)" wide>
          <DayStrip
            days={days.map((d) => ({ ...d, unavailable: d.time !== 'future' || d.day > addDays(NOW.day, 3) }))}
            selectedDay={FORECAST.day}
            mode="forecast"
          />
        </Variant>
      </Specimen>

      <Specimen
        name="Timebar"
        figma="Timeline · 2010:10063"
        props="mode, selectedDay, selectedHour, interval: 'hour' | 'day', days, offset, nowHour, unavailableHours, playing, speed, on…"
        note="Mode shows in the 3px top stripe, the tint and the badge. Track: solid = observed, dashed = forecast; today carries a NOW marker."
      >
        <Variant label="interactive — try ← → (hours), Shift+← → (days), drag, Now" wide>
          <div className={styles.full}>
            <TimebarPlayground />
          </div>
        </Variant>
        <Variant label="mode=live" wide>
          <div className={styles.full}>
            <TimebarAt sel={NOW} />
          </div>
        </Variant>
        <Variant label="mode=archive · Wed 14 13:00" wide>
          <div className={styles.full}>
            <TimebarAt sel={ARCHIVE} />
          </div>
        </Variant>
        <Variant label="mode=forecast · Fri 16 13:00" wide>
          <div className={styles.full}>
            <TimebarAt sel={FORECAST} />
          </div>
        </Variant>
        <Variant label="mode=forecast · today 18:00 (after now, same day)" wide>
          <div className={styles.full}>
            <TimebarAt sel={{ day: NOW.day, hour: 18 }} />
          </div>
        </Variant>
        <Variant label="interval=day (daily layer: hour track hidden)" wide>
          <div className={styles.full}>
            <TimebarAt sel={FORECAST} interval="day" />
          </div>
        </Variant>
        <Variant label="live · Lightning (no archive): past hours hatched" wide>
          <div className={styles.full}>
            <TimebarAt sel={NOW} unavailableHours={Array.from({ length: NOW.hour }, (_, h) => h)} />
          </div>
        </Variant>
      </Specimen>

      <Specimen
        name="Readout"
        figma="Layer Card · 2014:15144"
        props="mode, offset, location, coords, layer, value, unit, time, state: 'updated' | 'stale' | 'noData', delayMin, scale"
        note="“Updated HH:MM” in Live; stale states the delay; no data shows “—”, never 0 (rule 9)."
      >
        <Variant label="live · updated">
          <Readout mode="live" location="Rome" coords={COORDS} layer="Hourly rainfall" value={4.2} unit="mm" time="13:00" scale={rain} />
        </Variant>
        <Variant label="archive">
          <Readout mode="archive" offset="-24h" location="Rome" coords={COORDS} layer="Hourly rainfall" value={1.8} unit="mm" time={fmtReadoutTime(ARCHIVE)} scale={rain} />
        </Variant>
        <Variant label="forecast">
          <Readout mode="forecast" offset="+24h" location="Rome" coords={COORDS} layer="Hourly rainfall" value={6.5} unit="mm" time={fmtReadoutTime(FORECAST)} scale={rain} />
        </Variant>
        <Variant label="forecast · snow %">
          <Readout mode="forecast" offset="+24h" location="Rome" coords={COORDS} layer="Snow probability" value={15} unit="%" time={fmtReadoutTime(FORECAST)} scale={snow} />
        </Variant>
        <Variant label="live · stale">
          <Readout mode="live" location="Rome" coords={COORDS} layer="Hydrometric level" value={182} unit="cm" time="12:20" state="stale" delayMin={40} scale={{ max: 400, ramp: 'rain' }} />
        </Variant>
        <Variant label="archive · noData">
          <Readout mode="archive" offset="-26h" location="Rome" coords={COORDS} layer="Leaf wetness" value={null} unit="h" time="Wed 14, 11:00" state="noData" scale={{ max: 24, ramp: 'rain' }} />
        </Variant>
      </Specimen>

      <Specimen name="ModePill" figma="Map Pill · 2024:15692" props="mode, time, relative, onBackToLive" note="Hidden in Live: renders nothing.">
        <Variant label="archive" onMap>
          <ModePill mode="archive" time={fmtPillTime(ARCHIVE)} relative={fmtRelative(ARCHIVE)} />
        </Variant>
        <Variant label="forecast" onMap>
          <ModePill mode="forecast" time={fmtPillTime(FORECAST)} relative={fmtRelative(FORECAST)} />
        </Variant>
        <Variant label="live → nothing" onMap>
          <ModePill mode="live" time="" relative="" />
          <span className={styles.caption}>(hidden)</span>
        </Variant>
      </Specimen>

      <Specimen
        name="Toast"
        figma="— (from Screen 02 / Screen 03)"
        props="mode, tone: 'info' | 'warning', message, onUndo, onClose, duration"
        note="Auto-dismiss after 6 s, paused on hover/focus. Shown here with duration 0 so they stay."
      >
        <Variant label="info · auto switch + Undo" onMap wide>
          <Toast
            mode="forecast"
            duration={0}
            onUndo={() => {}}
            onClose={() => {}}
            message={
              <>
                <strong>Snow probability</strong> is only available as forecast. Switched to <ModeWord mode="forecast" />.
              </>
            }
          />
        </Variant>
        <Variant label="warning · blocked move" onMap wide>
          <Toast
            mode="live"
            tone="warning"
            duration={0}
            onClose={() => {}}
            message={
              <>
                <strong>Lightning</strong> is only available as <ModeWord mode="live" /> data.
              </>
            }
          />
        </Variant>
      </Specimen>

      <Specimen
        name="LayerPanel"
        figma="Panel · 2036:19020"
        props="group, selectedLayerId, isDisabled, disabledReason, onSelect, onGoLive"
        note="Single selection. Right: in Forecast, real-time layers are disabled with a tooltip and “Go to live” (rule 7)."
      >
        <Variant label="Water & Storms · live">
          <div style={{ height: 520, display: 'flex' }}>
            <LayerPanel group={water} selectedLayerId="rain-1h" />
          </div>
        </Variant>
        <Variant label="Snow · forecast">
          <div style={{ height: 520, display: 'flex' }}>
            <LayerPanel
              group={snowGroup}
              selectedLayerId="snow-prob"
              isDisabled={(l) => sectionOf(l) === 'realtime'}
              onGoLive={() => {}}
            />
          </div>
        </Variant>
      </Specimen>
    </>
  )
}
