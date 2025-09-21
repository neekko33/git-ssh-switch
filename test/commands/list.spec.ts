import listAction from '../../src/commands/list'
import fs from 'fs-extra'

jest.mock('fs-extra')

describe('commands/list', () => {
  beforeEach(() => jest.resetAllMocks())

  test('prints no account message when empty', async () => {
    ;(fs.readJSON as any).mockResolvedValue([])
    await listAction()
    expect((console.log as any).mock.calls.join('\n')).toMatch(/No Git accounts found/)
  })

  test('prints count and account info', async () => {
    ;(fs.readJSON as any).mockResolvedValue([
      { username: 'u', email: 'e', sshKey: 'k', host: 'u.github.com' },
    ])
    await listAction()
    const output = (console.log as any).mock.calls.flat().join('\n')
    expect(output).toMatch(/Found 1 Git account/)
    expect(output).toMatch(/Username:/)
  })
})
