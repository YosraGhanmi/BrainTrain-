#!/usr/bin/env bash
# sudo bash setup.sh DOMAIN CERTIFICATE_EMAIL [SSH_PORT]
set -Eeuo pipefail
[[ $EUID == 0 ]] || { echo 'Run with sudo.' >&2; exit 1; }
domain=${1:?Domain required}; email=${2:?Certificate email required}
ssh_port=${3:-22}
[[ $domain =~ ^[a-zA-Z0-9]([a-zA-Z0-9.-]*[a-zA-Z0-9])?$ && $domain == *.* ]] || exit 1
[[ $email =~ ^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+$ && $ssh_port =~ ^[0-9]+$ ]] || exit 1
# shellcheck disable=SC1091
source /etc/os-release
[[ $ID == ubuntu && $VERSION_ID == 24.04 ]] || { echo 'This script targets Ubuntu 24.04 LTS.' >&2; exit 1; }
[[ $(dpkg --print-architecture) == amd64 ]] || { echo 'Expected an amd64 VPS.' >&2; exit 1; }
apt-get update
apt-get install -y ca-certificates curl gnupg nginx certbot python3-certbot-nginx ufw openssl git shellcheck
install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
chmod a+r /etc/apt/keyrings/docker.asc
echo "deb [arch=amd64 signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu $VERSION_CODENAME stable" > /etc/apt/sources.list.d/docker.list
apt-get update
apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
id deploy &>/dev/null || useradd --create-home --shell /bin/bash deploy
usermod -aG docker deploy
install -d -m 750 -o deploy -g deploy /opt/braintrain /opt/braintrain/releases /opt/braintrain/backups
if [[ ! -e /opt/braintrain/.env ]]; then
  umask 077
  cat > /opt/braintrain/.env <<EOF
POSTGRES_DB=braintrain
POSTGRES_USER=braintrain
POSTGRES_PASSWORD=$(openssl rand -hex 24)
ADMIN_EMAIL=$email
ADMIN_PASSWORD=$(openssl rand -hex 24)
ADMIN_SESSION_SECRET=$(openssl rand -hex 32)
PORTAL_SESSION_SECRET=$(openssl rand -hex 32)
CRON_SECRET=$(openssl rand -hex 32)
NEXT_PUBLIC_SITE_URL=https://$domain
SMS_PROVIDER=twilio
EOF
  chown deploy:deploy /opt/braintrain/.env
fi
# Leave unrelated Nginx sites intact; this named virtual host serves only DOMAIN.
if [[ ! -e /etc/nginx/sites-available/braintrain ]]; then
  cat > /etc/nginx/sites-available/braintrain <<EOF
server {
    listen 80;
    server_name $domain;
    client_max_body_size 12m;
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_buffering off;
    }
}
EOF
fi
ln -sfn /etc/nginx/sites-available/braintrain /etc/nginx/sites-enabled/braintrain
nginx -t
systemctl enable --now docker nginx
systemctl reload nginx
ufw allow "$ssh_port/tcp"
ufw allow 'Nginx Full'
ufw --force enable
certbot --nginx --non-interactive --agree-tos --redirect --email "$email" -d "$domain"
cat > /etc/cron.d/braintrain-backup <<'EOF'
SHELL=/bin/bash
PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin
30 2 * * * deploy /bin/bash /opt/braintrain/current/scripts/vps/backup.sh >> /opt/braintrain/backups/backup.log 2>&1
EOF
echo 'Setup complete. Edit /opt/braintrain/.env, install the self-hosted runner, then enable GitHub deployment.'
echo 'The deploy user belongs to the Docker group, which grants root-equivalent access.'
