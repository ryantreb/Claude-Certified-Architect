#!/usr/bin/env bash
# The whole weekly deploy, as one command:
#
#   tools/deploy-mobile.sh [branch]
#
# Pulls the branch (current branch if omitted), rebuilds the mobile build into
# a staging folder, and swaps it live only if the build succeeded — a failed
# build aborts loudly with the old build still served. Restarts the static
# server unit (if installed) so its working directory follows the new folder.
# Set SKIP_PULL=1 to deploy the working tree as-is.
set -euo pipefail
cd "$(dirname "$0")/.."

BRANCH="${1:-$(git rev-parse --abbrev-ref HEAD)}"
if [ "${SKIP_PULL:-0}" != 1 ]; then
  git pull origin "$BRANCH"
fi

STAGING="mobile.staging"
rm -rf "$STAGING"
python3 tools/build-mobile.py "$STAGING"

# hand-written docs ride along; everything else in mobile/ is build output
if [ -f mobile/README.md ]; then cp mobile/README.md "$STAGING/README.md"; fi

rm -rf mobile.old
mv mobile mobile.old
mv "$STAGING" mobile
rm -rf mobile.old

# the unit serves by working directory, which followed the old inode — restart
systemctl --user try-restart weavefall-mobile 2>/dev/null || true

echo "deployed build $(python3 -c "import json;print(json.load(open('mobile/asset-manifest.json'))['version'])")"
