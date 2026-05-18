import type { LucideIcon } from "lucide-react"
import type { ReactNode } from "react"
import {
  Activity,
  Boxes,
  BrainCircuit,
  CircleDot,
  Database,
  Mail,
  Monitor,
  Moon,
  Phone,
  RefreshCw,
  Search,
  ShieldCheck,
  Sun,
} from "lucide-react"
import { useMemo, useState } from "react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { serviceEndpoints } from "@/api/service-clients"
import { useTheme } from "@/components/theme-provider"
import { cn } from "@/lib/utils"

type ModuleKey =
  | "overview"
  | "gpt-register"
  | "outlook-register"
  | "sms"
  | "mailbox"
  | "gpt-account-manager"
  | "outlook-account-manager"
  | "browser-automation"

type HealthState = "healthy" | "degraded" | "idle"

type ModuleStatus = {
  key: ModuleKey
  name: string
  description: string
  owner: string
  health: HealthState
  activeTasks: number
  backlog: number
  icon: LucideIcon
}

type WorkItem = {
  id: string
  module: Exclude<ModuleKey, "overview">
  account: string
  state: string
  channel: string
  updatedAt: string
}

const queryClient = new QueryClient()

const modules: ModuleStatus[] = [
  {
    key: "overview",
    name: "总览",
    description: "跨业务入口、导航与运行态聚合。",
    owner: "dashboard",
    health: "healthy",
    activeTasks: 36,
    backlog: 8,
    icon: Activity,
  },
  {
    key: "gpt-register",
    name: "GPT 注册",
    description: "GPT 账号注册流程、任务状态与人工介入入口。",
    owner: "gpt-register",
    health: "degraded",
    activeTasks: 14,
    backlog: 5,
    icon: BrainCircuit,
  },
  {
    key: "outlook-register",
    name: "Outlook 注册",
    description: "邮箱注册、会话恢复与风控状态追踪。",
    owner: "outlook-register",
    health: "healthy",
    activeTasks: 9,
    backlog: 1,
    icon: Mail,
  },
  {
    key: "sms",
    name: "SMS",
    description: "接码平台能力池、租用状态与验证码接收。",
    owner: "sms",
    health: "healthy",
    activeTasks: 6,
    backlog: 0,
    icon: Phone,
  },
  {
    key: "mailbox",
    name: "Mailbox",
    description: "邮箱账号、邮件检索、验证码读取与状态投影。",
    owner: "mailbox",
    health: "idle",
    activeTasks: 2,
    backlog: 2,
    icon: Database,
  },
  {
    key: "gpt-account-manager",
    name: "GPT 账号",
    description: "GPT 账号库存、凭据引用、状态流转与回收。",
    owner: "gpt-account-manager",
    health: "healthy",
    activeTasks: 2,
    backlog: 0,
    icon: ShieldCheck,
  },
  {
    key: "outlook-account-manager",
    name: "Outlook 账号",
    description: "Outlook 账号库存、凭据引用与生命周期。",
    owner: "outlook-account-manager",
    health: "healthy",
    activeTasks: 1,
    backlog: 0,
    icon: ShieldCheck,
  },
  {
    key: "browser-automation",
    name: "浏览器自动化",
    description: "浏览器 profile、任务执行与自动化会话边界。",
    owner: "browser-automation",
    health: "healthy",
    activeTasks: 2,
    backlog: 0,
    icon: Monitor,
  },
]

