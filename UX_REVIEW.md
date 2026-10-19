# MeteoCast v1.1 — UX review

Revisione euristica del sito pubblicato (https://a-ndre-w.github.io/meteocast-v1-1/) a 1440×840, del 19 ottobre 2026. Metodo: euristiche di Nielsen, WCAG 2.2 AA, coerenza con il design system, misure lette dal DOM. Non sostituisce un test con utenti.

## Stato (20 ottobre 2026)

Il designer ha scelto di correggere tutti i gruppi; per U1 la correzione minima.

| Esito | Punti | Commit |
|---|---|---|
| Risolti | U2, U3, U4, U6 | `98aecb0` testi, unità, formati |
| Risolti | D1–D6, A1 | `c15ae4e` design system |
| Risolti | U5, U7, U8, U9, U10, U11, U13, U14, A2 | `1ada471` feedback e bug |
| Risolto (minimo) | U1: la sezione non disponibile si comprime, la selezione resta in vista | `f8b0f9c` |
| Parziale | U12: il Play descrive il suo loop (tooltip e descrizione ARIA); velocità e Play non sono stati raggruppati | `1ada471` |
| Aperto | D7: sei segnali di modalità, da decidere con il designer. U1 nella versione completa (una voce per dato) | — |

Verifiche dopo le correzioni: nessuna area cliccabile sotto i 24px, nessuna riga della timebar che sborda negli scenari Live, Archive e Switch, `npm run contrast` senza errori.

Gravità: **Alta** = blocca o porta a leggere male un dato · **Media** = rallenta o confonde · **Bassa** = rifinitura.

## Usabilità

| # | Gravità | Problema | Evidenza | Proposta |
|---|---|---|---|---|
| U1 | Alta | **Lo stesso dato compare due volte nel pannello.** "Hourly rainfall" esiste sia in Real time sia in Forecast: l'utente deve scegliere la modalità, il contrario del principio "il dato, non la modalità" | In Forecast le 7 voci real time sono bloccate in cima con il lucchetto e la voce selezionata finisce sotto la piega | Una voce per dato, con le modalità disponibili indicate (Archive · Live · Forecast). In alternativa minima: comprimere la sezione non disponibile e portare in vista la voce selezionata |
| U2 | Alta | **Unità diverse per lo stesso livello** | Readout "4.2 **mm**", etichette sulla mappa "9.1 **mm/h**" | Unità presa dal livello, uguale ovunque |
| U3 | Alta | **Il valore principale è l'elemento meno evidente del Readout** | Il numero grande è in `text/tertiary` #6B6765, più chiaro del nome del luogo | Valore in `text/primary`, unità in secondario |
| U4 | Alta | **Tre nomi per la stessa azione** | "Now" (Timebar), "Back to live" (ModePill), "Go to live" (tooltip) | Un'unica etichetta e un'unica icona, per esempio "Back to live" |
| U5 | Media | **Pulsanti senza risposta** | Ricerca (Invio), campanella e "+" non producono alcun feedback | Toast informativo "Not available in this prototype" oppure stato disabilitato visibile |
| U6 | Media | **Date e ore in quattro formati** | Timebar "Thu 15 Oct 13:00" · Readout "Thu 15, 14:00" (mono) · Pill "Thu 15 Oct, 14:00" · badge "-47h" contro pill "47h ago" | Un formato assoluto e uno relativo, uguali ovunque |
| U7 | Media | **Toast in due posizioni** | Info in alto, warning in basso | Una sola posizione, sotto la ModePill |
| U8 | Media | **Il badge LIVE sembra spento** | Il puntino grigio neutro (il verde è riservato agli allarmi) si legge come "inattivo" | Icona di segnale o pallino pieno scuro, con la pulsazione già presente |
| U9 | Media | **Falsa affordance:** l'icona calendario accanto alla data fa pensare a un selettore che non esiste | — | Togliere l'icona o rendere la data un pulsante che apre i giorni |
| U10 | Media | **La Rail ha solo icone:** i nomi dei gruppi compaiono solo nel tooltip nativo, lento e invisibile da tastiera | — | Tooltip proprio, visibile anche al focus |
| U11 | Media | **I giorni "unavailable" fanno troppo rumore:** righe, testo barrato e grigio insieme. Il barrato si legge come "annullato" | — | Solo testo terziario e trama leggera; il motivo nel tooltip o nel Toast |
| U12 | Bassa | **Velocità e Play poco chiari:** i chip 1x/2x/4x sono scollegati dal Play e non dicono su quale intervallo gira il loop | — | Raggruppare velocità e Play; tooltip sul Play: "Loop 00:00 → now" |
| U13 | Bassa | **Deep link ignorati** se cambia solo l'hash con la pagina già aperta (bug) | `#/?s=forecast` funziona solo al caricamento | Rileggere lo scenario a ogni `hashchange` |
| U14 | Bassa | **Le etichette di latitudine finiscono sotto la Rail** | "30°N" coperta a metà | Spostarle a destra della Rail o nasconderle sotto |

## Accessibilità

| # | Gravità | Problema | Evidenza | Proposta |
|---|---|---|---|---|
| A1 | Media | **Aree cliccabili sotto 24px** (WCAG 2.5.8) | Chip 1x/2x/4x 28×**20**; Now 46×**23**; frecce dei giorni **20**×30 | Minimo 24×24 (meglio 32): altezze dei controlli su scala |
| A2 | Bassa | **Nomi dei gruppi nella Rail solo in `title`** (vedi U10) | — | Tooltip con `aria-describedby` |

## Coerenza del design system

| # | Gravità | Problema | Evidenza (dal CSS) | Proposta |
|---|---|---|---|---|
| D1 | Media | **Nessuna scala per le altezze dei controlli** | Nella sola Timebar: 20 · 23 · 26 · 30 · 32px. Nel resto: 28, 38, 44, 45 | Token `size/sm 24 · md 32 · lg 44`, applicati a tutti i controlli |
| D2 | Media | **La selezione ha quattro aspetti diversi** e il blu fa due lavori | LayerItem blu · Rail grigio scuro · DayChip colore modalità · chip velocità grigio con bordo. Il blu è anche il colore delle azioni (Now, link) | Un solo trattamento "selected" per i controlli di scelta; blu riservato alle azioni. Il colore della modalità solo dove la modalità è il contenuto |
| D3 | Media | **Sei ombre diverse** | `shadow/md` più cinque ombre scritte a mano (ModePill nera al 25%, pin, thumb, label) | Tre livelli: `shadow/sm · md · lg` |
| D4 | Bassa | **Forme miste per controlli simili** | Chip dei giorni a 10px, chip velocità e Now a pillola (20px), ricerca a 10px | Pillola per i toggle piccoli, 10px per card e chip con testo, applicato con regola |
| D5 | Bassa | **Colori fuori dai token** | Tooltip #9DBBFF, scrollbar #D9D9D9, marker neve #1FB8E0, rampa temperatura, sfondo mappa | Aggiungerli a `token.json` |
| D6 | Bassa | **Quattro pesi del font** (400/500/600/700) e mono/sans usati senza regola: l'ora è mono nel Readout, sans nella Pill e nella Timebar | — | Scala 400/500/600. Mono solo per etichette e valori tabellari |
| D7 | Bassa | **Sei segnali di modalità contemporanei**: cornice dello schermo, striscia, tinta, badge della Timebar, badge del Readout, Pill | — | Valutare con il designer se la cornice dello schermo (aggiunta da Figma) è di troppo: il brief ne chiede tre |

## Cosa funziona

- La modalità non è mai comunicata solo dal colore; l'Undo ripristina davvero lo stato precedente.
- Le regole di blocco spiegano sempre il perché e non spostano il tempo all'insaputa dell'utente.
- Tastiera completa sulla timeline; contrasto del testo AA verificato in CI.
