import fs from 'fs-extra'
import chalk from 'chalk'
import path from 'path'
import { spawn, execSync } from 'child_process'
import { GSS_CONFIG_PATH } from '../utils/preCheck'
import { select } from '@inquirer/prompts'
import { GitAccount } from '../types'

export default async function cloneAction(repository: string, directory: string | undefined, otherArgs: string[]) {
  if (!repository) {
    throw new Error('Error: Repository URL is required.')
  }

  if (!/^git@.+:.+\/.+\.git$/.test(repository)) {
    throw new Error('Error: Repository URL must be in SSH format (e.g., git@github.com:user/repo.git)')
  }

  const accounts: GitAccount[] = await fs.readJSON(GSS_CONFIG_PATH).catch(() => [])
  if (accounts.length === 0) {
    throw new Error('No Git accounts found. Please add an account first.')
  }

  const answer = await select({
    message: 'Select a Git account for cloning:',
    choices: accounts.map(account => {
      return {
        name: account.username,
        value: account.username
      }
    })
  })

  const selectedAccount = accounts.find( account => account.username === answer)

  if (!selectedAccount) {
    throw new Error('Selected account not found.')
  }

  const sshUrl = repository.replace(/git@github\.com/, `git@${selectedAccount.host}`)
  
  const args = ['clone', sshUrl]

  if (directory) {
    args.push(directory)
  }

  if (otherArgs.length > 0) {
    args.push(...otherArgs)
  }

  console.log(chalk.blueBright(`Cloning ${sshUrl} using account ${selectedAccount.username}...`))

  const git = spawn('git', args, { stdio: 'inherit' })

  git.on('error', (error) => {
    throw new Error('Git clone failed. Please check the repository URL and your SSH configuration.')
  })

  git.on('close', code => {
    if (code === 0) {
      console.log(chalk.greenBright('Repository cloned successfully.'))
      // change the user.name and user.email for the cloned repo
      const repoDir = directory ?? path.basename(repository, '.git')
      const username = selectedAccount.username
      const email = selectedAccount.email

      try {
        execSync(`git config user.name "${username}"`, { cwd: repoDir, stdio: 'inherit' })
        execSync(`git config user.email "${email}"`, { cwd: repoDir, stdio: 'inherit' })
        console.log(chalk.greenBright(`Set user.name to "${username}" and user.email to "${email}" in ${repoDir}`))
      } catch {
        throw new Error(`Failed to set git config in ${repoDir}`)
      }

    } else {
      throw new Error(`Git clone process exited with code ${code ?? 1}.`)
    }
  })
}