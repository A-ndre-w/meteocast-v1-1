# MeteoCast — Note componenti da Figma

File: `WJoO8ONNwOiSGN9pbxBSyr`, pagina "🎨 Stile & Componenti" (2005:818), frame **Components Library** (2007:7332).
Letto il 2026-10-19. Budget chiamate MCP: 10. Non rileggere quanto già salvato qui.

Log chiamate:
1. get_metadata 2005:818 → struttura (sotto)
2. get_variable_defs 2005:818 → errore (canvas, nessuna selezione)
3. get_variable_defs 2007:7332 → `token.json`
4. get_design_context 2010:10063 (Timeline) → sotto

## Mappa nomi Figma → nomi del brief

| Figma (nome / nodo) | Varianti Figma | Nome nel brief |
|---|---|---|
| Rail Button 2007:7333 | Status=default/hover/selected/preset | RailButton (status: default/hover/selected/add) — in Figma "add" si chiama **preset** |
| Layer/Item 2007:7454 | Status=default/hover/selected | LayerItem (+ disabled, non presente in Figma) |
| Menu Section label 2008:9345 | Property 1=Default/Variant2/Variant3 | SectionLabel |
| Set header 2008:9539 | — | PresetHeader |
| Live view button 2008:9544 | Status=on/off | pulsante "Now" (+ chip velocità 1x/2x/4x riusano lo stesso nome) |
| Search bar 2008:9549 | — | SearchBar |
| center 2008:9590 | — | icona "localizza" dentro SearchBar |
| Alert Icon 2008:9632 | — | NotificationBell |
| Data Map Label 2009:9669 | — | ValueLabel |
| Zoom Controls 2009:9699 | — | ZoomControl |
| DayChip 2009:9943 | Status=default/hover/selected × Time=today/past/future | DayChip |
| Timebar/Daychip 2010:10046 | Property 1=Default/Variant2/Variant3 | **ModeBadge** (LIVE / ARCHIVE -24h / FORECAST +24h) |
| Daystrip 2010:10400 | — | DayStrip |
| Timeline 2010:10063 | Mode=live/forecast/archive/forecastdaily | **Timebar** |
| Layer Card 2014:15144 | Mode=live/archive/forecast × Data=rainfallhr/snow% | **Readout** |
| Map Pill 2024:15692 | Property 1=Default/Variant2 | **ModePill** |
| Panel 2036:19020 | Property 1=Layers/Variant2 | pannello livelli (contenitore) |
| Logo 2011:10484 | — | Logo |
| Alert Panel 2087:32857, Alert 2087:32511, Alert/Filters tag, Alert/Severity tag | — | fuori v1 |
| (manca) | — | **Toast**, **MapPin** — non sono componenti in Figma, solo nelle schermate |

Icone meteo 32px: `32/<Nome>` con Color=On/Off (già esportate in `/assets/32`).
Icone UI: Thermometer, Wave, Plus, Minus, mingcute:alert-fill.

## Timeline (= Timebar) — 2010:10063

Contenitore: `padding 20`, `radius 10`, bordo 1px + **bordo superiore 5px** (il brief dice 3px), larghezza 1127.
- live: bg `#FFFFFF`, bordo `border/default`
- archive: bg `bg/deep`, bordo `mode/archive`
- forecast / forecastdaily: bg `bg/forecast`, bordo `mode/forecast`

Riga 1 (gap 20): 
- Start: ‹ (4×8) · Play (cerchio 30, scuro) · › — gap 12
- ModeBadge ("Timebar/Daychip"): h 26, min-w 130, px 8, radius 10, bordo border/default, Geist Mono 12.
  - live: sfondo trasparente, puntino verde 6px + "LIVE" text/tertiary, larghezza 135
  - archive: bg mode/archive, icona storico 13px + "ARCHIVE -24h" bianco
  - forecast: bg mode/forecast, icona 12px + "FORECAST +24h" bianco
- Data/ora: "Thu 15 Oct" Geist 16 text/primary + "13:00" Geist 16 text/tertiary (ora nascosta in forecastdaily)
- Now (Live view button 43×23, radius 20, Geist Medium 12): status=off in live (bg surface/sunken, text/tertiary), status=on altrove (bg accent/default, testo accent/on)
- separatore verticale 15px
- Daystrip: ‹ + 8 DayChip (gap 4) + ›. DayChip: px 12 py 6, radius 10, bg surface/default, Geist 12 nero; passati/oggi bordo solido border/default; futuri bordo **tratteggiato** border/strong.
  - Nota: in Figma "Tue 20" ha bordo solido (probabile errore → futuro = tratteggiato).

