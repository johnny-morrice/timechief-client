#!/bin/bash
set -e

# Parameters:
# ENVIRONMENT - dev or prod
# PHASE       - build step
# VERSION     - version tag to apply
# BRANCH      - Git branch to clone

if [ -z "$PHASE" ]; then
    echo "PHASE must be set to one of: bundle, upload, init-fs, build-iso, upload-iso, all"
    exit 1
fi

if [ -z "$VERSION" ]; then
    echo "VERSION must be set to a version string"
    exit 1
fi

if [ "$ENVIRONMENT" != "dev" ] && [ "$ENVIRONMENT" != "prod" ]; then
    echo "ENVIRONMENT must be set to one of: dev, prod"
    exit 1
fi

if [ -z "$BRANCH" ]; then
    echo "BRANCH must be set to a branch name"
    exit 1
fi

if [ -z "$REPO" ]; then
    echo "REPO must be set to a Git repository URL"
    exit 1
fi

echo "Building $ENVIRONMENT $VERSION $PHASE"
date


set +x
source "env/$ENVIRONMENT.sh"
set -x

TMPDIR=$(mktemp -d /tmp/timechief-launcher-XXXXXX)
echo "Using temporary directory $TMPDIR"

git clone --branch "$BRANCH" --single-branch "$REPO" "$TMPDIR"
cd "$TMPDIR"

pushd launcher
./script/build.sh
popd

git tag "$VERSION"
git push origin tag "$VERSION"

./script/build-phase.sh "$PHASE"

echo "Built $ENVIRONMENT $VERSION $PHASE"
date
