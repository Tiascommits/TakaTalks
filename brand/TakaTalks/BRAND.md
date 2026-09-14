# TakaTalks — Brand Identity

Finance for everyone in Bangladesh: tax, expenses, rebates, savings — explained plainly, in one place.

## Mark

A ledger seal holding the ৳ sign, with a small speech-bubble tail — "money" and "talks" in one shape.
Files: `logo-icon.svg` (full colour), `logo-icon-mono.svg` (single-ink knockout, for stamps/print/fax),
`wordmark.svg` (icon + wordmark lockup).

- Minimum size: 24px (icon alone), 96px wide (wordmark lockup).
- Clear space: keep space equal to the tail's height free on all sides — nothing else touches the seal.
- Do: place on `paper` (#f6f3ec) or `green-deep` (#07352a) backgrounds. Use `logo-icon-mono.svg` for one-colour print.
- Don't: recolour the mark outside the palette below, stretch/skew it, rotate it, add a drop shadow, or place it on a busy photo/background.

## Wordmark

**Taka**Talks — "Taka" in `green-deep`, "Talks" in `gold`, set in Newsreader 700. Always one word, no space.

## Colour

| Token | Hex | Role |
|---|---|---|
| paper | `#f6f3ec` | Primary background |
| ink | `#1b1b18` | Primary text |
| green-deep | `#07352a` | Logo, headers, highest emphasis |
| green | `#0b4f3f` | Links, active states |
| gold | `#b98a2e` | Accent, "Talks" |
| teal | `#0a6e5b` | Secondary accent |
| red | `#a62e2e` | Tax due / alerts |
| line | `#d8d2c2` | Hairlines, dividers |
| muted | `#7a7566` | Secondary text |

These are the exact tokens already used in `web/src/app/globals.css` — the brand and the product share one palette by design, see `palette.json`.

## Type

- **Newsreader** (500/600/700) — headings, wordmark, big numbers.
- **Noto Sans Bengali** (400–700) — body copy, Bengali text, the ৳ glyph in the mark.
- **IBM Plex Mono** (400/500) — currency figures, tabular data.

## Tagline

EN: "Everything financial, plainly told."
BN: "সবার টাকার হিসাব, একদম সহজ"

## Files in this folder

- `logo-icon.svg` — colour icon mark
- `logo-icon-mono.svg` — single-ink icon mark
- `wordmark.svg` — icon + wordmark lockup
- `palette.json` — colour + type tokens
- `brand-identity.html` — the full brand sheet (lockups, do's/don'ts, type & colour specimens); also published as a shareable page
