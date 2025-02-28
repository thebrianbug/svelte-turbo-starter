#!/bin/bash

# Try docker compose first, fall back to podman-compose
if docker compose version >/dev/null 2>&1; then
    docker compose "$@"
elif command -v podman-compose >/dev/null 2>&1; then
    podman-compose "$@"
else
    echo "Error: Neither docker compose nor podman-compose found"
    echo "Please install either Docker or Podman with compose plugin"
    exit 1
fi
