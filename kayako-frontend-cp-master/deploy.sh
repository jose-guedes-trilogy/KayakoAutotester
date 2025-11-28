#!/usr/bin/env bash

set -ev

git config --global user.email "travis@kayako.com"
git config --global user.name "Travis CI"

get_release_message() {
  local PREVIOUS_TAG=`git for-each-ref --sort=taggerdate --format '%(refname)' refs/tags |grep $1 | tail -n1 | grep -Eo 'v(.*)'`
  local HISTORY_RECORD=`git log --pretty=format:"%s" "$PREVIOUS_TAG..HEAD"`
  local TAG_COMMIT=`echo "$HISTORY_RECORD" | grep -Eo 'FT-(\d+)' | sort | uniq | sed -e "s/\(.*\)/- [x] https:\/\/kayako.atlassian.net\/browse\/\1/g"`
  local RELEASE_TEXT="Tickets released"

  if test -z "$TAG_COMMIT"; then
    if test -z "$HISTORY_RECORD"; then
      RELEASE_MESSAGE=`echo -e "$RELEASE_TEXT:\n-"`
    else
      RELEASE_MESSAGE=`echo -e "$RELEASE_TEXT:\n$HISTORY_RECORD"`
    fi
  else
    RELEASE_MESSAGE=`echo -e "$RELEASE_TEXT:\n$TAG_COMMIT"`
  fi

  echo "$RELEASE_MESSAGE"
}

tag() {
  local RELEASE_VERSION="v$(date +'%Y-%m-%d_%H-%m')-$1"
  local RELEASE_MESSAGE=$(get_release_message "$1")

  git tag -d $RELEASE_VERSION || true
  git tag -a "$RELEASE_VERSION" -m "$RELEASE_MESSAGE"
  git push origin --tags -f
}

deploy() {
  if [ "$1" == "develop" ]
  then
    BRANCH="develop"
  elif [ "$1" == "staging" ]
  then
    BRANCH="staging"
  elif [ "$1" == "production" ]
  then
    BRANCH="master"
  fi

  # Create a production build for the deploy target
  DEPLOY_TARGET_CONFIG="{}" DEPLOY_BRANCH="$BRANCH" DEPLOY_TARGET="$1" ember build --environment=production

  # Tag this release (has to happen after build otherwise tag affects the build)
  tag "$1"

  # Clone app-frontend and create a new commit with latest frontend-cp assets
  COMMIT_MESSAGE=$(git log -1 --format="%B Author:%an" $TRAVIS_COMMIT)
  git clone git@github.com:trilogy-group/kayako-app-frontend.git -b $BRANCH --depth=1 deploy
  cd deploy && git checkout $BRANCH && cd ../
  rm -rf deploy/assets deploy/templates
  mkdir -p deploy/assets/__cp
  cp -r dist/* deploy/assets/__cp
  rm -rf deploy/locale/en-us
  mkdir -p deploy/locale/en-us/api
  cp -r app/locales/en-us/* deploy/locale/en-us/api
  node scripts/prepare_translations_for_api.js deploy/locale/en-us/api
  mkdir -p deploy/__cp/templates/ui
  sed -i "s/\"\/assets\//\"{{ assets(\'frontend\') }}__cp\/assets\//g" "dist/index.html"
  sed -i "s/\"\/images\//\"{{ assets(\'frontend\') }}__cp\/images\//g" "dist/index.html"
  cp dist/index.html deploy/__cp/templates/ui/base.tpl
  cd deploy
  git add --all
  git commit -m "$COMMIT_MESSAGE ($BRANCH)" --allow-empty
  git push origin $BRANCH -f
}

if [ "$TRAVIS_REPO_SLUG" != "trilogy-group/kayako-frontend-cp" ]; then exit; fi
if [ "$TRAVIS_PULL_REQUEST" != "false" ]; then exit; fi
if [ "$TRAVIS_BRANCH" == "develop" ]; then deploy "develop"; fi
if [ "$TRAVIS_BRANCH" == "staging" ]; then deploy "staging"; fi
if [ "$TRAVIS_BRANCH" == "master" ]; then deploy "production"; fi
