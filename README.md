# MeteoCast v1.1

Prototipo in codice di **MeteoCast**, una piattaforma WebGIS meteo per professionisti che devono decidere in fretta: operatori della rete elettrica, vigili del fuoco, consorzi idrici.

> **v1.1 è un'iterazione individuale** di un progetto nato in team. Non è ancora stata testata con utenti.

**Decisione chiave:** una sola timeline per dati storici (*Archive*), in tempo reale (*Live*) e previsionali (*Forecast*). L'utente pensa al dato, non alla modalità: la modalità dipende dall'istante scelto. È *Live* solo esattamente "adesso", prima è *Archive*, dopo è *Forecast*.

Il prototipo è costruito come lo farebbe uno sviluppatore che riceve la consegna dal designer: token e componenti ricavati dal Design System Figma, stessi nomi, varianti Figma trasformate in props.

## Da provare

| Link (dopo la pubblicazione) | Cosa mostra |
|---|---|
| `…/#/` | La schermata, in Live |
| `…/#/?s=archive` · `?s=forecast` | La stessa schermata in Archive o in Forecast |
| `…/#/?s=switch` | Cambio automatico a Forecast con Toast e Undo (Screen 02) |
| `…/#/?s=missing` | Livello senza archivio: blocco con avviso (Screen 03) |
| `…/#/components` | Tutti i componenti in tutte le varianti (Storybook leggero) |

Un percorso di prova:
1. In Live, apri il gruppo **Snow** dalla barra laterale.
2. Clicca **Snow probability**: il tempo salta a venerdì, compare il Toast. Prova **Undo**.
3. Clicca **Mon 19**: oltre l'orizzonte della previsione, il tempo non si sposta e compare un avviso.
4. Torna con **Back to live**, apri **Water & Storms** (resta selezionato *Hourly rainfall*) e premi **▶**: l'animazione parte da adesso, mostra le 24 ore successive di previsione e ricomincia.
5. Da tastiera: il primo **Tab** mostra "Skip to timeline". Con **Invio** il focus va sulla traccia: **←/→** sposta di un'ora, **Shift + ←/→** di un giorno.

## Avvio in locale

Serve Node.js 22 o superiore (sviluppato con Node 24).

```bash
npm install
```

```bash
npm run dev
```

Poi apri http://localhost:5173. In sviluppo c'è anche `/#/qa`, il confronto con gli export Figma (vedi [DESIGN_QA.md](DESIGN_QA.md)).

| Script | Cosa fa |
|---|---|
| `npm run dev` | Server di sviluppo (rigenera prima i token) |
| `npm run build` | Token, controllo dei tipi, build in `dist/` |
| `npm run preview` | Serve la build di produzione |
| `npm run tokens` | `design-notes/token.json` → `src/styles/tokens.css` |
| `npm run contrast` | Verifica WCAG AA di ogni coppia testo/sfondo usata; fallisce sotto soglia |
| `npm run data` | Rigenera i dati finti (`src/data/series.json`) |
| `npm run icons` | Estrae le icone meteo dagli export Figma (`assets/32`) |

## Pubblicazione su GitHub Pages

Il progetto è già configurato:
- in [vite.config.ts](vite.config.ts), `base: './'` con routing a hash: funziona sotto qualunque nome di repository, senza configurazioni;
- in [.github/workflows/deploy.yml](.github/workflows/deploy.yml), la GitHub Action fa build e pubblicazione a ogni push su `main`, e controlla il contrasto prima della build.

Passi, una volta sola:

1. Crea un repository vuoto su GitHub, per esempio `meteocast-v1-1`.
2. Il branch locale è già `main`, quello su cui si avvia l'Action.
3. Collega il repository (sostituisci `<utente>`) e fai il push.

```bash
git remote add origin https://github.com/<utente>/meteocast-v1-1.git
```

```bash
git push -u origin main
```

4. Su GitHub: **Settings → Pages → Build and deployment → Source: GitHub Actions**.
5. Apri la scheda **Actions** e attendi che "Deploy to GitHub Pages" diventi verde. Il sito sarà su `https://<utente>.github.io/meteocast-v1-1/`.

