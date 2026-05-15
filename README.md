# stockly-monitor

Automated daily health checks for Stockly production API.

## What it does

- Runs read-only monitoring checks:
  - `GET /products`
  - `GET /suppliers`
  - `GET /categories`
  - `GET /health` (basic dashboard/health endpoint)
  - Optional auth check (`/admin/me` with token or `/admin/login` with test credentials)
- Measures for each check:
  - `name`
  - `type` (`API` | `AUTH` | `DATA`)
  - `status` (`PASSED` | `WARNING` | `FAILED`)
  - `responseTimeMs`
  - `message`
  - `details`
- Sends final report to:
  - `POST {STOCKLY_API_URL}/admin/monitoring/report`
  - Header: `x-monitoring-secret: MONITORING_INGEST_SECRET`

## Safety rules

- No create/delete/update operations against production data.
- No OTP flow is triggered.
- Secrets are never logged.
- Fails safely with non-zero exit code on ingest failure.

## Environment variables

Required:

- `STOCKLY_API_URL`
- `MONITORING_INGEST_SECRET`

Optional:

- `STOCKLY_TEST_ADMIN_EMAIL`
- `STOCKLY_TEST_ADMIN_PASSWORD`
- `STOCKLY_TEST_ADMIN_TOKEN`

If optional credentials are missing, auth check is skipped with `WARNING` status.

## Local usage

```bash
npm install
npm run build
npm run check
```

## GitHub Actions

Workflow file: `.github/workflows/monitoring.yml`

- Scheduled daily run: `0 5 * * *`
- Manual trigger: `workflow_dispatch`

Set repository secrets:

- `STOCKLY_API_URL`
- `MONITORING_INGEST_SECRET`
- `STOCKLY_TEST_ADMIN_EMAIL` (optional)
- `STOCKLY_TEST_ADMIN_PASSWORD` (optional)
- `STOCKLY_TEST_ADMIN_TOKEN` (optional)