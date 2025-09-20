#!/usr/bin/env node
import { Command } from 'commander'
import chalk from 'chalk'

import addAction from '../commands/add'
import preCheck from '../utils/preCheck'
import listAction from '../commands/list'
import testAction from '../commands/test'

const program = new Command()

program
  .name('gss')
  .description('Git SSH Switch CLI: manage multiple Git accounts')
  .version('0.1.0')

program.hook('preAction', async () => {
  try {
    await preCheck()
    console.log(chalk.greenBright('Pre-checks passed.\n'))
  } catch (error: Error | any) {
    console.error(chalk.redBright(error.message))
    process.exit(1)
  }
})

program
  .command('add')
  .description('Add a new Git SSH configuration')
  .action(async () => {
    try {
      await addAction()
    } catch (error: Error | any) {
      console.error(chalk.redBright(error.message))
      process.exit(1)
    }
  })

program
  .command('ls')
  .description('List all Git SSH configurations')
  .action(listAction)

program
  .command('test')
  .description('Test ssh connection for each account')
  .action(async () => {
    try {
      await testAction()
    } catch (error: Error | any) {
      console.error(chalk.redBright(error.message))
      process.exit(1)
    }
  })

program.parse()