const workItems: WorkItem[] = [
  {
    id: "reg-20260518-001",
    module: "gpt-register",
    account: "gpt/pending",
    state: "等待验证码",
    channel: "sms:5sim",
    updatedAt: "10:42",
  },
  {
    id: "reg-20260518-002",
    module: "outlook-register",
    account: "outlook/provisioning",
    state: "浏览器执行中",
    channel: "browser:chromium",
    updatedAt: "10:39",
  },
  {
    id: "sms-20260518-041",
    module: "sms",
    account: "rental/active",
    state: "号码已租用",
    channel: "smsbower",
    updatedAt: "10:37",
  },
  {
    id: "mail-20260518-006",
    module: "mailbox",
    account: "mailbox/check",
    state: "邮件检索",
    channel: "imap",
    updatedAt: "10:31",
  },
  {
    id: "acct-20260518-011",
    module: "gpt-account-manager",
    account: "gpt/ready",
    state: "可分配",
    channel: "grpc",
    updatedAt: "10:24",
  },
  {
    id: "acct-20260518-012",
    module: "outlook-account-manager",
    account: "outlook/ready",
    state: "可分配",
    channel: "grpc",
    updatedAt: "10:22",
  },
]

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Dashboard />
      </TooltipProvider>
    </QueryClientProvider>
  )
}

