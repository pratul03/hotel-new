#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ECOSYSTEM_FILE="${SCRIPT_DIR}/ecosystem.backend-services.config.js"
LOG_DIR="${SCRIPT_DIR}/../logs/pm2"

if ! command -v pm2 >/dev/null 2>&1; then
  echo "[ERROR] pm2 is required but not found in PATH."
  echo "[HINT] Install with: pnpm add -g pm2"
  echo "[HINT] If still missing, run: pnpm setup && exec \$SHELL -l"
  exit 1
fi

if [[ ! -f "${ECOSYSTEM_FILE}" ]]; then
  echo "[ERROR] Ecosystem file not found: ${ECOSYSTEM_FILE}"
  exit 1
fi

mkdir -p "${LOG_DIR}"

# Keep this list aligned with scripts/ecosystem.backend-services.cjs app names.
APP_NAMES=(
  "backend-api"
  "job-supervisor"
  "notification-service"
)

echo "[INFO] Starting backend services with PM2..."

# Cleanup a legacy process that can appear when PM2 treats .cjs as a script.
pm2 delete "ecosystem.backend-services.cjs" >/dev/null 2>&1 || true
pm2 delete "ecosystem.backend-services" >/dev/null 2>&1 || true

for app in "${APP_NAMES[@]}"; do
  echo "[INFO] Starting PM2 app: ${app}"
  if ! pm2 start "${ECOSYSTEM_FILE}" --only "${app}" --update-env; then
    echo "[INFO] App already exists, restarting: ${app}"
    pm2 restart "${app}" --update-env
  fi
done

pm2 save
pm2 ls

echo "[DONE] Services started and registered in PM2."
echo "[INFO] Monitor with: ./scripts/monitor-backend-services-pm2.sh"
echo "[INFO] PM2 log files: ${LOG_DIR}"
echo "[INFO] Tail all logs: ./scripts/monitor-backend-services-pm2.sh logs"
echo "[INFO] Tail endpoint logs: ./scripts/monitor-backend-services-pm2.sh endpoints"
