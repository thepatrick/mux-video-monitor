#!/bin/bash

set -o errexit -o nounset -o pipefail

export AWS_ROLE_ARN=arn:aws:iam::162559259314:role/MuxVideoMonitorGithubRole
export AWS_WEB_IDENTITY_TOKEN_FILE=/tmp/awscreds
export AWS_DEFAULT_REGION=us-east-1

echo AWS_WEB_IDENTITY_TOKEN_FILE=$AWS_WEB_IDENTITY_TOKEN_FILE >> $GITHUB_ENV
echo AWS_ROLE_ARN=$AWS_ROLE_ARN >> $GITHUB_ENV
echo AWS_DEFAULT_REGION=$AWS_DEFAULT_REGION >> $GITHUB_ENV

curl --silent -H "Authorization: bearer $ACTIONS_ID_TOKEN_REQUEST_TOKEN" "$ACTIONS_ID_TOKEN_REQUEST_URL&audience=sigstore" | jq -r '.value' > $AWS_WEB_IDENTITY_TOKEN_FILE
