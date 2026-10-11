# Shudha's Studio

Website and owner dashboard for **Shudha's Studio**, a Melbourne personalised-gift maker. Customers browse custom products (with optional "From $X" starting prices) and book an appointment to discuss an order. There is no cart or checkout: the final price is agreed in the appointment. The owner manages everything from a private dashboard at `/admin`.

- Requirements: [`docs/SRS.md`](docs/SRS.md) (v1.0)
- How the team works: [`docs/WORKFLOW.md`](docs/WORKFLOW.md) and one card per slice in [`docs/slices/`](docs/slices/README.md)
- Visual design: [`docs/design.md`](docs/design.md)
- Decisions log: [`docs/DECISIONS.md`](docs/DECISIONS.md)
- Work plan: GitHub Issues #1–#16, in build order

---

## Current state (11 October 2026)

**13 of 16 slices are built and merged.** The public site has its final look, a working catalogue, booking, custom orders, a wishlist, a customer gallery, seasonal colour themes and its content pages, in English and Bengali. The owner can manage products, availability, bookings, site content, gallery photos, the seasonal theme and the home page photos from the dashboard. Nothing is online yet: hosting is set up but not connected, and the domain is bought at launch.

| # | Slice | Status |
| --- | --- | --- |
| 1 | Foundation: schema, security, owner login, English/Bengali switch | Done |
| 2 | Product management in the dashboard | Done |
| 3 | Public catalogue and product page | Done |
| 4 | Availability settings and booking engine | Done |
| 5 | Booking emails, manage link and reminders | Done |
| 6 | Booking management in the dashboard | Done |
| 7 | Custom order wizard | Done |
| 8 | Wishlist | Done |
| 9 | Home page and visual design | Done |
| 10 | Content pages, site settings and home page editor | Done |
| 11 | English / Bengali completion | Done |
| 12 | Customer gallery (happy customers) | Done |
| 13 | Seasonal theming | Done |
| 14 | PWA dashboard, push notifications and dashboard design pass | Next |
| 15 | Performance, accessibility and SEO pass | Not started |
| 16 | Owner's guide, training and launch | Not started |

