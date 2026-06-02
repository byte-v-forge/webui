FROM docker.m.daocloud.io/library/node:22-bookworm-slim AS web-builder

WORKDIR /web
RUN sed -i 's/deb.debian.org/mirrors.ustc.edu.cn/g' /etc/apt/sources.list.d/debian.sources \
    && apt-get update \
    && apt-get install -y --no-install-recommends libprotobuf-dev protobuf-compiler python3 \
    && rm -rf /var/lib/apt/lists/*
COPY common-lib/ui /common-lib/ui
COPY common-lib/proto /common-lib/proto
COPY common-lib/scripts /common-lib/scripts
COPY webui/package.json webui/package-lock.json* ./
RUN npm ci
COPY webui/index.html webui/vite.config.ts webui/tsconfig.json ./
COPY webui/public ./public
COPY dashboard-catalog.json /deploy/dashboard-catalog.json
COPY scripts /deploy/scripts
COPY webui/scripts ./scripts
COPY webui/src ./src
RUN SOURCE_ROOT=/ npm run build

FROM docker.m.daocloud.io/library/golang:1.26-alpine AS go-builder

WORKDIR /app
ENV GOPROXY=https://goproxy.cn,direct
RUN sed -i 's/dl-cdn.alpinelinux.org/mirrors.aliyun.com/g' /etc/apk/repositories \
    && apk add --no-cache git
COPY common-lib /common-lib
COPY webui/server/go.mod webui/server/go.sum* ./
RUN go mod edit -replace github.com/byte-v-forge/common-lib=/common-lib \
    && go mod download
COPY webui/server ./
COPY --from=web-builder /web/dist ./web/dist
RUN go build -o webui .

FROM docker.m.daocloud.io/library/alpine:latest

RUN sed -i 's/dl-cdn.alpinelinux.org/mirrors.aliyun.com/g' /etc/apk/repositories \
    && apk add --no-cache ca-certificates
WORKDIR /app
COPY --from=go-builder /app/webui .
COPY --from=go-builder /app/web/dist ./web/dist
COPY --from=web-builder /deploy/dashboard-catalog.json ./dashboard-catalog.json

EXPOSE 8080
CMD ["./webui"]
