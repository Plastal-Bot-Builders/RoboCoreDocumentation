#!/bin/sh
# Concatenate the parts into code.js and syntax-check it. The icon geometry in ../app-icon
# goes first, so this page and app-icon/preview.js draw exactly the same shapes.
# src/01_core.js and src/02_tokens.js are snapshots of the IDE design builder's helpers
# (figma-plugin/src), so the page uses the same text styles and colour variables.
cd "$(dirname "$0")"
cat ../app-icon/geom.js ../app-icon/concepts.js ../app-icon/before_png.js src/*.js > code.js && node --check code.js && echo "code.js: $(wc -c < code.js) bytes"
if grep -q 'import(' code.js; then echo 'code.js contains "import(" (Figma rejects it)'; exit 1; fi
