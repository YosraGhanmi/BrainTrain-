# BrainTrain: Docker and CI/CD on your Ubuntu VPS

## Architecture and cost

GitHub schedules jobs; a **self-hosted Actions runner on your VPS** checks out this
private repository, builds Docker images, tests them, and deploys successful `main`
pushes. Other branch pushes run CI only. Pull requests do not execute on the
production runner. Only allow trusted collaborators to push code to this repository.

There is no image registry, image upload, GitHub-hosted runner, GitHub artifact
upload, or GitHub cache storage. GitHub currently lists self-hosted Actions usage
as free: https://docs.github.com/en/billing/concepts/product-billing/github-actions
Your VPS, domain, and external email/SMS/payment providers retain their own costs.

The application image uses Next.js standalone output: only the runtime, traced
dependencies, static assets, and public files. Prisma's CLI and locked dependencies
live in a separate migration image. Compiler dependencies and build caches still
consume VPS disk during builds; they are not copied into the application image.
Builds use the VPS CPU/RAM, so leave enough resources for the live app and database.

## Run locally

Docker Desktop must use Linux containers. Create `.env` only if you do not have one:

```powershell
Copy-Item .env.docker.example .env
docker compose up -d --build --wait --wait-timeout 180
curl.exe --fail http://localhost:3000/api/health
```

Open http://localhost:3000/fr. Disposable local admin credentials:
`admin@example.test` / `localtestadmin123`. Do not use these in production.
Compose starts PostgreSQL, runs the one-shot migration service, then starts the app.
Database and uploads persist in `braintrain_db-data` and `braintrain_uploads`.
SMTP, SMS, and payment functionality require provider credentials.

```sh
docker compose ps -a
docker compose logs --tail 100 app
docker compose down
```

`down` keeps data. `down -v` erases it; never use it for production.
The slim app image intentionally omits the full source, tsx, and Firebase import tools.
Run one-time Firebase imports separately with the full project dependencies, not
inside the application image, and never as part of deployment.

## Initial VPS setup (later)

Target: fresh **Ubuntu 24.04 LTS, amd64**. Point your domain's DNS A record to the
VPS first; remove an incorrect AAAA record. Ports 80/443 must be reachable for TLS.
Upload `scripts/vps/setup.sh` and `scripts/vps/install-runner.sh` using your existing
administrator SSH account. No deployment SSH key or registry token is needed.

```sh
sudo bash ~/setup.sh your-domain.example you@example.com 22
sudo -u deploy nano /opt/braintrain/.env
```

The last argument is your actual existing SSH port. Setup opens it in UFW without
changing the SSH daemon. It installs Docker/Compose, Git, ShellCheck, Nginx,
Certbot, and firewall rules; creates `deploy`; generates private database/admin/
session credentials; and schedules nightly backups. It preserves an existing
`.env` and Nginx site. If TLS issuance fails, correct DNS and rerun setup.
Use the script on a fresh server; review it before using a shared server.

Edit provider settings using `.env.example` / `.env.docker.example` as references.
Read the generated admin password securely from `/opt/braintrain/.env`. This file
stays on the VPS and is never committed or passed into the image build.
Keep database passwords URL-safe (`openssl rand -hex 24`). Changing the environment
password alone does not rotate an already initialized PostgreSQL role password.

## Register the self-hosted runner

In this private GitHub repository, open **Settings > Actions > Runners > New
self-hosted runner** and choose **Linux / x64**. Use the download and checksum
commands GitHub shows to obtain its current official runner archive on the VPS.
Keep that downloaded archive in your administrator user's folder. Then run:

```sh
sudo bash ~/install-runner.sh ~/actions-runner-linux-x64-VERSION.tar.gz https://github.com/YosraGhanmi/BrainTrain-
```

Enter the temporary registration token shown by GitHub when prompted. The script
installs runner dependencies, registers it with the `braintrain` label, and starts
its systemd service as `deploy`. Check that GitHub shows the runner as **Idle**.
The runner connects outward to GitHub; GitHub does not SSH into your VPS.
The `deploy` user belongs to the Docker group, which grants root-equivalent access.
Do not enable workflows for untrusted contributors or fork pull requests on it.

## GitHub variables

Under **Settings > Secrets and variables > Actions > Variables**, add:

| Variable | Value |
| --- | --- |
| `VPS_DEPLOY_ENABLED` | Leave unset until ready, then set exactly `true` |
| `NEXT_PUBLIC_SITE_URL` | Your public URL, e.g. `https://your-domain.example` |
| `NEXT_PUBLIC_STRINGTUNE_DEV_TOKEN` | Optional public build value |

No `VPS_HOST`, `VPS_USER`, `VPS_PORT`, SSH secrets, registry tokens, or publishing
permissions are needed. Remove previous deployment-only SSH secrets if added.
The normal automatic `GITHUB_TOKEN` handles checking out the private repository.
Keep the public URL equal to `/opt/braintrain/.env`; changing it requires a rebuild.

Until enabled, jobs are skipped and no runner is needed. After registering the
runner and setting variables, push to `main` or manually run **VPS CI and
deployment** on `main`. Each job runs entirely on the VPS. Jobs are serialized.

## CI and deployment behavior

CI runs ShellCheck and deployment failure tests, then builds both images locally.
The application build runs auth configuration tests, TypeScript checks, and the
production build. CI creates an isolated PostgreSQL/app stack with sample test
credentials and no published ports, runs migrations, and checks health and public
pages. Its temporary volumes are deleted afterward; production volumes are separate.
A failed build or test prevents deployment and leaves the live application intact.

Successful `main` jobs deploy the tested local release tags. Deploy backs up existing
data, runs migrations with the migration image, replaces the application, and waits
for health. Brief downtime during replacement is expected. It never pulls an app
image from a registry. Release directories live in `/opt/braintrain/releases`;
`current` points to the last healthy release and `previous` supports rollback.

A failed migration aborts before replacing the app. A failed health check attempts
to restore the previous app image and keeps the workflow failed. Schema changes
are never reversed automatically: migrations must remain compatible with the
previous application. Incompatible schema changes need a maintenance/restore plan.
The first deployment has no previous application to restore.

## Operations and backups

As `deploy` on the VPS:

```sh
cd /opt/braintrain/current
export IMAGE="$(cat image.ref)"
export MIGRATION_IMAGE="$(cat migration.ref)"
docker compose -f docker-compose.yml -f compose.production.yml ps
docker compose -f docker-compose.yml -f compose.production.yml logs --tail 100 app
bash scripts/vps/backup.sh
# Confirm schema compatibility before restoring the previous app:
bash scripts/vps/rollback.sh
```

Backups run at 02:30 **server time** and retain 14 days of database dumps and upload
archives. Copy them off-server. These are separate snapshots; quiesce writes if
atomic consistency across the database and uploaded files is required. Test
restores in an isolated environment. Certbot manages renewal; check its timer.

Release directories, tagged images, and Docker build caches remain local. Monitor
disk use and remove obsolete BrainTrain releases/images while preserving `current`,
`previous`, backups, and all production volumes. Do not globally prune shared VPS
resources. No automatic image cleanup can accidentally remove the rollback image.

For an intentional database restore, stop the app, prepare a clean database, and
load a chosen SQL backup with `psql -v ON_ERROR_STOP=1`. Restore matching uploads
when needed. Payment-reminder schedules and Firebase imports remain separate from
CI/CD. Set Stripe's webhook to `https://YOUR_DOMAIN/api/stripe/webhook` when ready.
