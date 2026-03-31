#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOG_DIR="${SCRIPT_DIR}/../logs/pm2"
LINES="${LINES:-200}"

if ! command -v pm2 >/dev/null 2>&1; then
  echo "[ERROR] pm2 is required but not found in PATH."
  echo "[HINT] Install with: pnpm add -g pm2"
  echo "[HINT] If still missing, run: pnpm setup && exec \$SHELL -l"
  exit 1
fi

usage() {
  echo "Usage: ./scripts/monitor-backend-services-pm2.sh [mode]"
  echo
  echo "Modes:"
  echo "  monit      Open PM2 monitor (default)"
  echo "  logs       Tail all backend service logs via PM2"
  echo "  endpoints  Tail backend-api endpoint request/response logs only"
  echo "  files      Tail per-service PM2 log files from logs/pm2"
  echo
  echo "Env:"
  echo "  LINES=<n>  Initial log lines to show before following (default: 200)"
}

mode="${1:-monit}"

case "${mode}" in
  monit)
    echo "[INFO] Opening PM2 monitor..."
    pm2 monit
    ;;
  logs)
    echo "[INFO] Tailing all backend service logs (${LINES} lines)..."
    pm2 logs backend-api job-supervisor notification-service --lines "${LINES}"
    ;;
  endpoints)
    echo "[INFO] Tailing backend-api endpoint logs (${LINES} lines)..."
    pm2 logs backend-api --lines "${LINES}" | grep --line-buffered -E "\[HTTP\]|\[REQ\]|\[RES\]|\[GQL\]"
    ;;
  files)
    mkdir -p "${LOG_DIR}"
    echo "[INFO] Tailing PM2 file logs from ${LOG_DIR}"
    tail -n "${LINES}" -F \
      "${LOG_DIR}/backend-api.combined.log" \
      "${LOG_DIR}/job-supervisor.combined.log" \
      "${LOG_DIR}/notification-service.combined.log"
    ;;
  help|-h|--help)
    usage
    ;;
  *)
    echo "[ERROR] Unknown mode: ${mode}"
    usage
    exit 1
    ;;
esac
