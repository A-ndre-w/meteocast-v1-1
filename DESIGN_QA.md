# MeteoCast v1.1 — Design QA

Revisione del prototipo in codice rispetto al file Figma (`WJoO8ONNwOiSGN9pbxBSyr`, pagina "🎨 Stile & Componenti") e agli export delle schermate in `assets/`.
Data: 19 ottobre 2026. Revisione fatta da chi ha scritto il codice, non ancora validata con utenti.

## Metodo

- **Frame di riferimento:** gli export sono a 4× (5760×3360) di un frame 1440×840. Tutte le misure sono in px di design (export ÷ 4).
- **Strumento:** pagina `/#/qa` (solo con `npm run dev`). Mette l'export Figma e il prototipo nello stesso frame 1440×840, in tre modalità:
  - *difference*: i pixel identici diventano neri, ogni scostamento si illumina;
  - *overlay*: Figma sopra il codice, con l'opacità regolabile;
  - *side*: affiancati.
  
  Con `#/qa?s=live&x=81&y=676&z=2.2` si ingrandisce una regione. Le misure precise sono lette dal DOM del prototipo e confrontate con le coordinate dell'export.
- **Scenari** (raggiungibili anche come deep link, per esempio `#/?s=archive`):

| Scenario | Export Figma | Note |
|---|---|---|
| `live` | Screen 01 / Live Data | |
| `archive` | Screen 01 / Archive Data | |
| `forecast` | Screen 01 / Forecast Data | |
| `snow` | Screen 02 / Screen 02 | |
| `switch` | Screen 02 / Auto switch to forecast | Regola 5, Toast con Undo |
| `missing` | Screen 03 / Missing data alert | Blocco + avviso. Vedi le differenze intenzionali |
| — | Screen 01 / Alerts | Fuori dalla v1: c'è solo la campanella, non funzionante |

## Differenze trovate e corrette

| # | Dove | Differenza | Correzione | Esito |
|---|---|---|---|---|
| 1 | Timebar, ritmo verticale | Riga 1 circa 10px più in alto; troppo spazio tra chip velocità e traccia; etichette delle ore 6px più in basso | Padding 22/20/23, gap riga 2 7px, traccia alta 10px, etichette a +2px | Badge 721,3 (Figma 720,7) · velocità 757,1 (756,7) · traccia 782,9 (782,6) · etichette 797,1 (797) |
| 2 | Timebar, ‹ ▶ › | Gruppo largo 82px invece di 62 | Chevron con area cliccabile da 24px (WCAG 2.5.8) che si sovrappone ai gap con margini negativi | Allineato |
| 3 | LayerItem | Alto 46px invece di 43 (interlinea 1.3 contro "normal" di Figma) | `line-height: 1.2` | 43 / 59px su una / due righe, come in Figma |
| 4 | ValueLabel sulla mappa | Ancorato al centro invece che all'angolo in alto a sinistra: circa 30px di scarto | Ancoraggio in alto a sinistra | Allineato |
| 5 | Livello dati | Macchie di pioggia più deboli di Figma; neve molto più intensa (in Figma è un velo) | Curva opacità/raggio rivista, intensità per famiglia di colore (pioggia 1 · neve 0,45) | Vicino. Le forme sono approssimate (vedi intenzionali) |
| 6 | Readout | Triangolo della scala 3px più in basso | `bottom: 1px` | Allineato |
| 7 | NotificationBell | Badge 1px più all'interno | `top/right: 5px` | Allineato |
| 8 | Cornice di modalità | Gli export Archive e Forecast hanno una cornice di 6px nel colore della modalità attorno allo schermo; il codice no | Cornice aggiunta, poi **rimossa** dopo la UX review (D7) su decisione del designer | Differenza intenzionale: vedi sotto |
| 9 | Timebar, livelli giornalieri | "Now" 40px troppo a destra: restava riservato lo spazio dell'ora | `min-width: 118px` solo in modalità giornaliera | 466px (Figma 465) |

Corretti durante lo sviluppo, prima di questa revisione:

