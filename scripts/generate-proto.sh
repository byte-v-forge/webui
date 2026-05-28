#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SOURCE_ROOT="${SOURCE_ROOT:-$(cd "${ROOT}/.." && pwd)}"
COMMON_ROOT="${COMMON_ROOT:-${SOURCE_ROOT}/common-lib}"
COMMON_PROTO_DIR="${COMMON_PROTO_DIR:-${COMMON_ROOT}/proto}"
DEPLOY_MODULES_CONFIG="${FRONTEND_MODULES_CONFIG:-${SOURCE_ROOT}/deploy/frontend-modules.json}"
TS_PROTO_PLUGIN="${PROTOC_GEN_TS_PROTO:-${ROOT}/node_modules/.bin/protoc-gen-ts_proto}"

run_if_exists() {
  local script=$1
  if [[ -x "${script}" ]]; then
    SOURCE_ROOT="${SOURCE_ROOT}" PROTOC_GEN_TS_PROTO="${TS_PROTO_PLUGIN}" "${script}"
  fi
}

if [[ ! -x "${TS_PROTO_PLUGIN}" ]]; then
  printf 'ts-proto plugin not found at %s; run npm install first\n' "${TS_PROTO_PLUGIN}" >&2
  exit 1
fi
if [[ ! -d "${COMMON_PROTO_DIR}" ]]; then
  printf 'common proto dir not found: %s\n' "${COMMON_PROTO_DIR}" >&2
  exit 1
fi
if [[ ! -f "${DEPLOY_MODULES_CONFIG}" ]]; then
  printf 'frontend module config not found: %s\n' "${DEPLOY_MODULES_CONFIG}" >&2
  exit 1
fi

run_if_exists "${COMMON_ROOT}/scripts/generate-web-proto.sh"
run_if_exists "${SOURCE_ROOT}/mailbox/webui/scripts/generate-proto.sh"
run_if_exists "${SOURCE_ROOT}/gpt/webui/scripts/generate-proto.sh"
run_if_exists "${SOURCE_ROOT}/sms/webui/scripts/generate-proto.sh"

SOURCE_ROOT="${SOURCE_ROOT}" FRONTEND_MODULES_CONFIG="${DEPLOY_MODULES_CONFIG}" \
  TARGET_FILE="${ROOT}/src/dashboard/generated-module-registry.ts" \
  "${SOURCE_ROOT}/deploy/scripts/sync-dashboard-modules.sh"
