import type { EngineInterface, Register } from 'claude-code'

import { PROTECTED, judge, mentionsGit } from './rules'

const currentBranch = async ($: EngineInterface) => {
  const r = await $.process.run(['git', 'branch', '--show-current']).catch(() => undefined)
  const name = r?.exitCode === 0 ? r.stdout.trim() : ''
  return name === '' ? null : name
}

const showBranch = async ($: EngineInterface) => {
  const branch = await currentBranch($)
  if (branch === null) return $.ui.status(undefined)
  $.ui.status(PROTECTED.includes(branch) ? `${branch} (protected)` : branch)
}

export const register: Register = on => {
  on('tool.call', { tool: 'Bash' }, async ($, e, next) => {
    if (!mentionsGit(e.command)) return next(e)
    const verdict = judge(e.command, await currentBranch($))
    if (verdict !== null) {
      $.ui.toast(verdict.deny.replace('branch-guard: ', 'Blocked: '))
      return verdict
    }
    const ran = await next(e)
    await showBranch($)
    return ran
  }).catch(($, e, next) =>
    next.called ? next(e) : { deny: `${$.plugin.name}: its guard failed, so the command was held.` },
  )

  on('session.start', async ($, e, next) => {
    await showBranch($)
    return next(e)
  })

  on('turn.complete', async ($, e, next) => {
    await showBranch($)
    return next(e)
  })
}
