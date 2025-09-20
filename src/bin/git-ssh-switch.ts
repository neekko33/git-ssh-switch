#!/usr/bin/env node
import { Command } from 'commander'
import path from 'path'
import os from 'os'
import fs from 'fs-extra'
import chalk from 'chalk'
import addAction from '../commands/add'
import { execSync } from 'child_process'
import preCheck from '../utils/preCheck'

const program = new Command()

program
  .name('gss')
  .description('Git SSH Switch CLI: manage multiple Git accounts')
  .version('0.1.0')

program.hook('preAction', async() => {
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

program.parse()
