describe('commands/clone', () => {
  beforeEach(() => jest.resetAllMocks())

  test('rejects invalid repo url', async () => {
    jest.resetModules()
    const mod = await import('../../src/commands/clone')
    await expect(mod.default('https://x', undefined, [])).rejects.toThrow('Invalid repository SSH format')
  })

  test('spawns git clone with args and succeeds', async () => {
    jest.resetModules()
    jest.doMock('../../src/utils/account', () => ({
      selectAccount: jest.fn(() => Promise.resolve({ username: 'u', email: 'e', sshKey: 'k', host: 'u.github.com' })),
      setLocalAccount: jest.fn(),
    }))
    const onHandlers: Record<string, Function> = {}
    jest.doMock('child_process', () => ({
      spawn: jest.fn(() => ({
        on: (evt: string, cb: Function) => { onHandlers[evt] = cb },
      })),
    }))

    const { default: cloneAction } = await import('../../src/commands/clone')
    const { spawn } = await import('child_process')
    const { setLocalAccount } = await import('../../src/utils/account') as any

    await cloneAction('git@github.com:me/repo.git', 'dir', ['--depth', '1'])
    // simulate close success
    onHandlers['close']?.(0)

    const args = (spawn as any).mock.calls[0][1]
    expect(args).toEqual(['clone', 'git@u.github.com:me/repo.git', 'dir', '--depth', '1'])
    expect(setLocalAccount).toHaveBeenCalled()
  })

  test('throws on spawn error', async () => {
    jest.resetModules()
    jest.doMock('../../src/utils/account', () => ({
      selectAccount: jest.fn(() => Promise.resolve({ username: 'u', email: 'e', sshKey: 'k', host: 'u.github.com' })),
      setLocalAccount: jest.fn(),
    }))
    const onHandlers: Record<string, Function> = {}
    jest.doMock('child_process', () => ({
      spawn: jest.fn(() => ({
        on: (evt: string, cb: Function) => { onHandlers[evt] = cb },
      })),
    }))

    const { default: cloneAction } = await import('../../src/commands/clone')

    await cloneAction('git@github.com:me/repo.git', undefined, [])
    expect(() => onHandlers['error']?.(new Error('spawn'))).toThrow(/Git clone failed/)
    expect(() => onHandlers['close']?.(1)).toThrow(/Git clone process exited/)
  })
})
