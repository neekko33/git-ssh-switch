import chalk from 'chalk'
import { execSync } from 'child_process'
import path from 'path'
import os from 'os'
import fs from 'fs-extra'
import { input } from '@inquirer/prompts'

const GIT_SSH_SWITCH_HEADER = '# >>> Created by git-ssh-switch. Do not edit this line manually! <<<'

async function createSshConfigFile(sshConfigPath: string): Promise<void> {
  try {
    await fs.ensureFile(sshConfigPath)
    await fs.writeFile(
      sshConfigPath,
      GIT_SSH_SWITCH_HEADER + '\n\n'
    )
    console.log(chalk.greenBright(`Created .ssh/config file at ${sshConfigPath}.`))
  } catch {
    throw new Error(`Failed to create .ssh/config file at ${sshConfigPath}.`)
  }
}

export default async function preCheck(): Promise<void> {
  // Check if Git is installed
  try {
    execSync('git --version', { stdio: 'ignore' })
  } catch {
    throw new Error('Git is not installed!')
  }

  // Check if .ssh directory exists
  const sshDir = path.join(os.homedir(), '.ssh')
  if (!fs.existsSync(sshDir)) {
    throw new Error(
      `.ssh directory does not exist at ${sshDir}. Please create it and try again.`
    )
  }

  // Check if SSH config file exists, if not create it
  const sshConfigPath = path.join(sshDir, 'config')
  if (!fs.existsSync(sshConfigPath)) {
    const createConfigFile = await input({
      message: `.ssh/config file does not exist at ${sshConfigPath}. Do you want to create it? (Y/n)`,
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

    await createSshConfigFile(sshConfigPath)
  } else {
    try {
      const fileContent = await fs.readFile(sshConfigPath, 'utf-8')
      if (!fileContent.startsWith(GIT_SSH_SWITCH_HEADER)) {
        const createBackup = await input({
          message: `The existing .ssh/config file at ${sshConfigPath} was not created by git-ssh-switch. Do you want to back it up before proceeding? (Y/n)`,
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

        const backupPath = `${sshConfigPath}.backup-${Date.now()}`
        await fs.copy(sshConfigPath, backupPath)
        console.log(chalk.yellowBright(`Backed up existing config to ${backupPath}`))
        
        await createSshConfigFile(sshConfigPath)
      }
    } catch {
      throw new Error(`Failed to read or process the existing .ssh/config file at ${sshConfigPath}.`)
    }
  }
}
