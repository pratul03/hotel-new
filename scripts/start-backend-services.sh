#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
PID_FILE="${SCRIPT_DIR}/.backend-services.pids"
LOG_DIR="${SCRIPT_DIR}/logs"

if ! command -v pnpm >/dev/null 2>&1; then
  echo "[ERROR] pnpm is required but was not found in PATH." >&2
  exit 1
fi

if [[ -f "${PID_FILE}" ]]; then
  echo "[INFO] PID file already exists: ${PID_FILE}"
  echo "[INFO] Run ./scripts/stop-backend-services.sh first if services are already running."
  exit 1
fi

mkdir -p "${LOG_DIR}"

PIDS=()
NAMES=()

start_service() {
  local name="$1"
  local rel_dir="$2"
  local work_dir="${REPO_ROOT}/${rel_dir}"
  local log_file="${LOG_DIR}/${name}.log"

  if [[ ! -d "${work_dir}" ]]; then
    echo "[ERROR] Service directory not found: ${work_dir}" >&2
    exit 1
  fi

  echo "[INFO] Starting ${name} from ${rel_dir}"
  (
    cd "${work_dir}"
    pnpm dev
  ) >"${log_file}" 2>&1 &

  local pid=$!
  sleep 1

  if ! kill -0 "${pid}" >/dev/null 2>&1; then
    echo "[ERROR] Failed to start ${name}. Check logs: ${log_file}" >&2
    for started_pid in "${PIDS[@]:-}"; do
      kill "${started_pid}" >/dev/null 2>&1 || true
    done
    exit 1
  fi

  PIDS+=("${pid}")
  NAMES+=("${name}")
  echo "[OK] ${name} started (PID ${pid})"
}

start_service "backend" "backend"
start_service "job-supervisor" "services/job-supervisor"
start_service "notification" "services/notification"

{
  echo "# name pid"
  for i in "${!PIDS[@]}"; do
    echo "${NAMES[$i]} ${PIDS[$i]}"
  done
} >"${PID_FILE}"

echo "[DONE] All backend services started."
echo "[INFO] PID file: ${PID_FILE}"
echo "[INFO] Logs directory: ${LOG_DIR}"
