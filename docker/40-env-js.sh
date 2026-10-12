#!/bin/sh
# Build once, deploy anywhere: write runtime config from container env vars.
# Written to /tmp (served by nginx.conf) so the image also works with readOnlyRootFilesystem.
set -eu
cat > /tmp/env.js <<EOF
window.__ENV__ = {
  OIDC_AUTHORITY: '${OIDC_AUTHORITY}',
  OIDC_CLIENT_ID: '${OIDC_CLIENT_ID:-shop-frontend}',
  API_BASE_URL: '${API_BASE_URL:-}',
}
EOF
