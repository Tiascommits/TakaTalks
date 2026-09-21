# TakaTalks — Strategic Roadmap & Next Steps

## 1. Distribution & Video Production (Highest Priority)
- [ ] Establish active publishing cadence: Produce and upload 3–5 high-quality shortform videos on Facebook/YouTube addressing common tax misconceptions (e.g. 5% tax slab, investment rebate headroom).
- [ ] Replace local `.mp4` video files in `web/public/videos/` with CDN-backed video hosting (e.g., Cloudflare Stream / Mux or canonical YouTube/Facebook embeds) to reduce Git repository size.

## 2. Product Focus & Core Tool Polish
- [ ] Focus product iterations primarily on `/calculator` (Tax Calculator) and `/instruments` (Real Yields).
- [ ] Keep tax rules updated with each national budget (review `src/config/tax-rules-2025-26.ts` annually).
- [ ] Regularly monitor BAJUS gold and silver benchmark prices for `/zakat`.

## 3. Operations & Infrastructure
The exact pages and variable-by-variable checklist for this section is in [`formenow.md`](formenow.md).
- [ ] **Urgent:** set `CRON_SECRET`, `SESSION_SECRET` and `ADMIN_SECRET` in Vercel (Secret, Production + Preview) and redeploy. Until `CRON_SECRET` exists every cron job refuses every request, and without `SESSION_SECRET` (or `ADMIN_SECRET` as fallback) `/tracker` cannot save in production.
- [ ] Set `YOUTUBE_API_KEY` in Vercel and redeploy so the `/videos` auto-feed goes live (`YOUTUBE_CHANNEL_ID` is already set), then restrict the key to YouTube Data API v3 in Google Cloud.
- [x] GoatCounter analytics live (`NEXT_PUBLIC_GOATCOUNTER_CODE=takatalks`, Production only); verify the account email and decide whether TakaTalks counts as commercial use.
- [ ] Verify the salary-to-tax figures in `docs/Car.md` and the calculator's 10% multi-car wealth surcharge against the Income Tax Act before publishing car-tax content. The Section 153 AIT amounts are already checked and corrected.
- [ ] Configure `RESEND_API_KEY`, `EMAIL_FROM`, and `ADMIN_EMAIL` in production environment to enable maturity reminder emails.
- [ ] Complete WhatsApp Cloud API verification (Meta Business Suite) to enable WhatsApp OTPs and reminders.
- [ ] Run regular security audits on authentication, session tokens, and rate limits.
