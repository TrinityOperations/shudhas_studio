# Slice #14: PWA dashboard and push notifications

**GitHub issue:** #14 · **Branch:** `feat/14-pwa` · **i18n namespace:** `admin.push.*`

## Goal
The owner installs the dashboard on her phone like an app and gets a push notification for each new booking and gallery submission.

## SRS requirements
| ID | Requirement | Priority |
| --- | --- | --- |
| OD-60 | Dashboard installable on the owner's phone (manifest, icons, offline shell) | M |
| OD-61 | Push notification on new booking and new gallery submission | M |

Full text: `docs/SRS.md`.

## Dependencies
- **Must be merged first:** #6 Booking management (merged), #12 Customer gallery (merged)
- **Can run in parallel with:** #11, #13

## Files you own (create and change freely)
- `src/app/manifest.ts`, `public/icons/**`, service worker file
- `src/lib/push/**`
- `src/actions/push.ts` (+ tests)
- `src/components/admin/push/**` (enable notifications button)

## Shared files you may touch (follow `docs/WORKFLOW.md` section 6)
- Booking-created hook (#4/#5) and gallery-submitted hook (#12): one call each to send a push
- `.env.example` (VAPID public/private keys)
- `docs/DECISIONS.md`
- `src/lib/i18n/en.json`, `bn.json`

Everything else belongs to another slice or the foundation: don't change it. Ask the lead if you need to.

## Data
- **Tables and storage:** push_subscriptions.
- **Schema changes:** None.

## Build plan
1. Web app manifest, icons, offline shell for `/admin`.
2. Subscribe/unsubscribe the owner's device (VAPID).
3. Send push on new booking and new gallery submission; remove dead subscriptions.
4. Test on iPhone (Add to Home Screen) and Android.

## Watch out for
- iOS only allows push for installed home-screen apps.
- Service worker must not cache admin data responses.

## Done when
Part a (PWA install + push) is built; part b (dashboard design pass, nav redesign) is a later PR on this issue.
- [ ] Installs on iPhone and Android (built; to confirm on real phones, see below)
- [ ] Push arrives within a minute of a new booking (built; to confirm on real phones, see below)
- [x] `pnpm lint && pnpm typecheck && pnpm test` pass (CI on the PR)
- [x] Works at phone width and by keyboard (the card is one section with plain buttons)
- [x] Part b: dashboard design pass and nav redesign (Gallery under More): bottom tab bar and `/admin/more` on phones, sidebar on desktop, shared `PageHeader` and `EmptyState`, dashboard home cards (Today, Waiting, Upcoming, Photos to review, Quick actions), safe-area insets for the installed app

## Testing push on a phone
Push needs HTTPS and a real device; Playwright covers the install shell only.
1. Generate VAPID keys once: `npx web-push generate-vapid-keys`. Put them in `.env.local` as `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY` and `VAPID_SUBJECT` (`mailto:` the owner's address).
2. Expose the Mac over HTTPS with a Cloudflare quick tunnel: `cloudflared tunnel --url http://localhost:3000`. It prints a `https://<random>.trycloudflare.com` URL.
3. For that run set `NEXT_PUBLIC_SITE_URL` to the tunnel URL and `NEXT_PUBLIC_TURNSTILE_SITE_KEY` to Turnstile's test site key `1x00000000000000000000AA` (with the matching test secret), then `pnpm build && pnpm start`.
4. On the phone open the tunnel URL, sign in at `/admin/login`.
5. Install: iPhone Safari → Share → Add to Home Screen; Android Chrome → the Install prompt or ⋮ → Install app.
6. Open the installed app from the Home Screen (iPhone only delivers push to the installed app), tap **Turn on notifications** on the dashboard home, allow, then **Send a test**: it should land within seconds.
7. From another device make a booking on the public site (or submit a gallery photo): the push should arrive within a minute. Hide, delete or ignore it; the notification opens the booking.
8. Afterwards restore `NEXT_PUBLIC_SITE_URL` and the Turnstile keys in `.env.local`.

## Hand-off to later slices
None.
