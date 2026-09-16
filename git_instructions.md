# Git instructions for this repo

Read the first section today. The rest is the normal workflow and a troubleshooting list.

Repo: <https://github.com/Tiascommits/TakaTalks.git> · default branch: `main`

---

## 1. READ FIRST: `main` history was rewritten on 16 Sep 2026

A commit on `main` had the placeholder message `"Your commit message here"`. It has been
given a real message, which means **its hash changed, and so did the hash of every commit
after it**. `main` was then force-pushed.

- `c08b153 "Your commit message here"` → `1c1e486 "Add TakaTalks brand assets"`
- `origin/main` now ends at `8929cd3`

**Nothing was lost.** Only commit messages and hashes changed — the files are byte-for-byte
identical to before (verified with `git diff` between the old and new tips, which came back
empty, and both sides have the same 30 commits). Author names were preserved too.

But if you already had `main` checked out, your local `main` and the remote have now
diverged, and **`git pull` will try to merge the old history back in**. Don't do that. Pick
the case below that matches you.

### Case A — you have no local changes and no unpushed commits

The common case. Just take the new history:

```bash
git fetch origin
git status                      # confirm "nothing to commit, working tree clean"
git checkout main
git reset --hard origin/main
```

### Case B — you have uncommitted changes you want to keep

```bash
git stash push -u -m "my wip"   # -u also stashes new untracked files
git fetch origin
git checkout main
git reset --hard origin/main
git stash pop                   # resolve conflicts here if any appear
```

### Case C — you have your own commits on `main` that were never pushed

Don't reset — you'd delete them. Copy them onto the new history instead. The reliable
route, because you see each step:

```bash
git fetch origin
git branch my-work-backup                 # safety net: your commits are also on this branch now
git log --oneline e1ffead..main           # THIS is the list of commits that are yours
git reset --hard origin/main
git cherry-pick <your-commit-hashes, oldest first>
```

`e1ffead` was the old tip of `origin/main` before the rewrite, so anything after it is
yours. If that command lists nothing, you're actually in Case A.

The one-liner equivalent, if you're comfortable with rebase:

```bash
git rebase --onto origin/main e1ffead main
```

Once you've confirmed your work is on the new `main`, delete the backup:
`git branch -D my-work-backup`.

### Case D — you have a feature branch off the old `main`

Rebase it onto the new `main`:

```bash
git fetch origin
git checkout my-branch
git log --oneline e1ffead..my-branch      # your commits, if you branched off the old main tip
git rebase --onto origin/main e1ffead my-branch
```

If you branched off something older than `e1ffead`, find your real starting point with
`git merge-base my-branch e1ffead` and use that in place of `e1ffead` above. If the rebase
stops on a conflict, fix the files, `git add` them, then `git rebase --continue`; or
`git rebase --abort` to get back to where you started and ask for help.

### How to tell it worked

```bash
git log --oneline -1            # should print 8929cd3 (or later, if more has landed)
git log --oneline | grep "Your commit message here"    # should print nothing
```

If you get stuck, **stop before running anything destructive** and ask — a wrong
`reset --hard` is the only way to actually lose work here.

---

## 2. Normal workflow

`main` is the deployed branch. Work on a branch, open a PR, don't commit straight to `main`.

```bash
git checkout main
git pull                              # fast-forward; safe once you've done section 1
git checkout -b short-descriptive-name

# ... make changes, then from web/:  npm run test  (and npm run build before anything big)

git add -A
git commit                            # see message rules below
git push -u origin short-descriptive-name
gh pr create                          # or open the PR on github.com
```

### Commit messages

- First line: imperative mood, under ~72 characters, no trailing period.
  `Add IFIC Bank FDR rate scraper`, not `added scraper.` or `Update files`.
- Then a blank line, then **why**, wrapped at ~72 characters. The diff already shows what
  changed; the message should explain what it's for and anything surprising about it.
- **Never leave the template text.** `git commit` with no `-m` opens an editor — replace
  the placeholder. That's the exact mistake section 1 exists to clean up.

### Before you commit, always

- `git status` and `git diff --staged` — read what you're actually committing.
- Never commit secrets. `web/.env` is gitignored (`.env*` in `web/.gitignore`, with
  `.env.example` as the one exception). If you add a new environment variable, document it
  in `web/.env.example` with an empty or placeholder value — never the real one.
- Don't commit `node_modules/`, `.next/`, `test-results/`, or `playwright-report/`. All
  already ignored.

### Never force-push a shared branch without telling people

Section 1 is what it costs everyone else. If it's genuinely necessary:

1. Say so in the team channel first.
2. Use `git push --force-with-lease`, never bare `--force`. It refuses to run if someone
   else pushed in the meantime, instead of silently destroying their commit.

---

## 3. Troubleshooting

### "You have not agreed to the Xcode license agreements" (macOS)

Every git command fails. `git` is routed through full Xcode, whose licence hasn't been
accepted. Either:

```bash
sudo xcodebuild -license                                    # accept it, or
sudo xcode-select --switch /Library/Developer/CommandLineTools   # sidestep Xcode entirely
```

This happened on this project already and blocked all commits for a session.

### `git pull` produced a merge commit or a pile of conflicts

You probably pulled across the rewrite. `git merge --abort` (or
`git rebase --abort`), then go back to section 1.

### "Updates were rejected because the tip of your current branch is behind"

Someone pushed before you. `git pull --rebase` then push again. Don't reach for `--force`.

### I committed to `main` by accident and haven't pushed

```bash
git branch my-work                # keep the commit on a branch
git reset --hard origin/main      # put main back
git checkout my-work
```

### I committed a secret

Tell the team and **rotate the secret immediately** — assume it's compromised the moment
it's pushed. Removing it from history afterwards doesn't undo the exposure.

### Which Windows line-ending setting?

This repo has no `.gitattributes`, so set it per-machine before your first commit to avoid
whole-file "everything changed" diffs:

```bash
git config --global core.autocrlf false
```

See `SETUP_ON_DEVICE.md` for the rest of the Windows setup.
