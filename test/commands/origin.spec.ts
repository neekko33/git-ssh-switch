import originAction from '../../src/commands/origin'
import fs from 'fs-extra'
import { execSync } from 'child_process'
import { selectAccount, setLocalAccount } from '../../src/utils/account'

jest.mock('fs-extra')
jest.mock('child_process', () => ({ execSync: jest.fn() }))
jest.mock('../../src/utils/account', () => ({
  selectAccount: jest.fn(),
  setLocalAccount: jest.fn(),
}))

describe('commands/origin', () => {
  beforeEach(() => jest.resetAllMocks())

  test('rejects invalid repository url', async () => {
    await expect(originAction('https://x')).rejects.toThrow('Invalid repository URL')
  })

  test('throws when no .git dir', async () => {
    ;(fs.existsSync as any).mockReturnValue(false)
    ;(selectAccount as jest.Mock).mockResolvedValue({ username: 'u', email: 'e', sshKey: 'k', host: 'u.github.com' })
    await expect(originAction('git@github.com:me/repo.git')).rejects.toThrow('No .git directory found')
  })

  test('sets origin and local account', async () => {
    ;(fs.existsSync as any).mockReturnValue(true)
    ;(selectAccount as jest.Mock).mockResolvedValue({ username: 'u', email: 'e', sshKey: 'k', host: 'u.github.com' })
    ;(execSync as jest.Mock).mockImplementation(() => {})
    await originAction('git@github.com:me/repo.git')
    expect(execSync).toHaveBeenCalledWith('git remote remove origin', { stdio: 'ignore' })
    expect(execSync).toHaveBeenCalledWith('git remote add origin git@u.github.com:me/repo.git', { stdio: 'inherit' })
    expect(setLocalAccount).toHaveBeenCalled()
  })

  test('throws when git remote add fails', async () => {
    ;(fs.existsSync as any).mockReturnValue(true)
    ;(selectAccount as jest.Mock).mockResolvedValue({ username: 'u', email: 'e', sshKey: 'k', host: 'u.github.com' })
    ;(execSync as jest.Mock)
      .mockImplementationOnce(() => {}) // remove
      .mockImplementationOnce(() => { throw new Error('fail') }) // add
    await expect(originAction('git@github.com:me/repo.git')).rejects.toThrow('Failed to add remote origin')
  })
})
