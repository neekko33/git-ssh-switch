import localAction from '../../src/commands/local'
import fs from 'fs-extra'
import { selectAccount, setLocalAccount } from '../../src/utils/account'

jest.mock('fs-extra')
jest.mock('../../src/utils/account', () => ({
  selectAccount: jest.fn(),
  setLocalAccount: jest.fn(),
}))

describe('commands/local', () => {
  beforeEach(() => jest.resetAllMocks())

  test('throws when not a git repo', async () => {
    ;(fs.existsSync as any).mockReturnValue(false)
  await expect(localAction()).rejects.toThrow(/This directory is not a Git repository\.?/)
  })

  test('sets local account when .git exists', async () => {
    ;(fs.existsSync as any).mockReturnValue(true)
    ;(selectAccount as jest.Mock).mockResolvedValue({ username: 'u', email: 'e', sshKey: 'k', host: 'u.github.com' })
    await localAction()
    expect(setLocalAccount).toHaveBeenCalled()
  })
})
