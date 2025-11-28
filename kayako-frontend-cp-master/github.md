# Git Workflow

Our general approach is to create the cleanest git history that we feasibly can achieve whilst creating an easy to follow chain of progression/discussion. As an added bonus to this it should help build a culture of accountability, we should feel equally responsible for the PRs from others as we do our own. No PR with a broken build or bug should be accepted, this will be ensured by following Travis' status and being proactive when testing PRs. Unfortunately most of this can come across as pedantic, especially during a development cycle but it acts as the training wheels for when we are rolling out production builds. We cannot risk deploying broken builds to live servers, and in the unfortunate case that does happen we need to be able to rollback succinctly.

### Pull requests

All changes must be made on your own fork in feature branches, then sent to the upstream's master via a pull request. The only acceptable branches on upstream are `master`, `production` and `staging`.

After a pull request has been made it must be peer reviewed, never merging your own pull request. In the case that it was reviewed face-to-face please add a comment of `Reviewed by @name offline` to keep everyone in the loop.

For large PRs please take the time to check the branch out on your local and thoroughly test, we do not want to carry out glorified human-error-prone syntax checks from the browser.

Inline comments on other people's PRs are very much welcomed and encouraged.

Do not let Arthur bully you into accepting his PR.

If you have completed a PR that is under review and it is required for you to continue with a secondary issue, then branch off of it, continue your work and in the secondary PR, add `Relies on #{Primary PR number}`. Then once that has been pulled in, rebase your secondary branch to remove duplicate commits.

Pull requests with failing tests will not be accepted.

### Labels

Please label appropriately, it could save collegues from reviewing PRs that are in progress and or avoid PRs that are not relevant to them. Notable examples are the `wip`, `don't review` and `help wanted` tags.

### Commits

Commits must be atomic and single serving, this is to avoid any potential future nightmares to do with rollbacks/rebases. Do not make commits labelled `Removing commented code` then slip in a change to the authentication API in with it. Learn how to do partial commits! In conjunction with this, keep commits to an absolute minimum and leverage the use of rebasing. Do not send a slew of `cleaned up`, `fixed bug`, `removed test code` commits -- rebase and squish to avoid redundant commit bloat.

We prefix all commits with the relevant area that it impacts, this can be documentation, components, models etc e.g:

```
[docs] github workflow
[ko-text-input] added validation
[user/model] added new api end point
[case-content/template] improved indentation
[ko-text-input][ko-text-area] multiple components touched by one commit
```

_Note: We omit the `ko` from component names as it is redundant._

No merge commits! If you have merge commits, go back, and run `git rum` to bring your branch up to date.

### Closing issues

@todo ARTHUR YOU NEED TO TALK ABOUT JIRA (LOL)

### Git Config

Add these settings to your `~/.gitconfig` file.

```
[push]
    default = simple
```

#### Initial setup
```
#fork through the github's website
git remote add upstream [master url]
git fetch upstream
```

#### Creating a new branch/feature
```
git checkout -b [branch-name]
git add [file/paths] ( OR ) git add .
git commit -m "[component/name] Commit message"
git push --set-upstream origin
```

#### Ammending a commit with new changes
```
git add .
git commit -a --amend
:x
git push --force
```

#### Bringing master up to date with upstream master
```
git checkout master
git rebase upstream
git pull --rebase upstream master
git push --force
```

#### Bring feature branch up to date (assuming no conflicts)
```
git checkout [branch name]
git pull --rebase upstream master
git push --force
```

#### Working with someone else's branch
```
git remote add workfriend https://github.com/username/repo.git
git fetch workfriend
git merge workfriend/feature-branch
```
_Later on you should rebase your merge commits out_.

#### Rebasing
```
git rebase -i HEAD~[Number of Commits]
#This will open the interactive rebase window, I believe the default is Vim/Nano.
#You will have a selection of: pick, reword, edit, squash and fixup. You can use p, r, e, s, f as aliases.
#Here you can reorganise your commits and merge related commits together
#This is where the power of atomic commits comes into play as you should be free to reorganise with no conflicts
```

Example
```
pick 3f6294e [component-name] Added delete tests, fixes #343
f c215d4b [component-name] Fixed delete tests    #We want to fixup (squish and remove this commit ever happened to create clean git history)
r 354fb9d Removed broken function     #Rewording this commit as we forgot the [component-name], a new window will appear for you to enter the new commit name
```

#### Cherry picking
```
#First find the commit hash that you require, almost always it is from someone's branch.
git remote add someone [someone]
git fetch someone
git cherry-pick c215d4b
#If their branch is pulled in before yours, make sure you rebase to remove it from your history.
```

#### Dealing with conflicts
```
#Sometimes the github gods look down on you and give you a conflict when doing `git rum`
#When this occurs, do `git s` to get a list of conflicted files and fix them accordingly.
git add .
git rebase --continue
#repeat until all commits have passed
#if you make a mistake, do git `rebase --abort` and start again.
```

#### Updating Novo API
```
git submodule update --remote
```

.
