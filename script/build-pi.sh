#!/bin/bash
set -e


# Parameters
# ENVIRONMENT
# PHASE
# VERSION

if [ -z "$PHASE" ] ; then
    echo "PHASE must be set to one of: bundle, upload, init-fs, build-iso, upload-iso, all"
    exit 1
fi

if [ -z "$VERSION" ] ; then
    echo "VERSION must be set to a version string"
    exit 1
fi

# ENVIRONMENT must equal dev or prod.
if [ "$ENVIRONMENT" != "dev" ] && [ "$ENVIRONMENT" != "prod" ] ; then
    echo "ENVIRONMENT must be set to one of: dev, prod"
    exit 1
fi

if [ -z "$BRANCH" ] ; then
    echo "BRANCH must be set to a branch name"
    exit 1
fi

echo "Building $ENVIRONMENT $VERSION $PHASE"
date

set +x
source env/$ENVIRONMENT.sh
set -x

git fetch
git checkout $BRANCH
git reset --hard
pushd launcher
./script/build.sh
popd
git tag $VERSION
git push origin tag $VERSION
./script/build-phase.sh $PHASE
echo "Built $ENVIRONMENT $VERSION $PHASE"
date