# git-ssh-switch

`git-ssh-switch` is a CLI tool for managing multiple GitHub accounts with different SSH keys. It automatically selects the right key when cloning repos and updates local Git user info for each account.

## Requirement

- Node >= 18

## Install

First, if you want to use multiple Git accounts, you need to create multiple pairs of different SSH public and private keys. You can refer to the GitHub documentation to create them and configure SSH in GitHub.

Read the document here:

- [Generate new SSH key](https://docs.github.com/en/authentication/connecting-to-github-with-ssh/generating-a-new-ssh-key-and-adding-it-to-the-ssh-agent#adding-your-ssh-key-to-the-ssh-agent)

- [Add a new SSH key](https://docs.github.com/en/authentication/connecting-to-github-with-ssh/adding-a-new-ssh-key-to-your-github-account?tool=webui#about-addition-of-ssh-keys-to-your-account)

Then you can clone this repo and run following commands
```shell
cd git-ssh-switch
npm install
npm run build
npm link
```
Now you can use the `gits` command.

## Usage

Before executing any command, the program runs a pre-check that creates a config.json file (`~/.gss/config.json`) for storing user information, backs up the existing SSH configuration file, and creates a new empty SSH config file (`~/.ssh/config`) for adding Host entries.

If everything is fine, you will see the message `Pre-checks passed.` in the console.

### Create a account

```shell
gits add
```

### List all accounts

```shell
gits list
```

### Test SSH connection

Run `ssh -T` for every account's host.

```shell
gits test
```

### Clone a Repo

Clone a repository (allowing additional parameters identical to the git command), select an account, automatically replace the repository URL with the chosen account’s SSH Host, and update the local Git user information in the cloned repository after completion.

```shell
gits clone <repository> [<directory>]
```

### Add remote origin

When adding an origin to an existing local repository, you can choose which user to use.The program will remove the existing remote origin (if it exists) and add a new one with the selected account's SSH Host. It also updates the local Git user information in the repository.

```shell
gits remote <repository>
```

### Switch local git user

Set the Git user information for the current local repository by selecting the desired account.

```shell
gits local
```

### Remove account

```shell
gits remove
```

### Reset

Delete all files created by git-ssh-switch and restore the latest backup of the SSH config file (if it exists).

```shell
gits reset
```
