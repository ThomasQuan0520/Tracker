#!/bin/sh
set -eu

REPO_ROOT=$(CDPATH= cd "$(dirname "$0")" && pwd)
DEPLOY_HOST=${DEPLOY_HOST:-root@87.106.101.203}
DEPLOY_PATH=${DEPLOY_PATH:-/root/cymo}
DEPLOY_BRANCH=${DEPLOY_BRANCH:-main}

cd "$REPO_ROOT"

CURRENT_BRANCH=$(git branch --show-current)
if [ "$CURRENT_BRANCH" != "$DEPLOY_BRANCH" ]; then
    printf 'Deploy from the %s branch (current branch: %s).\n' "$DEPLOY_BRANCH" "$CURRENT_BRANCH" >&2
    exit 1
fi

if [ -n "$(git status --porcelain)" ]; then
    printf 'Commit or stash local changes before deploying.\n' >&2
    exit 1
fi

printf 'Pushing %s to origin...\n' "$DEPLOY_BRANCH"
git push origin "$DEPLOY_BRANCH"

printf 'Updating %s on %s...\n' "$DEPLOY_PATH" "$DEPLOY_HOST"
ssh -o BatchMode=no "$DEPLOY_HOST" "sh -s -- '$DEPLOY_PATH' '$DEPLOY_BRANCH'" <<'REMOTE'
set -eu

DEPLOY_PATH=$1
DEPLOY_BRANCH=$2

cd "$DEPLOY_PATH"
git pull --ff-only origin "$DEPLOY_BRANCH"
docker compose up -d --build

attempt=0
until curl -fsS http://127.0.0.1:3000/ >/dev/null; do
    attempt=$((attempt + 1))
    if [ "$attempt" -ge 15 ]; then
        docker compose ps
        docker compose logs --tail=80 tracker
        exit 1
    fi
    sleep 2
done

docker compose ps
printf 'Deployment completed successfully.\n'
REMOTE
