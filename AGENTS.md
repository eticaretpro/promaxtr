<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.

## What Lovable manages

Rules outside this block are the project's own. Change the pieces below in
Lovable, not by hand. With the [Lovable MCP](https://mcp.lovable.dev)
connected, `send_message` asks Lovable to do it; otherwise ask the user to
use the editor.

- **Database.** Do not add or edit `supabase/migrations/` or `drizzle/`.
  Ask Lovable to change the schema.
- **Generated files.** Do not edit a file whose header says it is automatically
  generated.
- **AI gateway.** Keep model calls on Lovable's gateway, and keep
  `LOVABLE_API_KEY` out of browser code.
- **Connectors.** Lovable provides native connectors. `list_connectors` shows
  which are enabled; `add_connector` only returns the dashboard link. When a
  connector is enabled, calls go through the connector gateway and need
  `LOVABLE_API_KEY`. When Lovable does not provide one, users can bring their
  own key and store it in Secrets.
- **Secrets.** Lovable manages them. Do not put secret values in the repo.
<!-- LOVABLE:END -->

## Promax architecture

- **Strict 05xx mobile filter:** All Serper.dev Google Maps results pass through `parseTurkishMobile` in `src/lib/turkish-phone.ts` before persisting to `public.businesses`, ensuring only SMS-verifiable Turkish mobile numbers (`+905...`) enter the directory.
- **Businesses as members & OTP sessions:** Authentication uses server-verified `HttpOnly` cookie sessions (`promax_session`) backed by `public.business_sessions` and `public.otp_verifications` via OTP.com (or sandbox fallback when `otp_api_key` is unset) against existing `public.businesses` phone records.
- **Database-stored API credentials:** Serper.dev and OTP.com keys live in `public.system_settings` (service-role only, never exposed to client bundles) and are editable only by phone numbers listed in `public.admin_phones`.
- **Turkish location dataset:** All 81 provinces and 973 districts are bundled in `src/data/turkey-locations.json` and validated on both client and server in `src/lib/turkey-locations.ts`.
