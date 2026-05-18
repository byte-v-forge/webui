export type ServiceHealthStatus =
  | "unknown"
  | "serving"
  | "degraded"
  | "not_serving"

export type CapabilityKind = "page" | "action" | "query" | "workflow"

export type ContractReference = {
  contractRef: string
}

export type CapabilityDescriptor = {
  capabilityId: string
  displayName: string
  description: string
  kind: CapabilityKind
  ownerServiceId: string
  inputContract?: ContractReference
  outputContract?: ContractReference
  invocationRef: string
}

export type ServiceDescriptor = {
  serviceId: string
  displayName: string
  description: string
  owner: string
  health: ServiceHealthStatus
  contracts: ContractReference[]
  capabilities: CapabilityDescriptor[]
  updatedAt?: string
}

export type ServiceCatalogResponse = {
  services: ServiceDescriptor[]
}

const localCatalog: ServiceCatalogResponse = {
  services: [
    {
      serviceId: "registration-service",
      displayName: "注册服务",
      description: "账号注册类能力聚合入口。",
      owner: "registration",
      health: "degraded",
      contracts: [
        { contractRef: "internal-contracts/gptregister/v1" },
        { contractRef: "internal-contracts/outlookregister/v1" },
      ],
      capabilities: [
        {
          capabilityId: "registration.jobs",
          displayName: "注册任务",
          description: "注册任务创建、查询与状态追踪。",
          kind: "workflow",
          ownerServiceId: "registration-service",
          invocationRef: "catalog://registration-service/registration.jobs",
        },
      ],
    },
    {
      serviceId: "verification-service",
      displayName: "验证服务",
      description: "验证码、邮箱验证和外部校验能力。",
      owner: "verification",
      health: "serving",
      contracts: [
        { contractRef: "contracts/sms/v1" },
        { contractRef: "contracts/mailbox/v1" },
      ],
      capabilities: [
        {
          capabilityId: "verification.messages",
          displayName: "消息验证",
          description: "验证码接收、邮件检索与验证状态查询。",
          kind: "query",
          ownerServiceId: "verification-service",
          invocationRef: "catalog://verification-service/verification.messages",
        },
      ],
    },
    {
      serviceId: "account-inventory-service",
      displayName: "账号库存服务",
      description: "账号库存、凭据引用和生命周期状态。",
      owner: "account",
      health: "serving",
      contracts: [
        { contractRef: "internal-contracts/gptaccount/v1" },
        { contractRef: "internal-contracts/outlookaccount/v1" },
      ],
      capabilities: [
        {
          capabilityId: "account.inventory",
          displayName: "账号库存",
          description: "账号查询、状态更新和凭据引用管理。",
          kind: "query",
          ownerServiceId: "account-inventory-service",
          invocationRef: "catalog://account-inventory-service/account.inventory",
        },
      ],
    },
    {
      serviceId: "automation-service",
      displayName: "自动化服务",
      description: "浏览器任务执行、会话和产物管理。",
      owner: "automation",
      health: "serving",
      contracts: [{ contractRef: "internal-contracts/browserautomation/v1" }],
      capabilities: [
        {
          capabilityId: "automation.sessions",
          displayName: "自动化会话",
          description: "浏览器会话、任务执行与产物查询。",
          kind: "action",
          ownerServiceId: "automation-service",
          invocationRef: "catalog://automation-service/automation.sessions",
        },
      ],
    },
  ],
}

export async function listServices(): Promise<ServiceDescriptor[]> {
  const baseUrl = import.meta.env.VITE_SERVICE_CATALOG_API_BASE_URL as
    | string
    | undefined

  if (!baseUrl) {
    return localCatalog.services
  }

  const response = await fetch(`${baseUrl.replace(/\/$/, "")}/v1/services`)

  if (!response.ok) {
    throw new Error(`service catalog request failed: ${response.status}`)
  }

  const body = (await response.json()) as ServiceCatalogResponse
  return body.services
}
