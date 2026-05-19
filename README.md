# WebUI

WebUI 是 byte-v-forge 的浏览器操作界面，提供账号、邮箱、GoPay 和任务状态的统一前端入口。
仓库同时提供 `server/` 下的 Go API 入口，负责把浏览器请求转发到 `gpt-service` 和 `mailbox`。

## 本地开发

```bash
npm install
npm run dev
```

开发服务器默认监听 `5174`，并把 `/api` 代理到 `http://127.0.0.1:8080`。

API 服务：

```bash
npm run proto
cd server
go build ./...
LISTEN_ADDR=:8080 go run .
```

## 构建

```bash
npm run build
```

构建前会根据 `proto/` 生成本地 TypeScript 类型到 `src/proto/`。
同一命令会生成 Go gRPC 类型到 `server/pb/`，供 API 服务编译使用。

## 契约生成

```bash
npm run proto
```

生成物位于 `src/proto/` 和 `server/pb/`，属于本地可再生成产物。
