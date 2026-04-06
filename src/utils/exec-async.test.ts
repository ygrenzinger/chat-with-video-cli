import { describe, expect, it } from 'vitest'
import { execFileAsync } from './exec-async.js'

describe('execFileAsync', () => {
  it('passes shell metacharacters as literal args', async () => {
    const args = [
      'semi;colon',
      '$(touch hacked)',
      '`backticks`',
      'a && b',
      'x | y'
    ]

    const { stdout, stderr } = await execFileAsync(process.execPath, [
      '-e',
      'process.stdout.write(JSON.stringify(process.argv.slice(1)))',
      ...args
    ])

    expect(JSON.parse(stdout)).toEqual(args)
    expect(stderr).toBe('')
  })
})
