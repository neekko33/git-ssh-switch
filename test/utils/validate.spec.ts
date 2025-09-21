import { isInvalidText, isInvalidEmail, isInvalidFilePath, isInvalidHostName, isInvalidRepoUrl } from '../../src/utils/validate'
import fs from 'fs'
import os from 'os'

jest.mock('fs')

describe('utils/validate', () => {
  describe('isInvalidText', () => {
    it('returns true for null/empty/whitespace', () => {
      expect(isInvalidText(null)).toBe(true)
      expect(isInvalidText('')).toBe(true)
      expect(isInvalidText('   ')).toBe(true)
    })

    it('returns false for non-empty', () => {
      expect(isInvalidText('abc')).toBe(false)
    })
  })

  describe('isInvalidEmail', () => {
    it('returns false when empty (delegates to text validity)', () => {
      expect(isInvalidEmail(null)).toBe(false)
      expect(isInvalidEmail('')).toBe(false)
      expect(isInvalidEmail('   ')).toBe(false)
    })

    it('validates email format', () => {
      expect(isInvalidEmail('a@b.com')).toBe(false)
      expect(isInvalidEmail('invalid@b')).toBe(true)
      expect(isInvalidEmail('no-at.com')).toBe(true)
    })
  })

  describe('isInvalidFilePath', () => {
    const existsSync = jest.spyOn(fs, 'existsSync')
    const homedir = jest.spyOn(os, 'homedir')

    beforeEach(() => {
      existsSync.mockReset()
      homedir.mockReturnValue('/home/user')
    })

    it('returns true for empty', () => {
      expect(isInvalidFilePath(null)).toBe(true)
      expect(isInvalidFilePath('')).toBe(true)
      expect(isInvalidFilePath('   ')).toBe(true)
    })

    it('expands ~ and checks existence', () => {
      existsSync.mockReturnValueOnce(true)
      expect(isInvalidFilePath('~/file')).toBe(false)
      expect(existsSync).toHaveBeenCalledWith('/home/user/file')
    })

    it('returns true when not exists', () => {
      existsSync.mockReturnValueOnce(false)
      expect(isInvalidFilePath('/not/exist')).toBe(true)
    })
  })

  describe('isInvalidHostName', () => {
    it('requires .github.com suffix', () => {
      expect(isInvalidHostName(null)).toBe(true)
      expect(isInvalidHostName('')).toBe(true)
      expect(isInvalidHostName('myhost')).toBe(true)
      expect(isInvalidHostName('user.github.com')).toBe(false)
    })
  })

  describe('isInvalidRepoUrl', () => {
    it('validates git ssh url', () => {
      expect(isInvalidRepoUrl(null)).toBe(true)
      expect(isInvalidRepoUrl('git@github.com:user/repo.git')).toBe(false)
      expect(isInvalidRepoUrl('https://github.com/user/repo.git')).toBe(true)
      expect(isInvalidRepoUrl('git@host:user/repo')).toBe(true)
    })
  })
})
