@AGENTS.md

# Branch rule — read before any git push/commit

`main` is protected — do not commit or push to it directly, for any reason, unless the user
explicitly says "main" and asks for it by name. All work goes to `experimental` instead (it
already exists on `origin`). `experimental` is long-lived and never deleted; it only merges
into `main` after a deliberate QA pass produces a written QA report, and that merge is the
user's call, not something to do proactively. Full details: `../git_instructions.md`.
