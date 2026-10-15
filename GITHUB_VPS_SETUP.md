# BrainTrain: step-by-step GitHub and VPS setup

Follow these steps in order. Each step says where to work: **your PC**, **GitHub**,
or **the VPS**. You do not need to provide VPS details to Codex to use this guide.

Your private repository stays private. GitHub schedules the workflow, while a
self-hosted runner on your VPS builds, tests, and deploys the app. There is no
application image registry or image upload.

## 1. Your PC — push the prepared deployment files

Open PowerShell in your project:

```powershell
cd C:\Users\Admin\Desktop\BRAINS\BrainTrain-
git status
```

Stage the prepared files, including this guide:

```powershell
git add .dockerignore .env.example .env.docker.example .gitattributes .gitignore .github/workflows/ci.yml Dockerfile docker-compose.yml compose.production.yml compose.ci.yml next.config.js deployment scripts/vps scripts/test-vps.sh app/api/health DEPLOY_VPS.md GITHUB_VPS_SETUP.md
git diff --cached --stat
git commit -m "Set up Docker and self-hosted VPS CI/CD"
git push origin main
```

These commands are for you to run; creating this guide does not commit or push.
Your real `.env` must stay out of Git. If these changes are already committed,
just push them. If working on another branch, merge the changes into `main` first.

## 2. GitHub — leave deployment disabled while preparing

