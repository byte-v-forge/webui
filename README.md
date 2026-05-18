# WebUI

WebUI 是 nb-register 的浏览器操作界面，提供账号、邮箱、GoPay 和任务状态的统一前端入口。

## 本地开发

```bash
npm install
npm run dev
```

开发服务器默认监听 `5174`，并把 `/api` 代理到 `http://127.0.0.1:8080`。

## 构建

```bash
npm run build
```

构建前会根据 `proto/` 生成本地 TypeScript 类型到 `src/proto/`。

## 契约生成

```bash
npm run proto
```

生成物位于 `src/proto/`，属于本地可再生成产物。
