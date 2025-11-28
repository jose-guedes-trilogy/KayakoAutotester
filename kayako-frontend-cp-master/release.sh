#!/usr/bin/env bash

log () {
  CURRENT_TIME="$(date +'%Y-%m-%d %H:%M:%S')"

  echo "[$CURRENT_TIME] $1"
}

RELEASE_VERSION="v$(date +'%Y-%m-%d_%H-%m')"

release() {
  local ENVIRONMENT=$1
  local CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
  BRANCH=master

  log "Begin release to $ENVIRONMENT version \"$RELEASE_VERSION\""

  if [ "$ENVIRONMENT" == "production" ]
  then
    log "Stashing branch \"$CURRENT_BRANCH\", will re-apply after deployment"
    git stash
    log "Fetch upstream"
    git fetch upstream
    log "Checkout $BRANCH"
    git checkout $BRANCH
    log "Merge upstream/develop"
    git merge upstream/develop --ff-only
    log "Push upstream $BRANCH"
    git push upstream $BRANCH
  fi
}

revert() {
  local TAG=$1

  echo "Begin reverting tag \"$TAG\""

  git fetch upstream
  git checkout -b master
  git reset $TAG
  git push upstream master -f
}

while test $# -ne 0; do
  arg=$1; shift
  case $arg in
    release) release $1; exit ;;
    revert) revert $1; exit ;;
    *)
      if test -z "$ENV"; then
        ENV=$arg;
      else
        REF="$REF $arg";
      fi
      ;;
  esac
done
