import fs from 'fs-extra'
import { GSS_CONFIG_PATH, SSH_CONFIG_PATH } from '../utils/preCheck'
import { input } from '@inquirer/prompts'
import chalk from 'chalk'
import path from 'path'

export default async function resetAction() {
  const confirm = await input({
    message: 'Are you sure you want to reset all configurations? This will delete all accounts and restore the SSH config file. (y/N)',
    default: 'N',
    required: true,
    validate: (value) => {
      const val = value.trim().toLowerCase()
      return val === 'y' || val === 'n' ? true : 'Please enter y or n'
    }
  })

  if (confirm.trim().toLowerCase() === 'n') {
    throw new Error('Operation cancelled by user.')
  }

  try {
    fs.removeSync(GSS_CONFIG_PATH.replace('/config.json', ''))
    fs.removeSync(SSH_CONFIG_PATH)

    console.log(chalk.greenBright('All configurations have been reset successfully.'))
  } catch {
    throw new Error('Failed to delete configuration files.')
  }

  // Restore the backup SSH config if it exists
  const sshConfigDir = SSH_CONFIG_PATH.replace('/config', '')
  const backupFiles = fs.readdirSync(sshConfigDir).filter(file => file.startsWith('config.backup'))

  if (!backupFiles.length) {
    console.log(chalk.greenBright('No backup SSH config file found.\nReset successful.'))
  }

  const newestBackup = backupFiles.sort().reverse()[0]

  if (!newestBackup) {
    throw new Error('Failed to find the newest backup file.')
  }

  try {
    fs.copySync(path.join(sshConfigDir, newestBackup), SSH_CONFIG_PATH)
    console.log(chalk.greenBright(`Restored SSH config from backup: ${newestBackup}.\nReset successful.`))
  } catch {
    throw new Error('Failed to restore SSH config from backup.')
  }
}

