#!/usr/bin/env bash
# Run on the VPS runner, or any Linux machine with Docker/Compose.
set -Eeuo pipefail
tag=${1:?Release tag required}
[[ $tag =~ ^[a-f0-9-]+$ ]] || exit 1
export IMAGE="braintrain-app:$tag" MIGRATION_IMAGE="braintrain-migrations:$tag"
project="braintrain-ci-$tag"
common=(docker compose --env-file .env.docker.example -p "$project")
build=("${common[@]}" -f docker-compose.yml -f compose.ci.yml)
test_stack=("${common[@]}" -f docker-compose.yml -f compose.production.yml -f compose.ci.yml)
cleanup() {
  result=$?
  if [[ $result != 0 ]]; then "${test_stack[@]}" logs --tail 80 >&2 || true; fi
  # This is an isolated CI project, never the production project/volumes.
  "${test_stack[@]}" down -v --remove-orphans || true
  exit "$result"
}
trap cleanup EXIT
shellcheck scripts/vps/*.sh scripts/test-vps.sh
bash scripts/test-vps.sh
"${build[@]}" build app migrate
"${test_stack[@]}" up -d --wait --wait-timeout 120 db
"${test_stack[@]}" run --rm --no-deps migrate
"${test_stack[@]}" up -d --no-build --wait --wait-timeout 180 app
"${test_stack[@]}" exec -T app node -e "(async()=>{for(const path of ['/api/health','/fr','/en','/admin/login']){const r=await fetch('http://127.0.0.1:3000'+path);if(!r.ok)throw new Error(path+': '+r.status);console.log(path+': '+r.status)}})().catch(e=>{console.error(e);process.exit(1)})"
echo "CI passed: $IMAGE"
