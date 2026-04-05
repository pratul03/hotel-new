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
  echo "  live       Tail only new backend service logs via PM2 (from now)"
  echo "  endpoints  Tail backend-api endpoint request/response logs only"
  echo "  files      Tail per-service PM2 log files from logs/pm2"
  echo "  doctor     Show which process owns backend port and PM2 backend pid tree"
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
    pm2 logs --lines "${LINES}"
    ;;
  live)
    echo "[INFO] Tailing only new backend service logs (from now)..."
    pm2 logs --lines 0
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
  doctor)
    backend_port="8080"
    backend_env_file="${SCRIPT_DIR}/../backend/.env"
    if [[ -f "${backend_env_file}" ]]; then
      env_port="$(grep -E '^PORT=' "${backend_env_file}" | tail -n 1 | cut -d '=' -f2- | tr -d '[:space:]' || true)"
      if [[ -n "${env_port}" && "${env_port}" =~ ^[0-9]+$ ]]; then
        backend_port="${env_port}"
      fi
    fi

    echo "[INFO] Backend port from env: ${backend_port}"
    listener_pid="$(lsof -tiTCP:"${backend_port}" -sTCP:LISTEN 2>/dev/null | head -n 1 || true)"
    if [[ -n "${listener_pid}" ]]; then
      echo "[INFO] Port ${backend_port} listener PID: ${listener_pid}"
      ps -fp "${listener_pid}" || true
    else
      echo "[WARN] No process is listening on port ${backend_port}"
    fi

    pm2_backend_pid="$(pm2 pid backend-api 2>/dev/null | tr -d '[:space:]' || true)"
    if [[ -n "${pm2_backend_pid}" && "${pm2_backend_pid}" != "0" ]]; then
      echo "[INFO] PM2 backend-api PID: ${pm2_backend_pid}"
      ps -fp "${pm2_backend_pid}" || true
      echo "[INFO] Direct children of PM2 backend-api PID:"
      pgrep -P "${pm2_backend_pid}" -a || echo "(none)"
    else
      echo "[WARN] PM2 backend-api process not found"
    fi
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
