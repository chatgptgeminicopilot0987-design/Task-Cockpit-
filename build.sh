#!/bin/bash
set -e
echo "Building frontend..."
pnpm --filter @workspace/team-task-manager run build
echo "Building API server..."
pnpm --filter @workspace/api-server run build
echo "Build complete."
