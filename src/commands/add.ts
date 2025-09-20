import { input } from '@inquirer/prompts'
import path from 'path'
import {
  isInvalidText,
  isInvalidEmail,
  isInvalidFilePath,
  isInvalidHostName,
} from '../utils/validate'
import os from 'os'
import chalk from 'chalk'
import type { GitAccount } from '../types'
import fs from 'fs-extra'
import SSHConfig, { parse, stringify } from 'ssh-config'
import {
  GSS_CONFIG_PATH,
  SSH_CONFIG_PATH,
  GIT_SSH_SWITCH_HEADER,
} from '../utils/preCheck'

function printAccountInfo(account: GitAccount) {
  Object.entries(account).forEach(([key, value]) => {
    console.log(
      chalk.yellowBright(`${key.charAt(0).toUpperCase() + key.slice(1)}: `),
      chalk.cyanBright(value)
    )
  })
  console.log('')
}

async function getAccountInfo(): Promise<GitAccount> {
  const username = await input({
    message: 'Enter the username for your Git account:',
    required: true,
    validate: value =>
      isInvalidText(value) ? 'Username cannot be empty!' : true,
  })

  const email = await input({
    message: 'Enter the email for your Git account:',
    required: true,
    validate: value => (isInvalidEmail(value) ? 'Invalid email format!' : true),
  })

  const sshKeyPath = await input({
    message: 'Enter the path to your SSH private key (e.g., ~/.ssh/id_rsa):',
    required: true,
    default: path.join(os.homedir(), '.ssh', 'id_rsa'),
    prefill: 'editable',
    validate: value =>
      isInvalidFilePath(value)
        ? 'File does not exist at the specified path!'
        : true,
  })

  const customHost = await input({
    message: `Enter a custom SSH host name (e.g., ${username}.github.com):`,
    required: true,
    default: `${username}.github.com`,
    prefill: 'editable',
    validate: value =>
      isInvalidHostName(value) ? 'Host name must end with .github.com' : true,
  })

  const newAccount: GitAccount = {
    username,
    email,
    sshKeyPath: sshKeyPath.replace(/^~(?=$|\/|\\)/, os.homedir()),
    customHost,
  }

  return newAccount
}

async function checkExistingAccount(
  accounts: GitAccount[],
  newAccount: GitAccount
) {
  const exists = accounts.some(
    account => account.username === newAccount.username
  )

  if (exists) {
    const confirm = await input({
      message:
        'An account with the same username already exists. Do you want to overwrite it? (Y/n)',
      required: true,
      validate: value => {
        const val = value.toLowerCase()
        return val === 'y' || val === 'n' || val === ''
          ? true
          : 'Please enter "y" or "n".'
      },
      default: 'Y',
    })

    if (confirm.toLowerCase() !== 'y') {
      throw new Error('Operation cancelled by user.')
    }

    // Remove the existing account
    const index = accounts.findIndex(
      account =>
        account.sshKeyPath === newAccount.sshKeyPath ||
        account.customHost === newAccount.customHost
    )
    if (index !== -1) {
      accounts.splice(index, 1)
    }
  }
}

async function checkExistingSshConfig(
  config: SSHConfig,
  newAccount: GitAccount
) {
  const existingHost = config.find({ Host: newAccount.customHost })
  if (existingHost) {
    const confirm = await input({
      message:
        'An ssh config with the same host already exists. Do you want to overwrite it? (Y/n)',
      required: true,
      validate: value => {
        const val = value.toLowerCase()
        return val === 'y' || val === 'n' || val === ''
          ? true
          : 'Please enter "y" or "n".'
      },
      default: 'Y',
    })
    if (confirm.toLowerCase() !== 'y') {
      throw new Error('Operation cancelled by user.')
    }
    // Remove the existing host config
    config.remove({ Host: newAccount.customHost })
  }

  return config
}

async function saveAccount(newAccount: GitAccount) {
  const accounts: GitAccount[] = await fs
    .readJSON(GSS_CONFIG_PATH)
    .catch(() => [])

  const sshConfig = await fs.readFile(SSH_CONFIG_PATH, 'utf8').catch(() => '')
  const parsedSshConfig = parse(sshConfig)

  await checkExistingAccount(accounts, newAccount)
  const updatedSshConfig = await checkExistingSshConfig(parsedSshConfig, newAccount)

  accounts.push(newAccount)
  updatedSshConfig.append({
    Host: newAccount.customHost,
    HostName: 'ssh.github.com',
    User: 'git',
    IdentityFile: newAccount.sshKeyPath,
    Port: '443',
  })

  try {
    await fs.writeJSON(GSS_CONFIG_PATH, accounts, { spaces: 2 })
    await fs.writeFile(SSH_CONFIG_PATH, stringify(updatedSshConfig) + '\n')
  } catch {
    throw new Error(
      `Failed to write to ${GSS_CONFIG_PATH} or ${SSH_CONFIG_PATH}.`
    )
  }
  console.log(chalk.greenBright('\nNew Git account added successfully!'))
}

export default async function addAction() {
  const newAccount = await getAccountInfo()

  console.log(chalk.blueBright('\nPlease confirm the following information:'))
  printAccountInfo(newAccount)

  const confirm = await input({
    message: 'Is the above information correct? (Y/n)',
    required: true,
    validate: value => {
      const val = value.toLowerCase()
      return val === 'y' || val === 'n' ? true : 'Please enter "y" or "n".'
    },
    default: 'Y',
  })

  if (confirm.toLowerCase() === 'n') {
    throw new Error('Operation cancelled by user.')
  }

  await saveAccount(newAccount)
}