**Known gaps until later slices land**
- The dashboard can't be installed on a phone and sends no push notifications yet (#14).
- The dashboard uses the site's colours and fonts but hasn't had its own design pass; on phones its menu wraps to two rows (#14).
- Bengali text is being reviewed in rounds; some lines may still read awkwardly.

**Waiting on the client:** logo (text wordmark for now), her portrait and story, WhatsApp number (the chat button stays hidden until one is set), real opening hours (seeded as Mon–Sat 10:00–18:00), which seasons she wants, and the wording of the gallery consent line. She can fill in most of these herself from the dashboard.

---

## What works today

**Public site**

| Page | What it does |
| --- | --- |
| `/` | Home page: hero video with welcome card, shop by occasion, signature designs, new from the studio with category chips, custom order section, kind words, meet Shudha, follow the studio. Sections with nothing in them are hidden |
| `/products` | Catalogue with category, occasion and search filters (English and Bengali), paging |
| `/products/[slug]` | Product page: photo gallery, "From $X" when set, delivery note, share and WhatsApp links, related products, add to wishlist |
| `/book` | Book a consultation: pick a type, date and free time slot, attach a reference photo and wishlist items |
| `/custom-order` | Seven-step custom order wizard (personal or business order, up to three photos), ends in a booking |
| `/wishlist` | Saved products (kept in the browser, no account needed), shareable link, attach to a booking |
| `/booking/manage/[token]` | Customer's own link from the email to cancel or reschedule |
| `/about` | Her story |
| `/how-it-works` | How ordering works, with a delivery and pickup section (`/delivery` redirects here) |
| `/faq` | Questions and answers |
| `/contact` | Contact form; the message is saved and emailed to the owner |
| `/privacy`, `/terms` | Legal pages, edited by the owner |
| `/gallery` | Happy customers: approved customer photos, and a "Share your photo" form. Nothing shows until the owner approves it |
| Any page with `?lang=bn` | The same page in Bengali (the "বাংলা" switch in the header does the same and remembers it) |

**Owner dashboard** (`/admin`, owner only)

| Page | What it does |
| --- | --- |
| `/admin` | Next bookings at a glance, and the "Edit home page" button |
| `/admin/home-editor` | The real home page with an editing bar: change any photo or the hero video, pick products for the signature and new sections, then Save, Discard or Exit. Nothing goes live until Save |
| `/admin/products` | Add, edit, reorder photos, publish, archive, preview; categories, occasions and tags under Taxonomy |
| `/admin/availability` | Weekly hours, blocked dates, slot length, notice and booking horizon |
| `/admin/bookings` | Upcoming, past and cancelled bookings, calendar view, search; confirm, reschedule, cancel, mark done, private notes, one-tap WhatsApp reply |
| `/admin/gallery` | Customer photos waiting for review, approved and hidden; approve, hide or delete. The menu shows how many are waiting |
| `/admin/settings` | General (studio name, tagline), Content (her story, delivery note, contact email and WhatsApp number, social links, privacy and terms), Announcement, Seasonal banner, Theme, FAQs, Testimonials, Account (password change) |
| `/admin/settings/theme` | Pick the season's colour for the public site (Everyday, Eid, Pohela Boishakh, Wedding season, Christmas and New Year, Mother's Day, Valentine's Day) or schedule seasons by date. The dashboard always stays green |

**Behind the scenes**
- Emails for every booking step (customer and owner), with calendar (`.ics`) attachments, in English or Bengali.
- Reminder emails about 24 hours before each appointment, sent by an hourly Netlify function.
- Double bookings are blocked by the server and by a database rule.
- Every public form is protected by Cloudflare Turnstile and a rate limit.

---

## Run it on any computer

Works on macOS, Windows and Linux. Takes about 15 minutes the first time.

### 1. Install the tools (once per computer)

| Tool | Version | How to install |
| --- | --- | --- |
| Git | any recent | macOS: `xcode-select --install` · Windows: [git-scm.com](https://git-scm.com) · Linux: your package manager |
| Node.js | 24 (see `.nvmrc`) | [nodejs.org](https://nodejs.org) LTS installer, or `nvm install 24` (macOS/Linux) / `nvm-windows` |
| pnpm | 12 | Comes with Node: run `corepack enable` (macOS/Linux may need `sudo`; Windows: run the terminal as Administrator) |

Check:
```
git --version
node -v      # v24.x
pnpm -v      # 12.x
```

### 2. Get the code
```
git clone https://github.com/TrinityOperations/shudhas_studio.git
cd shudhas_studio
```
Avoid folder names with apostrophes or spaces; they break some tools.

### 3. Add the environment file from Sayek
The team runs against **Sayek's Supabase project**, so everyone sees the same products, photos, bookings and settings. You don't create a database of your own.

1. Get the `.env.local` file from Sayek (never by public chat or email; a private message or the password vault).
2. Put it in the project's top folder (next to `package.json`), named exactly `.env.local`. On a Mac, Finder hides files starting with a dot: press **Cmd+Shift+.** to see it.
3. Check it's in the right place:
   ```
   ls -a .env.local        # macOS / Linux: prints .env.local
   dir /a .env.local       # Windows
   ```

`.env.local` holds private keys with full access to the shared database and storage. It is gitignored: never commit it, paste it in chat, screenshot it or share it further.

What's in it, for reference (you don't need to change anything):

| Key | What it is |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` | The shared Supabase project's address and public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Secret key for uploads to Storage (**private**) |
| `DATABASE_URL` / `DIRECT_DATABASE_URL` | Database connection (runtime) and the one used only for migrations (**private**) |
| `RESEND_API_KEY`, `EMAIL_FROM`, `EMAIL_DRY_RUN` | Email sending. Until the studio's domain exists, Resend only delivers to the Resend account owner (Sayek) |
| `CRON_SECRET` | Protects the reminder job. Must be at least 16 characters, or the app won't start |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` / `TURNSTILE_SECRET_KEY` | Cloudflare's always-pass test keys for local work |
| `NEXT_PUBLIC_SITE_URL` | `http://localhost:3000` |
| `OWNER_EMAIL` | The one email allowed into `/admin` |
| `E2E_OWNER_EMAIL` / `E2E_OWNER_PASSWORD` | The owner login used by browser tests |

### 4. Install dependencies
```
pnpm install
```

### 5. Start the site
```
pnpm dev
```
Open **http://localhost:3000**. The first page load takes 10–20 seconds while it compiles. Stop the server with **Ctrl+C**.

You should see the same home page as Sayek: the demo products, photos, hero video, quotes and gallery. There is nothing to migrate or seed; the database is already set up.

### 6. Sign in to the dashboard (optional)
Go to **http://localhost:3000/admin** and sign in with the `OWNER_EMAIL` address and the owner password (the `E2E_OWNER_PASSWORD` value in your `.env.local`, or ask Sayek).

### Working on the shared database: rules
Everyone's changes land in the same database, so:
- **Anything you change is real for everyone.** Products you add, bookings you make, photos you approve, the theme you pick: the whole team sees it. Put "TEST" in the name of anything you create, and delete it when you're done.
- **Don't run** `pnpm db:migrate`, `pnpm db:seed`, `pnpm demo:seed` or `pnpm demo:clear`. Sayek runs these when the schema or demo content changes. `demo:clear` in particular would wipe the demo content for everyone.
- **Browser tests (`pnpm e2e`) and the database race tests write test data** into the shared database. Run them only when you need to, and tell Sayek.
- **Booking and contact emails** go to Sayek's inbox (Resend's test mode), not to the email you type in a form.
- If the site suddenly shows errors after a `git pull`, the database may need a new migration: tell Sayek rather than running it yourself.

---

## What you can test right now

Rows that change data change it for the whole team: name what you create "TEST" and remove it afterwards.

| # | Do this | Expected |
| --- | --- | --- |
| 1 | Open `localhost:3000` | Home page; the header shrinks to the logo mark as you scroll past the hero |
| 2 | Click "বাংলা" in the header | Page switches to Bengali; untranslated text falls back to English |
| 3 | Open `/products`, filter by a category, search a word | Matching products only; the filters stay in the address bar |
| 4 | Tap the heart on a product, then open `/wishlist` | The product is saved; "Share" gives a link that opens the same list |
| 5 | Open `/book`, pick a date and time, submit | Confirmation page; the slot disappears for the next person; emails sent (or logged in dry run) |
| 6 | Open `/custom-order` and go through the steps | Browser Back moves between steps; the last step creates a booking |
| 7 | Send a message from `/contact` | Thank-you message; the owner gets an email (or it's logged in dry run) |
| 8 | Go to `/admin` while signed out | Redirected to the login page |
| 9 | Sign in as the owner | Dashboard with the next bookings |
| 10 | `/admin/products` → add a product with a photo → publish | It appears on `/products` |
| 11 | `/admin/bookings` → open the new booking → confirm | Status changes; the customer gets a confirmation email |
| 12 | `/admin/availability` → block tomorrow | No slots for tomorrow on `/book` |
| 13 | Dashboard → "Edit home page" → change a photo → Save | The new photo shows on the home page; Discard instead leaves it unchanged |
| 14 | Settings → Content → add a WhatsApp number | The WhatsApp chat button appears on public pages |
| 15 | `/gallery` → "Share your photo" → send one | Thank-you message; it doesn't appear on `/gallery` yet |
| 16 | `/admin/gallery` → approve that photo | It appears on `/gallery` and in "Happy customers" on the home page; delete it afterwards |
| 17 | Settings → Theme → pick Eid → open the home page | Buttons, banner and footer turn indigo; the dashboard stays green. Set it back to Everyday or Automatic |
| 18 | Open any page with `?lang=bn` | The page in Bengali, with Bengali dates on `/book` |

Automated checks:
```
pnpm lint && pnpm typecheck && pnpm test     # must pass before every pull request
pnpm format:check                             # also checked in CI
pnpm exec playwright install chromium         # once per computer
pnpm e2e                                      # browser tests; owner tests need E2E_OWNER_EMAIL / E2E_OWNER_PASSWORD
```
`pnpm lint`, `typecheck`, `test` and `format:check` don't touch the database. `pnpm e2e` does: it creates test bookings, products and gallery photos in the shared database, so run it only when you need to.

Database race tests (bookings and reminders) write to the database too. **Don't run them against the shared database**; Sayek runs them on a separate test database:
```
RUN_DB_TESTS=1 pnpm vitest run src/lib/booking/concurrency.db.test.ts src/lib/booking/reminders.db.test.ts
```
Green tests don't prove a page looks right. After any layout change, open the page and look at it.

---

## Everyday commands
```
pnpm dev             # local dev server
pnpm build           # production build
pnpm lint            # code style checks
pnpm typecheck       # TypeScript checks
pnpm test            # unit tests (Vitest)
pnpm e2e             # browser tests (Playwright)
pnpm format          # auto-format with Prettier
pnpm format:check    # check formatting without changing files
pnpm db:studio       # browse the shared database in your browser (careful: edits are real)
```
Sayek only (they change the shared database for everyone):
```
pnpm db:generate     # create a migration after editing src/db/schema.ts
pnpm db:migrate      # apply migrations
pnpm db:seed         # seed starting data
pnpm demo:seed       # load demo content
pnpm demo:clear      # remove demo content
```

---

## Troubleshooting

| Problem | Fix |
| --- | --- |
| Home page is empty, or every page errors | `.env.local` is missing or in the wrong folder. It must sit next to `package.json`, named exactly `.env.local`. Restart `pnpm dev` after moving it |
| Login always says "wrong email or password" | Check you're using the `OWNER_EMAIL` address and the current owner password; ask Sayek if it changed. Check the terminal running `pnpm dev` for the real error |
| App won't start, error mentions `CRON_SECRET` or another key | Your `.env.local` is out of date or was changed; get the current one from Sayek |
| Uploads fail with "Invalid API key" | Your `.env.local` is out of date; get the current one from Sayek |
| Errors right after a `git pull` that mention a column, table or bucket | The shared database needs the new migration. Tell Sayek; don't run it yourself |
| Booking or contact emails don't arrive | They go to Sayek's inbox while Resend is in test mode, not to the address typed in the form. Check the terminal for dry-run logs |
| Changes to `.env.local` don't take effect | Restart `pnpm dev`; it only reads the file at startup |
| First page is very slow | Normal on the first load; Turbopack is compiling |
| `Port 3000 is in use` | Another `pnpm dev` is running. Stop it, or use `pnpm dev -p 3001` |
| `pnpm: command not found` | Run `corepack enable`, then open a new terminal |
| Site stopped working after a quiet week | Supabase's free plan pauses inactive projects. Tell Sayek; he restores it from the Supabase dashboard |
| Git says another process is running | Delete the stale lock: `rm .git/index.lock` |

---

## Project structure
```
src/
  app/(public)/          public pages (home, products, book, custom-order, wishlist, content pages)
  app/admin/             owner dashboard (login, home editor, protected pages)
  app/api/cron/          reminder job endpoint
  proxy.ts               session refresh and /admin protection (Next 16's replacement for middleware)
  actions/               server actions (all writes go here)
  db/schema.ts           database schema (single source of truth)
  db/queries/            read functions, one file per entity
  db/seed.ts             starting data
  emails/                email templates (English and Bengali)
  lib/booking/           slot generation, conflict checks, reminders
  lib/                   auth, i18n (en.json / bn.json), validators, Supabase clients, WhatsApp links, helpers
  components/            ui (shadcn), public (home, layout, pages, catalogue, ...), admin, shared
drizzle/                 SQL migrations
e2e/                     Playwright tests
netlify/functions/       scheduled reminder function
public/fonts/            Bengali accent font subset
scripts/demo-content/    demo products, photos and hero video for showcases
certs/                   Supabase CA certificate (database TLS is verified)
docs/                    SRS, workflow, slice cards, design and decisions log
```

## Team workflow
Full rules in [`docs/WORKFLOW.md`](docs/WORKFLOW.md). In short:
- Everyone runs against the same Supabase project (see "Working on the shared database: rules" above).
- One slice = one issue = one branch = one pull request. Branch as `feat/<issue>-<name>` from the latest `main`; never commit to `main`.
- Stay inside your slice's files (listed in its card).
- Pull request title `feat: <slice name> (#N)` with `Closes #N` in the description, then **Squash and merge**.
- Reference requirement IDs (PW-xx, OD-xx, NF-xx) in commit messages.
- Record any non-obvious technical choice in `docs/DECISIONS.md` in the same pull request.
- CI on GitHub runs lint, typecheck, unit tests and the format check on every push. Netlify (once connected) deploys `main` to production and each pull request to a preview link.
