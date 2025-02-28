#!/bin/bash

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check if docker compose V2 exists
if command_exists "docker" && docker compose version >/dev/null 2>&1; then
    docker compose "$@"
# Check if docker-compose V1 exists
elif command_exists "docker-compose"; then
    docker-compose "$@"
# Fall back to podman-compose
elif command_exists "podman-compose"; then
    podman-compose "$@"
else
    echo "Error: Neither docker compose, docker-compose, nor podman-compose found"
    echo "Please install either Docker or Podman with compose plugin"
    exit 1
fi