| Dove | Problema | Correzione |
|---|---|---|
| Rail (segnalato dal designer) | Con finestre basse (circa 650px) il "+" usciva dalla barra | La lista dei gruppi scorre; il "+" resta sempre dentro. Alta 486px alla misura Figma |
| Toast del gemello (segnalato dal designer) | Andando in Archive diceva "switched to the Real time layer" | Prima corretto ("switched to Archive data"), poi rimosso con il pannello a voce unica (UX audit H1) |
| Mappa in Archive | Con il filtro di desaturazione le latitudini saltavano in alto | Il contenitore ha le dimensioni del frame (latitudini poi rimosse con la mappa di Trento) |
| SearchBar | Placeholder troncato ("…coordina") | Spaziature ridotte: il testo entra in 292px |
| LayerItem disabled | Tooltip tagliato dallo scroll del pannello; "Go to live" saltato dal Tab | Tooltip `position: fixed` con ponte per il mouse; nascosto solo con opacità, quindi resta nell'ordine del Tab |
| Livelli giornalieri | Un giornaliero solo real time era selezionabile in Forecast nella giornata di oggi | Oggi richiede anche la modalità; spostandosi su oggi l'ora va ad "adesso" |

## Differenze intenzionali (mantenute)

| Elemento | Figma | Codice | Motivo |
|---|---|---|---|
| Badge FORECAST, chip selezionato in Forecast, parola "Forecast" nei Toast | `#8D84FF` con testo bianco (3,05:1) | `mode/forecast-strong #655BDE` (5,1:1) | Contrasto WCAG AA (decisione condivisa). Striscia, bordi e tinte restano `#8D84FF` |
| "Back to live", "Undo", "Now" attivo, "Cast" nel logo | `#3B7EFF` (3,74:1 su bianco) | `accent/strong #2563D8` (5,4:1) | Contrasto AA |
| DayChip selezionato | Grigio neutro `#5B5B5B` | Colore della modalità (neutro in Live) | Regola 3 del brief (decisione condivisa) |
| Puntino LIVE | Verde | Grigio scuro, con pulsazione | Il verde è riservato agli allarmi. La pulsazione si ferma con `prefers-reduced-motion` |
| Striscia superiore della Timebar | 5px | 3px | Il brief indica 3px |
| Scala del Readout | Testo a 8px | 11px | Nessun testo sotto 11px |
| Mappa di base | `map.png` con le macchie di pioggia nell'immagine, centrata su Roma | Mappa vettoriale vera (MapLibre + OpenFreeMap) del Trentino – Veneto, senza dati, e livello dati separato | Regola 11: base e dati separati, nessun filtro sui dati. Area del prodotto originale per il prima / dopo del portfolio (vedi sotto). Le macchie sono approssimate e cambiano con il valore |
| Etichette dei giorni | "Wed 13, Wed 14, Thu 15…" | "Tue 13, Wed 14, Thu 15…" | Il 13 ottobre 2026 è un martedì: refuso in Figma |
| Intestazione Water & Storms | "16 LAYERS" (13 voci visibili) | "13 LAYERS" | Il conteggio riflette i livelli realmente presenti |
| Lightning | ".ast 60 min - 5min" | "last 60 min - 5min" | Refuso |
| Screen 03 | Hourly rainfall, Rail su Snow ma pannello Water & Storms | Lightning (senza archivio), Rail coerente | Nel modello dati Hourly rainfall ha l'archivio. Lightning è il caso reale di "solo Live o Forecast". La Rail di Figma è incoerente |
| Raggi | 10 e 20 | 10 e 20 (`radius/md`, `radius/lg`) | Valori di Figma, non quelli di riserva del brief (14/22) |
| Chip velocità | Nessuno stato selezionato | Quello attivo è evidenziato (`aria-pressed`) | Lo stato deve essere visibile e annunciato |

## Modifiche dopo la UX review (20 ottobre 2026)

Scostamenti da Figma introdotti di proposito dalle correzioni di [UX_REVIEW.md](UX_REVIEW.md):

