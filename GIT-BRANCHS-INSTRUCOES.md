# Git: branches and how to use them in the project

This file explains simply what branches are, why they are useful, and how to use them in the local project.

## 1) What is a branch?

A branch is a project fork. Instead of working directly on the main version, you create a copy of the code and work there.

Think of it like this:

- main = the stable main version
- feature-x = a version for a new feature
- fix-x = a version for fixing something

You can create as many branches as you want.

## 2) Why use branches?

Branches help you:

- develop without breaking the main version
- test new ideas in isolation
- organize tasks by feature
- review changes before publishing
- roll back easily if something goes wrong

## 3) Main branch

Usually the main branch name is:

- main
- master

In this project, the goal is to keep the main branch as the stable version of the system.

## 4) How to create a branch

In the terminal, inside the project folder, run:

```bash
git checkout -b feature-bandmate-ai
```

Or the more modern form:

```bash
git switch -c feature-bandmate-ai
```

Examples of valid names:

```bash
git checkout -b feature-dashboard
git checkout -b feature-ai-generator
git checkout -b feature-show-calendar
git checkout -b fix-db-connection
git checkout -b improve-ui
```

## 5) How to view existing branches

```bash
git branch
```

## 6) How to switch branches

```bash
git checkout main
```

or

```bash
git switch main
```

## 7) How to commit on the current branch

After editing files:

```bash
git add .
git commit -m "Describe the change"
```

## 8) How to merge a branch into main

First, return to the main branch:

```bash
git checkout main
```

Then merge the other branch:

```bash
git merge feature-bandmate-ai
```

If the branch is ready and tested, this is the way to publish changes into the main version.

## 9) When to use a branch

Use a branch when:

- creating a new feature
- fixing a problem
- testing a different idea
- working on something that could break the project

## 10) Recommended workflow for this project

A simple and organized flow would be:

```bash
git checkout -b feature-ai-tools
git checkout -b feature-show-management
git checkout -b feature-press-kit
git checkout -b fix-database-config
```

This way each topic stays in its own branch and the main version remains clean.

## 11) Practical summary

A branch is like a separate copy of the project so you can work without fear of breaking the rest.

In summary:

- main = stable version
- new branch = isolated work
- merge = join changes into the main version

## 12) Simple rule

If the change is large or risky, work in a separate branch.

If the change is small and safe, you can still use a branch to maintain organization.

## 13) Useful commands to start

```bash
git status
git branch
git checkout -b feature-my-work
```

## 14) Tip for continuing later

To continue the project in another session or on another machine:

1. push the project to GitHub or save it to the repository
2. clone/open the local folder
3. run the setup commands
4. confirm which branch you are on
5. continue the development in a specific branch

## 15) Example of a full flow

```bash
git checkout -b feature-epk-generator
git add .
git commit -m "initialize epk generator"
git checkout main
git merge feature-epk-generator
```

## 16) Conclusion

Branches are essential for keeping the project organized, safe, and easy to evolve. For a system like this, using branches per feature is the best practice.

If you want, you can later create more specific branches for:

- AI
- dashboard
- shows
- scheduling
- finance
- marketing
- media upload

