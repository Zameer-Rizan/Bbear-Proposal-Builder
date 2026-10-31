# Bbear usability review

31 October 2026

The editor has been reviewed for typing interruptions, misleading save states, input problems, and common workflow mistakes. Changes are installed in the local Supabase-connected app at http://127.0.0.1:3001/. Refresh after saving any current work.

## Changes

| Area | What changed |
| --- | --- |
| Background saving | Retained non-blocking autosave and verified that fields stay enabled. New edits are preserved when a previous save returns. Saves are serialized. |
| Repeated saves | Saving or previewing an unchanged saved proposal no longer creates an unnecessary revision. Server version/date changes do not count as new edits. |
| Save failures | Automatic retries pause after a failure rather than repeatedly flashing errors. The status says the work is not saved; use Save to retry. Connection failures have a clear message and a request timeout. No automatic overwrite of a newer database version. |
| Number entry | Amounts can be cleared and typed, including decimals. Text fields prevent mouse-wheel price changes. Invalid or out-of-range amounts show a specific message and block saving. An invalid field no longer displays “All changes saved.” Blank fields normalize to their minimum when you leave them. |
| Child ages | Invalid/incomplete lists are visibly flagged and cannot silently save the old ages. Accepted ages are whole numbers from 0 to 17. Restoring a saved version also restores the displayed age list. |
| New-proposal preview | Preview saves a new proposal first, preventing a “proposal not found” response. |
| Copies | Copies receive a separate ID and revision history. An approved price becomes an estimate requiring review. The original proposal remains separate. |
| Leaving the editor | Unsaved pasted itinerary notes and unfinished invalid number entries trigger the leave warning too. Navigation is blocked during explicit operations such as uploads. Leaving clears stale editor state so a late save cannot reopen it. |
| Photos and search | Photo-library search now filters tour destinations/names. Website photo URLs are normalized and duplicates removed, including image objects containing URLs. |
| Missing website prices | Missing/zero website rates show “Price to be confirmed” instead of a misleading zero-dollar rate. |
| Upload feedback | Wrong image types and photos over 12 MB are rejected with a clear message before upload. The file picker resets so the same photo can be selected again. |
| Popups | Photo/preview/sign-in dialogs have accessible names, keyboard focus stays within the popup, and background scrolling is locked. Escape closes photo/preview popups when no operation is running. Closing restores the previous keyboard focus. |
| Limits and errors | Add-day and add-cost controls respect the existing limits of 60 days and 200 cost lines. Server validation names the affected field rather than returning only a generic failure. |
| Small UI fixes | Repeated field groups have stable React keys. Wrong-password errors are preserved instead of being replaced with a generic sign-in prompt. |

## Checks completed

- TypeScript check: passed.
- Automated tests: 18 passed, 0 failed. Coverage includes concurrent saves, edits during saves, copies, metadata-only changes, child-age parsing, photo filtering, pricing, import fidelity, and customer-document privacy.
- Production build: passed.
- Browser checks performed in a separate local test database; no edits were made to real customer proposals for these tests.
- Typed a rate of 145.50 and quantity 4: total displayed 582.00 and suggested total 698.40 at 20% markup.
- Cleared the customer amount and typed 1250.75; confirmed that exact value was saved.
- Confirmed the customer price input retained focus and the editor was not inert after background saving.
- Entered a negative price: save was blocked, the value remained visible for correction, and the final build showed “Check highlighted fields.”
- Entered child ages “5, 18”: save was blocked with an explicit age-range message.
- Opened a new proposal's preview before its first save: preview loaded successfully after automatic first save.
- Closed preview with Escape and confirmed focus returned to the editor.
- Saved an unchanged proposal again: its version remained 2, confirming no extra history entry.

## Scope and remaining limits

This is a focused usability and save-flow review, not a guarantee that every possible defect has been eliminated. Physical iOS/Android testing, simulated network outages, and the full Supabase multi-user account/session test matrix were not completed in this review. No Supabase policies or production customer records were changed. No historical records were deleted. Existing price approval and customer-PDF privacy rules remain in place.

Temporary test records were kept only in /tmp/bbear-ux-review-20261031, separate from your local and Supabase data. These changes have not been pushed to GitHub in this review.
