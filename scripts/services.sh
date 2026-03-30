#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

START_PM2="${SCRIPT_DIR}/start-backend-services-pm2.sh"
STOP_PM2="${SCRIPT_DIR}/stop-backend-services-pm2.sh"
MONITOR_PM2="${SCRIPT_DIR}/monitor-backend-services-pm2.sh"

usage() {
  echo "Usage: ./scripts/services.sh <command>"
  echo
  echo "Commands:"
  echo "  start    Start all backend services with PM2"
  echo "  stop     Stop all backend services in PM2"
  echo "  restart  Restart all backend services in PM2"
  echo "  status   Show PM2 process list"
  echo "  monitor  Open PM2 interactive monitor"
  echo "  logs     Tail logs for backend services"
  echo
  echo "Examples:"
  echo "  ./scripts/services.sh start"
  echo "  ./scripts/services.sh status"
  echo "  ./scripts/services.sh logs"
}

require_pm2() {
  if ! command -v pm2 >/dev/null 2>&1; then
    echo "[ERROR] pm2 is required but not found in PATH."
    echo "[HINT] Install with: pnpm add -g pm2"
    exit 1
  fi
}

command="${1:-}";

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
  status)
    require_pm2
    pm2 ls
    ;;
  monitor)
    "${MONITOR_PM2}"
    ;;
  logs)
    require_pm2
    pm2 logs backend-api job-supervisor notification-service
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
