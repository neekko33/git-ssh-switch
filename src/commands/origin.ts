import { isInvalidRepoUrl } from "../utils/validate"
import { selectAccount, setLocalAccount } from "../utils/account"
import { execSync } from 'child_process'
import fs from 'fs-extra'
import chalk from "chalk"

export default async function originAction(repository: string): Promise<void> {
  if (!repository || isInvalidRepoUrl(repository)) {
    throw new Error('Invalid repository URL')
  }

  const selectedAccount = await selectAccount()
  const sshUrl = repository.replace(/git@github\.com/, `git@${selectedAccount.host}`)

  // Check if .git exists in the current directory
  if (!fs.existsSync('.git')) {
    throw new Error('No .git directory found. Please run this command in a Git repository.')
  }

  try {
    execSync('git remote remove origin', { stdio: 'ignore' })
    execSync(`git remote add origin ${sshUrl}`, { stdio: 'inherit' })
    console.log(chalk.greenBright(`Remote origin set to ${sshUrl}`))
  } catch {
    throw new Error('Failed to add remote origin. Please check your Git configuration.')
  }

  await setLocalAccount(selectedAccount, process.cwd())
}
