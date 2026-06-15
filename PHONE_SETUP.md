# Running Claude Code from Your Phone

This guide walks you through setting up **Claude Code on the web** so you can
start, monitor, and review coding tasks from your phone — the same way this very
session is running.

Claude Code on the web runs on Anthropic-managed cloud machines (not your
phone), so there's nothing to install or compile locally. You drive it from
your browser or the Claude mobile app.

> **Requirements:** A **Pro, Max, or Team** plan (or an Enterprise premium /
> Chat + Claude Code seat). Claude Code on the web is currently in research
> preview. You'll also need a GitHub account with at least one repository.

---

## Step 1 — Install the Claude mobile app

| Platform | Link |
| :------- | :--- |
| iOS      | https://apps.apple.com/us/app/claude-by-anthropic/id6473753684 |
| Android  | https://play.google.com/store/apps/details?id=com.anthropic.claude |

Open the app and sign in with the same Anthropic account that has your Pro/Max/Team
plan.

> Prefer not to install the app? You can do everything from your phone's mobile
> browser at **claude.ai/code** instead. The steps are the same.

## Step 2 — Connect your GitHub account (one-time setup)

This is easiest to do once from any browser (phone or laptop):

1. Go to **claude.ai/code** and sign in.
2. When prompted, **install the Claude GitHub App** and grant it access to your
   repositories.
3. You'll then be asked to **create a cloud environment**. For your first
   project, leave the defaults (network access = `Trusted`) and tap
   **Create environment**.

> Starting a brand-new project? Cloud sessions only work with existing GitHub
> repos, so create an empty repo at https://github.com/new first.

## Step 3 — Open Claude Code on your phone

- **In the app:** tap the **Code** tab.
- **In the browser:** go to **claude.ai/code**.

## Step 4 — Pick a repository and start a task

1. Tap the **repository selector** below the input box and choose your repo.
   (Optionally change the branch to start from a feature branch.)
2. Choose a **permission mode**:
   - **Accept edits** (default) — Claude makes changes and pushes a branch
     without stopping for approval.
   - **Plan mode** — Claude proposes an approach and waits for your go-ahead.
3. **Describe the task** and submit. Be specific, e.g.
   *"Add a README with setup instructions"* or
   *"Fix the failing auth test in `tests/test_auth.py`"*.

Claude clones the repo into a fresh cloud machine, works on it, and pushes a
branch when it reaches a stopping point.

## Step 5 — Review and iterate

- Tap the diff indicator (e.g. `+42 -18`) to open the **diff view**.
- Tap a line to leave an **inline comment**; comments bundle with your next
  message.
- When the diff looks right, tap **Create PR** to open a pull request (full or
  draft).
- The session stays live after the PR — paste CI failures or review comments and
  ask Claude to keep going.

> Sessions persist across devices. Start a task on your laptop and review it
> from your phone later — closing the tab or app does **not** stop the session.

---

## Tips

- **Link the app fast:** in the Claude Code terminal CLI, run `/mobile` to get a
  QR code that connects the mobile app.
- **Run several tasks at once:** each task gets its own session and branch, so
  you don't have to wait for one to finish before starting the next.
- **Pre-fill a session** with a URL, handy for bookmarks:
  `https://claude.ai/code?prompt=Fix%20the%20login%20bug&repositories=owner/repo`

## Troubleshooting

| Problem | Fix |
| :------ | :-- |
| Only a GitHub login button shows | Cloud sessions require a connected GitHub account — finish the connect flow in Step 2. |
| No repositories appear | Confirm the connected GitHub account can actually see the repo on github.com. |
| "Not available for the selected organization" | An Enterprise admin may need to enable Claude Code on the web. |

## Learn more

- Get started: https://code.claude.com/docs/en/web-quickstart
- Full reference: https://code.claude.com/docs/en/claude-code-on-the-web
