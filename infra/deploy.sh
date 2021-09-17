#!/bin/bash

set -o errexit -o nounset -o pipefail

export AWS_DEFAULT_REGION=us-east-1

aws cloudformation deploy \
  --template-file deployment.cfn.yaml \
  --stack-name mux-video-monitor \
  --parameter-override \
    "HostedZoneId=$HOSTED_ZONE_ID" \
    "AppDomain=$APP_DOMAIN" \
  --capabilities CAPABILITY_IAM

FRONTEND_BUCKET=$(aws cloudformation describe-stacks --stack-name mux-video-monitor --query 'Stacks[0].Outputs[?OutputKey==`FrontendWebsiteBucket`].OutputValue' --output text)

echo "::set-output name=frontendBucket::$FRONTEND_BUCKET"
