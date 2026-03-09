# Supabase Type Generation

Run:

- `npm run db:types`

Generation source priority:

1. `SUPABASE_DB_URL` (if set)
2. `SUPABASE_PROJECT_ID` (if set)
3. local Supabase CLI instance (`--local`)

The script writes `src/core/api/types.ts` in UTF-8 to prevent Windows UTF-16/NUL-byte lint parse failures.

