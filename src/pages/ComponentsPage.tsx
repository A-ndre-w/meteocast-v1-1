import tokens from '../../design-notes/token.json'
import { DayChip } from '../components/DayChip/DayChip'
import { LayerItem } from '../components/LayerItem/LayerItem'
import { LiveViewButton } from '../components/LiveViewButton/LiveViewButton'
import { Logo } from '../components/Logo/Logo'
import { MapPin } from '../components/MapPin/MapPin'
import { ModeBadge } from '../components/ModeBadge/ModeBadge'
import { NotificationBell } from '../components/NotificationBell/NotificationBell'
import { PresetHeader } from '../components/PresetHeader/PresetHeader'
import { RailButton } from '../components/RailButton/RailButton'
import { SearchBar } from '../components/SearchBar/SearchBar'
import { SectionLabel } from '../components/SectionLabel/SectionLabel'
import { ValueLabel } from '../components/ValueLabel/ValueLabel'
import { ZoomControl } from '../components/ZoomControl/ZoomControl'
import { Icon, iconNames } from '../icons/Icon'
import type { Mode } from '../types'
import { BigSpecimens } from './BigSpecimens'
import styles from './ComponentsPage.module.css'
import { Specimen, Variant } from './Specimen'

const visible = <T extends object>(obj: T) =>
  Object.entries(obj).filter(([k]) => !k.startsWith('_')) as [string, string | number][]

const cssVar = (...parts: string[]) => `--${parts.join('-').replace(/[/\s]+/g, '-').toLowerCase()}`

const times = ['past', 'today', 'future'] as const
const modes: Mode[] = ['live', 'archive', 'forecast']
const dayLabel = { past: 'Wed 14', today: 'Thu 15', future: 'Fri 16' }

