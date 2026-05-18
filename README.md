# dashboard

`dashboard` 是注册系统的前端聚合入口，负责 shell、导航、环境切换、状态聚合和跨业务可视化。

## 边界

- 本仓只承载前端 shell 与业务页面组合，不沉淀业务核心逻辑。
- 前端通过 `contracts/servicecatalog` 发现业务服务、能力和入口引用，不在代码中硬编码具体业务动作。
- 不直接 import 任何业务仓源码；业务协作只能通过服务目录、gRPC-Web、HTTP gateway 或事件投影边界完成。
- 通用 UI 组件后续沉淀到独立 `uikit` 仓，业务页面只组合基础组件。

## 技术栈

- React
- TypeScript
- Vite
- Tailwind CSS
- shadcn/ui
- TanStack Query

## 本地开发

```bash
pnpm install
pnpm dev
```

## 验证

```bash
pnpm lint
pnpm build
```

## 生成物

`dist/`、测试报告、覆盖率报告和其他可再生成产物不提交仓库。
