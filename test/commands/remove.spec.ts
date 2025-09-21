import removeAction from '../../src/commands/remove'
import fs from 'fs-extra'
import { selectAccount } from '../../src/utils/account'
import { input } from '@inquirer/prompts'
import { parse, stringify } from 'ssh-config'

jest.mock('fs-extra')
jest.mock('../../src/utils/account', () => ({ selectAccount: jest.fn() }))
jest.mock('@inquirer/prompts', () => ({ input: jest.fn() }))
jest.mock('ssh-config', () => ({
  __esModule: true,
  parse: jest.fn(),
  stringify: jest.fn((c: any) => String(c)),
}))

describe('commands/remove', () => {
  beforeEach(() => jest.resetAllMocks())

  test('cancels when confirm is n', async () => {
    ;(selectAccount as jest.Mock).mockResolvedValue({ username: 'u', email: 'e', sshKey: 'k', host: 'u.github.com' })
    ;(input as jest.Mock).mockResolvedValue('n')
  await expect(removeAction()).rejects.toThrow(/Operation cancelled by user\.?/)
  })

  test('removes account and updates files', async () => {
    ;(selectAccount as jest.Mock).mockResolvedValue({ username: 'u', email: 'e', sshKey: 'k', host: 'u.github.com' })
    ;(input as jest.Mock).mockResolvedValue('y')
    ;(fs.readJSON as any).mockResolvedValue([
      { username: 'u', email: 'e', sshKey: 'k', host: 'u.github.com' },
      { username: 'v', email: 'e2', sshKey: 'k2', host: 'v.github.com' },
    ])
    const config = { remove: jest.fn() }
    ;(fs.readFile as any).mockResolvedValue('cfg')
    ;(parse as jest.Mock).mockReturnValue(config)
    ;(fs.writeJSON as any).mockResolvedValue(undefined)
    ;(fs.writeFile as any).mockResolvedValue(undefined)

    await removeAction()

    expect(config.remove).toHaveBeenCalledWith({ Host: 'u.github.com' })
    expect(fs.writeJSON).toHaveBeenCalled()
    expect(fs.writeFile).toHaveBeenCalled()
  })
})
