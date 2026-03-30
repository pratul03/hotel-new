#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ECOSYSTEM_FILE="${SCRIPT_DIR}/ecosystem.backend-services.cjs"

if ! command -v pm2 >/dev/null 2>&1; then
  echo "[ERROR] pm2 is required but not found in PATH."
  echo "[HINT] Install with: pnpm add -g pm2"
  exit 1
fi

if [[ ! -f "${ECOSYSTEM_FILE}" ]]; then
  echo "[ERROR] Ecosystem file not found: ${ECOSYSTEM_FILE}"
  exit 1
fi

echo "[INFO] Starting backend services with PM2..."
pm2 start "${ECOSYSTEM_FILE}"
pm2 save
pm2 ls

echo "[DONE] Services started and registered in PM2."
echo "[INFO] Monitor with: ./scripts/monitor-backend-services-pm2.sh"
