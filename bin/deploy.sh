#!/bin/bash

set -eu -o pipefail

JS="process.stdout.write(JSON.parse(require('fs').readFileSync('$(dirname $0)/../package.json')).version)"
VERSION="v$(node -e "$JS")"

(cd $(dirname $0)/../ && \
    npm run build && \
    aws s3 cp --acl=public-read dist/mapbox-gl-instrumentile.min.js s3://mapbox-gl-js/plugins/mapbox-gl-instrumentile/$VERSION/mapbox-gl-instrumentile.js && \
    echo "ok - published $VERSION to https://api.mapbox.com/mapbox-gl-js/plugins/mapbox-gl-instrumentile/$VERSION/mapbox-gl-instrumentile.js" || echo "error")