Riga 2 (pt 10, gap 10):
- velocità 1x/2x/4x: pill bg surface/sunken, px 8 py 2, radius 20, Geist Medium 12 text/tertiary, gap 4
- "TIME INTERVAL:" (text/tertiary) / "1 HOUR"|"1 DAY" (text/primary), Geist Mono 11, larghezza 93
- Traccia (w 949, gap 20 dal label): 25 tick 2×5 surface/sunken; linea 2px
  - live: parte osservata piena text/tertiary fino al cursore, resto tratteggiato border/strong
  - archive: tutta piena (bordo text/tertiary)
  - forecast: tutta tratteggiata border/strong
  - cursore: cerchio 12px
- etichette 00 06 12 18 24, Geist Mono 11 text/tertiary
- forecastdaily: traccia nascosta.
- Nessun marcatore "NOW" in Figma → da aggiungere (regola 3 del brief).

## Layer Card (= Readout) — 2014:15144

Varianti: Mode=live/archive/forecast × Data=rainfallhr/snow%. Larghezza 307, bg bianco, bordo border/default, radius 10, padding 15/20, gap righe 25.
- Riga 1: pin + "Rome" (Geist 16 text/secondary) / coord "41.90° N, 12.50° E" (Geist 12 text/tertiary) · a destra ModeBadge (stesso componente "Timebar/Daychip")
- Riga 2: label layer Geist Mono 12 text/tertiary maiuscolo ("HOURLY RAINFALL") · valore Geist Bold 32 text/tertiary + unità Geist Regular 24 · a destra Geist Mono 12 text/secondary: "Updated 13:00" (live) oppure "Wed 14, 13:00" (archive/forecast)
- Riga 3: barra gradiente h ~12, radius 10: rain = accent/soft → accent/default; snow% = rgba(71,218,255,.14) → #47DAFF. Indicatore triangolo 16px sopra la barra. Scala 0 / 10 / 20+ (rain) o 0 / 50 / 100 (snow%) — **Geist Mono 8px in Figma: viola la regola "nessun testo sotto 11px" → portare a 11px.**
- Nota: nelle varianti snow% archive/forecast i livelli Figma sono disordinati ma il risultato visivo è identico alle rain.
- Mancano in Figma gli stati `stale` e `noData` → da progettare in codice.
- Valore in text/tertiary (#6B6765) su bianco: contrasto 5.6:1, OK AA.

## Panel (pannello livelli) — 2036:19020

Contenitore bianco, bordo border/default, radius 10, padding 10/16, gap 14, larghezza 249. Scrollbar custom 4px #D9D9D9 radius 20 (variante Layers).
- **Set header (= PresetHeader)**: h 44, px 13 py 7, gap 10. Cerchio icona 30px (bg accent/soft chiaro, icona 20px) + titolo Geist SemiBold 12 text/primary + riga Geist Mono 11 text/secondary "DEFAULT  16 LAYERS" (gap 10). Sotto: linea divisoria w 199.
- **Menu Section label (= SectionLabel)**: Geist Mono 12 text/secondary maiuscolo ("REAL TIME", "FORECAST").
- Lista: gap 11, larghezza 213.
- **Layer/Item (default)**: px 13 py 7, gap 10, sfondo bianco, bordo border/default, **radius 20**. Cerchio icona 30 (surface/sunken) + icona 20. Label Geist 12 text/primary; meta Geist 11 text/secondary ("mm - hourly").
- Refuso Figma: "Lightning — .ast 60 min - 5min" → "last 60 min - 5min".
- Gruppi:
  - Water & Storms (16 layers): REAL TIME = Hourly rainfall (mm-hourly), Accumulated rainfall per hour (mm-hourly), Accumulated precipitation in 24h (mm-daily), Rainfall rate (mm/h-5min), Lightning (last 60 min-5min), Hydrometric level (cm-hourly), Leaf wetness (h-hourly); FORECAST = Hourly rainfall, Accumulated rainfall per hour, Rainfall rate, Lightning, Hydrometric level, Leaf wetness. (13 voci visibili, header dice 16)
  - Snow (5 layers): REAL TIME = Snow on the ground (cm-hourly), Accumulated snow per hour (mm-hourly); FORECAST = Snow probability (%-daily), Accumulated snow (cm-daily), Accumulated snow (run) (cm-daily).
- Icone layer: rain (Drizzle), lightning (Sever-thunderstorm), drop (Humidity), snow (Snow).

## DayChip — 2009:9943

Props Figma: Status=default/hover/selected × Time=today/past/future. px 12 py 6, radius 10, bordo 1px.
- default: bg surface/default, testo Geist 12 nero; past/today bordo solido border/default; future bordo **tratteggiato** border/strong
- hover: bg surface/sunken, stessi bordi
- selected: bg **icon/default #5B5B5B** (grigio neutro, NON colore modalità), testo bianco **14px**; future selected mantiene il tratteggio
- Nessun puntino "oggi" e nessuno stato unavailable in Figma → da aggiungere (regole 3 e 8 del brief)
- Negli screenshot di schermata il chip selezionato appare #46413E-ish scuro anche in Forecast → il brief chiede "selezionato nel colore della modalità": discrepanza, vedi domande.

## Map Pill (= ModePill) — 2024:15692

Varianti: Default (archive), Variant2 (forecast). Nessuna variante live (coerente: nascosta in Live).
- bordo border/strong, radius 10, px 6 py 10, gap 12, min-w 135, drop-shadow 0 2 2 rgba(0,0,0,.25)
- bg: archive = bg/deep, forecast = bg/forecast
- contenuto: icona cerchio 24 (archive: cerchio mode/archive + icona storico bianca; forecast: cerchio mode/forecast + icona refresh bianca) · "Archive"/"Forecast" Geist 12 text/primary · "Wed 14 Oct, 13:00" Geist 12 text/primary · "24h ago"/"in 24h" Geist 12 text/secondary · "Back to live →" Geist 12 accent/default

## NON letti (limite Figma raggiunto alla chiamata 9) — ricavati dagli screenshot

- **Rail Button** (2007:7333) Status=default/hover/selected/preset: 38×38 cerchio; default = icona grigia su trasparente; selected = cerchio scuro (#46413E circa) con icona bianca e anello; preset (= "add") = "+" in cerchio con bordo tratteggiato. Hover: da stimare (surface/sunken).
- **Layer/Item** (2007:7454) Status=default/hover/selected: selected = bg accent/soft, bordo accent/default, cerchio icona accent/default con icona bianca. Hover: stimato bg surface/sunken.
- Search bar, Alert Icon, Zoom Controls, Data Map Label, Logo: dagli screenshot.
  - SearchBar: bianco, radius ~10, icona lente, placeholder "Search location, region, coordinate", separatore + icona "center" (localizza)
  - NotificationBell: quadrato bianco 45, campanella rossa (status/danger) + badge rosso con numero
  - ZoomControl: colonna bianca 42×76, + / divisore / −
  - ValueLabel ("Data Map Label"): box bianco bordo sottile, Geist Mono ~12 "9.1 mm/h"
  - MapPin: goccia accent/default con cerchio bianco + etichetta "Rome" in pill bianca sopra
  - Toast (info): bianco, icona "i" accent, testo con nome layer in bold e "Forecast" in mode/forecast, "↶ Undo" in accent, ×
  - Toast warning ("Missing data alert"): icona triangolo arancio, "Hourly rainfall is only available as Live or Forecast data." — posizionato sopra la timebar

## Log chiamate (aggiornato)
5. get_design_context 2014:15144 (Layer Card) ✔
6. get_design_context 2036:19020 (Panel) ✔
7. get_design_context 2009:9943 (DayChip) ✔
8. get_design_context 2024:15692 (Map Pill) ✔
9. get_design_context 2007:7333 (Rail Button) ✖ limite piano Starter
10. get_design_context 2007:7454 (Layer/Item) ✖ limite piano Starter
→ Nessun'altra chiamata Figma disponibile. Usare solo questi file + /assets.

## Decisioni confermate (2026-10-19)

1. **Nomi:** nel codice si usano i nomi del brief (Timebar, Readout, ModePill). Il nome Figma corrispondente è indicato nella pagina /components; il designer rinominerà i componenti in Figma.
2. **DayChip selezionato:** nel colore della modalità (Archive mode/archive, Forecast mode/forecast-strong). In Live usa un grigio scuro neutro (icon/default), mai verde.
3. **Contrasto AA:** nuovi token `mode/forecast-strong #655BDE` (bianco 5,2:1 · su bg/forecast 4,9:1) e `accent/strong #2563D8` (su bianco 5,4:1 · su bg/deep 4,6:1), usati solo per testo e fondi con testo. Strisce, bordi e tinte restano con mode/forecast #8D84FF e accent/default #3B7EFF.
4. **Screen 03 "Blocca e avvisa":** alcuni livelli real-time non hanno archivio (es. Lightning, Rainfall rate). Per loro i giorni e le ore passate sono "unavailable"; se l'utente prova ad andarci compare il Toast warning e il tempo non si sposta.

Altre scelte: "adesso" simulato = Thu 15 Oct 2026 13:00; i livelli a 5 minuti si muovono a passi di 5 minuti (dal 2026-10-24; prima di 1 ora); mappa = map.png più sovrapposizioni SVG per livello; font Geist via @fontsource; Vite `base: './'` con routing a hash; striscia della Timebar 3px (brief) invece di 5px (Figma); scala del Readout a 11px invece di 8px.

## Modello dati e comportamenti — decisioni (2026-10-19, prima del passo 5)

**Modello A + proposta del designer.**
- I livelli con lo stesso `stream` (campo esplicito in layers.json) sono un unico dato sulla timeline: per esempio Hourly rainfall in Real time e in Forecast. Disponibilità dei giorni e delle ore = unione dei gemelli.
- **Play (movimento automatico):** non attraversa mai "adesso". Gira in loop sulle ore disponibili del giorno visibile per il livello selezionato (oggi in Live/Archive: 00→13, poi di nuovo 00; in Forecast oggi: 14→23).
- **Gesti manuali = azione esplicita:** clic su giorno, clic o trascinamento sulla traccia, frecce, Shift+frecce, pulsanti ‹ ›. Possono attraversare "adesso". Se il livello non ha dati lì ma il gemello sì, la selezione passa al gemello. Aggiornamento del 2026-10-20: senza Toast, perché con il pannello a voce unica nulla salta e la modalità è già indicata (UX audit H1).
- Se né il livello né il gemello hanno dati (orizzonte superato, livello senza archivio): il tempo non si sposta e compare il Toast warning (Screen 03).
- "Now" e "Back to live" tornano a Live e, se serve, al gemello real time, senza Toast: l'intenzione è esplicita.

## Regole del design system dopo la UX review (2026-10-20)

- **Altezze dei controlli** (`size/*`): sm 24 (toggle piccoli e badge: velocità, Back to live, badge di modalità, azioni dei Toast) · md 32 (chip dei giorni, ‹ ▶ ›, zoom, localizza) · lg 40 (Rail) · xl 44 (ricerca, allarmi). Nessuna area cliccabile sotto i 24px.
- **Selezione, tre ruoli distinti:**
  - *scelta* (LayerItem, chip velocità): fondo `accent/soft`, bordo `accent/default`, testo `text/primary`;
  - *navigazione* (Rail): disco scuro `text/secondary`;
  - *tempo* (DayChip): colore della modalità, perché lì la modalità è il contenuto.
  - L'accent pieno (`accent/strong`) indica solo azioni: Back to live, Undo, link. Dal 2026-10-22 è il verde MeteoCast (#00A644, testo #00782F), prima era blu.
- **Elevazione:** `shadow/sm` per gli oggetti sulla mappa (etichette, pin, cursore della traccia), `shadow/md` per pannelli, card, timebar, pill e Toast, `shadow/lg` per gli overlay. Il pin usa un `drop-shadow` per la forma.
- **Forme:** pillola per i toggle piccoli (velocità, Back to live) e per la Rail; 10px per card, chip con testo e campi.
- **Tipografia:** pesi 400 / 500 (controlli) / 600 (titoli) / 700 (solo numeri display e logo). Mono solo per etichette maiuscole e dati tabellari (badge, etichette sulla mappa, intervallo); date e ore in sans.
- **Un nome, un formato:** l'azione è sempre "Back to live"; date assolute "Wed 14 Oct, 13:00"; distanza da adesso "−24h / +24h".

## Decisioni dopo aver provato il sito (2026-10-20)

- **Pannello livelli:** una voce per dato (stream), senza sezioni Real time / Forecast. Ogni voce mostra le icone delle modalità disponibili (ModeAvailability). Aggiornamento del 2026-10-21: sostituisce la CoverageBar, poco intuitiva (UX audit H12, scelta B).
- **Nessuna voce bloccata:** sostituisce la regola 7 del brief. Se si sceglie un dato senza valori nell'istante selezionato, il tempo va all'istante più vicino che li ha, con Toast e Undo. Per i dati solo previsione il testo è quello di Screen 02 (regola 5).
- **Segnali di modalità:** rimossa la cornice attorno allo schermo. Restano ModePill, tag del Readout, striscia + tinta + badge della Timebar (il badge è uscito dalla Timebar il 2026-10-24).
- SectionLabel resta nel design system ma non è più usato nella schermata.

## Decisioni del 2026-10-21

- **Mappa e località:** Roma sostituita da Trento, su una mappa reale OpenStreetMap (attenuata) dell'area del prodotto originale, per il prima / dopo del portfolio. Le note qui sopra ("Rome") descrivono il Figma letto il 2026-10-19; le schermate Figma vanno aggiornate con `basemap-1440x840.png`.
- **Mappa vera:** MapLibre con tile vettoriali chiare di OpenFreeMap (Positron), pan e zoom reali, stazioni e campo su coordinate geografiche. Sostituisce l'immagine statica OSM, che sembrava poco rifinita.
- **Logo (2026-10-24):** marchio di MeteoCast ridisegnato in vettoriale (LogoMark, viewBox 40×40: anello aperto a destra, archi radar al 70% e 40%) prima del wordmark, e come favicon. Da riportare in Figma nel componente Logo.
- **Card del punto e legenda (2026-10-23):** la Layer Card (Readout) diventa una card compatta ancorata al pin, con posizione automatica, aggancio sotto la legenda quando il pin esce dallo schermo, chiusura e quadratino di classe. La scala esce dalla card e diventa il componente Legend, fisso in alto a destra con titolo e unità. Le stazioni sono selezionabili (clic o tastiera); la selezione può essere vuota: chiudendo la card o cliccando la mappa lontano dalle stazioni spariscono card e pin. Nella card: valore e, a destra, "Updated … ago"; la data come riga di contesto accanto al nome del dato. Sulla timeline un'etichetta con giorno e ora segue il pallino mentre si muove. Le icone di modalità escono dal pannello (ModeAvailability resta in libreria, non usato) (lettura, validazione o corsa del modello); larghezza 248–320px, così i valori lunghi non escono. Da riportare in Figma: Layer Card compatta, Legend, pin senza etichetta quando la card è aperta.
- **Forecast petrolio (2026-10-22):** il viola stonava con l'accent verde. Forecast diventa petrolio: `mode/forecast` #4F98A5, `mode/forecast-strong` #1B6573, `bg/forecast` #F2F8F9. Di conseguenza la neve passa dal ciano a una scala lavanda (`data/snow-1…5` #EFECFA → #43337F).
- **Accent verde (2026-10-22):** torna il verde MeteoCast / RadarMeteo #00A644 come accent (testo e pulsanti pieni #00782F, AA). Il Live resta neutro. Gli allarmi usano solo giallo, arancione e rosso (modifica della regola del brief). "Now" sotto la traccia; tacche della timeline ridisegnate in un SVG allineato ai pixel.
- **Timebar compatta (concept A, 2026-10-22):** due righe. Riga 1: ‹ ▶ ›, pulsante velocità che cicla 1× → 2× → 4×, badge, data, Back to live, giorni. Riga 2: traccia a tutta larghezza, 00 e 24 alle estremità, tacche lunghe ogni 6 ore. Tolti i tre chip della velocità e "Time interval". 84px invece di circa 150.
- **Timebar in una riga (2026-10-24):** 52px. ▶ e velocità · ‹ giorno › con il giorno grande (16px semibold) che apre il calendario (DayChip in un popover; Esc o clic fuori per chiudere) · l'ora · la traccia delle 24 ore (NOW sopra, 00 06 12 18 24 sotto) · Back to live. Escono il badge di modalità, i ‹ › delle ore e la DayStrip. Da riportare in Figma: Timeline in una riga, popover del calendario.
- **Timeline, seconda passata (2026-10-24):** sotto l'ora la modalità in parole con lo scarto da adesso (mono 11, colore `--mode-text`, icona della modalità o il puntino del Live). L'ora è un campo di testo (16/600, 64 di larghezza) con ‹ › ai lati che scorrono se tenuti premuti. Tasti: ↑ ↓ e ← → un passo, Pagina su / giù un'ora, Maiusc + frecce un giorno.
- **Nowcast (2026-10-24):** `nowcast: { minutes: 120, stepMin: 5, source }` su rain-rate-fc e lightning-fc: nelle prime 2 ore dopo "adesso" la previsione va a 5 minuti, con la sua fonte; poi è oraria. `stepOf(layer, sel)` dipende dall'istante.
- **Grafico e tabella (2026-10-24):** SeriesPanel (src/components/SeriesPanel), dati da `stationSeries` in src/data/index.ts (ogni punto prende il livello del flusso che ha dati in quell'istante, quindi la serie attraversa "adesso"). I valori delle stazioni usano ora un fattore fisso per livello (`scaleOf`) e la pioggia è un evento centrato su adesso (`rainPulse`). Componenti nuovi anche TopMenu e MapTools; icone nuove chart, table, download, apps, user, help, sign-out, support, report, api, ruler, camera, basemap.
- **Allarmi (2026-10-24):** dati in src/data/alerts.ts (5 allarmi: dato, istante, stazione, emissione, scadenza). AlertPanel sotto la campanella, AlertCard per ogni allarme; regola `showInstant` per aprirne uno sulla mappa. Token nuovi: status/danger-strong · -soft, status/warning-strong · -soft, status/advisory · -strong · -soft (giallo). Icona nuova: settings. Lo stato letto / non letto vive solo nella sessione.
- **Preset (2026-10-24):** archivio in src/state/presets.ts (localStorage `meteocast.presets.v1`, dati non più esistenti scartati al caricamento). Un preset è un gruppo: `groupById` cerca nei gruppi e nei preset, e le regole tengono il preset selezionato quando un dato passa al gemello (`groupFor`). Componenti: PresetEditor (nuovo), PresetHeader con `onEdit` e "Custom", Rail con `presets` sotto un divisore. Icone nuove: edit, trash, check.
- **Fonte del dato (2026-10-24):** `source` in layers.json per ogni livello; la Legend la mostra come tag a destra del titolo. Dati osservati: i prodotti dell'originale (GisMeteotrigger, RadarCast) o la rete (stazioni, fulmini, boe, satellite). Previsioni: "ICON-2I", provvisorio finché il designer non conferma il modello vero.
- **Risoluzione per dato (2026-10-24):** `stepMin: 5` in layers.json per Rainfall rate, Lightning, raffiche e celle temporalesche; gli altri dati restano orari. Frecce, trascinamento e Play usano il passo del dato; i dati orari arrotondano all'ora (in avanti quando ci si muove in avanti). Le previsioni restano orarie. Play a 5 minuti: 24 fotogrammi, cioè 2 ore.
- **Data viz a classi:** cinque classi per famiglia di colore (token `data/<ramp>-1…5`), le stesse per campo, etichette e legenda del Readout. ValueLabel ha due prop nuove, `ramp` e `level`, per il riempimento di classe.
- **Rete di stazioni:** 88 stazioni con gerarchia (puntini per tutte, valori solo dove piove senza sovrapposizioni, nome e valore al passaggio del mouse) e campo interpolato dalle stazioni. Risponde al prima / dopo: l'originale mostrava tutte le stazioni, il prototipo solo 3–4 valori.

- **Play:** parte dal pallino (non più da mezzanotte) e avanza ora per ora per 24 ore, anche oltre "adesso" nella previsione; poi torna al punto di partenza. Per i dati giornalieri, un fotogramma al giorno finché ci sono dati. Cambiare dato o gruppo mette in pausa (H14).
- **H9, anteprima dei gruppi nella Rail:** provata e scartata lo stesso giorno: ingombrante e ridondante con il pannello livelli. Resta il tooltip col nome del gruppo (hover e focus).
- **Icone di modalità:** archive e forecast ridisegnate con geometria esatta (vedi DESIGN_QA).
- **H12, icone di modalità:** archivio, live e previsione sulla riga dei metadati di ogni voce; mancanti tenui, corrente piena nel colore della modalità.
- **H11:** layout fino a 1024 × 700 (giorni scorrevoli nella timebar, pill accanto al pannello sotto i 1280px).
- **H15:** SectionLabel e LayerItem "disabled" restano nella libreria con il badge "Not used in the screen".
