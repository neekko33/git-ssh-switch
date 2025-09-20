# git-ssh-switch

`git-ssh-switch` is a CLI tool for managing multiple GitHub accounts with different SSH keys. It automatically selects the right key when cloning repos and updates local Git user info for each account.

## Requirement

- Node >= 18

## Install

First, if you want to use multiple Git accounts, you need to create multiple pairs of different SSH public and private keys. You can refer to the GitHub documentation to create them and configure SSH in GitHub.

Read the document here:

- [Generate new SSH key](https://docs.github.com/en/authentication/connecting-to-github-with-ssh/generating-a-new-ssh-key-and-adding-it-to-the-ssh-agent#adding-your-ssh-key-to-the-ssh-agent)

- [Add a new SSH key](https://docs.github.com/en/authentication/connecting-to-github-with-ssh/adding-a-new-ssh-key-to-your-github-account?tool=webui#about-addition-of-ssh-keys-to-your-account)

Then you can install `git-ssh-switch` by following command
```shell
TODO
```

## Usage

### Create a account

```shell
gssw add
```

### List all accounts

```shell
gssw list
```

### Test SSH connection

Run `ssh -T` for every account's host.

```shell
gssw test
```

### Clone a Repo

Clone a repository (allowing additional parameters identical to the git command), select an account, automatically replace the repository URL with the chosen account’s SSH Host, and update the local Git user information in the cloned repository after completion.

```shell
gssw clone <repository> [<directory>]
```
