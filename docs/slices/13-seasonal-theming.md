# Slice #13: Seasonal theming

**GitHub issue:** #13 · **Branch:** `feat/13-themes` · **i18n namespace:** `themes.*` (public), `admin.themes.*` (dashboard)

## Goal
The owner switches the whole site's look for a season (Eid, Christmas, Valentine's, Mother's Day) with one click, no deploy.

## SRS requirements
| ID | Requirement | Priority |
| --- | --- | --- |
| PW-90 | A small set of themes (default, Eid, Christmas, Valentine's, Mother's Day — to confirm) changing colours and accents (hero imagery dropped for v1: she changes the hero in the home page editor) | M |
| PW-91 | Theme is chosen by the owner from the dashboard; one click, no deploy | M |
| OD-35 | Choose the active seasonal theme | M |

Full text: `docs/SRS.md`.

## Dependencies
- **Must be merged first:** #9 Home and design (merged), Client answer on which seasons
- **Can run in parallel with:** #11, #14

## Files you own (create and change freely)
- `src/lib/themes/**` (theme definitions)
- `src/components/admin/themes/**`, theme picker page under settings
- `src/app/globals.css` (theme variable sets only)

## Shared files you may touch (follow `docs/WORKFLOW.md` section 6)
- `src/lib/i18n/en.json`, `bn.json` (add keys in your namespace, alphabetical)
- `docs/DECISIONS.md` (append)
- `src/app/layout.tsx` (apply the active theme class/attribute)
- Settings action/validator from #10 (add the `theme` key)

Everything else belongs to another slice or the foundation: don't change it. Ask the lead if you need to.

## Data
- **Tables and storage:** site_settings (`theme` key).
- **Schema changes:** None.

## Build plan
1. Theme definitions as CSS variable sets on top of #9's tokens, plus optional hero image and accents.
2. Owner picker in settings with previews.
3. Active theme read server-side and applied on every page; change visible within a minute.
4. Contrast check (WCAG AA) for every theme.

## Watch out for
- No hard-coded colours; only variables.
- Revalidate cached pages when the theme changes.

## Needs client input
Which seasons to include.

If the answer isn't in yet, build with sensible defaults the owner can change, and note them in the PR.

## Done when
- [x] Switching theme updates the live site within a minute (on the next request: e2e)
- [x] Every theme passes WCAG AA contrast (unit test, 4.5:1 on white and paper)
- [x] `pnpm lint && pnpm typecheck && pnpm test` pass (CI on the PR)
- [x] Works at phone width and by keyboard (e2e arrows across the cards)

## Follow-up: seasonal artwork (12 Oct 2026, branch `feat/13-artwork`)
Per-theme motifs on the header, the big tag and the footer, icons in the facts strip, neutrals moved off pure white. Data in `src/lib/themes/artwork/`, components in `src/components/public/artwork/`, the rule and tests in `place.ts`; see `docs/design.md`, "Seasonal artwork". Playwright: `e2e/artwork.spec.ts`.

## Round 3: whole sets and a header that stays (13 Oct 2026, branch `feat/13-artwork-round3`)
- **Tag and footer:** shared slot pools; slots that meet text, the hero or a hanger go first, then the theme's `set` is handed to the survivors, biggest first, so every icon in the set appears at every width (unit guard for every theme at 1440, 1280, 1024, 768 and 390; e2e for Eid and Pohela Boishakh at 1440 and 390). The tag's text is centred at every width and measured by its lines and the button; the phone tag gained 24px of bottom padding (the mock-up needs both).
- **Header:** the scatter covers the whole row, edge to edge (px from the row's centre, the outermost anchored to the edges), a pop colour per theme, stroke 1.8, opacity 1; on collapse each side slides in by half of (name width + gap), keeping its spacing and its gap from the mark. The header box keeps one height (no layout shift), collapses with 48px of hysteresis, the name only fades and the mark slides to the centre (`e2e/header-collapse.spec.ts`, Chromium, mobile and WebKit). The tag's text is measured by its lines at every width and the footer's bottom line by its lines. Icons kept, measured on the page:

| Width | At the top | Collapsed |
| --- | --- | --- |
| 1440 | 24 of 24 | 20 of 24 |
| 1280 | 24 of 24 | 24 of 24 |
| 1024 | 19 of 24 | 22 of 24 |
| 768 | 6 of 6 | 6 of 6 |
| 390 | 5 of 6 | 6 of 6 |

## Hand-off to later slices
None. The season list in `src/lib/themes/themes.ts` is a placeholder until the client confirms; adding or removing one is a single entry there plus its `admin.themes.name.<id>` key.
