import path from 'path'
import { SSH_CONFIG_PATH, GSS_CONFIG_PATH } from '../../src/utils/preCheck'

describe('commands/reset', () => {
  beforeEach(() => jest.resetAllMocks())

  test('throws when user cancels', async () => {
    jest.resetModules()
    jest.doMock('@inquirer/prompts', () => ({ __esModule: true, input: jest.fn(() => Promise.resolve('n')) }))
    const mod = await import('../../src/commands/reset')
    await expect(mod.default()).rejects.toThrow(/Operation cancelled by user\.?/)
  })

  test('removes files and restores latest backup', async () => {
    jest.resetModules()
    jest.doMock('@inquirer/prompts', () => ({ __esModule: true, input: jest.fn(() => Promise.resolve('y')) }))
    const fsMocks = {
      removeSync: jest.fn(),
      readdirSync: jest.fn(() => ['config.backup-1', 'config.backup-2']),
      copySync: jest.fn(),
      ensureFile: jest.fn(),
      writeJSON: jest.fn(),
      readFile: jest.fn(),
      writeFile: jest.fn(),
      readJSON: jest.fn(),
      existsSync: jest.fn(),
    }
    jest.doMock('fs-extra', () => ({ __esModule: true, default: fsMocks, ...fsMocks }))

    const mod = await import('../../src/commands/reset')
    await mod.default()

    const dir = SSH_CONFIG_PATH.replace('/config', '')
    const fsExtra = await import('fs-extra') as any
    expect(fsExtra.removeSync).toHaveBeenCalledWith(GSS_CONFIG_PATH.replace('/config.json', ''))
    expect(fsExtra.removeSync).toHaveBeenCalledWith(SSH_CONFIG_PATH)
    expect(fsExtra.copySync).toHaveBeenCalledWith(path.join(dir, 'config.backup-2'), SSH_CONFIG_PATH)
  })
})
