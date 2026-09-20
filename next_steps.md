# TakaTalks — Strategic Roadmap & Next Steps

## 1. Distribution & Video Production (Highest Priority)
- [ ] Establish active publishing cadence: Produce and upload 3–5 high-quality shortform videos on Facebook/YouTube addressing common tax misconceptions (e.g. 5% tax slab, investment rebate headroom).
- [ ] Replace local `.mp4` video files in `web/public/videos/` with CDN-backed video hosting (e.g., Cloudflare Stream / Mux or canonical YouTube/Facebook embeds) to reduce Git repository size.

## 2. Product Focus & Core Tool Polish
- [ ] Focus product iterations primarily on `/calculator` (Tax Calculator) and `/instruments` (Real Yields).
- [ ] Keep tax rules updated with each national budget (review `src/config/tax-rules-2025-26.ts` annually).
- [ ] Regularly monitor BAJUS gold and silver benchmark prices for `/zakat`.

## 3. Operations & Infrastructure
- [ ] Configure `RESEND_API_KEY`, `EMAIL_FROM`, and `ADMIN_EMAIL` in production environment to enable maturity reminder emails.
- [ ] Complete WhatsApp Cloud API verification (Meta Business Suite) to enable WhatsApp OTPs and reminders.
- [ ] Run regular security audits on authentication, session tokens, and rate limits.
