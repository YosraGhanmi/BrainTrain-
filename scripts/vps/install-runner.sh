#!/usr/bin/env bash
# Download/check the official Linux x64 runner archive using GitHub's setup UI.
# sudo bash install-runner.sh ARCHIVE https://github.com/OWNER/REPO
set -Eeuo pipefail
[[ $EUID == 0 ]] || { echo 'Run with sudo.' >&2; exit 1; }
archive=$(realpath "${1:?Official runner archive required}")
repo=${2:?Repository URL required}
[[ -s $archive && $repo =~ ^https://github.com/[A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+$ ]] || exit 1
id deploy >/dev/null
runner=/opt/braintrain/runner
install -d -m 750 -o deploy -g deploy "$runner"
[[ ! -f $runner/.runner ]] || { echo 'Runner is already registered; manage it using svc.sh.'; exit 1; }
tar xzf "$archive" -C "$runner"
chown -R deploy:deploy "$runner"
cd "$runner"
bash bin/installdependencies.sh
read -rsp 'Temporary runner registration token from GitHub: ' registration_token
echo
runuser -u deploy -- ./config.sh --url "$repo" --token "$registration_token" --name braintrain-vps --labels braintrain --unattended --work _work
unset registration_token
./svc.sh install deploy
./svc.sh start
echo 'Runner installed. Check GitHub runner status before enabling VPS_DEPLOY_ENABLED.'
