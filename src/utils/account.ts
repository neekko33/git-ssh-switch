import chalk from 'chalk'
import type { GitAccount } from '../types'
import fs from 'fs-extra'
import { GSS_CONFIG_PATH } from './preCheck'
import { select } from '@inquirer/prompts'
import { execSync } from 'child_process'

export function printAccountInfo(account: GitAccount) {
  Object.entries(account).forEach(([key, value]) => {
    console.log(
      chalk.yellowBright(`${key.charAt(0).toUpperCase() + key.slice(1)}: `),
      chalk.cyanBright(value)
    )
  })
  console.log('')
}

export async function selectAccount(): Promise<GitAccount> {
  const accounts: GitAccount[] = await fs.readJSON(GSS_CONFIG_PATH).catch(() => [])
  if (accounts.length === 0) {
    throw new Error('No Git accounts found. Please add an account first.')
  }

  const answer = await select({
    message: 'Select a Git account:',
    choices: accounts.map(account => {
      return {
        name: account.username,
        value: account.username
      }
    })
  })

  const selectedAccount = accounts.find(account => account.username === answer)

  if (!selectedAccount) {
    throw new Error('Selected account not found.')
  }

  return selectedAccount

}

export function setLocalAccount(selectedAccount: GitAccount, path: string): void {
  const username = selectedAccount.username
  const email = selectedAccount.email

  try {
    execSync(`git config user.name "${username}"`, { cwd: path, stdio: 'inherit' })
    execSync(`git config user.email "${email}"`, { cwd: path, stdio: 'inherit' })
    console.log(chalk.greenBright(`Set user.name to "${username}" and user.email to "${email}" in ${path}`))
  } catch {
    throw new Error(`Failed to set git config in ${path}`)
  }

}
