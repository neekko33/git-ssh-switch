import fs from 'fs-extra'
import * as cp from 'child_process'
import os from 'os'
import path from 'path'
import { input } from '@inquirer/prompts'
import preCheck, { GIT_SSH_SWITCH_HEADER, GSS_CONFIG_PATH, SSH_CONFIG_PATH } from '../../src/utils/preCheck'

jest.mock('fs-extra')
jest.mock('@inquirer/prompts', () => ({ input: jest.fn() }))
jest.mock('child_process', () => ({ execSync: jest.fn() }))

const asFs = fs as unknown as jest.Mocked<typeof fs>

describe('utils/preCheck', () => {
  const home = '/home/user'

  beforeEach(() => {
    jest.resetAllMocks()
    jest.spyOn(os, 'homedir').mockReturnValue(home as any)
  })

  test('throws when git not installed', async () => {
    ;(cp.execSync as jest.Mock).mockImplementation(() => { throw new Error('no git') })
    await expect(preCheck()).rejects.toThrow('Git is not installed.')
  })

  test('throws when ~/.ssh dir missing', async () => {
    ;(cp.execSync as jest.Mock).mockImplementation(() => {})
    asFs.existsSync.mockImplementation((p: any) => {
      if (String(p) === path.join(home, '.ssh')) return false
      return false
    })
    await expect(preCheck()).rejects.toThrow('.ssh directory does not exist')
  })

  test('creates config.json when missing', async () => {
    ;(cp.execSync as jest.Mock).mockImplementation(() => {})
    asFs.existsSync.mockImplementation((p: any) => {
      const sshDir = path.join(home, '.ssh')
      if (String(p) === sshDir) return true
      if (String(p) === SSH_CONFIG_PATH) return true
      if (String(p) === GSS_CONFIG_PATH) return false
      return false
    })

    asFs.ensureFile.mockResolvedValue(undefined as any)
    asFs.writeJSON.mockResolvedValue(undefined as any)
    asFs.readFile.mockResolvedValue(GIT_SSH_SWITCH_HEADER + '\n')

    await preCheck()

    expect(asFs.ensureFile).toHaveBeenCalledWith(GSS_CONFIG_PATH)
    expect(asFs.writeJSON).toHaveBeenCalledWith(GSS_CONFIG_PATH, [])
  })

  test('creates ~/.ssh/config when missing and user agrees', async () => {
    ;(cp.execSync as jest.Mock).mockImplementation(() => {})
    asFs.existsSync.mockImplementation((p: any) => {
      const sshDir = path.join(home, '.ssh')
      if (String(p) === sshDir) return true
      if (String(p) === GSS_CONFIG_PATH) return true
      if (String(p) === SSH_CONFIG_PATH) return false
      return false
    })
    ;(input as jest.Mock).mockResolvedValue('y')
    asFs.ensureFile.mockResolvedValue(undefined as any)
    asFs.writeFile.mockResolvedValue(undefined as any)

    await preCheck()

    expect(asFs.ensureFile).toHaveBeenCalledWith(SSH_CONFIG_PATH)
    expect(asFs.writeFile).toHaveBeenCalledWith(SSH_CONFIG_PATH, GIT_SSH_SWITCH_HEADER + '\n\n')
  })

  test('backs up existing ~/.ssh/config without header after confirmation', async () => {
    ;(cp.execSync as jest.Mock).mockImplementation(() => {})
    asFs.existsSync.mockImplementation((p: any) => {
      const sshDir = path.join(home, '.ssh')
      if (String(p) === sshDir) return true
      if (String(p) === GSS_CONFIG_PATH) return true
      if (String(p) === SSH_CONFIG_PATH) return true
      return false
    })

    asFs.readFile.mockResolvedValue('not ours')
    ;(input as jest.Mock).mockResolvedValue('y')
    asFs.copy.mockResolvedValue(undefined as any)
    asFs.ensureFile.mockResolvedValue(undefined as any)
    asFs.writeFile.mockResolvedValue(undefined as any)

    await preCheck()

    expect(asFs.copy).toHaveBeenCalled()
    expect(asFs.ensureFile).toHaveBeenCalledWith(SSH_CONFIG_PATH)
    expect(asFs.writeFile).toHaveBeenCalledWith(SSH_CONFIG_PATH, GIT_SSH_SWITCH_HEADER + '\n\n')
  })
})
