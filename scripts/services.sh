#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

START_PM2="${SCRIPT_DIR}/start-backend-services-pm2.sh"
STOP_PM2="${SCRIPT_DIR}/stop-backend-services-pm2.sh"
MONITOR_PM2="${SCRIPT_DIR}/monitor-backend-services-pm2.sh"
ECOSYSTEM_FILE="${SCRIPT_DIR}/ecosystem.backend-services.config.js"

APP_NAMES=(
  "backend-api"
  "job-supervisor"
  "notification-service"
)

usage() {
  echo "Usage: ./scripts/services.sh <command>"
  echo
  echo "Commands:"
  echo "  start    Start all backend services with PM2"
  echo "  stop     Stop all backend services in PM2"
  echo "  restart  Restart all backend services in PM2"
  echo "  refresh <service>  Restart one service (or start it if missing)"
  echo "  status   Show PM2 process list"
  echo "  monitor  Open PM2 interactive monitor"
  echo "  logs     Tail all service logs"
  echo "  endpoints Tail backend-api endpoint request/response logs"
  echo "  logfiles Tail per-service PM2 log files from logs/pm2"
  echo
  echo "Examples:"
  echo "  ./scripts/services.sh start"
  echo "  ./scripts/services.sh status"
  echo "  ./scripts/services.sh logs"
  echo "  ./scripts/services.sh refresh backend-api"
}

require_pm2() {
  if ! command -v pm2 >/dev/null 2>&1; then
    echo "[ERROR] pm2 is required but not found in PATH."
    echo "[HINT] Install with: pnpm add -g pm2"
    echo "[HINT] If still missing, run: pnpm setup && exec \$SHELL -l"
    exit 1
  fi
}

is_valid_service() {
  local target="${1:-}"
  for app in "${APP_NAMES[@]}"; do
    if [[ "${app}" == "${target}" ]]; then
      return 0
    fi
  done
  return 1
}

refresh_one_service() {
  local service="${1:-}"

  if [[ -z "${service}" ]]; then
    echo "[ERROR] Missing service name."
    echo "[HINT] Usage: ./scripts/services.sh refresh <service>"
    echo "[HINT] Valid services: ${APP_NAMES[*]}"
    exit 1
  fi

  if ! is_valid_service "${service}"; then
    echo "[ERROR] Unknown service: ${service}"
    echo "[HINT] Valid services: ${APP_NAMES[*]}"
    exit 1
  fi

  if pm2 describe "${service}" >/dev/null 2>&1; then
    echo "[INFO] Restarting service: ${service}"
    pm2 restart "${service}" --update-env
  else
    echo "[INFO] Service not found in PM2, starting: ${service}"
    pm2 start "${ECOSYSTEM_FILE}" --only "${service}" --update-env
  fi

  pm2 save
  pm2 ls
}

command="${1:-}";
service_name="${2:-}";

case "${command}" in
  start)
    "${START_PM2}"
    ;;
  stop)
    "${STOP_PM2}"
    ;;
  restart)
    "${STOP_PM2}"
    "${START_PM2}"
    ;;
  refresh)
    require_pm2
    refresh_one_service "${service_name}"
    ;;
  status)
    require_pm2
    pm2 ls
    ;;
  monitor)
    "${MONITOR_PM2}" monit
    ;;
  logs)
    "${MONITOR_PM2}" logs
    ;;
  endpoints)
    "${MONITOR_PM2}" endpoints
    ;;
  logfiles)
    "${MONITOR_PM2}" files
    ;;
  ""|help|-h|--help)
    usage
    ;;
  *)
    echo "[ERROR] Unknown command: ${command}"
    usage
    exit 1
    ;;
esac