| Elemento | Figma | Codice | Motivo |
|---|---|---|---|
| Pulsante della timebar | "Now" (46px) | "Back to live" | Un solo nome per l'azione (U4) |
| Gap della timebar | 20 / 16px | 12px | Spazio per "Back to live" |
| Padding dei DayChip | 12px | 11px | Spazio per "Back to live"; il chip selezionato non cambia più altezza |
| Altezze dei controlli | 23 · 26 · 30 · 38 · 45 | Scala 24 · 32 · 40 · 44 (`size/*`) | Coerenza e WCAG 2.5.8 (D1, A1) |
| Rail | 45px, pulsanti 38 | 50px, pulsanti 40 | Scala delle altezze |
| Chip velocità selezionato | Nessuno stato | Fondo `accent/soft`, bordo accent, come LayerItem | Un solo stile per le scelte (D2) |
| Ombra della ModePill | Nera al 25% | `shadow/md` | Tre livelli di elevazione (D3) |
| Valore del Readout | `text/tertiary` | `text/primary` | È il dato più importante (U3) |
| Etichette sulla mappa | "mm/h" | Unità del livello ("mm") | Coerenza con il Readout (U2) |
| Toast di avviso (Screen 03) | Sopra la timebar | Sotto la ModePill, come gli altri | Un solo punto per i messaggi (U7) |
| Etichette di latitudine | 40°, 35°, 30°, 25°N | Solo 25°N | Le altre finivano sotto la Rail (U14) |
| Pannello livelli | Sezioni Real time / Forecast, stesso dato due volte (13 voci) | Una voce per dato (7 voci in Water & Storms), con le icone delle modalità (`ModeAvailability`); nessuna voce bloccata | U1, decisione del designer: l'utente sceglie il dato, la timeline decide la modalità |
| Regola 7 | Livello real time in Forecast: Disabled con tooltip | Selezionabile: il tempo va a Live con Toast e Undo | Le voci bloccate scoraggiavano l'utente (decisione del designer) |
| Cornice di modalità attorno allo schermo | Presente in Archive e Forecast | Rimossa | D7: sei segnali erano troppi, e un bordo attorno allo schermo richiama gli allarmi |
| Badge LIVE | Testo terziario | Testo secondario, puntino scuro | Si leggeva come "spento" (U8) |

## Mappa di Trento (21 ottobre 2026)

Decisione del designer: per il prima / dopo del portfolio la mappa deve mostrare la stessa zona del prodotto MeteoCast originale. Roma è sostituita da Trento. **Le schermate Figma vanno aggiornate** con `design-notes/basemap-1440x840.png`; finché non lo sono, la pagina `/#/qa` confronta con gli export su Roma.

