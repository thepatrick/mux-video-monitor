#!/bin/bash

set -o errexit -o nounset -o pipefail

cd $(dirname "$0")

STACK_NAME=mux-video-monitor

aws cloudformation deploy \
  --template-file deployment.cfn.yaml \
  --stack-name "$STACK_NAME" \
  --parameter-override \
    "HostedZoneId=$HOSTED_ZONE_ID" \
    "AppDomain=$APP_DOMAIN" \
    "BackendLambdaS3Bucket=$BACKEND_LAMBDA_S3_BUCKET" \
    "BackendLambdaS3Key=$BACKEND_LAMBDA_S3_KEY" \
  --capabilities CAPABILITY_IAM

FRONTEND_BUCKET=$(aws cloudformation describe-stacks --stack-name "$STACK_NAME" --query 'Stacks[0].Outputs[?OutputKey==`FrontendWebsiteBucket`].OutputValue' --output text)

echo "::set-output name=frontendBucket::$FRONTEND_BUCKET"
