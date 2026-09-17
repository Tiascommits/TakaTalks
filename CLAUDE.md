# Branch rule — read before any git push/commit

`main` is protected. Do not commit or push to `main` directly, for any reason, unless the
user explicitly says the word "main" and asks for it by name.

All work — commits, pushes, PRs — goes to the `experimental` branch instead (it already
exists on `origin`; check it out with `git checkout experimental` if you don't have it
locally). `experimental` is a long-lived shared branch and is never deleted.

`experimental` only merges into `main` after a deliberate QA pass produces a written QA
report confirming it's ready. That merge is a decision for the user to make, not something
to do proactively.

Full workflow details: [`git_instructions.md`](git_instructions.md).
