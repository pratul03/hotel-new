#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ECOSYSTEM_FILE="${SCRIPT_DIR}/ecosystem.backend-services.config.js"
LOG_DIR="${SCRIPT_DIR}/../logs/pm2"
BACKEND_ENV_FILE="${SCRIPT_DIR}/../backend/.env"

backend_port="8080"
if [[ -f "${BACKEND_ENV_FILE}" ]]; then
  env_port="$(grep -E '^PORT=' "${BACKEND_ENV_FILE}" | tail -n 1 | cut -d '=' -f2- | tr -d '[:space:]' || true)"
  if [[ -n "${env_port}" && "${env_port}" =~ ^[0-9]+$ ]]; then
    backend_port="${env_port}"
  fi
fi

is_descendant_of() {
  local pid="$1"
  local ancestor="$2"

  while [[ -n "${pid}" && "${pid}" != "0" ]]; do
    if [[ "${pid}" == "${ancestor}" ]]; then
      return 0
    fi

    pid="$(ps -o ppid= -p "${pid}" 2>/dev/null | tr -d '[:space:]')"
  done

  return 1
}

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

listener_pid="$(lsof -tiTCP:"${backend_port}" -sTCP:LISTEN 2>/dev/null | head -n 1 || true)"
if [[ -n "${listener_pid}" ]]; then
  pm2_backend_pid="$(pm2 pid backend-api 2>/dev/null | tr -d '[:space:]' || true)"
  has_conflict="false"

  if [[ -z "${pm2_backend_pid}" || "${pm2_backend_pid}" == "0" ]]; then
    has_conflict="true"
  elif ! is_descendant_of "${listener_pid}" "${pm2_backend_pid}"; then
    has_conflict="true"
  fi

  if [[ "${has_conflict}" == "true" ]]; then
    echo "[ERROR] Port ${backend_port} is already in use by a non-PM2 process (PID ${listener_pid})."
    echo "[ERROR] PM2 backend logs will not include live API requests until this is stopped."
    ps -fp "${listener_pid}" || true
    echo "[HINT] Stop the conflicting process, then rerun this script."
    echo "[HINT] If this is your local dev server, stop it in that terminal (Ctrl+C)."
    exit 1
  fi
fi

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
echo "[INFO] Tail only new logs: ./scripts/monitor-backend-services-pm2.sh live"
echo "[INFO] Tail endpoint logs: ./scripts/monitor-backend-services-pm2.sh endpoints"
