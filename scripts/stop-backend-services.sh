#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PID_FILE="${SCRIPT_DIR}/.backend-services.pids"

if [[ ! -f "${PID_FILE}" ]]; then
  echo "[INFO] No PID file found. Nothing to stop."
  exit 0
fi

while read -r name pid; do
  if [[ -z "${name}" || "${name}" == "#" ]]; then
    continue
  fi

  if kill -0 "${pid}" >/dev/null 2>&1; then
    echo "[INFO] Stopping ${name} (PID ${pid})"
    kill "${pid}" >/dev/null 2>&1 || true

    for _ in {1..20}; do
      if ! kill -0 "${pid}" >/dev/null 2>&1; then
        break
      fi
      sleep 0.2
    done

    if kill -0 "${pid}" >/dev/null 2>&1; then
      echo "[WARN] ${name} still running; sending SIGKILL"
      kill -9 "${pid}" >/dev/null 2>&1 || true
    fi

    echo "[OK] ${name} stopped"
  else
    echo "[INFO] ${name} (PID ${pid}) is not running"
  fi

done <"${PID_FILE}"

rm -f "${PID_FILE}"
echo "[DONE] Backend services shutdown complete."
