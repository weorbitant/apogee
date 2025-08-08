# Karma Slackbot with NextJS, Turso, and Vercel

This is a Slackbot you can use to give and take karma to your colleagues.

## Usage example in Slack

- `@username ++`: give 1 karma point to @username
- `@username --`: take 1 karma point from @username
- `@username +++`: give 2 karma points to @username
- `@username ---`: take 2 karma points from @username
- etc.

### Environment Variables

After completing the setup instructions below, you will have the following `.env` file in your project for testing locally, and the same environment variables added on Vercel:

```bash
CHANNEL_ID=
SLACK_BOT_TOKEN=
SLACK_SIGNING_SECRET=
TURSO_AUTH_TOKEN=
TURSO_DATABASE_URL=
```

## Slack Bot Token & Signing Secret

Go to [Slack API Apps Page](https://api.slack.com/apps):

- Create new App
  - From Scratch
  - Name your app & pick a workspace
- Go to OAuth & Permissions
  - Scroll to scopes
  - Add the following scopes
    - `channels:history`
  - Click "Install to Workplace"
  - Copy **Bot User OAuth Token**
  - Add the token to Vercel's environment variables as `SLACK_BOT_TOKEN`
- Getting signing secret
  - Basic Information --> App Credentials --> Copy **Signing Secret**
  - Add the secret to Vercel's environment variables as `SLACK_SIGNING_SECRET`

## Enable Slack Events

After successfully deploying the app, go to [Slack API Apps Page](https://api.slack.com/apps) and select your app:

- Go to **Event Subscriptions** and enable events.
- Add the following URL to **Request URL**:
  - `https://<your-vercel-app>.vercel.app/api/slack/events`
  - Make sure the URL is verified, otherwise check out [Vercel Logs](https://vercel.com/docs/observability/runtime-logs) for troubleshooting.
  - Subscribe to bot events by adding:
    - `message.channels`
  - Click **Save Changes**.
- Slack requires you to reinstall the app to apply the changes.

## Local Development

Use [localtunnel](https://github.com/localtunnel/localtunnel) to test out this project locally:

```sh
npm run dev
```

```sh
npx localtunnel --port 3000
```

Make sure to modify the [subscription URL](./README.md/#enable-slack-events) to the `localtunnel` URL.

## DB Migrations apply (Prisma + Turso)

```sh
turso auth login

turso db shell apogee-bot-dev < ./prisma/migrations/20241024201506_init/migration.sql
```

### Running Tests

This project uses [Vitest](https://vitest.dev/) for testing. To run the test suite, use:

```sh
npm test
```

## Workflow for Feature Development

This document outlines our Git workflow to ensure a smooth and predictable development process. Please follow these guidelines when contributing to the project.

### 1. Main Branches

We use two primary branches, each with a specific purpose:

- `staging`: This is our main development branch. All new feature implementations and quality assurance testing happen here. All feature branches must be created from `staging` and merged back into `staging`.

- `main`: This branch is the single source of truth for what is currently in production. You must **never** work directly on `main`. Code only gets to `main` after being thoroughly tested and approved in staging.

### 2. Developing a New Feature
Follow these steps to work on a new feature:

1. Update your local staging branch: Before you start, make sure your local staging branch is up to date with the remote.

```bash
git checkout staging
git pull origin staging
```

2. Create a feature branch: Name your branch descriptively, following the `feature/name-of-your-task` format.

```bash
git checkout -b feature/new-awesome-feature
```

3. Implement and commit: Work on your feature and make regular commits.

4. Open a Pull Request (PR): Once your feature is complete, open a PR from your feature branch to the `staging` branch. Your PR description should clearly explain what your changes do.

5. Approval and merge: After your PR is approved, it will be merged into `staging` using the Squash and Merge option. This keeps the `staging` branch history clean, with each feature representing a single, clean commit.

### 3. Deploying to Production

When a set of features has been tested and validated on `staging`, follow this process to deploy to production:

1. Open a PR from `staging` to `main`: The team lead will create a PR from the `staging` branch to the `main` branch.
2. Merge the PR: This PR will be merged using a Merge Commit. This moves all of the feature commits from `staging` to `main` in an organized way.
3. Automatic deployment: The merge to `main` will automatically trigger a deployment to production.

### 4. Handling Hotfixes

For critical bug fixes that need to go to production immediately, we follow a special workflow:

Create a hotfix branch: Create a new branch with the hotfix/ prefix directly from the `main` branch.

```bash
git checkout main
git checkout -b hotfix/critical-bug-fix
```

Implement and open PR: Make the necessary fix and open a PR from your hotfix branch to `main`. This PR will be merged using a standard Merge Commit to get it to production as quickly as possible.

Sync `staging`: Immediately after the hotfix is merged into `main`, you must merge `main` into `staging`. This ensures our development branch also has the fix and that the bug doesn't reappear in a future deployment.

```bash
git checkout staging
git pull origin main
git push origin staging
```

This workflow ensures that `staging` is always up-to-date with `main` and that our development base is always the most stable and recent version of the code.