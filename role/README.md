# github-oidc

Creates an IAM OIDC identity provider that can be used with GitHub Actions. This only needs to be done once per AWS account.

# mux-video-monitor-role

Creates an IAM role named `MuxVideoMonitorGithubRole` that can be assumed by GitHub Actions.

Is deployed as the stack `mux-video-monitor-github-role` in us-east-1 (US East (North Virigina)).

The ARN required is an output from the `github-oidc` stack.
