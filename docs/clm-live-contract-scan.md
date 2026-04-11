# CLM Live Contract Scan (OpenRouter)

Use this to test `ContractScanPage` with a real LLM call instead of mock data.

## 1) Frontend toggle

Add this to your frontend `.env` file:

```env
VITE_ENABLE_LIVE_CONTRACT_SCAN=true
```

## 2) Supabase Edge Function secrets

Set OpenRouter secrets on your Supabase project:

```bash
supabase secrets set OPENROUTER_API_KEY=your_openrouter_key
supabase secrets set OPENROUTER_MODEL=openrouter/free
supabase secrets set OPENROUTER_APP_NAME="SISWIT CLM Scanner"
supabase secrets set OPENROUTER_APP_URL="http://localhost:8080"
```

Notes:
- `openrouter/free` routes requests to currently available free models.
- You can pin a specific free model using the `:free` suffix (availability changes over time).

## 3) Deploy the function

```bash
supabase functions deploy contract-scan-ai
```

If you see `401 Unauthorized` from `/functions/v1/contract-scan-ai`, deploy without JWT verification:

```bash
supabase functions deploy contract-scan-ai --no-verify-jwt
```

For local function testing:

```bash
supabase functions serve contract-scan-ai --env-file supabase/.env.local
```

## 4) Test from UI

1. Run app with `npm run dev`.
2. Open `/:tenantSlug/app/clm/scan`.
3. Upload a contract file.
4. Confirm toast shows `Scanned with model: ...` and scan is saved in history.

## 5) If scan still looks mocked

- Ensure `VITE_ENABLE_LIVE_CONTRACT_SCAN=true` and restart Vite.
- Check browser network for `functions/v1/contract-scan-ai`.
- Check Supabase function logs for OpenRouter errors or rate limits.
