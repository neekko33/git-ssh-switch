import { input } from "@inquirer/prompts"
import { selectAccount } from "../utils/account"
import fs from "fs-extra"
import { GSS_CONFIG_PATH, SSH_CONFIG_PATH } from "../utils/preCheck"
import { GitAccount } from "../types"
import { parse, stringify } from "ssh-config"
import chalk from "chalk"

export default async function removeAction() {
  const selectedAccount = await selectAccount()
  const confirm = await input({
    message: 'Are you sure you want to remove the account ' + selectedAccount.username + '? (y/N)',
    default: 'N',
    required: true,
    validate: (value) => {
      const val = value.trim().toLowerCase()
      return val === 'y' || val === 'n' ? true : 'Please enter y or n'
    },
  })

  if (confirm.trim().toLowerCase() === 'n') {
    throw new Error('Operation cancelled by user.')
  }

  try {
    const configJson = await fs.readJSON(GSS_CONFIG_PATH) as GitAccount[]
    const sshConfigFile = await fs.readFile(SSH_CONFIG_PATH, 'utf-8')
    const config = parse(sshConfigFile)

    configJson.splice(configJson.findIndex(acc => acc.username === selectedAccount.username), 1)
    config.remove({ Host: selectedAccount.host })

    await fs.writeJSON(GSS_CONFIG_PATH, configJson, { spaces: 2 })
    await fs.writeFile(SSH_CONFIG_PATH, stringify(config))

    console.log(chalk.greenBright(`Removed account ${selectedAccount.username} successfully.`))
  } catch {
    throw new Error('Failed to update configuration file.')
  }
}
