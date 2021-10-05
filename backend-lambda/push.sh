#!/bin/bash

set -o errexit -o nounset -o pipefail

export AWS_DEFAULT_REGION=us-east-1

export LAMBDA_BUCKET=$(aws cloudformation describe-stacks --stack-name mux-video-monitor-backend-bucket --query 'Stacks[0].Outputs[?OutputKey==`BackendBucket`].OutputValue' --output text)

ci/pr.sh
