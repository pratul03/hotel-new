#!/usr/bin/env bash
set -euo pipefail

SERVICES=("backend-api" "job-supervisor" "notification-service")

if ! command -v pm2 >/dev/null 2>&1; then
  echo "[ERROR] pm2 is required but not found in PATH."
  echo "[HINT] Install with: pnpm add -g pm2"
  echo "[HINT] If still missing, run: pnpm setup && exec \$SHELL -l"
  exit 1
fi

echo "[INFO] Stopping backend services in PM2..."
# Cleanup a legacy process that can appear when PM2 treats .cjs as a script.
pm2 delete "ecosystem.backend-services.cjs" >/dev/null 2>&1 || true
pm2 delete "ecosystem.backend-services" >/dev/null 2>&1 || true

for service in "${SERVICES[@]}"; do
  pm2 delete "${service}" >/dev/null 2>&1 || true
  echo "[OK] ${service} stopped (or was not running)"
done

pm2 save
pm2 ls

echo "[DONE] PM2 backend services shutdown complete."
