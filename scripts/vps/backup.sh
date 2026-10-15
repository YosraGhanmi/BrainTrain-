#!/usr/bin/env bash
set -Eeuo pipefail
umask 077
base=/opt/braintrain
release=${1:-$base/current}
mkdir -p "$base/backups"
exec 8> "$base/backup.lock"
flock -x 8
cd "$release"
export IMAGE
IMAGE=$(cat image.ref)
export MIGRATION_IMAGE
MIGRATION_IMAGE=$(cat migration.ref)
dc=(docker compose --env-file "$base/.env" -f docker-compose.yml -f compose.production.yml)
stamp=$(date -u +%Y%m%dT%H%M%S)-$$
db_file="$base/backups/db-$stamp.sql.gz"
uploads_file="$base/backups/uploads-$stamp.tgz"
trap 'rm -f "${db_file}.tmp" "${uploads_file}.tmp"' EXIT
# Variables expand inside the database container, not on the host.
# shellcheck disable=SC2016
"${dc[@]}" exec -T db sh -c 'pg_dump -U "$POSTGRES_USER" "$POSTGRES_DB"' | gzip > "${db_file}.tmp"
mv "${db_file}.tmp" "$db_file"
# Use the app image, already present, to archive the persistent upload volume.
docker run --rm --pull never --user 0 --entrypoint tar -v braintrain_uploads:/uploads:ro "$IMAGE" czf - -C /uploads . > "${uploads_file}.tmp"
mv "${uploads_file}.tmp" "$uploads_file"
find "$base/backups" -maxdepth 1 -type f \( -name 'db-*.sql.gz' -o -name 'uploads-*.tgz' \) -mtime +14 -delete
echo "Backup complete: $stamp (UTC)"
