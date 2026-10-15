export const PROTECTED = ['main', 'master', 'live-prod']

export type Verdict = { deny: string } | null

const SHARED_TREE = 'run `git stash -u` first in the same command: a shared tree may hold another session\'s unrecoverable work.'

const tokens = (segment: string) =>
  (segment.trim().match(/"[^"]*"|'[^']*'|\S+/g) ?? []).map(t => t.replace(/^["']|["']$/g, ''))

type Git = { sub: string; rest: string[] }

const parseGit = (segment: string): Git | null => {
  const t = tokens(segment)
  let i = 0
  while (i < t.length && (/^\w+=/.test(t[i]!) || t[i] === 'sudo' || t[i] === 'command')) i += 1
  if (t[i] !== 'git') return null
  i += 1
  while (i < t.length && t[i]!.startsWith('-')) i += t[i] === '-C' || t[i] === '-c' ? 2 : 1
  const sub = t[i]
  return sub === undefined ? null : { sub, rest: t.slice(i + 1) }
}

const target = (refspec: string, branch: string | null) => {
  const dst = refspec.replace(/^\+/, '').split(':').at(-1)!.replace(/^refs\/heads\//, '')
  return dst === 'HEAD' ? branch : dst
}

const isProtected = (b: string | null | undefined, list: readonly string[]) =>
  b !== null && b !== undefined && list.includes(b)

const judgeOne = (
  { sub, rest }: Git,
  branch: string | null,
  list: readonly string[],
  isStashed: boolean,
): Verdict => {
  const onProtected = isProtected(branch, list)
  const flags = rest.filter(t => t.startsWith('-'))
  switch (sub) {
    case 'commit':
      if (flags.some(f => f === '--all' || /^-[a-zA-Z]*a[a-zA-Z]*$/.test(f)))
        return { deny: 'branch-guard: `git commit -a` is banned. Commit your own files with an explicit pathspec.' }
      return onProtected ? { deny: `branch-guard: you are on protected branch "${branch}". Switch to a working branch before committing.` } : null
    case 'merge':
    case 'rebase':
    case 'cherry-pick':
    case 'revert':
    case 'am':
      return onProtected ? { deny: `branch-guard: \`git ${sub}\` on protected branch "${branch}". Merge through the remote, and only when told.` } : null
    case 'pull':
      return onProtected && !flags.includes('--ff-only')
        ? { deny: `branch-guard: \`git pull\` on protected branch "${branch}" can create a merge. Use --ff-only.` }
        : null
    case 'push': {
      if (flags.some(f => f === '--delete' || f === '-d') || rest.some(t => t.startsWith(':')))
        return { deny: 'branch-guard: deleting a remote branch is banned.' }
      const refspecs = rest.filter(t => !t.startsWith('-')).slice(1)
      const hits = refspecs.length === 0 ? onProtected : refspecs.some(r => isProtected(target(r, branch), list))
      return hits ? { deny: `branch-guard: push to a protected branch (${list.join(', ')}). Push only when told, via a merge request.` } : null
    }
    case 'branch':
      return flags.some(f => f === '-d' || f === '-D' || f === '--delete')
        ? { deny: 'branch-guard: never delete a branch.' }
        : null
    case 'reset':
      return flags.includes('--hard') && !isStashed ? { deny: `branch-guard: \`git reset --hard\`: ${SHARED_TREE}` } : null
    case 'clean':
      return flags.some(f => /^-[a-zA-Z]*f/.test(f) || f === '--force') && !isStashed
        ? { deny: `branch-guard: \`git clean\`: ${SHARED_TREE}` }
        : null
    case 'checkout':
      return (rest.includes('--') || rest.includes('.')) && !isStashed
        ? { deny: `branch-guard: \`git checkout -- <path>\` discards changes: ${SHARED_TREE}` }
        : null
    default:
      return null
  }
}

export const mentionsGit = (command: string) => /\bgit\b/.test(command)

export const judge = (command: string, branch: string | null, list: readonly string[] = PROTECTED): Verdict => {
  let isStashed = false
  for (const segment of command.split(/&&|\|\||;|\||\n/)) {
    const git = parseGit(segment)
    if (git === null) continue
    if (git.sub === 'stash' && git.rest.some(t => t === '-u' || t === '--include-untracked')) {
      isStashed = true
      continue
    }
    const verdict = judgeOne(git, branch, list, isStashed)
    if (verdict !== null) return verdict
  }
  return null
}
