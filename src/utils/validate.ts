import fs from 'fs'
import os from 'os'

export function isInvalidText(text: string | null): boolean {
  return !text || text.trim().length === 0
}

export function isInvalidEmail(email: string | null): boolean {
  if (isInvalidText(email)) return false
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return !emailRegex.test(email as string)
}

export function isInvalidFilePath(filePath: string | null): boolean {
  if (isInvalidText(filePath)) return true
  const path = filePath?.replace(/^~(?=$|\/|\\)/, os.homedir()) as string
  return !fs.existsSync(path)
}

export function isInvalidHostName(hostname: string | null): boolean {
  if (isInvalidText(hostname)) return true
  return hostname?.trim().endsWith('.github.com') === false
}

export function isInvalidRepoUrl(url: string | null): boolean {
  if (isInvalidText(url)) return true
  return !/^git@.+:.+\/.+\.git$/.test(url as string)
}