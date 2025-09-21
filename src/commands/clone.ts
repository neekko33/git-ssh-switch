import chalk from 'chalk'
import path from 'path'
import { spawn } from 'child_process'
import { isInvalidRepoUrl } from '../utils/validate'
import { selectAccount, setLocalAccount } from '../utils/account'

export default async function cloneAction(repository: string, directory: string | undefined, otherArgs: string[]) {
  if (isInvalidRepoUrl(repository)) {
    throw new Error('Error: Invalid repository SSH format.')
  }

  const selectedAccount = await selectAccount()

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

  git.on('error', () => {
    throw new Error('Git clone failed. Please check the repository URL and your SSH configuration.')
  })

  git.on('close', code => {
    if (code === 0) {
      console.log(chalk.greenBright('Repository cloned successfully.'))
      // change the user.name and user.email for the cloned repo
      const repoDir = directory ?? path.basename(repository, '.git')
      setLocalAccount(selectedAccount, repoDir)
    } else {
      throw new Error(`Git clone process exited with code ${code ?? 1}.`)
    }
  })
}
