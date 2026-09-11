# Email provider setup (needed for email reminders + magic-link login)

Status: blocking. `src/lib/notify/email.ts` no-ops until `RESEND_API_KEY` is set — nothing
sends until this is done. This is the easier of the two notification channels to stand up
and should be done first so reminders work at all while WhatsApp is pending.

## Steps

1. Sign up at https://resend.com (or swap in whatever provider you prefer — the wrapper is
   a thin adapter, easy to point elsewhere later).
2. Verify a sending domain (e.g. `mail.takatox.com` or similar) via DNS records Resend gives
   you — needed so emails don't land in spam and so you can send from a real address.
3. Create an API key.
4. Set these env vars (also add to Vercel project settings):
   - `RESEND_API_KEY`
   - `EMAIL_FROM` (e.g. `Takatox <reminders@mail.takatox.com>`)
   - `ADMIN_EMAIL` (where the daily rate-scrape digest gets sent)

Once set, magic-link login and email maturity reminders both activate automatically.
