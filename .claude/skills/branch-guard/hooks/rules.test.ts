import { expect, test } from 'claude-code/testing'

import { judge } from './rules'

const denied = (c: string, b: string | null) => judge(c, b) !== null

test('commit on protected branch is denied, on a working branch allowed', () => {
  expect(denied('git commit -m "x"', 'live-prod')).toBe(true)
  expect(denied('git commit -m "x"', 'experimental')).toBe(false)
})

test('commit -a is denied everywhere', () => {
  expect(denied('git commit -am "x"', 'feature')).toBe(true)
  expect(denied('git commit --all -m x', 'feature')).toBe(true)
  expect(denied('git add a.ts && git commit -m "x"', 'feature')).toBe(false)
})

test('push targets', () => {
  expect(denied('git push', 'main')).toBe(true)
  expect(denied('git push origin HEAD:live-prod', 'feature')).toBe(true)
  expect(denied('git push origin feature', 'feature')).toBe(false)
  expect(denied('git push origin --delete feature', 'feature')).toBe(true)
})

test('branch deletion and destructive resets', () => {
  expect(denied('git branch -D old', 'feature')).toBe(true)
  expect(denied('git reset --hard HEAD~1', 'feature')).toBe(true)
  expect(denied('git clean -fd', 'feature')).toBe(true)
  expect(denied('git checkout -- src/a.ts', 'feature')).toBe(true)
})

test('a stash -u earlier in the same command lifts the stash rule', () => {
  expect(denied('git stash -u && git reset --hard', 'feature')).toBe(false)
})

test('global options and non-git commands', () => {
  expect(denied('git -C ../x commit -m y', 'main')).toBe(true)
  expect(denied('echo git commit', 'main')).toBe(false)
  expect(denied('git status', 'main')).toBe(false)
})
