#!/bin/bash
cd "$(dirname "$0")/.."
TYPE=$1
TARGET=$2
npm run osint -- --osint "$TYPE" "$TARGET" "${@:3}"