/** Lightweight Storybook: every component in every variant. Tokens first. */
export function ComponentsPage() {
  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <a href="#/" className={styles.back}>
          ← Prototype
        </a>
        <h1 className={styles.title}>MeteoCast v1.1 — Components</h1>
        <p className={styles.lede}>
          Code twin of the Figma library. Same names, Figma variants become props.
        </p>
        <nav className={styles.toc} aria-label="Sections">
          <a href="#tokens-color" onClick={jump}>Tokens</a>
          <a href="#icons" onClick={jump}>Icons</a>
          <a href="#small" onClick={jump}>Small components</a>
          <a href="#big" onClick={jump}>Big components</a>
        </nav>
      </header>

      <h2 className={styles.part}>Tokens</h2>

      <section className={styles.section} aria-labelledby="tokens-color">
        <h2 id="tokens-color" className={styles.h2}>
          Color
        </h2>
        <div className={styles.swatches}>
          {visible(tokens.color).map(([name, value]) => (
            <figure key={name} className={styles.swatch}>
              <span className={styles.chip} style={{ background: `var(${cssVar(name)})` }} />
              <figcaption>
                <code className={styles.name}>{name}</code>
                <code className={styles.value}>{String(value)}</code>
              </figcaption>
            </figure>
          ))}
        </div>
      </section>

      <section className={styles.section} aria-labelledby="tokens-type">
        <h2 id="tokens-type" className={styles.h2}>
          Type
        </h2>
        <div className={styles.typeList}>
          {visible(tokens.fontSize).map(([name, px]) => (
            <div key={name} className={styles.typeRow}>
              <code className={styles.name}>
                {name} · {px}px
              </code>
              <span style={{ fontSize: `var(${cssVar('font-size', name)})` }}>Hourly rainfall 4.2 mm</span>
              <span style={{ fontSize: `var(${cssVar('font-size', name)})`, fontFamily: 'var(--font-mono)' }}>
                HOURLY RAINFALL 13:00
              </span>
            </div>
          ))}
        </div>
      </section>

      <section className={styles.section} aria-labelledby="tokens-shape">
        <h2 id="tokens-shape" className={styles.h2}>
          Radius & shadow
        </h2>
        <div className={styles.shapes}>
          {visible(tokens.radius).map(([name, px]) => (
            <figure key={name} className={styles.shape} style={{ borderRadius: `var(${cssVar('radius', name)})` }}>
              <figcaption>
                <code className={styles.name}>radius/{name}</code>
                <code className={styles.value}>{px}px</code>
              </figcaption>
            </figure>
          ))}
          {visible(tokens.shadow).map(([name]) => (
            <figure key={name} className={styles.shape} style={{ boxShadow: `var(${cssVar('shadow', name)})`, border: 0 }}>
              <figcaption>
                <code className={styles.name}>shadow/{name}</code>
              </figcaption>
            </figure>
          ))}
        </div>
      </section>

      <section className={styles.section} aria-labelledby="icons">
        <h2 id="icons" className={styles.h2}>
          Icons
        </h2>
        <div className={styles.icons}>
          {iconNames.map((name) => (
            <figure key={name} className={styles.iconCell}>
              <Icon name={name} size={24} />
              <figcaption className={styles.value}>{name}</figcaption>
            </figure>
          ))}
        </div>
      </section>

      <h2 className={styles.part} id="small">
        Small components
      </h2>

      <Specimen
        name="RailButton"
        figma="Rail Button · 2007:7333"
        props="status: 'default' | 'hover' | 'selected' | 'add', icon, label"
        note="Figma calls the add variant “preset”. Preset creation is out of v1: the button is inert."
      >
        <Variant label="default">
          <RailButton label="Snow" icon="snow" />
        </Variant>
        <Variant label="hover">
          <RailButton label="Snow" icon="snow" status="hover" />
        </Variant>
        <Variant label="selected">
          <RailButton label="Water & Storms" icon="drizzle" status="selected" />
        </Variant>
        <Variant label="add">
          <RailButton label="Create preset" status="add" />
        </Variant>
      </Specimen>

      <Specimen
        name="LayerItem"
        figma="Layer/Item · 2007:7454"
        props="status: 'default' | 'hover' | 'selected' | 'disabled', icon, label, meta, coverage, idle, onSelect, disabledReason, onGoLive"
        note="Disabled is a code addition (rule 7). It stays focusable; hover or focus it to see the tooltip with “Back to live”."
      >
        {(['default', 'hover', 'selected', 'disabled'] as const).map((status) => (
          <Variant key={status} label={status}>
            <div style={{ width: 213 }}>
              <LayerItem status={status} icon="drizzle" label="Hourly rainfall" meta="mm - hourly" onGoLive={() => {}} />
            </div>
          </Variant>
        ))}
        <Variant label="long label">
          <div style={{ width: 213 }}>
            <LayerItem icon="drizzle" label="Accumulated precipitation in 24h" meta="mm - daily" />
          </div>
        </Variant>
        <Variant label="coverage (screen use)">
          <div style={{ width: 213 }} data-mode="live">
            <LayerItem icon="drizzle" label="Hourly rainfall" meta="mm - hourly" status="selected" coverage={{ modes: ['archive', 'live', 'forecast'], cursor: 'live' }} />
          </div>
        </Variant>
        <Variant label="coverage · idle (no data now)">
          <div style={{ width: 213 }} data-mode="forecast">
            <LayerItem icon="humidity" label="Snow on the ground" meta="cm - hourly" idle coverage={{ modes: ['archive', 'live'], cursor: 'forecast' }} />
          </div>
        </Variant>
      </Specimen>

      <Specimen name="SectionLabel" figma="Menu Section label · 2008:9345" props="children">
        <Variant label="real time">
          <SectionLabel>Real time</SectionLabel>
        </Variant>
        <Variant label="forecast">
          <SectionLabel>Forecast</SectionLabel>
        </Variant>
      </Specimen>

      <Specimen name="PresetHeader" figma="Set header · 2008:9539" props="icon, title, preset, layerCount">
        <Variant label="Water & Storms">
          <PresetHeader icon="drizzle" title="Water & Storms" layerCount={16} />
        </Variant>
        <Variant label="Snow">
          <PresetHeader icon="snow" title="Snow" layerCount={5} />
        </Variant>
      </Specimen>

      <Specimen
        name="LiveViewButton"
        figma="Live view button · 2008:9544"
        props="status: 'on' | 'off', onClick"
        note="The timebar “Now” button (rule 4): off in Live, highlighted in Archive and Forecast."
      >
        <Variant label="on">
          <LiveViewButton status="on" />
        </Variant>
        <Variant label="off">
          <LiveViewButton status="off" />
        </Variant>
      </Specimen>

      <Specimen
        name="ModeBadge"
        figma="Timebar/Daychip · 2010:10046"
        props="mode: 'live' | 'archive' | 'forecast', offset"
        note="Text + icon + colour, never colour alone. Live uses a neutral dot: green is reserved for alerts."
      >
        <Variant label="live">
          <ModeBadge mode="live" />
        </Variant>
        <Variant label="archive · -24h">
          <ModeBadge mode="archive" offset="−24h" />
        </Variant>
        <Variant label="forecast · +24h">
          <ModeBadge mode="forecast" offset="+24h" />
        </Variant>
        <Variant label="forecast · +3d">
          <ModeBadge mode="forecast" offset="+3d" />
        </Variant>
      </Specimen>

      <Specimen
        name="DayChip"
        figma="DayChip · 2009:9943"
        props="time: 'past' | 'today' | 'future', selected, unavailable, mode, label, fullLabel, hover"
        note="Past solid, today with dot, future dashed. Selected takes the mode colour (neutral in Live). Unavailable = outside the layer’s modes or horizon."
      >
        <div className={styles.matrix}>
          <span />
          {['default', 'hover', 'selected · live', 'selected · archive', 'selected · forecast', 'unavailable'].map((h) => (
            <span key={h} className={styles.caption}>
              {h}
            </span>
          ))}
          {times.map((time) => (
            <Row key={time} time={time} />
          ))}
        </div>
      </Specimen>

      <Specimen name="SearchBar" figma="Search bar · 2008:9549" props="placeholder, onSearch, onLocate">
        <Variant label="default" onMap>
          <SearchBar />
        </Variant>
      </Specimen>

      <Specimen
        name="NotificationBell"
        figma="Alert Icon · 2008:9632"
        props="count, onClick"
        note="Alerts panel is out of v1: the button is inert."
      >
        <Variant label="count 0" onMap>
          <NotificationBell count={0} />
        </Variant>
        <Variant label="count 3" onMap>
          <NotificationBell count={3} />
        </Variant>
        <Variant label="count 12" onMap>
          <NotificationBell count={12} />
        </Variant>
      </Specimen>

      <Specimen name="ZoomControl" figma="Zoom Controls · 2009:9699" props="onZoomIn, onZoomOut, canZoomIn, canZoomOut">
        <Variant label="default" onMap>
          <ZoomControl />
        </Variant>
        <Variant label="max zoom" onMap>
          <ZoomControl canZoomIn={false} />
        </Variant>
      </Specimen>

      <Specimen name="MapPin" figma="— (from the screens)" props="label">
        <Variant label="default" onMap>
          <MapPin label="Rome" />
        </Variant>
      </Specimen>

      <Specimen name="ValueLabel" figma="Data Map Label · 2009:9669" props="value: number | null, unit" note="No data shows “—”, never “0”.">
        <Variant label="value" onMap>
          <ValueLabel value={9.1} unit="mm/h" />
        </Variant>
        <Variant label="no data" onMap>
          <ValueLabel value={null} unit="mm/h" />
        </Variant>
      </Specimen>

      <Specimen name="Logo" figma="Logo · 2011:10484" props="—">
        <Variant label="default" onMap>
          <Logo />
        </Variant>
      </Specimen>

      <h2 className={styles.part} id="big">
        Big components
      </h2>
      <BigSpecimens />
    </div>
  )
}

function Row({ time }: { time: (typeof times)[number] }) {
  const common = { time, label: dayLabel[time] }
  return (
    <>
      <span className={styles.caption}>{time}</span>
      <span>
        <DayChip {...common} />
      </span>
      <span>
        <DayChip {...common} hover />
      </span>
      {modes.map((mode) => (
        <span key={mode}>
          <DayChip {...common} selected mode={mode} />
        </span>
      ))}
      <span>
        <DayChip {...common} unavailable />
      </span>
    </>
  )
}

/** Hash routing owns location.hash, so in-page links scroll instead of navigating. */
function jump(e: React.MouseEvent<HTMLAnchorElement>) {
  e.preventDefault()
  document.getElementById(e.currentTarget.hash.slice(1))?.scrollIntoView({ behavior: 'smooth' })
}