Open [the repository](https://github.com/YosraGhanmi/BrainTrain-).

1. Go to **Settings → Secrets and variables → Actions → Variables**.
2. If `VPS_DEPLOY_ENABLED` exists, set it to `false`. Otherwise leave it absent.
3. Go to **Actions** and confirm that **VPS CI and deployment** appears after the push.

The job is skipped while the variable is absent or `false`. This is expected.
Do not create `VPS_HOST`, SSH-key secrets, or registry tokens for this setup.

## 3. Your VPS provider and domain provider — prepare the server and DNS

Use a fresh **Ubuntu 24.04 LTS, amd64/x86-64** VPS, with an administrator account
that can run `sudo`. The setup script checks the OS and architecture.

At your domain provider:

1. Choose your exact website hostname, for example `braintrain.tn`.
2. Point its DNS **A record** to your VPS public IPv4 address.
3. Remove an incorrect **AAAA record** if IPv6 is not configured.

If your VPS provider has a separate network firewall, allow inbound TCP traffic
on your existing SSH port and on **80** and **443**. Do not expose 3000 or 5432.
The setup script requests HTTPS for the exact hostname you provide; it does not
automatically add `www` or other hostnames.

## 4. Your PC — upload the setup scripts and connect

In PowerShell, replace the example values:

```powershell
$VpsIp = "YOUR_VPS_IP"
$VpsUser = "ubuntu"
$SshPort = 22

scp -P $SshPort scripts/vps/setup.sh scripts/vps/install-runner.sh "${VpsUser}@${VpsIp}:~/"
ssh -p $SshPort "${VpsUser}@${VpsIp}"
```

Use the administrator username and actual SSH port supplied by your VPS provider.
After the `ssh` command, you are working **on the VPS**, not your PC.

## 5. VPS — install Docker, Nginx, HTTPS, and the deployment user

Set your real hostname and email, and keep `SSH_PORT` equal to the port used above:

```bash
DOMAIN='your-domain.com'
CERT_EMAIL='you@example.com'
SSH_PORT=22

getent ahostsv4 "$DOMAIN"
```

Confirm that the displayed IPv4 address is your VPS address. Then run:

```bash
sudo bash ~/setup.sh "$DOMAIN" "$CERT_EMAIL" "$SSH_PORT"
```

This installs Docker/Compose, Git, ShellCheck, Nginx, Certbot, and firewall rules.
It creates the `deploy` user, `/opt/braintrain`, generated credentials, and nightly
backups. It preserves an existing environment file and named Nginx site on reruns.

Check the installation:

```bash
sudo -u deploy -H docker compose version
sudo nginx -t
sudo systemctl status docker --no-pager
sudo systemctl status certbot.timer --no-pager
```

If certificate issuance fails, correct DNS and incoming ports 80/443, then rerun
the same setup command. Before the first deployment, Nginx may return **502**
because the app is not running yet.

## 6. VPS — configure production application settings

```bash
sudo -u deploy nano /opt/braintrain/.env
```

Check these settings:

| Setting | What to do |
| --- | --- |
| `NEXT_PUBLIC_SITE_URL` | Set your exact public URL, such as `https://your-domain.com` |
| `ADMIN_EMAIL` | Set the email you want to use to sign in |
| `ADMIN_PASSWORD` | Keep the generated password or choose a strong replacement |
| `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD` | Keep the generated database settings for initial setup |
| Session secrets and `CRON_SECRET` | Keep the generated random values |
| SMTP, Stripe, Twilio settings | Add real provider settings when you need those features |

Use [the environment template](.env.example) to find the provider field names.
Do not copy disposable local credentials from `.env.docker.example` into production.
Save in nano with **Ctrl+O**, **Enter**, then exit with **Ctrl+X**.

Production secrets belong in this VPS file. Never commit it or paste it into
GitHub variables. Keep a secure copy of your admin password and environment file.

## 7. GitHub and VPS — register the self-hosted runner

### On GitHub

1. Open **Settings → Actions → Runners**.
2. Click **New self-hosted runner**.
3. Select **Linux** and **x64**.
4. Keep this page open. It shows the current download, checksum, and registration token.

### On the VPS

Start in your administrator user's home folder:

```bash
cd ~
```

Copy and run **only the download and checksum commands** from GitHub's page.
Download the archive into this folder. Use the exact version and checksum shown
by GitHub, rather than an old version from an example.

Do **not** run GitHub's `config.sh` or `run.sh` commands separately: the project's
installer handles registration, the custom label, and the background service.

Find the exact downloaded filename:

```bash
ls -lh ~/actions-runner-linux-x64-*.tar.gz
```

Replace `VERSION` below with that filename's version:

```bash
sudo bash ~/install-runner.sh ~/actions-runner-linux-x64-VERSION.tar.gz https://github.com/YosraGhanmi/BrainTrain-
```

When prompted, paste the temporary registration token from GitHub. The token is
not displayed while you type. If it expires, refresh GitHub's runner setup page
to obtain a new token before retrying registration.

Check the service:

```bash
cd /opt/braintrain/runner
sudo ./svc.sh status
```

### Back on GitHub

Refresh **Settings → Actions → Runners**. You should see:

- Name: **braintrain-vps**
- Status: **Idle**
- Labels: **self-hosted**, **Linux**, **X64**, **braintrain**

The workflow requires the `braintrain` label. The runner connects outward to
GitHub, so GitHub does not need an SSH connection to your VPS. You do not need a
personal access token for normal private-repository checkouts.

## 8. GitHub — add the public build settings and enable CI/CD

Go to **Settings → Secrets and variables → Actions → Variables**.
Use **New repository variable** to add the following:

| Name | Value |
| --- | --- |
| `NEXT_PUBLIC_SITE_URL` | `https://your-domain.com` — exactly the same URL as the VPS environment file |
| `NEXT_PUBLIC_STRINGTUNE_DEV_TOKEN` | Optional; omit it if unused |
| `VPS_DEPLOY_ENABLED` | `true` — enable this last, after the runner is Idle |

The URL is public and is included in the app build. Changing it later requires
a new build/deployment. No new entries under **Secrets** are required for this
pipeline. You do not need a GHCR account or registry credentials.

## 9. GitHub — trigger and watch the first deployment

1. Open **Actions → VPS CI and deployment**.
2. Click **Run workflow**.
3. Choose branch **main** and run it.
4. Open the new run and watch its logs.

You should see these stages:

1. Check out the private repository on the VPS runner.
2. Prepare the release directory.
3. Build and test on the VPS, using an isolated test database.
4. Deploy `main`, run production migrations, and wait for app health.

The first build takes longer because the VPS downloads dependencies and base
images. A failed build or test prevents deployment. No application image is
uploaded anywhere.

## 10. VPS and browser — verify the website

On the VPS:

```bash
sudo -iu deploy
cd /opt/braintrain/current
export IMAGE="$(cat image.ref)"
export MIGRATION_IMAGE="$(cat migration.ref)"

docker compose -f docker-compose.yml -f compose.production.yml ps
curl --fail http://127.0.0.1:3000/api/health
docker compose -f docker-compose.yml -f compose.production.yml logs --tail 100 app
```

The health response should be `{"status":"ok"}` and the app/database should be
healthy. The migration service is a one-shot job; an exit code of **0** is normal.

In your browser, visit:

- `https://your-domain.com/fr`
- `https://your-domain.com/admin/login`

Sign in using the admin email/password from the VPS environment file. Provider
features such as email, SMS, and payments need their own credentials to work.

## 11. After setup — your normal update process

On your PC, commit your changes and push:

```powershell
git push origin main
```

Each successful `main` push now builds, tests, and deploys on the VPS. Pushes to
other branches run CI without changing the live website. Pull requests do not
run on the production runner. Keep repository write access limited to trusted
people: their code executes on your server.

To pause future CI/deployment runs, set `VPS_DEPLOY_ENABLED=false` in GitHub.
This does not stop the currently running website or an already-running workflow.

## Quick troubleshooting

| Symptom | What to check |
| --- | --- |
| Workflow is skipped | `VPS_DEPLOY_ENABLED` must be exactly `true` |
| Workflow waits for a runner | Runner must be online with the `braintrain` label |
| Runner is Offline | Run `sudo ./svc.sh status` in `/opt/braintrain/runner`; use `sudo ./svc.sh start` if stopped |
| Registration token is rejected | Obtain a fresh temporary token from GitHub's runner setup page |
| Main configuration check fails | Set a public HTTPS `NEXT_PUBLIC_SITE_URL` and ensure `/opt/braintrain/.env` exists |
| Certificate setup fails | Check DNS, incorrect AAAA records, and incoming ports 80/443 |
| Docker reports permission denied | Ensure the runner service runs as `deploy`, which setup adds to the Docker group; restart its service after membership changes |
| Build fails or runs out of memory/disk | Read the failed step's log and check VPS resources; leave capacity for the live app and PostgreSQL |
| Website returns 502 after deployment | Check app health and logs using step 10 |

Nightly backups are stored in `/opt/braintrain/backups` and retained for 14 days.
Copy them off-server. Keep the current and previous release images for rollback.
Never run `docker compose down -v` against production.

For manual backups, application rollback, and architecture details, see
[DEPLOY_VPS.md](DEPLOY_VPS.md).

GitHub's official references:
[adding a runner](https://docs.github.com/en/actions/how-tos/manage-runners/self-hosted-runners/add-runners)
and [managing the runner service](https://docs.github.com/en/actions/how-tos/manage-runners/self-hosted-runners/configure-the-application?platform=linux).
