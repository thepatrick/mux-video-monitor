#!/bin/bash

set -o errexit -o nounset -o pipefail

cd $(dirname "$0")

STACK_NAME=mux-video-monitor-backend-bucket

aws cloudformation deploy \
  --template-file backend-bucket.cfn.yaml \
  --stack-name "$STACK_NAME"

LAMBDA_BUCKET=$(aws cloudformation describe-stacks --stack-name "$STACK_NAME" --query 'Stacks[0].Outputs[?OutputKey==`BackendBucket`].OutputValue' --output text)

echo "::set-output name=backendBucket::$LAMBDA_BUCKET"