| Elemento | Prima (Roma) | Ora (Trento) | Nota |
|---|---|---|---|
| Mappa di base | SVG disegnata a mano | MapLibre con tile vettoriali OpenFreeMap (stile Positron), pan e zoom reali | Inquadratura ricavata dallo screenshot originale: centro 46,02° N, 12,01° E. Prima versione (stesso giorno): un'immagine statica di tile OpenStreetMap attenuate, scartata perché sembrava uno screenshot di OSM e lo zoom era solo un ingrandimento |
| Località | Rome, 41.90° N, 12.50° E | Trento, 46.07° N, 11.12° E | Stessi valori di Figma (4,2 mm adesso, 1,8 ieri, 6,5 domani) |
| Stazioni ed etichette | Tre punti senza nome | 88 stazioni reali, in tre livelli: puntino per tutte; valore solo dove piove, senza sovrapposizioni; nome e valore al passaggio del mouse | Nel prima / dopo il prodotto originale mostrava ~150 valori, il prototipo 3: sembrava avere meno dati. Ora ha la stessa rete ma con una gerarchia, al posto della griglia di "0" dell'originale (decisione del designer) |
| Campo di pioggia, neve, temperatura | Macchie disegnate a mano | Interpolato dalle stazioni (media pesata sulla distanza, potenza 3) e diviso in cinque classi nette, bordi appena più scuri | Prima versione: sfumatura continua dal 14% al 100% di blu, scartata perché sembrava una nebbia. Con le classi si legge subito dove piove e quanto. Sotto 0,4 mm la pioggia non è colorata, altrimenti l'interpolazione stende un velo ovunque |
| Classi | — | Cinque per famiglia di colore (`data/<rain, snow, temp, neutral>-1…5`), dal chiaro allo scuro. Pioggia 1 / 5 / 10 / 20 mm (5, 25, 50, 100% della scala); percentuali fino a 75 e 100; altre grandezze a passi uguali del 20% | Le precipitazioni sono sbilanciate verso i valori piccoli: le classi strette in basso le distinguono. Niente rosso, arancione o verde (allarmi) |
| Legenda del Readout | Sfumatura continua, tacche 0 / 10 / 20+ | Cinque segmenti con i colori delle classi, una tacca per limite (0, 1, 5, 10, 20+); indicatore scuro | Stessa legenda del campo e delle etichette |
| Etichette delle stazioni | Bianche | Riempite con il colore della loro classe; testo scuro sulle classi 1–3, bianco sulle 4–5 | Venti coppie aggiunte a `npm run contrast`, tutte AA |
| Valori delle stazioni | — | Celle di pioggia che si spostano ora per ora, scalate sul valore di Trento | La rete e il Readout sono sempre coerenti. Precipitazioni a chiazze (stazioni a 0); temperatura, vento e simili continui |
| Accessibilità delle stazioni | — | Puntini ed etichette nascosti ai lettori di schermo; elenco nascosto "… at nearby stations" con le stazioni che hanno un valore, dal più alto | Il valore al passaggio del mouse non è raggiungibile da tastiera: è un dettaglio in più, il dato principale resta nel Readout |
| Etichette di latitudine | Solo 25°N | Rimosse | Su una mappa reale sono superflue |
| Attribuzione | — | OpenFreeMap, © OpenMapTiles, © OpenStreetMap, in basso a destra, una riga ciascuno | Obbligatoria (ODbL e licenza OpenMapTiles). Su righe brevi entra nei 120px che la timebar lascia liberi sotto i 1328px |
| Finestre strette | La mappa restava centrata | Scorre a destra quanto serve perché il pin resti a 398px, finché l'utente non sposta la mappa | Trento è vicina al bordo sinistro: sotto i 1440px finiva sotto il pannello |
| Etichette e interfaccia | — | Un valore compare solo se è intero, dentro lo schermo e non coperto da pannello, Rail, Readout, timebar, ricerca, zoom | Un'etichetta mezza nascosta sotto un pannello sembrava un errore (segnalato dal designer a 1082×564) |
| Nome della località | Pin con etichetta | Il nome "Trento" della mappa di base è nascosto | Sotto il pin si leggeva "Tr⊙nto": il pin lo nomina già |
| Nomi delle città | — | Nascosti dove c'è un'etichetta di valore | Riquadri invisibili nella posizione delle etichette, sopra gli altri livelli: MapLibre non disegna i nomi che finirebbero sotto ("Belluno" sotto "22.7 mm") |
| Valori in traccia | Etichetta su una zona senza colore (0,2 mm) | Sotto il 40% del primo limite (0,4 mm) né colore né etichetta; il valore resta al passaggio del mouse | Etichetta e colore dicono sempre la stessa cosa |
| Mappa in Archive e Forecast | — | Uguale al Live | Decisione del designer: ModePill, Readout e Timebar danno già abbastanza segnali |
| Ricerca | Solo luoghi (non nel prototipo) | Invariata | La ricerca dei dati nella barra dei luoghi è stata provata e tolta (decisione del designer): due ricerche diverse nello stesso campo sono incoerenti |
| Frecce ‹ › ai bordi | Sempre attive, nessun effetto | Attenuate al primo e all'ultimo istante; un clic spiega dove finiscono i dati (UX audit H3) | Restano focalizzabili (`aria-disabled`), così il messaggio arriva anche da tastiera |
| Puntini delle stazioni | — | Anelli bianchi con bordo scuro | La base Positron ha già puntini neri per le città: le stazioni non devono confondersi con quelli |
| Campo dei dati | — | Sotto le etichette della mappa | I nomi dei luoghi restano leggibili sopra la pioggia |
| Zoom | Scala visiva 1×–2× | Zoom reale da 6,5 a 11 (la vista di partenza è 8); i pulsanti ingrandiscono attorno a Trento | Oltre l'11 la rete di stazioni è troppo rada per il campo |
| Mappa in Archive | Base desaturata | Nessun filtro | Base e dati sono nello stesso canvas e Positron è già quasi neutra; la modalità resta indicata da ModePill, Readout e Timebar |

