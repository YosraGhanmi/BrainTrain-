#!/usr/bin/env bash
# Only run after confirming the previous application supports the current schema.
set -Eeuo pipefail
base=/opt/braintrain
exec 9> "$base/deploy.lock"
flock -x 9
target=$(readlink -f "$base/previous")
[[ $target == "$base/releases/"* && -s $target/image.ref ]] || { echo 'No previous release.' >&2; exit 1; }
current=$(readlink -f "$base/current")
cd "$target"
export IMAGE
IMAGE=$(cat image.ref)
export MIGRATION_IMAGE
MIGRATION_IMAGE=$(cat migration.ref)
docker compose --env-file "$base/.env" -f docker-compose.yml -f compose.production.yml up -d --no-build --wait --wait-timeout 180 app
ln -sfn "$target" "$base/current"
ln -sfn "$current" "$base/previous"
echo 'Previous application restored. No database rollback performed.'
