# Repository Guidelines

## Project Structure & Module Organization

This is a small Node.js ES module project for collecting Google Analytics 4 data, summarizing it with Claude, and sending reports to Telegram.

- `index.js`: process entry point, cron schedule, and per-site job orchestration.
- `analytics.js`: GA4 Data API report collection.
- `summarizer.js`: Claude summary generation.
- `telegram.js`: Telegram Bot API delivery.
- `config.js`: monitored sites, GA4 metrics, dimensions, date range, and startup env checks.
- `.env.example`: required environment variable template. Keep real secrets in `.env`.
- `README.md`: setup and operational instructions.

There is currently no dedicated `tests/` directory or static asset directory.

## Build, Test, and Development Commands

- `npm install`: install dependencies from `package-lock.json`.
- `npm start`: run `node index.js` with the hourly production schedule.
- `npm run dev`: run `node --watch index.js` for local development.
- `npm run test-run`: import `index.js` to catch startup/module errors.

For an immediate end-to-end run, follow the README guidance and temporarily call `runJob()` in `index.js`, then run `node index.js`.

## Coding Style & Naming Conventions

Use modern JavaScript ES modules (`import`/`export`) and keep functions focused on one integration boundary. Match the existing style: two-space indentation, semicolons, single quotes, and descriptive camelCase names such as `runAnalyticsReport` or `sendToTelegram`.

Keep configuration values in `config.js` or `.env`; avoid hardcoding tokens, chat IDs, service account paths, or property IDs in implementation modules.

## Testing Guidelines

No formal test framework is configured yet. Before submitting changes, run:

```bash
npm run test-run
```

For integration changes, test with valid `.env` values and a non-production GA4/Telegram setup when possible. Name future tests after the module under test, for example `analytics.test.js` or `telegram.test.js`, and prefer mocked external APIs for routine checks.

## Commit & Pull Request Guidelines

This checkout does not include Git history, so no existing commit convention could be inferred. Use concise imperative commit messages, for example `Add Telegram error handling` or `Update GA4 metrics config`.

Pull requests should include a short summary, configuration or migration notes, test commands run, and screenshots or sample Telegram output when report formatting changes.

## Security & Configuration Tips

Never commit `.env` or `google-credentials.json`. Keep `.env.example` updated when adding required variables. Grant the Google service account the minimum GA4 role needed, typically reader access.
