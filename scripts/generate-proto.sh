#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
OUT_DIR="${ROOT}/src/proto"
PLUGIN="${ROOT}/node_modules/.bin/protoc-gen-ts_proto"

if [[ ! -x "${PLUGIN}" ]]; then
  printf 'ts-proto plugin not found at %s; run npm install first\n' "${PLUGIN}" >&2
  exit 1
fi

rm -rf "${OUT_DIR}"
mkdir -p "${OUT_DIR}"

ORCHESTRATOR_PROTOS=("${ROOT}"/proto/orchestrator*.proto)

protoc -I "${ROOT}/proto" \
  --plugin="protoc-gen-ts_proto=${PLUGIN}" \
  --ts_proto_out="${OUT_DIR}" \
  --ts_proto_opt=onlyTypes=true,outputServices=none,esModuleInterop=true,useJsonWireFormat=true,snakeToCamel=false \
  "${ROOT}/proto/account_db.proto" \
  "${ROOT}/proto/email.proto" \
  "${ROOT}/proto/gopay_app.proto" \
  "${ROOT}/proto/payment.proto" \
  "${ORCHESTRATOR_PROTOS[@]}"
