# MeteoCast v1.1 — UX, accessibility and consistency audit

Audit of the published prototype (https://a-ndre-w.github.io/meteocast-v1-1/, commit `db2122f`) and the local dev build, 20 October 2026.
Expert review plus instrumented checks. **No users were involved**: the task metrics below are model estimates and baselines for a future test, not measured user performance.

**Methods**
- axe-core 4.14 (WCAG 2.0/2.1/2.2 A + AA and best practices) on four states: Live, Archive, auto-switch, missing data.
- The project's own WCAG contrast script.
- DOM measurements: tab order, target sizes, text sizes, layout overlaps at five viewport sizes.
- Interaction processing times on the production build (5 runs each).
- Flow walkthroughs, with step counts and Keystroke-Level Model (KLM) time estimates.

## 0. Status after the first fixes (same day)

Priorities 1 and 2 are done and re-measured on the dev build:

| Finding | Fix | Re-test |
|---|---|---|
| H4: timeline at Tab stop 39 | "Skip to timeline" and "Skip to layers" are the first two Tab stops, visible on focus | Timeline in 2 Tabs + Enter (was 39); layers in 3 (was 11). No single-letter shortcuts, because of WCAG 2.1.4 |
| H5: Label in Name (9 nodes) | Day chips: the name starts with the visible text ("Tue 13, Tuesday 13 October"). Date button: visible text as the name, the rest in `aria-describedby` | axe `label-content-name-mismatch`: 0 |
| H6: content outside landmarks | Screen wrapped in `<main>` | axe `region`: 0 |
| H7: slider pointer target 10 px | Invisible 24 px hit area on track and thumb; the drawing is unchanged | Pointer hits 7 px above and below the 10 px track, misses at 9 px |
| H1: toast fatigue | No toast when crossing "now" onto the twin layer | Fri 16 from Live: no toast. Rule 5 toast still shown |
| H2: Undo could discard later work | Any new action closes the previous toast and its Undo | Auto switch → Sat 17: toast gone. Undo right after the switch still restores Live |

**axe-core: 0 violations in all four states** (Live, Archive, auto switch, missing data). The tests ran with CSS transitions disabled, to avoid the background-tab artefact described below.

Still open after that round: H3, H8–H15.

**Second round (21 October 2026)**, designer decisions:

| Finding | Fix | Re-test |
|---|---|---|
| Play restarted at midnight (designer report) | Play starts at the cursor and runs 24 h forward, crossing "now" into the forecast, then returns to the start | From Thu 13:00: 13:00 Live → 14:00 … Fri 12:00 Forecast → back to 13:00 |
| H9: finding data across groups | Group preview on the rail (concept B) built, then **dropped** by the designer: bulky and redundant with the layer panel. The group name tooltip (hover and focus) stays | Open: search for data in the search bar (concept C) is the remaining option |
| H11: layout under 1280 px | Day chips scroll between the arrows; pill next to the panel without the date; min width 1024 | 0 overlaps and 0 off-screen elements at 1024×700, 1280×720, 1440×840 |
| H12: coverage bar not intuitive | Replaced by the mode icons used by the badges (concept B), on the meta line | Present / missing / current shown for every entry |
| H14: Play continued on data change | Changing data or group pauses Play | — |
| H15: unused library pieces | Kept, badged "Not used in the screen" on /#/components | — |

**Third round (22 October 2026):**

| Finding | Fix | Re-test |
|---|---|---|
| H3: silent no-op at the window edges | At Tue 13 00:00 and Tue 20 23:00 the ‹ › button on that side is drawn disabled (`aria-disabled`, still focusable). A step past the edge, by button or arrow key, shows a toast: "The Forecast ends Tue 20 Oct, 23:00" / "The Archive starts Tue 13 Oct, 00:00" | Both edges: time does not move, button dimmed, toast shown |
| H8: two announcements per arrow press | The page's live summary is `aria-live="off"` while focus is in the timeline: the slider (`aria-valuetext`) and the day chips announce the time themselves. Back to `polite` when focus leaves | One announcement per key press |
| H9: finding data across groups | Concept C (data in the location search bar) built and **dropped** by the designer the same day: mixing place search and data search in one field is incoherent | Designer decision: no further entry point. The group-name tooltip on the Rail stays; H9 stays open and is declared in the case study |

Still open: H9 (accepted, see above), H10 (touch, out of the desktop scope) and H13 (to validate in testing).

Archive and forecast icons redrawn with exact geometry after designer feedback (they were hand-drawn and crooked); verified numerically (centred r = 8 arc, mirrored arrows, identical hands).

axe-core after the second round: 0 violations. Still open: H3, H8, H9 (search), H10, H13.

## 1. Scorecard (before the fixes)

| Area | Metric | Result | Benchmark | Verdict |
|---|---|---|---|---|
| Accessibility | axe violations, serious | **1 rule, 9 nodes** (`label-content-name-mismatch`) | 0 | ✗ |
| | axe violations, moderate | 1 rule, 8–11 nodes (`region`) | 0 | ✗ |
| | Text contrast (20 pairs actually used) | 20 / 20 ≥ 4.5:1 | WCAG 1.4.3 AA | ✓ |
| | Smallest text | 11 px, 0 elements below | Brief: ≥ 11 px | ✓ |
| | Pointer targets ≥ 24 px | 39 / 40. The slider track is **10 px** tall, its thumb 14 px | WCAG 2.5.8 AA | ✗ (1) |
| | Visible focus on keyboard Tab | 40 / 40 (search shows it on its container) | WCAG 2.4.7 | ✓ |
| | Tab stops before the timeline slider | **39 of 40** | ≤ ~10, or a bypass (WCAG 2.4.1) | ✗ |
| | Controls reachable by keyboard | 100 % | 100 % | ✓ |
| Performance | Interaction processing (median / max) | 15–27 ms / 37 ms | INP "good" ≤ 200 ms | ✓ |
| | Transfer on first load | 169 KB in 6 requests (JS 108 · fonts 52 · CSS 7) | Well under the typical page weight (~2 MB) | ✓ |
| | Layout shift (CLS) | 0 | ≤ 0.1 | ✓ |
| | LCP / FCP | Not captured (the test browser was in background, so no paint entries) | ≤ 2.5 s | Run Lighthouse |
| Consistency | Colour / type / shadow declarations on tokens | 100 % / 100 % / 100 % | 100 % | ✓ |
| | Radius on tokens | 89 % (5 raw: 1–2 px micro-geometry, scrollbar) | 100 % | ~ |
| | Control heights on the `size/*` scale | 100 % of interactive controls (the 25 raw heights are drawing geometry) | 100 % | ✓ |
| Robustness | 1440×840 · 1366×768 | No overlaps, no overflow | — | ✓ |
| | 1280×720 | Timebar row overflows 8 px; the "Components" link overlaps the timebar | — | ~ |
| | 1024×700 | Timebar row overflows **188 px**; zoom control **off-screen** (clipped, no scrollbar) | — | ✗ |
| | Reflow at 320 CSS px (≈ 400 % zoom) | Not supported (fixed desktop layout, min 1100 px) | WCAG 1.4.10 AA | ✗ (known scope) |

The automated scan also reported a contrast failure (white on white) on the selected day chip and "Back to live". This turned out to be a **test artefact**: in a background tab the browser freezes CSS transitions. With transitions disabled there are 0 contrast violations. It is not a product defect.

## 2. Common flows

KLM operators: M (think) 1.35 s · P (point) 1.1 s · B (click) 0.1 s · K (key) 0.2 s. The estimates are for an expert user and ignore system time, which here is under 40 ms.

| # | Task | Steps, pointer | KLM est. | Keyboard only | Outcome | Smooth? |
|---|---|---|---|---|---|---|
| F1 | "How much is it raining in Trento now?" | 0 (Readout shows it on load) | 1.4 s | 0 | 4.2 mm, "Updated 13:00" | ✓ Immediate |
| F2 | Same hour yesterday | 1 (Wed 14) | 2.6 s | 28 Tabs + Enter | Archive, 1.8 mm, three mode cues change | ✓ |
| F3 | Tomorrow at 18:00 | 2 (Fri 16, then the track at 18) | 3.8 s | 39 Tabs + Shift+→ + 5 × → (45 keys) | Forecast 10.2 mm. **A toast fires** ("switched to Forecast data") | ~ Toast is noise (§3, H1) |
| F4 | Snow probability on Saturday | 3 (rail Snow, Snow probability, Sat 17) | 6.3 s | 3 Tabs + Enter, 10 Tabs + Enter, ~19 Tabs + Enter (≈ 35 keys) | Auto switch to Fri 16, then Sat 17. Toast with Undo | ✓ Rule 5 works. Finding "Snow" relies on the icon or a hover (H9) |
| F5 | Back to live | 1 (pill or timebar) | 2.6 s | 26 Tabs + Enter (no shortcut) | Live, previous data stream kept | ✓ Two entry points, same label |
| F6 | Animate today's rain | 1 (Play) | 2.6 s | 23 Tabs + Enter | Loops 00 → 13 and never passes now | ✓ |
| F7 | Undo an unwanted auto switch | 1 (Undo) within 6 s (pauses on hover) | 2.6 s | Tab to toast + Enter | Previous view restored, including Archive | ✓ inside the window; after 6 s it takes 2–3 manual steps |
| F8 | Find a layer in an unknown group (e.g. "Wind gusts") | Up to 8 hovers + 1–2 clicks | 10–14 s | Up to 8 Tabs (tooltip on focus) | Works, but by trial | ✗ No layer search, icon-only rail (H9) |

**Verdict on navigation.** The pointer flows are short (0–3 clicks for every core task) and fast (< 40 ms processing). The single-timeline model holds: the user picks a day or an hour and the mode follows, with no dead ends. Two things break the smoothness:
- **Repeated toasts** when moving into the future (H1).
- **Very long keyboard paths**: every timeline task starts 22–39 Tabs away (H4).

## 3. Findings

Severity: **High** = blocks a user group or misleads about data · **Medium** = slows or confuses · **Low** = polish.

| # | Sev. | Finding | Evidence | Recommendation |
|---|---|---|---|---|
| H1 | Medium | **Toast fatigue.** Crossing "now" by hand with a data stream that has a forecast twin fires "switched to Forecast data" every time | F3, E1: it appears on every move to Fri–Tue. The new panel shows one entry per data stream, so nothing jumps any more, and the mode is already signalled five ways | Drop the twin toast. Keep toasts for real surprises: auto switch (rule 5), moved to Live, blocked |
| H2 | Medium | **Undo can throw away later work.** Undo returns to the view before the switch, even after the user has moved on | E3: auto switch to Fri 16 → user picks Sat 17 → Undo goes back to Live / Snow on the ground, and Sat 17 is lost | Close the toast (and its Undo) at the next manual move, or label it "Undo switch" and keep later navigation |
| H3 | Low | **Silent no-op at the window edges.** → at Tue 20 23:00, or ← at Tue 13 00:00, does nothing | E1: no feedback; the ‹ › hour buttons stay enabled | Disable the step buttons at the edges and announce "Forecast ends Tue 20" |
| H4 | High (keyboard users) | **The timeline sits at the end of the tab order** | Slider is stop 39 of 40, first day chip 27; no skip link, no shortcuts | Add skip links ("Skip to timeline", "Skip to layers") and documented shortcuts, e.g. `T` timeline, `L` layers, `N` back to live |
| H5 | Medium | **Label in Name (WCAG 2.5.3).** The accessible name doesn't contain the visible text | Day chips: "Tue 13" shown, "Tuesday 13 October" announced. The date button: "Choose a day. Showing…". 9 nodes | Start the name with the visible text ("Tue 13, Tuesday 13 October, today") or move the extra into `aria-describedby` |
| H6 | Low | **Content outside landmarks** | Map value labels, pin, toast, logo, components link | Wrap the screen in `<main>`, the map in a labelled region, and the logo, search and alerts in `<header>` |
| H7 | Medium | **The slider's pointer target is 10 px tall** | Track 10 px, thumb 14 px | Give the track a transparent 24 px hit area; the drawing can stay 2 px |
| H8 | Low | **Verbose screen reader output.** Each arrow press announces the slider's value *and* the `aria-live` summary | Two announcements per keystroke | Don't fire the live region while the slider has focus, or debounce it to 500 ms |
| H9 | Medium | **Low discoverability of data across groups.** Rail is icon-only; no way to search layers | F8: up to 8 hovers to find "Wind gusts" | Let the search bar match layer names, or expand the rail with labels on demand |
| H10 | Low | **Hover-only information** on touch screens | Rail names, Play hint, coverage legend (`title`) | Out of the v1 desktop scope; note it for tablets in the field |
| H11 | Medium | **Below 1280 px the layout breaks** | 1024×700: timebar overflows 188 px, zoom off-screen. 1280×720: 8 px overflow and a link overlap | Let the DayStrip scroll, or show fewer days, under 1280 px. Drop `overflow: hidden` on the screen, or move the zoom inside the safe area. 1366×768 is fine |
| H12 | Medium | **The coverage bar is a new visual language with no legend** | Meaning only in a `title` tooltip | Add a one-line legend under the panel header ("━ archive · ● live · ┅ forecast"), or show it once on first use |
| H13 | Low | **"Idle" entries are subtle.** Users may not expect that picking one moves time | Only secondary text colour marks them | Fine with the toast and Undo; validate in testing |
| H14 | Low | **Play continues when the data changes,** and the loop silently switches from hours to days | E4 | Pause Play when the data stream changes |
| H15 | Low | **Drift between design system and screen** | SectionLabel and LayerItem `disabled` exist in the library but are unused since the panel redesign | Mark them deprecated in Figma and in `/components`, or remove them |

## 4. Edge cases

| Case | Current behaviour | OK? |
|---|---|---|
| Moving within today across 13:00 | Mode switches Archive ↔ Live ↔ Forecast on the exact hour | ✓ |
| Daily layer selected "today" | Snaps to now; a live-only daily layer can't be shown at a forecast hour of today | ✓ |
| Data stream with no archive (Lightning) in Archive | Entry marked idle; picking it moves to Live with toast and Undo | ✓ |
| Real-time-only data stream in Forecast | Entry idle; picking it moves to Live with toast and Undo | ✓ |
| Forecast-only data stream in Live | First forecast instant, Screen 02 copy, Undo | ✓ |
| Day beyond the forecast horizon (Snow probability, Mon 19) | Chip hatched; clicking warns "Data reaches Sun 18 Oct"; time stays | ✓ |
| End of the 8-day window (→ at Tue 20 23:00) | Nothing happens, no feedback | ✗ H3 |
| No data at an hour (Leaf wetness, now) | Readout "—", "No data for this hour", data layer hidden on the map | ✓ |
| Late live data (Hydrometric level) | "Updated 12:20" + "Data 40 min late" | ✓ |
| Undo after the 6 s timeout | Gone; recovery takes 2–3 manual steps | ~ |
| Undo after further navigation | Discards that navigation | ✗ H2 |
| Several toasts in quick succession | Only the latest is shown; its timer restarts | ✓ |
| Play, then picking another data stream | Keeps playing, loop scope may change (hours → days) | ~ H14 |
| Deep link with an unknown scenario (`#/?s=foo`) | Ignored, default view | ✓ |
| Deep link changed on an open page | Applied | ✓ |
| Inert features (search, locate; presets and alerts until 2026-10-24) | "… is not part of this prototype yet" | ✓ |
| Short window (650 px tall) | Rail and panel scroll; "+" stays inside | ✓ |
| Narrow window (< 1280 px) | Overflow and clipping | ✗ H11 |
| `prefers-reduced-motion` | Transitions and the LIVE pulse are off; Play still steps (content change, user-started) | ✓ |
| Colour vision deficiency | Mode is never colour-only (word + icon + position); archive brown and forecast violet also differ in lightness | ✓ |
| Touch devices | Pointer drag on the track works (`touch-action: none`); tooltips don't | ~ H10 |

## 5. Benchmarks for the first usability test

These aren't measured yet. They are targets to compare MeteoCast against, with 5–8 participants per persona (grid operators, fire services, water consortia):

| Measure | Target | Source of the benchmark |
|---|---|---|
| Task success, F1–F7 | ≥ 78 % per task (average across studies) | Sauro & Lewis, *Quantifying the User Experience* |
| Single Ease Question (SEQ, 1–7) | ≥ 5.5 per task (the average) | Sauro |
| System Usability Scale (SUS) | ≥ 68 = average, ≥ 80 = top quartile | Brooke; Bangor et al. |
| Time on task | Within 2× the KLM estimates above (expert → novice) | KLM (Card, Moran & Newell) |
| "Which data am I looking at: past, live or forecast?" | 100 % correct within 3 s after each switch | Product principle: the mode must never be misread |
| Unwanted auto switches undone | Track counts; > 20 % means the auto switch is too eager | — |

## 6. Suggested order of work

1. **H4 + H5 + H7** — keyboard and voice access to the timeline (skip links and shortcuts, Label in Name, 24 px hit area).
2. **H1 + H2** — toast hygiene: drop the twin toast; make Undo safe.
3. **H11** — layout down to 1024 px.
4. **H12 + H9** — coverage legend; layer search in the search bar.
5. **H3, H6, H8, H14, H15** — polish.
