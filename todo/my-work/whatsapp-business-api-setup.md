# WhatsApp Business API setup (needed for WhatsApp reminders + phone OTP)

Status: blocking. The app's WhatsApp send code is being built now (`src/lib/notify/whatsapp.ts`)
but it no-ops until these credentials exist — nothing will actually send until this is done.

This also blocks phone-based account recovery: rather than paying for a separate SMS/OTP
provider, phone verification is designed to send its OTP over WhatsApp. So finishing this
unlocks two features at once (maturity reminders over WhatsApp, and phone-number login/recovery).

## Steps

1. **Meta Business Manager account** — https://business.facebook.com if you don't already have
   one for Takatox/Inovace.
2. **Verify the business** — Meta will ask for business documents (trade license / registration,
   address proof). This step has the longest lead time (can take days), start it first.
3. **Create a WhatsApp Business app** inside Meta for Developers
   (https://developers.facebook.com/apps) — add the "WhatsApp" product to it.
4. **Add/verify a phone number** for the WhatsApp Business account. This becomes the number
   users see reminders come from. Can't be a number already registered on personal WhatsApp.
5. **Generate a permanent access token** (system user token, not the 24h test token) — Meta's
   docs: System Users → Generate New Token, with `whatsapp_business_messaging` permission.
6. **Submit message templates for approval.** WhatsApp requires pre-approved templates for any
   message sent outside a 24h user-initiated window (which reminders and OTPs always are). You'll
   need at minimum:
   - A maturity-reminder template (e.g. "Your {{investment_label}} matures on {{date}}.")
   - An OTP template (e.g. "Your Takatox verification code is {{code}}.")
   - Optionally an admin-digest template if you want the daily rate-scrape digest on WhatsApp too.
   Template approval can take a day or two and Meta sometimes rejects wording on the first pass.
7. **Set these env vars** once you have them (also add to Vercel project settings):
   - `WHATSAPP_ACCESS_TOKEN`
   - `WHATSAPP_PHONE_NUMBER_ID`
   - `WHATSAPP_REMINDER_TEMPLATE_NAME`
   - `WHATSAPP_OTP_TEMPLATE_NAME`
   - `WHATSAPP_ADMIN_DIGEST_TEMPLATE_NAME` (optional)

Once these are set, WhatsApp sending and phone-based login both activate automatically — no
further code changes needed on our side.
