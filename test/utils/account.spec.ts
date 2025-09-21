import chalk from 'chalk'
import { printAccountInfo, selectAccount, setLocalAccount } from '../../src/utils/account'
import fs from 'fs-extra'
import { select as inquirerSelect } from '@inquirer/prompts'
import { execSync } from 'child_process'
import { GSS_CONFIG_PATH } from '../../src/utils/preCheck'
import type { GitAccount } from '../../src/types'

jest.mock('fs-extra')
jest.mock('@inquirer/prompts', () => ({ select: jest.fn() }))
jest.mock('child_process', () => ({ execSync: jest.fn() }))

const mockAccounts: GitAccount[] = [
  { username: 'u1', email: 'u1@x.com', sshKey: '/k1', host: 'u1.github.com' },
  { username: 'u2', email: 'u2@x.com', sshKey: '/k2', host: 'u2.github.com' },
]

describe('utils/account', () => {
  beforeEach(() => {
    jest.resetAllMocks()
  })

  test('printAccountInfo prints formatted lines', () => {
    printAccountInfo(mockAccounts[0])
    // ensure it printed some lines; chalk is mocked via moduleNameMapper
    expect((console.log as any).mock.calls.length).toBeGreaterThan(0)
  })

  test('selectAccount returns selected', async () => {
    ;(fs.readJSON as any).mockResolvedValue(mockAccounts)
    ;(inquirerSelect as jest.Mock).mockResolvedValue('u2')
    const acc = await selectAccount()
    expect(acc.username).toBe('u2')
  })

  test('selectAccount throws when none', async () => {
    ;(fs.readJSON as any).mockResolvedValue([])
    await expect(selectAccount()).rejects.toThrow(/No Git accounts found/i)
  })

  test('selectAccount throws when missing selection', async () => {
    ;(fs.readJSON as any).mockResolvedValue(mockAccounts)
    ;(inquirerSelect as jest.Mock).mockResolvedValue('unknown')
    await expect(selectAccount()).rejects.toThrow(/Selected account not found/i)
  })

  test('setLocalAccount sets git config', () => {
    ;(execSync as jest.Mock).mockImplementation(() => {})
    setLocalAccount(mockAccounts[0], '/repo')
    expect(execSync).toHaveBeenCalledWith('git config user.name "u1"', { cwd: '/repo', stdio: 'inherit' })
    expect(execSync).toHaveBeenCalledWith('git config user.email "u1@x.com"', { cwd: '/repo', stdio: 'inherit' })
  })

  test('setLocalAccount throws on failure', () => {
    ;(execSync as jest.Mock).mockImplementationOnce(() => { throw new Error('fail') })
    expect(() => setLocalAccount(mockAccounts[0], '/repo')).toThrow(/Failed to set git config in \/repo/)
  })
})
