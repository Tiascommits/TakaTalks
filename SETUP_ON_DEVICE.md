# Setting up TakaTalks on a brand-new Windows device

Written for someone starting from a freshly-imaged Windows machine with nothing installed.
Follow it top to bottom. Every command is meant to be copy-pasted.

Expect **30–60 minutes**, most of it downloads. Docker Desktop needs one reboot.

- **Target**: Windows 11, or Windows 10 version 22H2 (64-bit). Anything older isn't worth
  fighting.
- **Disk**: allow ~10 GB (Docker Desktop and its Postgres image are the bulk of it).
- **Admin rights**: needed for the installers and for enabling WSL2.

If a step fails, check [section 11](#11-troubleshooting) — it lists the actual error text
for the problems you're most likely to hit.

---

## 1. What you're setting up

The repo is a monorepo-ish layout, but only one folder is a running application:

| Path | What it is |
|---|---|
| `web/` | **The app.** Next.js 16 + React 19 + TypeScript, Prisma ORM, PostgreSQL. This is where you run everything. |
| `todo/` | Live task lists — `my-work/` needs a human, `agent-work/` is the build log. |
| `prompts/` | The scoped build instructions each module was built from. |
| `docs/` | Product and UX reasoning. |
| `tools/` | Standalone HTML prototypes that predate the app. No build step, just open them. |
| `brand/` | Logo, wordmark, palette. |

Three pieces run locally when you're developing:

1. **PostgreSQL 16** in a Docker container, on port **55432**. Two databases inside it:
   `takatalks` (your dev data) and `takatalks_test` (wiped on every end-to-end test run).
2. **The Next.js dev server** on port **3000** — that's the site you look at.
3. **A production server on port 3100**, started only while end-to-end tests run.

You do *not* need any API keys, accounts, or secrets to run the app locally. Email and
WhatsApp features detect that their keys are missing and quietly do nothing.

---

## 2. Install the prerequisites

### 2.1 Enable virtualization (only if Docker later complains)

Docker Desktop needs hardware virtualization. It's usually already on. If Docker's
installer complains, reboot into your BIOS/UEFI (mash <kbd>F2</kbd>, <kbd>Del</kbd>, or
<kbd>F10</kbd> during startup — varies by manufacturer) and enable:

- Intel machines: **Intel VT-x** / "Intel Virtualization Technology"
- AMD machines: **AMD-V** / **SVM Mode**

### 2.2 Windows Subsystem for Linux (WSL2)

Docker Desktop runs its Linux VM on WSL2. Open **PowerShell as Administrator**
(<kbd>Win</kbd> → type `powershell` → right-click → *Run as administrator*):

```powershell
wsl --install
```

Then **reboot**. After rebooting, confirm:

```powershell
wsl --status
```

You want to see `Default Version: 2`. If it says version 1, run `wsl --set-default-version 2`.

### 2.3 Git for Windows

Download from <https://git-scm.com/download/win> and run the installer. The defaults are
fine, with one screen worth attention:

- **"Configuring the line ending conversions"** → choose
  **"Checkout as-is, commit as-is"**. This repo has no `.gitattributes`, and the default
  ("Checkout Windows-style") will otherwise rewrite every file's line endings and give you
  enormous meaningless diffs.

If you already installed it with the defaults, fix it after the fact:

```powershell
git config --global core.autocrlf false
```

Then set your identity and turn on long-path support (`node_modules` paths exceed
Windows' old 260-character limit):

```powershell
git config --global user.name "Your Name"
git config --global user.email "you@inovacetech.com"
git config --global core.longpaths true
```

### 2.4 Node.js

Next 16 requires **Node 20.9.0 or newer**. Install the current **LTS** from
<https://nodejs.org> (pick the Windows Installer, .msi, 64-bit). Leave
*"Automatically install the necessary tools"* unchecked — you don't need the native build
chain for this project.

Verify in a **new** terminal (PATH changes need a fresh window):

```powershell
node -v      # must be v20.9.0 or higher
npm -v
```

### 2.5 Docker Desktop

Download from <https://www.docker.com/products/docker-desktop/> and install, keeping
**"Use WSL 2 instead of Hyper-V"** checked. Reboot if it asks.

Launch Docker Desktop and **wait for the whale icon in the system tray to stop animating**
— the engine isn't ready until it does, and every `docker` command fails until then. Accept
the service agreement; you can skip the sign-in prompt entirely.

Verify:

```powershell
docker --version
docker compose version
docker run --rm hello-world     # should print "Hello from Docker!"
```

### 2.6 VS Code (optional but recommended)

<https://code.visualstudio.com>. Useful extensions: **ESLint**, **Prisma**,
**Tailwind CSS IntelliSense**.

### 2.7 One-time PowerShell fix

By default Windows blocks the `npm.ps1` script that npm installs, which makes every `npm`
command fail. Fix it once, in **PowerShell as Administrator**:

```powershell
Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned
```

Answer `Y`. (Alternatively, use **Command Prompt** instead of PowerShell, which isn't
affected.)

---

## 3. Get the code

Pick a path **without spaces or OneDrive** in it. OneDrive-synced folders corrupt
`node_modules` and slow builds badly.

```powershell
mkdir C:\dev
cd C:\dev
git clone https://github.com/Tiascommits/TakaTalks.git
cd TakaTalks\web
```

You'll be asked to authenticate to GitHub. The browser-based prompt from Git Credential
Manager is the easy path; if you use a personal access token instead, paste it as the
password.

> Everything from here on runs **inside `TakaTalks\web`**, not the repo root. This is the
> single most common mistake.

---

## 4. Create your environment file

```powershell
copy .env.example .env
```

(`copy`, not `cp` — that's the Command Prompt / PowerShell equivalent.)

**The defaults already work for local development.** `.env.example` ships pointing at the
Docker Postgres from the next step, so you don't have to edit anything to get the app
running.

Two values are worth setting now if you intend to touch the admin pages — pick any long
random strings:

```env
ADMIN_SECRET="some-long-random-string-you-invent"
CRON_SECRET="another-long-random-string"
```

Everything else can stay as shipped:

| Variable | Needed locally? | What it does |
|---|---|---|
| `DATABASE_URL` | **Yes** (default works) | Your dev database. |
| `TEST_DATABASE_URL` | Only for e2e tests (default works) | Wiped on every test run. **Never point this at real data.** |
| `ADMIN_SECRET` | Only for `/admin/*` | Gates admin pages; also bootstraps the first admin account at `/admin/setup`. |
| `CRON_SECRET` | Only for `/api/cron/*` | Cron routes reject everything without it. |
| `NEXT_PUBLIC_APP_URL` | No | Base URL for links in emails. Falls back to the request origin. |
| `RESEND_API_KEY`, `EMAIL_FROM`, `ADMIN_EMAIL` | No | Email sending. Unset = email silently no-ops. |
| `WHATSAPP_*` (4 vars) | No | WhatsApp sending. Unset = silently no-ops. |

`.env` is gitignored and must never be committed.

---

## 5. Start the database

Make sure Docker Desktop is running, then from `TakaTalks\web`:

```powershell
docker compose up -d
```

First run downloads the `postgres:16-alpine` image (~80 MB). Confirm it's healthy:

```powershell
docker compose ps
```

You want `STATUS` to read `Up (healthy)`. If it says `starting`, wait ten seconds and
re-run — the app will fail to connect until it's healthy.

Notes:

- Data lives in a Docker **named volume** (`takatalks-postgres`), so it survives
  `docker compose down` and reboots.
- Only `takatalks` is created up front. `takatalks_test` is created automatically the first
  time you run the e2e tests.
- **Don't have Docker, or can't run it?** Create a free Postgres at
  <https://neon.tech> instead and paste its connection string into `DATABASE_URL` (and a
  second database's string into `TEST_DATABASE_URL`). Then skip this step. Nothing else in
  this guide changes.

---

## 6. Install dependencies

```powershell
npm install
```

This takes a few minutes. It also runs `prisma generate` automatically afterwards (the
`postinstall` script), which produces the typed Prisma client — if you ever see
`@prisma/client did not initialize yet`, that's the step that didn't run.

Then download the browser Playwright needs for end-to-end tests:

```powershell
npx playwright install chromium
```

(~150 MB. Skip only if you never intend to run the e2e suite.)

---

## 7. Create the database tables

```powershell
npx prisma migrate deploy
```

Expected output ends with `No pending migrations to apply.` or a list of applied
migrations. If it errors, your database isn't reachable — go back to section 5.

---

## 8. Run the app

```powershell
npm run dev
```

Within a second or two you'll see:

```
▲ Next.js 16.3.4 (Turbopack)
- Local:        http://localhost:3000
✓ Ready in 299ms
```

Open <http://localhost:3000>. Leave this terminal running — it's the server. Stop it with
<kbd>Ctrl</kbd>+<kbd>C</kbd>. Edits to files reload automatically.

If Windows Firewall pops up asking about Node.js, "Allow on private networks" is enough.

### Pages to check

| URL | Tool |
|---|---|
| `/` | Homepage — grid of all 9 tools |
| `/calculator` | Income tax calculator + rebate optimizer |
| `/tracker` | Income & investment tracker (the one feature that uses the database) |
| `/rates` | Bank FDR rate scorecard |
| `/freelance` | Freelance & IT remittance hub |
| `/instruments` | Real-yield instrument matrix |
| `/loans` | Loan & home EMI prepayment accelerator |
| `/zakat` | Zakat calculator |
| `/goals` | Life goals planner |
| `/salary` | Salary offer analyzer |
| `/videos` | Video content |
| `/admin/rates` | Admin — needs `ADMIN_SECRET`; `/admin/setup` creates the first account |

The UI is bilingual (Bangla/English) with a language toggle; Bangla is the default.

---

## 9. Run the tests

**Unit tests** (fast, no database, ~1 second):

```powershell
npm run test
```

Expect `119 passed`.

**Everything, in the right order** — this is the real pre-push check:

```powershell
npm run build
```

That chains four steps: unit tests → production build → end-to-end tests. Expect
`37 passed` at the end.

> **`npm run test:e2e` on its own will fail on a fresh clone.** The e2e suite starts a
> *production* server, so it needs `.next` to exist. Run `npm run build` at least once
> first. After that, `npm run test:e2e` works standalone.

**The e2e suite drops and recreates `takatalks_test` on every run.** That's by design and
only ever touches `TEST_DATABASE_URL`. Just never point that variable at anything you care
about.

Type-checking and linting:

```powershell
npx tsc --noEmit
npm run lint
```

---

## 10. Daily workflow, once set up

```powershell
cd C:\dev\TakaTalks
git pull                      # read git_instructions.md first, once
cd web
docker compose up -d          # no-op if already running
npm install                   # only when package.json changed
npx prisma migrate deploy     # only when prisma/migrations/ changed
npm run dev
```

Shutting down for the day: <kbd>Ctrl</kbd>+<kbd>C</kbd> the dev server. Leave Docker
running, or `docker compose stop` to free the memory (`docker compose down` also removes
the container but **keeps your data** in the volume).

See **`git_instructions.md`** for branching, commit messages, and the one-time history
cleanup you need to apply.

---

## 11. Troubleshooting

### `npm : File C:\Program Files\nodejs\npm.ps1 cannot be loaded because running scripts is disabled`

PowerShell's execution policy. See section 2.7, or use Command Prompt instead.

### `error during connect: ... The system cannot find the file specified` (any docker command)

The Docker engine isn't running. Launch Docker Desktop and wait for the tray whale to
settle.

### `Can't reach database server at localhost:55432`

In order of likelihood: Docker Desktop isn't running; the container is still `starting`
(`docker compose ps`); or you're in the repo root instead of `web/`, so `docker compose`
found no `docker-compose.yml`.

### `Error: P1000: Authentication failed`

Your `.env` has been edited away from the shipped defaults. The container's credentials
are `postgres` / `postgres` (set in `docker-compose.yml`), so `DATABASE_URL` must match.

### `bind: address already in use` on 55432, or port 3000 already taken

Something else is on the port. Find it:

```powershell
netstat -ano | findstr :3000
tasklist /FI "PID eq <the-pid-from-above>"
```

Either stop that process, or change the port — `npm run dev -- -p 3001` for the app; for
Postgres, edit the `ports:` line in `docker-compose.yml` and update `DATABASE_URL` and
`TEST_DATABASE_URL` to match.

### `@prisma/client did not initialize yet. Please run "prisma generate"`

```powershell
npx prisma generate
```

### `EPERM`, `EBUSY`, or "file in use" during `npm install`

Antivirus or a running dev server is holding the files. Stop the dev server, pause
real-time scanning briefly, and retry. If `node_modules` is wedged:

```powershell
rmdir /s /q node_modules
del package-lock.json
npm install
```

### `Executable doesn't exist at ...chrome-win\chrome.exe` when running e2e tests

```powershell
npx playwright install chromium
```

### Git shows every file as modified right after cloning

Line endings. See section 2.3, then re-normalize the working copy. **`git reset --hard`
discards uncommitted changes** — only do this on a fresh clone, or commit/stash first:

```powershell
git config --global core.autocrlf false
git rm --cached -r .
git reset --hard
```

### Everything is extremely slow

The repo is probably inside a OneDrive-synced folder, or your antivirus is scanning
`node_modules` on every read. Move the repo to `C:\dev\` and add an antivirus exclusion for
that folder.

### `wsl --install` says the feature isn't available

Virtualization is off in BIOS. See section 2.1.

---

## 12. Quick reference

| Thing | Value |
|---|---|
| Work from | `C:\dev\TakaTalks\web` |
| App URL | <http://localhost:3000> |
| Postgres | `localhost:55432`, user `postgres`, password `postgres` |
| Dev database | `takatalks` |
| Test database | `takatalks_test` (wiped every e2e run) |
| e2e server port | 3100 (transient) |
| Minimum Node | 20.9.0 |
| Start db / app | `docker compose up -d` / `npm run dev` |
| Full check | `npm run build` |
