# AGENTS.md

本仓是 `dashboard` 前端聚合仓。

- 当前重构按破坏性重构处理，不保留旧接口、旧配置、旧行为或旧目录命名兼容。
- 前端优先使用 React、TypeScript、Vite、Tailwind CSS 和 shadcn/ui。
- 基础组件优先来自 shadcn/ui 或未来独立 `uikit` 仓，不在业务页面里重复手写通用组件。
- 本仓只负责 shell、导航、认证入口、跨业务状态聚合和业务页面组合。
- 禁止把业务核心逻辑、业务状态机、业务私有接口沉淀到 dashboard。
- 禁止直接 import 业务仓源码；业务协作只能通过公开契约、gRPC-Web、HTTP gateway 或事件投影边界完成。
- 公共契约来自 `contracts` 仓；本仓不维护业务私有 proto。
- 运行时配置使用 `VITE_*` 环境变量，不在代码中硬编码环境地址、token、cookie 或 secret。
- 不提交生成物，包括 `dist/`、覆盖率报告、测试报告、IDL 生成代码和其他可再生成产物。
- 新增前端框架、SDK 或组件库时，必须按官方文档和官方推荐实践开发。
