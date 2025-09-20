import { GSS_CONFIG_PATH } from '../utils/preCheck'
import fs from 'fs-extra'
import chalk from 'chalk'
import type { GitAccount } from '../types'
import { execSync } from 'child_process'

export default async function testAction() {
  const accounts: GitAccount[] = await fs
    .readJSON(GSS_CONFIG_PATH)
    .catch(() => [])
  if (accounts.length === 0) {
    console.log(chalk.yellowBright('No Git accounts found.'))
    return
  }

  accounts.forEach(account => {
    console.log(
      chalk.blueBright(`\nTesting connection for account: ${account.username}`)
    )
    try {
      execSync(`ssh -T ${account.host}`, { stdio: 'inherit' })
    } catch {}
  })
}
