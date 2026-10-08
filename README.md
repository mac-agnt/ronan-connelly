# Pulse — Harbour

React build of the **Pulse v5 Harbour** design from Claude Design, the operations dashboard mocked up for Kilbride Group.

Every page, theme and interaction from the design is here. Screens were checked against the original mockup and match pixel for pixel at 1440×900 and 1024×720.

## Run it

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # type-check + production build into dist/
```

## What's in it

| Area | Where |
| --- | --- |
| Pages: Home (Helios chat), Agents, Dashboard, Work, Records, Activity, Settings | `src/views/pages/` |
| Overlays: ⌘K palette, agent studio, Helios mini chat, work viewer, new record, background gallery | `src/views/overlays/` |
| App frame: sidebar, top bar, notifications | `src/views/AppShell.tsx` |
| State and behaviour | `src/logic/PulseLogic.js` |
| Demo data (Kilbride Group) | `src/logic/data.js` |
| Agent avatar | `src/components/AgentFace.tsx` |
| Theme tokens (Harbour, light and 11 more), animations | `src/styles/pulse.css` |

## How it fits together

- **`PulseLogic`** holds all state. Its `renderVals()` returns one flat object `v`.
- **Views** are plain React components that render from `v`.
- **`LogicHost`** (`src/runtime/logic.tsx`) mounts the logic and re-renders on `setState`.
- **Backgrounds** live in `src/App.tsx`:
  - `dashboardBackdrop`: the colour of the Dashboard KPI background
  - `kpiBackdropOn`: whether that background shows
  - `recordsBackdrop`: the colour of the Records wash (`""` uses the theme gradient)
- **Customising for a client:** read `CLAUDE.md` first. It lists the layout rules every copy keeps.

## ERP module pages

Dashboard, Projects, Plant & Hire, Garage, Finance, Safety, Work (Timesheets, Approvals) and Records (Clients, Suppliers, People) are data-driven.

- **Data:** `src/logic/fixtures.js` holds the seeded records, the monthly history (`HIST`), quotes, clients, suppliers, incidents and training. Everything on screen derives from it. State persists to `localStorage` under `ce-plant-demo-v2`; **Reset demo** clears it.
- **Pages:** `src/logic/mod/*.js` build each page as plain block objects (KPI strips, charts, boards, tables, drawers). `src/logic/mod/kit.js` lists every block type and holds the shared helpers.
- **Renderer:** `src/views/pages/Module.tsx` draws the blocks; `charts.tsx` has the SVG charts; `src/styles/erp.css` styles them.
- **Click-through:** every KPI, chart bar, list row and table link carries a `go` of `[page, section, recordId, uiPatch]`. The record id opens that record's drawer; the patch presets filters (for example `{invFilter:"overdue"}`).
- **Deep links:** `#/Finance/invoices/INV-1048` opens a page, section and record on load.
- **Colour:** one brand blue. Charts use `--ch1` to `--ch5` (blue steps); only warn (amber) and bad (red) are used for status.

## Updating from Claude Design

Export the new version, replace the file in `design/`, then run:

```bash
npm run import-design
```

This regenerates:

- `src/views/`
- `src/styles/pulse.css`
- `src/styles/interactions.css`
- `src/logic/`

`AgentFace` is hand-written and left alone. Commit before running, because it overwrites hand edits to those files.

## Fixed from the mockup

In the mockup, the work viewer's wrapper `<div>` was never closed. As a result, the ⌘K palette, agent studio, new record dialog and background gallery could only appear while the work viewer was open. They now open on their own. The fix is applied in `tools/import-design.mjs`.
