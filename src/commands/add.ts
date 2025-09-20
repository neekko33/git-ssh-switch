import { input } from '@inquirer/prompts'
import path from 'path'
import os from 'os'
import chalk from 'chalk'
import fs from 'fs-extra'
import SSHConfig, { parse, stringify } from 'ssh-config'

import {
  isInvalidText,
  isInvalidEmail,
  isInvalidFilePath,
  isInvalidHostName,
} from '../utils/validate'
import {
  GSS_CONFIG_PATH,
  SSH_CONFIG_PATH,
  GIT_SSH_SWITCH_HEADER,
} from '../utils/preCheck'
import { printAccountInfo } from '../utils/account'
import type { GitAccount } from '../types'

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

  const sshKey = await input({
    message: 'Enter the path to your SSH private key (e.g., ~/.ssh/id_rsa):',
    required: true,
    default: path.join(os.homedir(), '.ssh', 'id_rsa'),
    prefill: 'editable',
    validate: value =>
      isInvalidFilePath(value)
        ? 'File does not exist at the specified path!'
        : true,
  })

  const host = await input({
    message: `Enter a custom SSH host (e.g., ${username}.github.com):`,
    required: true,
    default: `${username}.github.com`,
    prefill: 'editable',
    validate: value =>
      isInvalidHostName(value) ? 'Host name must end with .github.com' : true,
  })

  const newAccount: GitAccount = {
    username,
    email,
    sshKey: sshKey.replace(/^~(?=$|\/|\\)/, os.homedir()),
    host,
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
        account.sshKey === newAccount.sshKey ||
        account.host === newAccount.host
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
  const existingHost = config.find({ Host: newAccount.host })
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
    config.remove({ Host: newAccount.host })
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
  const updatedSshConfig = await checkExistingSshConfig(
    parsedSshConfig,
    newAccount
  )

  accounts.push(newAccount)
  updatedSshConfig.append({
    Host: newAccount.host,
    HostName: 'ssh.github.com',
    User: 'git',
    IdentityFile: newAccount.sshKey,
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
