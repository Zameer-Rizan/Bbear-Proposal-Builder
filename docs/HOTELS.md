# Hotel search and contracts

Open **Hotels** in the workspace. Search by destination, dates, rooms, guests and meal plan. Filters include verified star category, room type, budget and rates needing review. Use ages at travel and assign children to the room they share. Unknown prices display zero with a check-needed label; they are not free and cannot be added as complete costs.

## Setup

The project owner runs `supabase/migrations/202611010001_hotels.sql` once in the Supabase SQL Editor. It creates separate hotel/contract/history tables, an optimistic save RPC and a private `bbear-contracts` bucket. Existing proposal tables are unchanged. Every approved `bbear_staff` account can read and review hotel data; this release does not introduce separate reviewer roles. Public/anon access is not granted. Original PDFs and Word files are served through authenticated routes.

## Upload and review

Use **Upload contracts** for PDFs and `.docx` files up to 4 MB each. Several files are processed sequentially with progress; keep the page open. Successful files persist if a later upload fails. Select an existing hotel before uploading another season or amendment. Exact SHA256 duplicates are skipped. Unreadable/encrypted documents are not assigned invented rates.

A failed/unknown extraction leaves the original available for manual review. Without the optional API connection, PDF/Word source text can be read but new table formats are not automatically understood. PDFs can be viewed alongside the editor; Word originals are downloadable and extracted text is shown. Scanned PDFs without readable text require manual entry in this release. There is no unattended OCR worker or durable background queue; extraction is a retryable per-document request.

The four original contracts were prepared from an earlier visual review. A local private cache matched by file hash supplies those drafts during initial import only. It is not included in Git or deployment traces. The resulting reviewed-source drafts are stored in the private database and remain available online. New contracts do not require a developer when entered manually or read through the optional API.

Review tabs:
- Rates: room, occupants, plan, dates, amount, source page/text, and per-row check. Lists are paginated in groups of 15 to keep typing responsive.
- Meals: independent prices/units/conditions; not automatic board conversions.
- Rules: resolve supplier questions and enter verified board adjustments, child sharing/age rules, gala charges and child ages, room upgrades and early-booking offers.
- Hotel: name/location, verified star source and real property photo.
- History: saved versions. Edits use version checks and reject stale overwrites.

Contracts begin **Needs checking**. To mark one Reviewed, confirm currency, per-room-per-night charging, nightly season handling, all required fields and source checks, and resolve questions with supplier clarification. Editing pricing returns the contract to a draft. Archive a superseded contract to exclude it from searches; the original and history remain. For partial-date amendments, carefully review and adjust effective ranges; overlapping matching rates block totals instead of choosing the latest or cheapest.

## Pricing supported

- Direct occupancy/room/meal-plan rates; occupied nights exclude checkout day.
- Confirmed nightly season splitting; other cross-season methods are not implemented and must not be approved using the nightly checkbox.
- Explicit per-person board changes and per-room upgrades, with direct plan/room rates taking precedence.
- Confirmed child age bands, sharing limits, base/target-plan charges and special-date child age ranges.
- Date restrictions and compulsory special-date charges. Events can apply to one date or an inclusive night range, use per-person or per-room pricing, and charge once per stay window or per applicable night. Child age bands, meal-plan scope, source page and source wording are recorded; missing verification keeps the final total incomplete. Optional event charges are not part of this automatic total and must be clearly quoted separately after review.
- Best single confirmed eligible early-booking offer across the stay, with explicit discounted components, lead time, minimum nights and travel window. Offers do not stack. Eligibility uses the selected booking date. Other deal types, stay/pay offers, market/channel-specific eligibility or partially qualifying stays require manual review; do not approve a contract as representable if its applicable rules are unsupported.
- Fixed minor-unit arithmetic, transparent line breakdowns and blocking for incomplete/mixed-currency totals.

There is no automatic adult reclassification for older children, live hotel inventory, external star verification, automatic exchange-rate conversion or supplier booking confirmation. Where an older child must count as an adult, verify the configuration with the hotel and enter the correct adult occupancy; never force an unsupported child price. Original contract currencies are kept. Government tax changes and unprovided compulsory conditions need supplier confirmation. Room confirmation remains a separate step from finding a contract rate.

## Proposals

A complete stay can be added to an existing or new proposal as an internal cost and immutable calculation snapshot with contract versions. Cost confirmation remains false until staff confirm the supplier, and existing approved selling prices return to Estimate. Currency mismatches against existing amounts block cost addition. Duplicate same-hotel/date additions are rejected. An incomplete stay can be attached without a cost and remains pending. Customer documents do not print the raw supplier snapshot or margin. Empty matching itinerary hotel/meal fields may be filled, while existing entries are kept. A new stay-only proposal intentionally leaves activities empty for staff to complete.

The pre-existing Vercel PDF-browser compatibility work remains separate; the hotel section does not claim to repair deployed PDF generation.

## Optional automatic reading

Leave both settings blank for manual mode (the user's selected mode for now):

```
OPENAI_API_KEY=
OPENAI_HOTEL_MODEL=
```

Configure them only on the server in ignored environment files / Vercel settings. Never use a `NEXT_PUBLIC_` key or paste a key into the app. The configured model must support Responses structured outputs. API usage is billed separately. The reader sends extracted contract text to OpenAI only when configured, uses `store:false`, validates the returned shape, and never approves a rate. Source instructions are treated as untrusted data. Long/scanned/failed extractions stay in manual review. No API calls were made during this release's acceptance checks because no API connection was configured.

Reference: https://developers.openai.com/api/docs/guides/structured-outputs?api-mode=responses
PDF extraction: https://github.com/unjs/unpdf
Word extraction: https://github.com/mwilliamson/mammoth.js

## Backups and private data

Download hotel records from the Contracts view for a JSON record/history copy. This export does not contain original file binaries. In cloud mode separately back up the Supabase database and the private `bbear-contracts` and `bbear-private` buckets. In local mode the backup command now snapshots both SQLite databases and copies private proposal files and contract files with checksums. Restore validates checksums and database integrity and refuses a nonempty destination; legacy record backups remain supported.

`PDFS/`, `data/`, private environment files and review caches stay out of Git. `next.config.ts` also excludes them from server output tracing; Git ignore alone does not control deployment tracing. Review exports can contain confidential supplier/payment data and must remain private.
