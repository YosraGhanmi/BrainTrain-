#!/usr/bin/env bash
# Exercise deployment failure paths without SSH, Docker, or a real database.
set -Eeuo pipefail
root=$(cd "$(dirname "$0")/.." && pwd)
temp=$(mktemp -d)
trap 'rm -rf "$temp"' EXIT
mkdir -p "$temp/bin"
cat > "$temp/bin/docker" <<'EOF'
#!/usr/bin/env bash
set -eu
printf '%s|%s\n' "${IMAGE:-}" "$*" >> "$TEST_LOG"
if [[ $* == *'run --rm --no-deps migrate'* && $TEST_MODE == migration-failure ]]; then exit 1; fi
if [[ $* == *'up -d --no-build'* && $IMAGE == "$TEST_NEW_IMAGE" && $TEST_MODE == health-failure ]]; then exit 1; fi
EOF
chmod +x "$temp/bin/docker"
export PATH="$temp/bin:$PATH"
export TEST_NEW_IMAGE=braintrain-app:aaaaaaaa-1-1
old_image=braintrain-app:bbbbbbbb-1-1
for mode in success migration-failure health-failure; do
  base="$temp/$mode"
  mkdir -p "$base/releases/old/scripts/vps" "$base/releases/new"
  touch "$base/.env"
  # Deploy requires a nonempty environment file.
  printf 'POSTGRES_DB=test\n' > "$base/.env"
  printf '%s\n' "$old_image" > "$base/releases/old/image.ref"
  printf 'braintrain-migrations:bbbbbbbb-1-1\n' > "$base/releases/old/migration.ref"
  # The generated stub reads TEST_LOG when it runs.
  # shellcheck disable=SC2016
  printf '#!/usr/bin/env bash\necho backup >> "$TEST_LOG"\n' > "$base/releases/old/scripts/vps/backup.sh"
  ln -s "$base/releases/old" "$base/current"
  sed "s|/opt/braintrain|$base|g" "$root/scripts/vps/deploy.sh" > "$base/releases/new/deploy.sh"
  export TEST_LOG="$base/commands.log" TEST_MODE="$mode"
  if (cd "$base/releases/new"; bash deploy.sh "$TEST_NEW_IMAGE") > "$base/output.log" 2>&1; then
    [[ $mode == success ]] || { cat "$base/output.log"; exit 1; }
    [[ $(readlink -f "$base/current") == "$base/releases/new" ]]
    [[ $(readlink -f "$base/previous") == "$base/releases/old" ]]
    sed "s|/opt/braintrain|$base|g" "$root/scripts/vps/rollback.sh" > "$base/rollback.sh"
    bash "$base/rollback.sh" >> "$base/output.log" 2>&1
    [[ $(readlink -f "$base/current") == "$base/releases/old" ]]
    [[ $(readlink -f "$base/previous") == "$base/releases/new" ]]
  else
    [[ $mode != success ]] || { cat "$base/output.log"; exit 1; }
    [[ $(readlink -f "$base/current") == "$base/releases/old" ]]
  fi
  grep -qx backup "$TEST_LOG"
  if [[ $mode == migration-failure ]]; then
    if grep -q 'up -d --no-build' "$TEST_LOG"; then
      echo 'Application was replaced after a failed migration.' >&2
      exit 1
    fi
  elif [[ $mode == health-failure ]]; then
    grep -F "$old_image|" "$TEST_LOG" | grep -q 'up -d --no-build'
  fi
  echo "Deployment test passed: $mode"
done
