# Bbear Proposal Builder

Private, responsive staff workspace for website tour imports, custom itineraries, quotes, photographs, customer previews and PDFs.

## Start

Use Node.js 24 LTS or a newer supported LTS. This project was built with Next.js 16.4.3, React 19.3.1 and Tailwind CSS 4.3.3; exact installed dependencies are locked in package-lock.json.

```sh
npm ci
npm run setup:pdf
npm run seed
npm run dev
```

Open http://127.0.0.1:3000. The seed command only adds the two-day Nuwara Eliya & Ella trip if your database is empty. It never overwrites existing proposals.

For a production build: `npm run build`, then `npm start`. Keep the server running to use the app. The default scripts bind to this computer only.

## What works

- Live catalogue from bbeartravels.com, with a labelled saved-catalogue fallback.
- Import full website packages into separate editable proposals; website starting rates do not automatically become customer prices.
- Custom day editor, move days, up to eight photos per day, uploaded photographs, pasted Day 1 / Day 2 notes.
- Guest details, child ages, room arrangements, currency labels, cost lines, quantity/km calculations, markup, final total or adult price.
- Basic draft checks and explicit confirmation flags on supplier costs.
- Autosave after 1.8 seconds of inactivity; manual save; database revision history; copy proposals; load previous versions.
- Customer preview, downloadable PDF, private PDF archive, hidden hotels/meals/prices/contact controls. Internal costs and notes are excluded from rendered documents.
- Transactional saves with optimistic version checks, SQLite WAL, PostgreSQL connection option, validation and backup/restore utilities.
- Responsive phone/tablet/desktop web UI and Lucide icons. This is a web app, not a native iOS/Android app; real-device Safari/Chrome testing is still needed before claiming device certification.

## Where your stuff lives

By default all records are in `data/bbear.sqlite`. Uploaded photos and generated PDFs are in `data/files/`. PDF browser binaries are in `data/browsers/` and can be reinstalled; they do not need backup. Downloaded PDF copies also go to your browser's normal Downloads folder.

You can set DATA_DIR to another persistent disk folder. Never put live SQLite on Dropbox/Google Drive/NFS or copy only the main database while it is running: WAL files matter. Use the backup utility.

### Recommended hosted setup

- Supabase mode for staff sign-in, records, revisions and private photos/PDFs; see the setup guide below. A separate PostgreSQL connection option also remains available.
- An always-on Node server/container for the app and PDF browser runtime. Local/PostgreSQL modes also need private persistent file storage.
- Separate encrypted off-site backups for database AND files.
- HTTPS and approved Supabase staff accounts in cloud mode. Local/shared-password mode needs a strong APP_PASSWORD and SESSION_SECRET. Keep private settings on the server.
- Do not use temporary serverless disk as local file storage. Cloud mode uses the private Supabase bucket; back it up separately from the database.

Copy `.env.example` to `.env.local` and fill in your own values. Local mode without APP_PASSWORD only accepts API requests on localhost/127.0.0.1. Local mode supports a shared staff password. Supabase mode supports individual approved staff accounts sharing one workspace; granular roles are not implemented. Add reverse-proxy login rate limiting before internet exposure. Keep this build local until hosted access controls and backups are configured and tested.

Changing DATABASE_URL does not migrate your local records automatically. Make a backup and use a reviewed migration before switching a live installation.

## Back up and recover

```sh
npm run backup -- /a/separate/backup/location
npm run restore -- /backup/bbear-TIMESTAMP /a/new/empty/data-folder
```

The local backup uses SQLite VACUUM INTO for a consistent snapshot, copies private files, and records file checksums. Restore verifies checksums and SQLite integrity and refuses a nonempty destination. Set DATA_DIR to the recovered location after stopping the app, then restart. PostgreSQL users need their provider's database backup or pg_dump plus the file backup. Schedule daily backups outside this app and test restore regularly. The Settings download is a portable record/revision JSON export; it is not a full file backup.

## Verification

`npm test`, `npm run check`, `npm run build`. Tests cover financial arithmetic, import fidelity, family-price warnings, hidden fields, notes parsing, invalid data and stale-save rejection. A local end-to-end website import and PDF export are also checked during development.

## Honest limits

No software guarantees zero data loss. Protect the disk, maintain independent backups and keep dependencies patched. Supplier availability, child policies, hotel classifications, train bookings, exchange rates, and travel times are not automatically verified. Rates are entered by staff. Currency changes relabel existing values rather than fetching exchange rates. Never quote a website starting price as a confirmed solo or family rate without checking it.

Templates share a reliable base layout with style-specific labels and visibility controls; this version does not have a freeform Canva-style canvas. PDF pagination can differ from the web preview. Generated PDFs are archived; client links, approvals, messaging, payments, role-based accounts, AI writing, live hotel rates, a full supplier library and automated website write-back are not included yet. The app never writes to your public website.

## Pricing review and import update
New imports preserve highlights and up to eight photos per day. Prices begin as Needs pricing. Customer PDFs with prices require staff to mark them Approved after entering a positive quote, expiry and confirmed cost lines. Changes to quote inputs move approved pricing back to Estimate. This is an internal review state, not supplier confirmation or a separate permission role. Historical saved proposals are not automatically overwritten or refreshed. Customer documents omit internal draft, version and reference labels.

## Supabase staff workspace

Optional Supabase sign-in, staff-only proposal/revision tables, and private file storage are implemented behind `STORAGE_MODE=supabase`. Local mode remains the default. Follow [the setup guide](docs/SUPABASE-SETUP.md) before enabling it. The SQL migration must be applied by the project owner and staff IDs explicitly approved. Existing records are not moved automatically. Sign-in and the private media import were checked on the configured project; complete the setup guide’s access, session, concurrent-user and restore checks for every deployment.

Photo library: see [docs/PHOTO-LIBRARY.md](docs/PHOTO-LIBRARY.md) for bulk uploads, duplicate checks, private storage and backups.
