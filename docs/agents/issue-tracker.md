# Issue Tracker: GitHub

Issues and PRDs for this repository live as GitHub issues. Use the `gh` CLI for
all operations and infer the repository from `git remote -v`.

## Conventions

- Create issues with `gh issue create`.
- Read an issue and all comments with `gh issue view <number> --comments`.
- List issues with `gh issue list` and request JSON when filtering by labels,
  comments, or state.
- Apply or remove labels with `gh issue edit`.
- Comment with `gh issue comment` and close with `gh issue close`.

## Pull requests as a triage surface

External pull requests are not a triage surface. An explicitly named pull
request may still be inspected when the user requests it.

## Skill operations

- "Publish to the issue tracker" means create a GitHub issue.
- "Fetch the relevant ticket" means read the full GitHub issue and its comments.
- Publish AFK-ready issues with the label mapped to `ready-for-agent`.
- Prefer GitHub's native issue dependencies for blocking relationships. If
  native dependencies are unavailable, record `Blocked by: #<number>` in the
  issue body.