function Dashboard() {
  const [activeModule, setActiveModule] = useState<ModuleKey>("overview")
  const [environment, setEnvironment] = useState("local")
  const [query, setQuery] = useState("")

  const visibleItems = useMemo(() => {
    return workItems.filter((item) => {
      const moduleMatched =
        activeModule === "overview" || item.module === activeModule
      const keyword = query.trim().toLowerCase()

      if (!keyword) {
        return moduleMatched
      }

      return (
        moduleMatched &&
        [item.id, item.account, item.state, item.channel]
          .join(" ")
          .toLowerCase()
          .includes(keyword)
      )
    })
  }, [activeModule, query])

  const selectedModule =
    modules.find((module) => module.key === activeModule) ?? modules[0]

  return (
    <div className="min-h-svh bg-background text-foreground">
      <div className="grid min-h-svh grid-cols-1 lg:grid-cols-[264px_minmax(0,1fr)]">
        <aside className="border-b bg-sidebar text-sidebar-foreground lg:border-r lg:border-b-0">
          <div className="flex h-full flex-col">
            <div className="flex h-16 items-center gap-3 px-4">
              <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Boxes className="size-4" aria-hidden="true" />
              </div>
              <div className="min-w-0">
                <div className="truncate text-sm font-semibold">
                  Register Console
                </div>
                <div className="truncate text-xs text-muted-foreground">
                  byte-v-forge
                </div>
              </div>
            </div>

            <ScrollArea className="flex-1 px-2 pb-4">
              <nav className="space-y-1">
                {modules.map((module) => {
                  const Icon = module.icon
                  const active = module.key === activeModule

                  return (
                    <button
                      key={module.key}
                      className={cn(
                        "flex h-10 w-full items-center gap-3 rounded-lg px-3 text-left text-sm transition-colors",
                        active
                          ? "bg-sidebar-accent text-sidebar-accent-foreground"
                          : "text-muted-foreground hover:bg-sidebar-accent/70 hover:text-sidebar-accent-foreground"
                      )}
                      type="button"
                      onClick={() => setActiveModule(module.key)}
                    >
                      <Icon className="size-4" aria-hidden="true" />
                      <span className="min-w-0 flex-1 truncate">
                        {module.name}
                      </span>
                      <HealthDot state={module.health} />
                    </button>
                  )
                })}
              </nav>
            </ScrollArea>

            <div className="border-t p-4 text-xs text-muted-foreground">
              前端只通过公开服务边界访问业务能力，不直接 import 业务仓源码。
            </div>
          </div>
        </aside>

        <main className="min-w-0">
          <header className="flex min-h-16 flex-col gap-3 border-b px-4 py-3 md:flex-row md:items-center md:justify-between">
            <div className="min-w-0">
              <div className="text-sm font-semibold">{selectedModule.name}</div>
              <div className="truncate text-xs text-muted-foreground">
                {selectedModule.description}
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Select value={environment} onValueChange={setEnvironment}>
                <SelectTrigger className="h-8 w-[132px]">
                  <SelectValue aria-label={environment} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="local">Local</SelectItem>
                  <SelectItem value="staging">Staging</SelectItem>
                  <SelectItem value="prod">Production</SelectItem>
                </SelectContent>
              </Select>
              <IconButton label="刷新状态">
                <RefreshCw className="size-4" aria-hidden="true" />
              </IconButton>
              <ThemeToggle />
            </div>
          </header>

          <div className="grid gap-0 xl:grid-cols-[minmax(0,1fr)_340px]">
            <section className="min-w-0 px-4 py-4 lg:px-6">
              <div className="grid gap-3 md:grid-cols-3">
                <Metric
                  label="运行任务"
                  value={String(
                    modules.reduce((sum, module) => sum + module.activeTasks, 0)
                  )}
                  detail="跨业务当前活跃"
                />
                <Metric
                  label="待处理"
                  value={String(
                    modules.reduce((sum, module) => sum + module.backlog, 0)
                  )}
                  detail="需要人工或重试"
                />
                <Metric
                  label="服务边界"
                  value="8"
                  detail="dashboard + 7 个业务服务"
                />
              </div>

              <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {modules.slice(1).map((module) => {
                  const Icon = module.icon
                  const active = activeModule === module.key

                  return (
                    <button
                      key={module.key}
                      className={cn(
                        "group rounded-lg border bg-card p-4 text-left transition-colors hover:bg-accent/60",
                        active && "border-foreground"
                      )}
                      type="button"
                      onClick={() => setActiveModule(module.key)}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex min-w-0 items-center gap-3">
                          <div className="flex size-9 items-center justify-center rounded-md bg-muted">
                            <Icon className="size-4" aria-hidden="true" />
                          </div>
                          <div className="min-w-0">
                            <div className="truncate text-sm font-medium">
                              {module.name}
                            </div>
                            <div className="truncate text-xs text-muted-foreground">
                              {module.owner}
                            </div>
                          </div>
                        </div>
                        <HealthBadge state={module.health} />
                      </div>
                      <p className="mt-3 min-h-10 text-xs leading-5 text-muted-foreground">
                        {module.description}
                      </p>
                      <div className="mt-3 flex items-center gap-4 text-xs">
                        <span>{module.activeTasks} active</span>
                        <span className="text-muted-foreground">
                          {module.backlog} backlog
                        </span>
                      </div>
                    </button>
                  )
                })}
              </div>

              <div className="mt-6 rounded-lg border bg-card">
                <div className="flex flex-col gap-3 border-b p-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <div className="text-sm font-medium">任务流</div>
                    <div className="text-xs text-muted-foreground">
                      按业务服务边界聚合，不承载业务核心逻辑。
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <Search
                        className="pointer-events-none absolute top-1/2 left-2 size-3.5 -translate-y-1/2 text-muted-foreground"
                        aria-hidden="true"
                      />
                      <Input
                        className="h-8 w-[220px] pl-7"
                        placeholder="搜索任务"
                        value={query}
                        onChange={(event) => setQuery(event.target.value)}
                      />
                    </div>
                    <Tabs
                      value={activeModule}
                      onValueChange={(value) =>
                        setActiveModule(value as ModuleKey)
                      }
                    >
                      <TabsList className="h-8">
                        <TabsTrigger value="overview">全部</TabsTrigger>
                        <TabsTrigger value="gpt-register">GPT</TabsTrigger>
                        <TabsTrigger value="outlook-register">
                          Outlook
                        </TabsTrigger>
                      </TabsList>
                    </Tabs>
                  </div>
                </div>

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>任务</TableHead>
                      <TableHead>业务</TableHead>
                      <TableHead>状态</TableHead>
                      <TableHead>通道</TableHead>
                      <TableHead className="text-right">更新时间</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {visibleItems.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-mono text-xs">
                          {item.id}
                        </TableCell>
                        <TableCell>{moduleName(item.module)}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{item.state}</Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {item.channel}
                        </TableCell>
                        <TableCell className="text-right text-muted-foreground">
                          {item.updatedAt}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </section>

            <aside className="border-t px-4 py-4 xl:border-t-0 xl:border-l">
              <div className="space-y-5">
                <section>
                  <div className="mb-3 text-sm font-medium">依赖边界</div>
                  <div className="space-y-3 text-sm">
                    <BoundaryLine
                      label="UI 基础"
                      value="shadcn/ui + Tailwind"
                    />
                    <BoundaryLine
                      label="服务调用"
                      value="gRPC-Web / HTTP gateway"
                    />
                    <BoundaryLine
                      label="契约来源"
                      value="contracts / internal-contracts"
                    />
                    <BoundaryLine label="业务源码" value="禁止直接依赖" />
                  </div>
                </section>

                <Separator />

                <section>
                  <div className="mb-3 text-sm font-medium">当前模块</div>
                  <div className="rounded-lg border bg-card p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <div className="text-sm font-medium">
                          {selectedModule.name}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          owner: {selectedModule.owner}
                        </div>
                      </div>
                      <HealthBadge state={selectedModule.health} />
                    </div>
                    <p className="mt-3 text-xs leading-5 text-muted-foreground">
                      {selectedModule.description}
                    </p>
                  </div>
                </section>

                <Separator />

                <section>
                  <div className="mb-3 text-sm font-medium">接入状态</div>
                  <div className="space-y-2 text-xs">
                    {serviceEndpoints.slice(0, 4).map((endpoint) => (
                      <StatusLine
                        key={endpoint.key}
                        label={endpoint.name}
                        ok={endpoint.transport === "grpc-web"}
                      />
                    ))}
                  </div>
                </section>
              </div>
            </aside>
          </div>
        </main>
      </div>
    </div>
  )
}

function Metric({
  label,
  value,
  detail,
}: {
  label: string
  value: string
  detail: string
}) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-2 text-2xl font-semibold tracking-normal">{value}</div>
      <div className="mt-1 text-xs text-muted-foreground">{detail}</div>
    </div>
  )
}

function BoundaryLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium">{value}</span>
    </div>
  )
}

function StatusLine({ label, ok = false }: { label: string; ok?: boolean }) {
  return (
    <div className="flex items-center justify-between rounded-md border px-3 py-2">
      <span>{label}</span>
      <Badge variant={ok ? "default" : "secondary"}>
        {ok ? "ready" : "pending"}
      </Badge>
    </div>
  )
}

function HealthBadge({ state }: { state: HealthState }) {
  const label = {
    healthy: "healthy",
    degraded: "degraded",
    idle: "idle",
  }[state]

  return (
    <Badge
      variant={state === "degraded" ? "destructive" : "secondary"}
      className={cn(state === "healthy" && "bg-emerald-600 text-white")}
    >
      <HealthDot state={state} />
      {label}
    </Badge>
  )
}

function HealthDot({ state }: { state: HealthState }) {
  return (
    <CircleDot
      className={cn(
        "size-3",
        state === "healthy" && "text-emerald-500",
        state === "degraded" && "text-destructive",
        state === "idle" && "text-muted-foreground"
      )}
      aria-hidden="true"
    />
  )
}

function IconButton({
  label,
  children,
  onClick,
}: {
  label: string
  children: ReactNode
  onClick?: () => void
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          aria-label={label}
          size="icon"
          type="button"
          variant="outline"
          onClick={onClick}
        >
          {children}
        </Button>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  )
}

function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const dark = theme === "dark"

  return (
    <IconButton
      label={dark ? "切换浅色" : "切换深色"}
      onClick={() => setTheme(dark ? "light" : "dark")}
    >
      {dark ? (
        <Sun className="size-4" aria-hidden="true" />
      ) : (
        <Moon className="size-4" aria-hidden="true" />
      )}
    </IconButton>
  )
}

function moduleName(key: Exclude<ModuleKey, "overview">) {
  return modules.find((module) => module.key === key)?.name ?? key
}

export default App
