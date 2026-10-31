# Supabase setup

Local mode remains the default. Do not change it until the following setup is complete. No service role key is needed or used by this app.

1. Make a full local backup using the README backup command. Keep the backup off this computer too.
2. In your Supabase project SQL Editor, review and run `supabase/migrations/202610310001_bbear.sql` once. It creates separate Bbear tables, an atomic save function, staff-only rules, and a private `bbear-private` storage bucket. It does not modify other app tables. If any named object exists, stop and review rather than deleting it.
3. In Authentication, disable public signups for this staff-only project. Create staff users through the dashboard. Set each user's password privately. No signup or password reset screen is implemented in the app yet; use Supabase administration for account recovery.
4. Copy each approved user's ID from Authentication. In SQL Editor run:

   ```sql
   insert into public.bbear_staff(user_id) values ('APPROVED-USER-UUID');
   ```

   Only explicitly added users may read or save Bbear proposals and files. To revoke access, delete their row from `bbear_staff`. All approved staff share the same workspace; separate agencies or granular roles are not supported.
5. Use a separate app checkout with an empty local data folder for cloud testing. Put `STORAGE_MODE=supabase`, your `SUPABASE_URL`, and `SUPABASE_ANON_KEY` in its ignored `.env.local`. These are server settings. Never commit `.env.local`. Do not configure `DATABASE_URL` for this mode. Restart the server.
6. Test: signed-out requests must fail; an unapproved account must fail; an approved user must create, edit, preview and export a sample proposal. Upload a photo, sign out, and confirm its `/api/files/...` address is blocked. Test stale edits from two sessions: the second save must fail with a conflict. Remove test staff access and confirm access stops. Use HTTPS when hosting.
7. Existing local records and files do NOT move automatically. Keep the existing installation in local mode. Plan and verify a separate migration of records, every revision, and private files before switching the real installation. Never silently merge two live databases.

Private files are streamed through the app using the signed-in user's session. No public file URLs or admin bypass keys are used. PDF generation still needs an always-on Node server with Chromium installed; Supabase does not host this Next.js app. Maintain backups of database AND storage, and verify restore independently.

This change has not been applied to your Supabase project automatically. URL and anon key cannot install database rules or approve staff. Live account, row access rules, private storage, expiry/refresh, and migration checks must pass before cloud use.
