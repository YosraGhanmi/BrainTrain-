#!/usr/bin/env bash
# CI builds and tests these local release images before this script runs.
set -Eeuo pipefail
base=/opt/braintrain
release=$(pwd -P)
image=${1:?Local release image tag required}
[[ $release == "$base/releases/"* && $image =~ ^braintrain-app:[a-f0-9-]+$ ]] || { echo 'Invalid release or image.' >&2; exit 1; }
[[ -s $base/.env ]] || { echo 'Run VPS setup first.' >&2; exit 1; }
exec 9> "$base/deploy.lock"
flock -x 9
export IMAGE=$image
export MIGRATION_IMAGE="braintrain-migrations:${image#braintrain-app:}"
docker image inspect "$IMAGE" "$MIGRATION_IMAGE" >/dev/null
printf '%s\n' "$IMAGE" > image.ref
printf '%s\n' "$MIGRATION_IMAGE" > migration.ref
ln -sfn "$base/.env" .env
dc=(docker compose --env-file "$base/.env" -f docker-compose.yml -f compose.production.yml)
"${dc[@]}" config --quiet
previous=$(readlink -f "$base/current" || true)
if [[ -n $previous && -f $previous/image.ref ]]; then
  bash "$previous/scripts/vps/backup.sh" "$previous"
fi
"${dc[@]}" up -d --wait --wait-timeout 120 db
# Failed migrations leave the old application running; never reverse schema changes.
"${dc[@]}" run --rm --no-deps migrate
if ! "${dc[@]}" up -d --no-build --wait --wait-timeout 180 app; then
  "${dc[@]}" logs --tail 80 app >&2
  if [[ -n $previous && -f $previous/image.ref ]]; then
    echo 'Restoring previous application image; database schema is unchanged by recovery.' >&2
    (cd "$previous"; IMAGE=$(cat image.ref) MIGRATION_IMAGE=$(cat migration.ref) docker compose --env-file "$base/.env" -f docker-compose.yml -f compose.production.yml up -d --no-build --wait --wait-timeout 180 app)
  fi
  exit 1
fi
[[ -z $previous || $previous == "$release" ]] || ln -sfn "$previous" "$base/previous"
ln -sfn "$release" "$base/current"
echo "Deployment healthy: $IMAGE"
