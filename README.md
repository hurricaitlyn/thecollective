# GttDrop — first edition (private)

Timed, Vine-style ICU clinical drops for nurses, with a searchable atlas and a dated evidence shelf.

**Education, not orders.** GttDrop does not replace provider orders, hospital policy, or clinical judgment. Drops contain no medication doses.

## What's inside

| Area | Route | Notes |
| --- | --- | --- |
| Drops | `#/drops`, `#/drop/:id` | 12 timed drops (20–45s). Play/pause, step, loop, skip; then bedside language (patient / family / team) and a one-question quiz. |
| Atlas | `#/atlas` | 170 topics across 14 systems. Live search with highlighting and system filter; search is kept in the URL. |
| Shift tray | `#/tray` | Saved drops and atlas topics, stored in this browser. Printable. |
| Editorial queue | `#/queue` | Pitched → Drafting → In review → Scheduled. Pitches are stored in this browser. |
| Team | `#/team` | Team wins, rotating encouragement, nursing insights. |
| Evidence shelf | `#/evidence` | Dated sources (SCCM ICU Liberation, PADIS 2018 + 2025 focused update, AHA CPR/ECC 2025, SSC 2021, ADA inpatient). Sources not reviewed within 31 days are flagged "Review due". |
| Downloads | `#/downloads` | Two ICU communication boards (PDF) and a slot for the MGH study guide. |
| Guardrails | `#/about` | Clinical guardrails. |

## Run it

No build step. Open `index.html`, or serve the folder:

```sh
python3 -m http.server 8000   # then visit http://localhost:8000
```

It also works as-is on GitHub Pages (`.nojekyll` is included). The page sets `noindex`.

## Adding the MGH study guide

Drop the file at `downloads/mgh-study-guide.pdf`. When served over HTTP the Downloads page detects it automatically; set `available: true` for it in `js/data/content.js` to enable it everywhere (including `file://`).

## Editing content

- Drops: `js/data/drops.js`
- Atlas: `js/data/atlas.js` (`"Title|What it is|Nursing focus"`)
- Evidence, queue, team content, downloads: `js/data/content.js`
- Communication boards: `python3 scripts/make_boards.py` (needs `reportlab`)

### Monthly evidence review

1. Open each source on the evidence shelf and check for a newer edition or changed recommendations.
2. Update affected drops/atlas entries.
3. Set that source's `reviewed` date in `js/data/content.js`.

## Test

```sh
node tests/smoke.js
```

Uses Playwright + Chromium to check the feed, filters, player, quiz, tray persistence, atlas search, queue, evidence, downloads (real PDFs), routing, and the 375px mobile layout.