Da quel momento ogni push su `main` ripubblica il sito. Per ripubblicare senza modifiche: **Actions → Deploy to GitHub Pages → Run workflow**.

## Dal Design System Figma al codice

Fonte: file Figma *UXChallenge_RadarMeteo*, pagina "🎨 Stile & Componenti". Le variabili e la struttura lette da Figma sono salvate in [design-notes/](design-notes/): [token.json](design-notes/token.json) e [componenti.md](design-notes/componenti.md), con le decisioni prese con il designer.

| Figma | Codice | Props (varianti Figma → props) |
|---|---|---|
| Rail Button | `RailButton` | `status: default \| hover \| selected \| add` (Figma: *preset*), `icon`, `label` |
| Layer/Item | `LayerItem` | `status: default \| hover \| selected \| disabled`, `icon`, `label`, `meta`, `availability`, `idle` |
| — | `ModeAvailability` | `modes`, `current` — icone Archive · Live · Forecast di un dato, la modalità corrente evidenziata |
| Menu Section label | `SectionLabel` | `children` |
| Set header | `PresetHeader` | `icon`, `title`, `preset`, `layerCount` |
| Live view button | `LiveViewButton` | `status: on \| off` — il pulsante "Now" |
| Timebar/Daychip | `ModeBadge` | `mode`, `offset` |
| DayChip | `DayChip` | `time: past \| today \| future`, `selected`, `unavailable`, `mode` |
| Daystrip | `DayStrip` | `days`, `selectedDay`, `mode` |
| Timeline | `Timebar` | `mode`, `selectedDay`, `selectedHour`, `interval: hour \| day` |
| Layer Card | `Readout` | `mode`, `location`, `coords`, `layer`, `value`, `unit`, `time`, `state: updated \| stale \| noData` |
| Map Pill | `ModePill` | `mode`, `time`, `relative` |
| — | `Toast` | `mode`, `tone`, `message`, `onUndo` |
| Search bar · Alert Icon · Zoom Controls · Data Map Label | `SearchBar` · `NotificationBell` · `ZoomControl` · `ValueLabel` | |
| Panel · Logo | `LayerPanel` · `Logo` | |
| — | `MapPin`, `Rail`, `MapView` | Componenti di schermata |

Per tre componenti il codice usa i nomi del brief (Timebar, Readout, ModePill) invece di quelli di Figma (Timeline, Layer Card, Map Pill). La corrispondenza è indicata nella pagina `/#/components`.

## Regole di comportamento

Tutte le regole sono funzioni pure in [src/state/rules.ts](src/state/rules.ts): (vista, intenzione) → (nuova vista, avviso).

1. **Modalità dall'istante:** Live solo a "adesso", prima Archive, dopo Forecast, anche dentro la giornata di oggi.
2. **Modalità sempre con testo, icona e colore:** ModePill in alto (nascosta in Live), tag nel Readout, striscia di 3px, tinta e badge della Timebar. Rosso, arancione e verde restano agli allarmi.
3. **Traccia:** piena per il dato osservato, tratteggiata per la previsione, marcatore NOW su oggi. Chip: passati pieni, oggi con puntino, futuri tratteggiati, selezionato nel colore della modalità.
4. **Now:** disattivato in Live, in evidenza in Archive e Forecast.
5. **Cambio automatico:** un livello solo previsione scelto in Live o Archive porta al primo istante di previsione. Il Toast offre Undo, che ripristina lo stato precedente anche se era Archive, e sparisce dopo 6 secondi (in pausa con hover o focus).
6. **Livelli giornalieri:** intervallo "1 DAY", la traccia delle ore si nasconde.
7. **Cambio inverso (rivisto dopo la UX review):** nessun livello è bloccato. Il pannello ha una voce per dato, con le icone delle modalità in cui esistono dati. Se si sceglie un dato senza valori nell'istante selezionato (per esempio un dato real time in Forecast), il tempo va all'istante più vicino che li ha, con Toast e Undo. La versione originale del brief disattivava il livello.
8. **Disponibilità:** ogni livello dichiara modalità, intervallo e orizzonte ([src/data/layers.json](src/data/layers.json)). I giorni fuori portata sono "unavailable".
9. **Readout:** "Updated HH:MM" in Live, "stale" con il ritardo esplicito, "noData" con "—" (mai "0").
10. **Selezione:** singola; la barra laterale cambia gruppo di livelli senza spostare il tempo.
11. **Mappa:** base e livello dati separati, nessun filtro sui dati. In Archive si desatura solo la base.

