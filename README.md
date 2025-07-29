# Karma Slackbot with NextJS, Turso, and Vercel

This is a Slackbot you can use to give and take karma to your colleagues.

### Usage example in Slack

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

#### Slack Bot Token & Signing Secret

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

### Enable Slack Events

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

### DB Migrations apply (Prisma + Turso)

```sh
turso auth login

turso db shell apogee-bot-dev < ./prisma/migrations/20241024201506_init/migration.sql
```

### Running Tests

This project uses [Vitest](https://vitest.dev/) for testing. To run the test suite, use:

```sh
npm test
```


### Acknowledgements & useful links

- [Christopher-Hayes](https://gist.github.com/Christopher-Hayes/684ab3a73e0e8945384d4742e6547693)
- [OpenAI AI-Powered Slackbot with GPT](https://vercel.com/templates/other/openai-gpt-slackbot-vercel-functions)
- [Prisma with Turso](https://www.prisma.io/docs/orm/overview/databases/turso)
- [Verifying Slack Requests](https://dev.to/soumyadey/verifying-requests-from-slack-the-correct-method-for-nodejs-417i)
