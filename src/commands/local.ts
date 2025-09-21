import { selectAccount, setLocalAccount } from "../utils/account"
import fs from "fs-extra"

export default async function localAction() {
  if (!fs.existsSync('.git')) {
    throw new Error('This directory is not a Git repository.')
  }
  const selectedAccount = await selectAccount()
  setLocalAccount(selectedAccount, process.cwd())
}
