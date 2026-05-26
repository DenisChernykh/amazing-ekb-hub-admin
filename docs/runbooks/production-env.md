# Admin Production Environment

This runbook describes the admin-specific production values owned by this
repository. The admin app is a Vite SPA, so `VITE_API_BASE_URL` is compiled into
the browser bundle during the Docker image build.

## Required GitHub Environment Variables

Configure these variables in the `production` GitHub Environment for
`DenisChernykh/amazing-ekb-hub-admin`.

| Variable            | Purpose                                                        |
| ------------------- | -------------------------------------------------------------- |
| `ADMIN_BASE_URL`    | Production admin URL used by deploy smoke checks.              |
| `VITE_API_BASE_URL` | Browser-visible backend API URL compiled into the admin build. |

Current production values:

```text
ADMIN_BASE_URL=https://admin.strelchukgo.ru
VITE_API_BASE_URL=https://api.strelchukgo.ru/v1
```

## Updating Values

Use GitHub UI:

1. Open `DenisChernykh/amazing-ekb-hub-admin`.
2. Go to Settings -> Environments -> production.
3. Update Environment variables.
4. Re-run `deploy-production` or push the intended release to `main`.

Or use GitHub CLI:

```bash
gh variable set ADMIN_BASE_URL \
  --repo DenisChernykh/amazing-ekb-hub-admin \
  --env production \
  --body https://admin.strelchukgo.ru

gh variable set VITE_API_BASE_URL \
  --repo DenisChernykh/amazing-ekb-hub-admin \
  --env production \
  --body https://api.strelchukgo.ru/v1

gh variable list \
  --repo DenisChernykh/amazing-ekb-hub-admin \
  --env production
```

## Ownership Boundary

This repository owns only admin-specific build and smoke values. It does not own
the shared production server file at `/opt/amazing-ekb-hub/.env`.

Do not store backend database, JWT, upload, or shared Compose secrets in this
admin repository. Shared runtime environment values are owned by the backend
deployment foundation.
