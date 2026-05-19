#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
OUT_DIR="${ROOT}/src/proto"
GO_OUT_DIR="${ROOT}/server/pb"
PLUGIN="${ROOT}/node_modules/.bin/protoc-gen-ts_proto"

if [[ ! -x "${PLUGIN}" ]]; then
  printf 'ts-proto plugin not found at %s; run npm install first\n' "${PLUGIN}" >&2
  exit 1
fi

rm -rf "${OUT_DIR}"
mkdir -p "${OUT_DIR}"
rm -rf "${GO_OUT_DIR}"
mkdir -p "${GO_OUT_DIR}"

ORCHESTRATOR_PROTOS=("${ROOT}"/proto/orchestrator*.proto)
PROTOS=(
  "${ROOT}/proto/account_db.proto"
  "${ROOT}/proto/email.proto"
  "${ROOT}/proto/gopay_app.proto"
  "${ROOT}/proto/payment.proto"
  "${ROOT}/proto/mailbox_service.proto"
  "${ORCHESTRATOR_PROTOS[@]}"
)

PROTO_INCLUDES=("-I" "${ROOT}/proto")
if [[ -d /usr/include/google/protobuf ]]; then
  PROTO_INCLUDES+=("-I" "/usr/include")
fi

protoc "${PROTO_INCLUDES[@]}" \
  --plugin="protoc-gen-ts_proto=${PLUGIN}" \
  --ts_proto_out="${OUT_DIR}" \
  --ts_proto_opt=onlyTypes=true,outputServices=none,esModuleInterop=true,useJsonWireFormat=true,snakeToCamel=false \
  "${PROTOS[@]}"

if [[ "${GENERATE_GO_PROTO:-true}" != "false" ]]; then
  protoc "${PROTO_INCLUDES[@]}" \
    --go_out="${GO_OUT_DIR}" \
    --go-grpc_out="${GO_OUT_DIR}" \
    "${PROTOS[@]}"
fi
