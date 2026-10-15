#!/usr/bin/env bash
# Runs every local check, prints a summary table, exits 1 if any step failed.
# --fast = typecheck, lint, stray files, unsafe HTML (skips tests and build).
# Not here: e2e (`npm run test:e2e` resets TEST_DATABASE_URL; CI runs it).
set -euo pipefail
cd "$(dirname "$0")/.."
FAST=0; [ "${1:-}" = "--fast" ] && FAST=1
names=(); results=()
step() { # name cmd...
  local n=$1; shift; echo "== $n"
  if "$@"; then results+=(pass); else results+=(FAIL); fi
  names+=("$n")
}
web() { (cd web && "$@"); }
stray() {
  local f; f=$(find . \( -path ./web/node_modules -o -path ./.git -o -path ./web/.next -o -path ./web/test-results -o -path ./web/playwright-report \) -prune -o \
    \( -name '*-e' -o -name '*.orig' -o -name '*.rej' -o -name '*.bak' \) -print)
  f+=$(git ls-files | grep -E '(^|/)\.env(\.local|\.production)?$' || true) # a committed secret file
  [ -z "$f" ] || { echo "$f"; return 1; }
}
unsafe_html() { # any raw-HTML sink in app code, unless the line says `// safe-html: <reason>`
  local hits; hits=$(grep -rnE 'innerHTML|outerHTML|insertAdjacentHTML|document\.write|dangerouslySetInnerHTML' \
    web/src web/scripts web/e2e 2>/dev/null | grep -v 'safe-html:' || true)
  [ -z "$hits" ] || { echo "$hits"; echo "unsafe HTML sink(s): render as text, or add '// safe-html: <reason>'" >&2; return 1; }
}
step "typecheck (tsc)" web npx tsc --noEmit
step "lint (eslint)" web npm run --silent lint
step "stray files" stray
step "unsafe HTML" unsafe_html
if [ "$FAST" = 0 ]; then
  step "unit tests (vitest)" web npm test --silent
  step "build (next build)" web npx next build
fi
echo; printf '%-30s | %s\n' step result; printf '%-30s-+-%s\n' "------------------------------" ------
fail=0
for i in "${!names[@]}"; do printf '%-30s | %s\n' "${names[$i]}" "${results[$i]}"; [ "${results[$i]}" = pass ] || fail=1; done
exit $fail
