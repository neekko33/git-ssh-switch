import chalk from 'chalk'
import { execSync } from 'child_process'
import path from 'path'
import os from 'os'
import fs from 'fs-extra'
import { input } from '@inquirer/prompts'

export const GIT_SSH_SWITCH_HEADER = '# >>> Created by git-ssh-switch. Do not edit this line manually! <<<'
export const GSS_CONFIG_PATH = path.join(os.homedir(), '.gss', 'config.json')
export const SSH_CONFIG_PATH = path.join(os.homedir(), '.ssh', 'config')

async function createSshConfigFile(): Promise<void> {
  try {
    await fs.ensureFile(SSH_CONFIG_PATH)
    await fs.writeFile(
      SSH_CONFIG_PATH,
      GIT_SSH_SWITCH_HEADER + '\n\n'
    )
    console.log(chalk.greenBright(`Created .ssh/config file at ${SSH_CONFIG_PATH}.`))
  } catch {
    throw new Error(`Failed to create .ssh/config file at ${SSH_CONFIG_PATH}.`)
  }
}

export default async function preCheck(): Promise<void> {
  // Check if Git is installed
  try {
    execSync('git --version', { stdio: 'ignore' })
  } catch {
    throw new Error('Git is not installed.')
  }

  // Check if .ssh directory exists
  const sshDir = path.join(os.homedir(), '.ssh')
  if (!fs.existsSync(sshDir)) {
    throw new Error(
      `.ssh directory does not exist at ${sshDir}.`
    )
  }

  // Check if config file exists
  if (!fs.existsSync(GSS_CONFIG_PATH)) {
    try {
      await fs.ensureFile(GSS_CONFIG_PATH)
      console.log(chalk.greenBright(`Created configuration file at ${GSS_CONFIG_PATH}`))
    } catch {
      throw new Error(`Failed to create configuration file at ${GSS_CONFIG_PATH}`)
    }
  }

  // Check if SSH file exists, if not create it
  if (!fs.existsSync(SSH_CONFIG_PATH)) {
    const createConfigFile = await input({
      message: `.ssh/config file does not exist at ${SSH_CONFIG_PATH}. Do you want to create it? (Y/n)`,
      required: true,
      default: 'Y',
      validate: value => {
        const val = value.trim().toLowerCase()
        return val === 'y' || val === 'n' ? true : 'Please enter y or n'
      },
      prefill: 'tab',
    })

    if (createConfigFile.trim().toLowerCase() === 'n')
      throw new Error('.ssh/config file is required to proceed.')

    await createSshConfigFile()
  } else {
    try {
      const fileContent = await fs.readFile(SSH_CONFIG_PATH, 'utf-8')
      if (!fileContent.startsWith(GIT_SSH_SWITCH_HEADER)) {
        const createBackup = await input({
          message: `The existing .ssh/config file at ${SSH_CONFIG_PATH} was not created by git-ssh-switch. Do you want to back it up before proceeding? (Y/n)`,
          required: true,
          default: 'Y',
          validate: value => {
            const val = value.trim().toLowerCase()
            return val === 'y' || val === 'n' ? true : 'Please enter y or n'
          },
          prefill: 'tab',
        })
        if (createBackup.trim().toLowerCase() === 'n')
          throw new Error('Cannot proceed without backing up the existing config file.')

        const backupPath = `${SSH_CONFIG_PATH}.backup-${Date.now()}`
        await fs.copy(SSH_CONFIG_PATH, backupPath)
        console.log(chalk.yellowBright(`Backed up existing config to ${backupPath}`))
        
        await createSshConfigFile()
      }
    } catch {
      throw new Error(`Failed to read or process the existing .ssh/config file at ${SSH_CONFIG_PATH}.`)
    }
  }
}
