# Supabase curriculum setup

No Supabase project is configured in this workspace. The website therefore reads the reviewed curriculum from `src/features/curriculum/data/curriculum.json` and stores anonymous progress in this browser only; it does not claim that progress or curriculum has been uploaded.

When a project is available:

1. Apply `migrations/202611170001_learning_curriculum.sql` using the Supabase CLI or SQL Editor.
2. Run `npm run curriculum:seed:generate` if the curriculum JSON has changed.
3. Apply `seed.sql` with the migration owner/SQL Editor. It is idempotent and inserts public curriculum content, not user progress.
4. Configure authentication and the Supabase browser/server clients before replacing local progress storage with per-user database reads/writes.

Content tables allow public reads. Writes require a trusted `app_metadata.role = admin` JWT claim; users cannot set their own `app_metadata`. Lesson progress is restricted by RLS to the authenticated user's `auth.uid()`.
