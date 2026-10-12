#!/bin/sh
# Concatenate the source parts into code.js and syntax-check it.
cd "$(dirname "$0")"
cat src/*.js > code.js && node --check code.js && echo "code.js: $(wc -c < code.js) bytes"
