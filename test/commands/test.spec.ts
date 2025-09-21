import testAction from '../../src/commands/test'
import fs from 'fs-extra'
import { execSync } from 'child_process'

jest.mock('fs-extra')
jest.mock('child_process', () => ({ execSync: jest.fn() }))

describe('commands/test', () => {
  beforeEach(() => jest.resetAllMocks())

  test('prints message when no accounts', async () => {
    ;(fs.readJSON as any).mockResolvedValue([])
    await testAction()
    expect((console.log as any).mock.calls.join('\n')).toMatch(/No Git accounts found/)
  })

  test('executes ssh for each account', async () => {
    ;(fs.readJSON as any).mockResolvedValue([
      { username: 'u1', email: 'e1', sshKey: 'k1', host: 'u1.github.com' },
      { username: 'u2', email: 'e2', sshKey: 'k2', host: 'u2.github.com' },
    ])
    ;(execSync as jest.Mock).mockImplementation(() => {})
    await testAction()
    expect(execSync).toHaveBeenCalledTimes(2)
    expect((execSync as jest.Mock).mock.calls[0][0]).toMatch(/^ssh -T /)
  })
})