Verifica: pin a 398px e attribuzione libera da timebar, zoom e link Components a 1440×840, 1280×720, 1024×700 e 1100×1000; axe senza violazioni in Live, Archive e cambio automatico.

## Stati e componenti aggiunti (non presenti in Figma)

Da riportare nel file Figma, così Figma resta la fonte di verità:
- **LayerItem `disabled`:** contorno tratteggiato, lucchetto, tooltip con il motivo e "Go to live".
- **DayChip `unavailable`:** trama a righe, testo barrato, comunque cliccabile per mostrare il motivo. Il puntino di "oggi" è nel chip.
- **Timebar:** marcatore NOW, ore senza dati tratteggiate, traccia piena (osservato) e tratteggiata (previsione) nella stessa giornata.
- **Readout:** stati `stale` ("Updated 12:20 · Data 40 min late") e `noData` ("—", mai "0").
- **Toast:** due toni (info con Undo, warning) con conto alla rovescia visibile di 6 secondi, che si mette in pausa al passaggio del mouse o al focus.
- **Modello gemelli:** livello real time e livello forecast con lo stesso `stream` sono un unico dato. Il Play non attraversa "adesso"; un gesto manuale sì, con Toast e Undo.
- **ModeAvailability** nel LayerItem: le icone di ModeBadge (archivio, live, previsione) sulla riga dei metadati; mancanti tenui, quella dell'istante selezionato piena nel colore della modalità. Ha sostituito una prima CoverageBar (mini-timeline), giudicata poco intuitiva (UX audit H12).
- **Icone archive e forecast ridisegnate** (2026-10-21): arco di raggio 8 centrato, apertura di 45°, punta della freccia sull'estremo dell'arco; forecast è lo specchio esatto di archive, con le stesse lancette. Valgono per ModeBadge, ModePill e ModeAvailability.
- **Tooltip della Rail** con il nome del gruppo, anche da tastiera; **data della timebar** come pulsante che porta ai giorni.
- **Toast "non incluso"** per ricerca, allarmi, localizzazione e preset.
- **Icone UI disegnate in codice:** termometro, onde, orologio, lucchetto. Quelle meteo vengono dal set Figma 32px.

## Limiti noti

- **Stati hover non verificati:** RailButton e LayerItem in hover non sono stati letti da Figma (limite di chiamate del piano Starter). Sono ricavati dagli screenshot e da stimare con il designer.
- **Larghezza minima 1100px:** il layout è progettato sul frame 1440×840; sotto i 1100px di larghezza non è progettato. Sulle finestre basse il pannello e la Rail scorrono.
- **Mappa online:** stile e tile arrivano da OpenFreeMap: senza rete la mappa resta vuota (il resto funziona).
- **Peso:** MapLibre porta il bundle a circa 390 kB compressi.
- **Ricerca, campanella, creazione preset:** solo pulsanti, come da brief.
- **Dati:** finti e deterministici (`scripts/build-data.mjs`). "Adesso" è fissato a giovedì 15 ottobre 2026, 13:00.
- **Pagina `/#/qa`:** funziona solo in sviluppo, perché gli export Figma (25 MB) non vengono pubblicati.
