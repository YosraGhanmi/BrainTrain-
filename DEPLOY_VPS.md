# Deploying BrainTrain on the OVH VPS (Docker)

The site runs as two Docker containers on the VPS (Ubuntu, VPS-2):

- **app**: the Next.js website, built from this repository
- **db**: PostgreSQL 17, holding every account, child, enrollment, payment and the site content

Nginx on the VPS itself receives the public traffic (HTTPS) and forwards it to the app container. Uploaded images and the database live in Docker volumes, so they survive rebuilds and updates.

Run every command below on the VPS, as a user with `sudo`.

---

## 1. Connect to the VPS

From your PC (PowerShell), with the IP and user from the OVH email:

```bash
ssh ubuntu@YOUR_VPS_IP
```

Then update the system:

```bash
sudo apt update && sudo apt upgrade -y
```

## 2. Install Docker, Git and Nginx

```bash
sudo apt install -y docker.io docker-compose-v2 git nginx certbot python3-certbot-nginx
sudo usermod -aG docker $USER
```

Log out (`exit`) and connect again so the `docker` group applies. Check:

```bash
docker compose version
```

## 3. Open the firewall

```bash
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable
```

Ports 3000 (website) and 5432 (database) stay closed to the internet: Docker only exposes them to the server itself.

## 4. Get the code and fill in the settings

```bash
cd ~
git clone https://github.com/YOUR-ACCOUNT/BrainTrain.git braintrain
cd braintrain
cp .env.docker.example .env
nano .env
```

In `.env`, replace every `change-me`:

- `POSTGRES_PASSWORD`: the database password. Letters and digits only. Make one with `openssl rand -hex 24`.
- `ADMIN_SESSION_SECRET` and `CRON_SECRET`: one `openssl rand -hex 32` each.
- `ADMIN_EMAIL` / `ADMIN_PASSWORD`: the admin dashboard login.
- `NEXT_PUBLIC_SITE_URL`: the real address, e.g. `https://braintrain.tn`.
- SMTP, Stripe and Twilio: the same values as today.

Save with `Ctrl+O`, `Enter`, then `Ctrl+X`. Keep a copy of this file somewhere safe (a password manager): it is not in Git.

## 5. Start everything

```bash
docker compose up -d --build
```

The first build takes a few minutes. On its first start the database container creates the `braintrain` database and user from `.env`, and the app creates all the tables.

Check it's running:

```bash
docker compose ps
docker compose logs -f app
```

You should see `Ready` in the app logs (`Ctrl+C` to stop following). `curl -I http://127.0.0.1:3000` should answer `200` or `307`.

## 6. Bring the data over from Firebase (once)

1. In Firebase console > Project settings > Service accounts, click **Generate new private key**. Copy its `project_id`, `client_email` and `private_key` into `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL` and `FIREBASE_PRIVATE_KEY` in `.env` (keep the private key in double quotes, with its `\n`s).
2. Run `docker compose up -d` so the app picks up those values.
3. Upload the site content and contact messages. They are in `data/content.json` and `data/messages.json`, which are not in Git. First create the folder on the VPS with `mkdir -p ~/braintrain/data`, then from your PC (PowerShell, in the project folder), using the latest copies (from wherever the live site runs today):

```bash
scp data/content.json data/messages.json ubuntu@YOUR_VPS_IP:~/braintrain/data/
```

Then on the VPS, put them into the app container:

```bash
cd ~/braintrain
docker compose cp data/content.json app:/app/data/content.json
docker compose cp data/messages.json app:/app/data/messages.json
```

4. Run the import:

```bash
docker compose exec app npm run db:import-firebase
```

It prints how many rows it copied per table, anything it couldn't copy, and the list of accounts that need a new password. Passwords are not copied (they lived in Firebase):

- Reception accounts keep working.
- Parents use **Forgot password** on the login page (SMS code), or you set one from the admin **Parents** page (key icon).
- Teachers: set one from the admin **Teachers** page (key icon) and give it to them.

The import is safe to run again: rows already copied are skipped. When it looks right, delete the three `FIREBASE_` lines from `.env` and run `docker compose up -d`.

**Old uploaded images:** images uploaded on the old host were saved in `public/courses`, `public/partners`, `public/ach`, `public/age` and `public/children`. Any that are not in Git yet must be copied into those folders in the repository, then committed, or their pictures will be missing. New uploads go to the `uploads` volume.

## 7. Domain and HTTPS

1. At your domain registrar, point an `A` record for `braintrain.tn` (and `www`) to the VPS IP.
2. Create the Nginx site:

```bash
sudo nano /etc/nginx/sites-available/braintrain
```

Paste (with your domain):

```nginx
server {
    listen 80;
    server_name braintrain.tn www.braintrain.tn;

    # Photo and image uploads (the site itself accepts up to 10 MB)
    client_max_body_size 12m;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

3. Enable it and get the certificate:

```bash
sudo ln -s /etc/nginx/sites-available/braintrain /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl reload nginx
sudo certbot --nginx -d braintrain.tn -d www.braintrain.tn
```

Certbot switches the site to HTTPS and renews the certificate by itself.

4. In the Stripe dashboard, set the webhook URL to `https://braintrain.tn/api/stripe/webhook` and put its signing secret in `STRIPE_WEBHOOK_SECRET` (then `docker compose up -d`).

## 8. Daily payment reminders

Open the crontab with `crontab -e` and add (your domain and the `CRON_SECRET` from `.env`):

```cron
0 9 * * * curl -s -X POST -H "x-cron-secret: YOUR_CRON_SECRET" https://braintrain.tn/api/cron/payment-reminders > /dev/null
```

Every day at 9:00 it marks late payments as overdue and texts the parents.

## 9. Backups

The database and the uploads are the only things that can't be rebuilt from Git. Back them up every night:

```bash
mkdir -p ~/backups
crontab -e
```

Add:

```cron
30 2 * * * cd ~/braintrain && docker compose exec -T db sh -c 'pg_dump -U "$POSTGRES_USER" "$POSTGRES_DB"' | gzip > ~/backups/db-$(date +\%F).sql.gz
45 2 * * * docker run --rm -v braintrain_uploads:/uploads -v ~/backups:/backup alpine tar czf /backup/uploads-$(date +\%F).tgz -C /uploads .
0 4 * * * find ~/backups -type f -mtime +14 -delete
```

This keeps 14 days on the VPS. Copy `~/backups` off the server from time to time (or enable OVH's automated backup option).

Restore a database backup:

```bash
gunzip -c ~/backups/db-2027-06-15.sql.gz | docker compose exec -T db sh -c 'psql -U "$POSTGRES_USER" "$POSTGRES_DB"'
```

## Updating the site

After new code is pushed to Git:

```bash
cd ~/braintrain
git pull
docker compose up -d --build
```

The app applies any new database changes when it starts. Visitors see the old version until the new one is ready.

## Useful commands

| What | Command |
| --- | --- |
| Is it running? | `docker compose ps` |
| Website logs | `docker compose logs -f app` |
| Restart the website | `docker compose restart app` |
| Open the database | `docker compose exec db sh -c 'psql -U "$POSTGRES_USER" "$POSTGRES_DB"'` |
| Stop everything | `docker compose down` (data is kept) |

Never run `docker compose down -v`: the `-v` deletes the database and the uploads.
