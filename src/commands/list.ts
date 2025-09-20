import fs from 'fs-extra'
import chalk from 'chalk'

import type { GitAccount } from '../types'
import { GSS_CONFIG_PATH } from '../utils/preCheck'
import { printAccountInfo } from '../utils/account'

export default async function listAction() {
  const accounts: GitAccount[] = await fs.readJSON(GSS_CONFIG_PATH).catch(() => [])
  if (accounts.length === 0) {
    console.log(chalk.yellowBright('No Git accounts found.'))
    return
  }
  console.log(chalk.greenBright(`Found ${accounts.length} Git account(s):\n`))
  accounts.forEach(account => {
    printAccountInfo(account)
  })
}
