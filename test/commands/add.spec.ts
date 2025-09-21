import addAction from '../../src/commands/add'
import fs from 'fs-extra'
import { input } from '@inquirer/prompts'
import { parse, stringify } from 'ssh-config'

jest.mock('fs-extra')
jest.mock('@inquirer/prompts', () => ({ input: jest.fn() }))
jest.mock('ssh-config', () => ({
  __esModule: true,
  default: {},
  parse: jest.fn(),
  stringify: jest.fn((c: any) => String(c)),
}))

describe('commands/add', () => {
  beforeEach(() => jest.resetAllMocks())

  const answers = {
    username: 'u',
    email: 'u@x.com',
    sshKey: '/k',
    host: 'u.github.com',
  }

  function mockInputs(seq: string[]) {
    let i = 0
    ;(input as jest.Mock).mockImplementation(() => Promise.resolve(seq[i++]))
  }

  test('cancels when final confirm is n', async () => {
    mockInputs(['u', 'u@x.com', '/k', 'u.github.com', 'n'])
    await expect(addAction()).rejects.toThrow(/Operation cancelled by user/i)
  })

  test('adds new account and writes files', async () => {
    mockInputs(['u', 'u@x.com', '/k', 'u.github.com', 'y'])
    ;(fs.readJSON as any).mockResolvedValue([])
    ;(fs.readFile as any).mockResolvedValue('')
    ;(parse as jest.Mock).mockReturnValue({
      find: jest.fn(),
      append: jest.fn(),
      remove: jest.fn(),
    })
    ;(fs.writeJSON as any).mockResolvedValue(undefined)
    ;(fs.writeFile as any).mockResolvedValue(undefined)

    await addAction()

    expect(fs.writeJSON).toHaveBeenCalled()
    expect(fs.writeFile).toHaveBeenCalled()
  })

  test('overwrites existing account and ssh host when user agrees', async () => {
    mockInputs(['u', 'u@x.com', '/k', 'u.github.com', 'y', 'y', 'y'])
    ;(fs.readJSON as any).mockResolvedValue([
      { username: 'u', email: 'old@x.com', sshKey: '/k', host: 'u.github.com' },
    ])
    const cfg = {
      find: jest.fn(() => ({})),
      append: jest.fn(),
      remove: jest.fn(),
    }
    ;(fs.readFile as any).mockResolvedValue('something')
    ;(parse as jest.Mock).mockReturnValue(cfg)
    ;(fs.writeJSON as any).mockResolvedValue(undefined)
    ;(fs.writeFile as any).mockResolvedValue(undefined)

    await addAction()

    expect(cfg.remove).toHaveBeenCalledWith({ Host: 'u.github.com' })
  })
})
