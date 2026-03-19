#!/bin/bash
# Run the bounty pipeline once
cd "$(dirname "$0")/.."
npm run build 2>/dev/null
npm start -- --once "$@"
