# For me, now (2026-09-21)

Everything still open that only you can do, in order, with the exact page for each.
`todo/my-work/for_you.md` is the longer version with the reasoning; this is the checklist.

**No secret ever goes in this repo.** Values below are described, not pasted. The YouTube
API key is in your developer's message; keep it there and in Vercel, nowhere else.

## Where every variable goes

One place, for all of them:
**Vercel → taka-talks → Settings → Environment Variables → Add Environment Variable**
<https://vercel.com/inovace-growths-projects/taka-talks/settings/environment-variables>

Use type **Secret** for anything sensitive (Vercel can't show it again after saving, so
keep a copy in a password manager). Use **Config** for public values.

### Current state of the Vercel project

| Variable | State |
|---|---|
| `DATABASE_URL` | Set (Production + Preview) |
| `NEXT_PUBLIC_GOATCOUNTER_CODE` = `takatalks` | Set (Production only). Live; the count request returns 200. |
| `YOUTUBE_CHANNEL_ID` | Set (Production + Preview) |
| Everything in the next table | **Not set yet** |

### Still to add

| Variable | Where the value comes from | Type · environments |
|---|---|---|
| `CRON_SECRET` | Generate it (command below) | Secret · Production + Preview |
| `SESSION_SECRET` | Generate it, a different value | Secret · Production + Preview |
| `ADMIN_SECRET` | Generate it, a different value. Gates `/admin/*` and creates your first admin login at `/admin/setup`. | Secret · Production + Preview |
| `YOUTUBE_API_KEY` | Your developer's message | Secret · Production + Preview |
| `NEXT_PUBLIC_APP_URL` | `https://www.takatalks.com` | Config · Production only |
| `RESEND_API_KEY` | <https://resend.com/api-keys> | Secret · Production + Preview |
| `EMAIL_FROM` | `TakaTalks <reminders@your-verified-domain>`; the domain must be verified at <https://resend.com/domains> | Config · Production + Preview |
| `ADMIN_EMAIL` | Your email; the daily rate digest goes here | Config · Production |
| `WHATSAPP_ACCESS_TOKEN` | Meta app, WhatsApp setup | Secret · Production |
| `WHATSAPP_PHONE_NUMBER_ID` | Same page in Meta | Config · Production |
| `WHATSAPP_REMINDER_TEMPLATE_NAME` | Name of your approved reminder template | Config · Production |
| `WHATSAPP_OTP_TEMPLATE_NAME` | Name of your approved OTP template | Config · Production |
| `WHATSAPP_ADMIN_DIGEST_TEMPLATE_NAME` | Optional, same place | Config · Production |

Generate each secret with this, once per secret, so every value is different:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**Never put `TEST_DATABASE_URL` in Vercel.** It is wiped on every e2e run and is for your
local machine only.

`NEXT_PUBLIC_*` values are baked in at build time, so they only take effect after a
redeploy. Everything else also needs a redeploy to be picked up.

## Order

1. **Now (fixes what is actually broken).** Add `CRON_SECRET`, `SESSION_SECRET`,
   `ADMIN_SECRET`, `YOUTUBE_API_KEY` and `NEXT_PUBLIC_APP_URL`, then redeploy once.
   - Without `CRON_SECRET` all three cron jobs (rate scrape, maturity reminders,
     bank-health check) refuse every request.
   - Without `SESSION_SECRET` (or `ADMIN_SECRET` as its fallback) `/tracker` cannot save
     anything in production.
2. **Resend (about 30 minutes).** Add the three email variables and redeploy. Login emails
   and maturity reminders stay silent until this is done, and reminders also need
   `CRON_SECRET`.
3. **WhatsApp Business verification.** Start it early because Meta takes days; add its
   variables whenever it clears.

## Pages you will need

| For | Page |
|---|---|
| Add variables | <https://vercel.com/inovace-growths-projects/taka-talks/settings/environment-variables> |
| Redeploy (latest row, `...` menu, Redeploy; leave "Use existing Build Cache" unchecked) | <https://vercel.com/inovace-growths-projects/taka-talks/deployments> |
| Confirm the three cron jobs are listed | <https://vercel.com/inovace-growths-projects/taka-talks/settings/cron-jobs> |
| Restrict the YouTube key to **YouTube Data API v3** only | <https://console.cloud.google.com/apis/credentials> |
| Resend: sign up, verify domain, create key | <https://resend.com>, <https://resend.com/domains>, <https://resend.com/api-keys> (steps in `todo/my-work/email-provider-setup.md`) |
| Meta business account and WhatsApp app | <https://business.facebook.com>, <https://developers.facebook.com/apps> (steps in `todo/my-work/whatsapp-business-api-setup.md`) |
| GoatCounter dashboard | <https://takatalks.goatcounter.com> |
| Live site, to check afterwards | <https://www.takatalks.com> and <https://www.takatalks.com/videos> |

## Also on you

- **Verify the GoatCounter email.** The link went to nshababa16@gmail.com. Data is
  arriving, but the account is unconfirmed until you click it.
- **Decide whether TakaTalks counts as commercial use.** GoatCounter's free hosted plan
  is for non-commercial use. It affects whether you pay or self-host later, not whether
  the code works.
- **Restrict the YouTube key** in Google Cloud (link above). It has been pasted into a
  chat, so treat it as exposed; regenerate it if it ever leaks.
- **Bank list decision** (`todo/needs-us-both/confirm-new-bank-list.md`): confirm the AB
  Bank and National Bank scrapers, and decide on BRAC, Dutch-Bangla and Islami Bank.

## Release decisions (yours)

- **`experimental` is not live.** The car tax fix below is on `experimental` only until it
  merges into `main`. That merge needs a QA pass and a written QA report first, and it is
  your call.
- **E2E run.** Needs your sign-off because `e2e/global-setup.ts` runs a destructive
  `prisma migrate reset` on `TEST_DATABASE_URL`. Last known result was 56/56 on
  2026-09-20, before analytics and the car tax changes.
- **Local database.** Run `cd web && npx prisma migrate deploy` to apply the two newest
  migrations. Vercel does this itself on deploy.

## Changed today (2026-09-21), for context

- **Car AIT tables now match the Act.** Income Tax Act 2023, Section 153, as substituted
  by the Finance Act 2026 (in force 1 July 2026), read on bdlaws.minlaw.gov.bd.
  Changed: 2501-3000cc 125k to 200k; 3001-3500cc 150k to 250k; the single >3500cc tier
  split into 3501-4500cc (400k) and >4500cc (500k); microbus and double-cabin pickup 30k
  to 40k; EV bands rebuilt as 200/300/400 kW at 25k/50k/75k/100k. The 1500cc and 2000cc
  amounts were already right.
- **Second car is 50% more, not double.** `docs/Car.md` said double; the code was already
  correct.
- **Motorcycles are excluded from this AIT** (153(8)(a)).
- **YouTube feed** no longer shows private or deleted videos (they have no thumbnail),
  and the `no-explicit-any` lint error is gone.

## Still unverified, so do not publish from these yet

- The salary-to-tax figures in `docs/Car.md`, and whether salary counts as "regular
  source" income under Section 163(2).
- The "10% wealth surcharge" the calculator applies for owning more than one car.
- The example car names on the EV tiers are indicative; the band depends on the kW rating
  on the vehicle's registration papers.

## Strategy, when the above is done (`next_steps.md`)

- Publish 3-5 shortform videos.
- Move the remaining video files to a CDN or canonical embeds.