In più, decisi con il designer durante lo sviluppo:
- **Livelli gemelli:** real time e forecast con lo stesso `stream` sono un unico dato e una sola voce del pannello. Un gesto manuale può attraversare "adesso" senza avvisi: la modalità è già indicata da pill, Readout e timebar. Il Play parte dal punto selezionato e avanza per 24 ore (anche oltre "adesso", nella previsione), poi torna al punto di partenza.
- **Toast e Undo:** ogni nuova azione chiude il Toast precedente, quindi l'Undo è disponibile solo finché non è successo altro e non può cancellare navigazione fatta dopo.
- **Screen 03:** se né il livello né il gemello hanno dati, il tempo non si sposta e compare un avviso.

## Accessibilità

- Tastiera: gli skip link "Skip to timeline" e "Skip to layers" sono i primi due tab stop, quindi la timeline è a 2 Tab + Invio. Sulla traccia (slider ARIA) **←/→** = ore, **Shift + ←/→** o **PagUp/PagDown** = giorni, **Home/End** = 00/23. Le frecce funzionano anche sui chip dei giorni. Niente scorciatoie da una sola lettera (WCAG 2.1.4).
- Focus visibile ovunque, con un unico stile. Sulla Rail, hover o focus su un gruppo mostra l'anteprima dei suoi dati: **→** entra nell'elenco, **↑/↓** scorre, **Invio** sceglie, **←/Esc** torna al gruppo.
- Controllo vocale: ogni nome accessibile inizia con il testo visibile (WCAG 2.5.3), per esempio il chip "Tue 13" si chiama "Tue 13, Tuesday 13 October".
- Aree cliccabili di almeno 24px, compresa la traccia della timeline (disegnata a 2px, cliccabile su 24px).
- axe-core 4.14 senza violazioni (WCAG 2.2 AA e best practice) negli stati Live, Archive, cambio automatico e dato mancante.
- `aria-label` su tutti i pulsanti con sola icona. Gli stati sono esposti con `aria-pressed`, `aria-disabled` e `aria-valuetext` ("Thursday 15 October, 13:00 — Live"). Una regione `aria-live` annuncia livello, ora e modalità.
- Contrasto WCAG AA verificato da script. Due token aggiunti per il testo (`accent/strong`, `mode/forecast-strong`).
- Nessun testo sotto gli 11px. `prefers-reduced-motion` è rispettato.

## Struttura

```
design-notes/        token.json, componenti.md (lettura Figma + decisioni)
assets/              export Figma (schermate 4×, icone 32px, map.png originale)
public/basemap.svg   mappa di base senza dati
scripts/             token, icone, dati finti, controllo contrasto
src/components/      un componente per cartella (TSX + CSS Module)
src/data/            layers.json, series.json, accesso ai dati
src/state/           rules.ts (regole), useMeteo.ts (stato), scenarios.ts (deep link)
src/pages/           MapScreen, ComponentsPage, QaPage (solo dev)
src/styles/          tokens.css (generato), global.css
```

Stack: React + Vite + TypeScript, CSS Modules e custom properties. Nessuna libreria UI. Font Geist e Geist Mono.

## Limiti noti

Dati finti, con "adesso" fissato a giovedì 15 ottobre 2026 alle 13:00. Pannello allarmi, ricerca e creazione dei preset sono solo pulsanti. Il layout è progettato per desktop (da 1100px di larghezza). L'elenco completo, con le differenze rispetto a Figma, è in [DESIGN_QA.md](DESIGN_QA.md).
