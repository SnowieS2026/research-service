#!/bin/bash
# Run program discovery and seed TARGET_PROGRAMS
cd "$(dirname "$0")/.."
npm start -- --discover-only "$@"
