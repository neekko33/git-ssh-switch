import chalk from 'chalk'
import type { GitAccount } from '../types'

export function printAccountInfo(account: GitAccount) {
  Object.entries(account).forEach(([key, value]) => {
    console.log(
      chalk.yellowBright(`${key.charAt(0).toUpperCase() + key.slice(1)}: `),
      chalk.cyanBright(value)
    )
  })
  console.log('')
}