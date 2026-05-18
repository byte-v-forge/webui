import { create, fromJson, type JsonValue } from "@bufbuild/protobuf"
import {
  CapabilityAvailabilitySchema,
  CapabilityAvailabilityStatus,
  CapabilityDependencySchema,
  CapabilityDescriptorSchema,
  CapabilityKind,
  CapabilityTargetSchema,
  ContractReferenceSchema,
  ListServicesResponseSchema,
  ServiceDescriptorSchema,
  ServiceHealthStatus,
  type ServiceDescriptor,
} from "@byte-v-forge/contracts-ts/byte/v/forge/contracts/servicecatalog/v1/catalog_pb"

export { CapabilityAvailabilityStatus, CapabilityKind, ServiceHealthStatus }
export type { ServiceDescriptor }

const localCatalog = create(ListServicesResponseSchema, {
  services: [
    create(ServiceDescriptorSchema, {
      serviceId: "service-catalog",
      displayName: "服务目录",
      description: "服务、能力、契约引用和入口引用的发现入口。",
      owner: "platform",
      health: ServiceHealthStatus.SERVING,
      contracts: [
        create(ContractReferenceSchema, {
          contractRef: "contracts/servicecatalog/v1",
        }),
      ],
      capabilities: [
        create(CapabilityDescriptorSchema, {
          capabilityId: "servicecatalog.services",
          displayName: "服务发现",
          description: "列出已注册服务及其能力描述。",
          kind: CapabilityKind.QUERY,
          ownerServiceId: "service-catalog",
          invocationRef: "catalog://service-catalog/servicecatalog.services",
          availability: create(CapabilityAvailabilitySchema, {
            status: CapabilityAvailabilityStatus.AVAILABLE,
          }),
        }),
      ],
    }),
    create(ServiceDescriptorSchema, {
      serviceId: "account-manager",
      displayName: "账号库存",
      description: "账号查询、凭据引用、账号分配和释放入口。",
      owner: "account",
      health: ServiceHealthStatus.SERVING,
      contracts: [
        create(ContractReferenceSchema, {
          contractRef: "contracts/account/v1",
        }),
      ],
      capabilities: [
        create(CapabilityDescriptorSchema, {
          capabilityId: "account.inventory.list",
          displayName: "账号查询",
          description: "按状态、标识和标签查询账号库存。",
          kind: CapabilityKind.QUERY,
          ownerServiceId: "account-manager",
          inputContract: create(ContractReferenceSchema, {
            contractRef: "contracts/account/v1/ListAccountsRequest",
          }),
          outputContract: create(ContractReferenceSchema, {
            contractRef: "contracts/account/v1/ListAccountsResponse",
          }),
          invocationRef:
            "grpc://account-manager/AccountInventoryService.ListAccounts",
          targets: [
            create(CapabilityTargetSchema, {
              resourceType: "account",
            }),
          ],
          availability: create(CapabilityAvailabilitySchema, {
            status: CapabilityAvailabilityStatus.AVAILABLE,
          }),
        }),
        create(CapabilityDescriptorSchema, {
          capabilityId: "account.reservation.reserve",
          displayName: "账号占用",
          description: "按 selector 占用可用账号。",
          kind: CapabilityKind.ACTION,
          ownerServiceId: "account-manager",
          inputContract: create(ContractReferenceSchema, {
            contractRef: "contracts/account/v1/ReserveAccountRequest",
          }),
          outputContract: create(ContractReferenceSchema, {
            contractRef: "contracts/account/v1/ReserveAccountResponse",
          }),
          invocationRef:
            "grpc://account-manager/AccountInventoryService.ReserveAccount",
          targets: [
            create(CapabilityTargetSchema, {
              resourceType: "account",
            }),
          ],
          availability: create(CapabilityAvailabilitySchema, {
            status: CapabilityAvailabilityStatus.AVAILABLE,
          }),
        }),
        create(CapabilityDescriptorSchema, {
          capabilityId: "account.tags.update",
          displayName: "账号标签",
          description: "更新账号级用户标签。",
          kind: CapabilityKind.ACTION,
          ownerServiceId: "account-manager",
          inputContract: create(ContractReferenceSchema, {
            contractRef: "contracts/account/v1/UpdateAccountTagsRequest",
          }),
          outputContract: create(ContractReferenceSchema, {
            contractRef: "contracts/account/v1/UpdateAccountTagsResponse",
          }),
          invocationRef:
            "grpc://account-manager/AccountInventoryService.UpdateAccountTags",
          targets: [
            create(CapabilityTargetSchema, {
              resourceType: "account",
            }),
          ],
          availability: create(CapabilityAvailabilitySchema, {
            status: CapabilityAvailabilityStatus.AVAILABLE,
          }),
        }),
      ],
    }),
    create(ServiceDescriptorSchema, {
      serviceId: "gopay-payment",
      displayName: "GoPay 支付",
      description: "GoPay 支付流程服务。",
      owner: "gopay",
      health: ServiceHealthStatus.SERVING,
    }),
    create(ServiceDescriptorSchema, {
      serviceId: "gpt-orchestrator",
      displayName: "GPT 注册",
      description: "GPT 注册流程和账号池协作入口。",
      owner: "gpt",
      health: ServiceHealthStatus.SERVING,
      contracts: [
        create(ContractReferenceSchema, {
          contractRef: "contracts/account/v1",
        }),
      ],
      capabilities: [
        create(CapabilityDescriptorSchema, {
          capabilityId: "gpt.account.pool",
          displayName: "GPT 账号池",
          description: "面向 GPT 注册流程的账号池查询入口。",
          kind: CapabilityKind.QUERY,
          ownerServiceId: "gpt-orchestrator",
          inputContract: create(ContractReferenceSchema, {
            contractRef: "contracts/account/v1/AccountListFilter",
          }),
          outputContract: create(ContractReferenceSchema, {
            contractRef: "contracts/account/v1/Account",
          }),
          invocationRef:
            "account://account-manager/accounts?owner_service=gpt-orchestrator",
          targets: [
            create(CapabilityTargetSchema, {
              resourceType: "account.gpt",
            }),
          ],
          availability: create(CapabilityAvailabilitySchema, {
            status: CapabilityAvailabilityStatus.AVAILABLE,
          }),
        }),
        create(CapabilityDescriptorSchema, {
          capabilityId: "gpt.account.activate.gopay",
          displayName: "GoPay 激活",
          description: "使用 GoPay 通道处理 GPT 账号激活。",
          kind: CapabilityKind.ACTION,
          ownerServiceId: "gpt-orchestrator",
          inputContract: create(ContractReferenceSchema, {
            contractRef:
              "internal-contracts/gptorchestrator/v1/ActivateGptAccountRequest",
          }),
          outputContract: create(ContractReferenceSchema, {
            contractRef:
              "internal-contracts/gptorchestrator/v1/ActivateGptAccountResponse",
          }),
          invocationRef:
            "grpc://gpt-orchestrator/GptActivationService.ActivateWithGoPay",
          targets: [
            create(CapabilityTargetSchema, {
              resourceType: "account.gpt",
            }),
          ],
          dependencies: [
            create(CapabilityDependencySchema, {
              serviceId: "gopay-payment",
              requiredHealth: ServiceHealthStatus.SERVING,
              required: true,
            }),
          ],
          availability: create(CapabilityAvailabilitySchema, {
            status: CapabilityAvailabilityStatus.AVAILABLE,
          }),
        }),
        create(CapabilityDescriptorSchema, {
          capabilityId: "gpt.account.activate.paypal",
          displayName: "PayPal 激活",
          description: "使用 PayPal 通道处理 GPT 账号激活。",
          kind: CapabilityKind.ACTION,
          ownerServiceId: "gpt-orchestrator",
          inputContract: create(ContractReferenceSchema, {
            contractRef:
              "internal-contracts/gptorchestrator/v1/ActivateGptAccountRequest",
          }),
          outputContract: create(ContractReferenceSchema, {
            contractRef:
              "internal-contracts/gptorchestrator/v1/ActivateGptAccountResponse",
          }),
          invocationRef:
            "grpc://gpt-orchestrator/GptActivationService.ActivateWithPayPal",
          targets: [
            create(CapabilityTargetSchema, {
              resourceType: "account.gpt",
            }),
          ],
          dependencies: [
            create(CapabilityDependencySchema, {
              serviceId: "paypal-payment",
              requiredHealth: ServiceHealthStatus.SERVING,
              required: true,
            }),
          ],
          availability: create(CapabilityAvailabilitySchema, {
            status: CapabilityAvailabilityStatus.UNAVAILABLE,
            reasonCode: "dependency_missing",
          }),
        }),
      ],
    }),
    create(ServiceDescriptorSchema, {
      serviceId: "outlook-orchestrator",
      displayName: "Outlook 注册",
      description: "Outlook 注册流程和账号池协作入口。",
      owner: "outlook",
      health: ServiceHealthStatus.SERVING,
      contracts: [
        create(ContractReferenceSchema, {
          contractRef: "contracts/account/v1",
        }),
      ],
      capabilities: [
        create(CapabilityDescriptorSchema, {
          capabilityId: "outlook.account.pool",
          displayName: "Outlook 账号池",
          description: "面向 Outlook 注册流程的账号池查询入口。",
          kind: CapabilityKind.QUERY,
          ownerServiceId: "outlook-orchestrator",
          inputContract: create(ContractReferenceSchema, {
            contractRef: "contracts/account/v1/AccountListFilter",
          }),
          outputContract: create(ContractReferenceSchema, {
            contractRef: "contracts/account/v1/Account",
          }),
          invocationRef:
            "account://account-manager/accounts?owner_service=outlook-orchestrator",
          targets: [
            create(CapabilityTargetSchema, {
              resourceType: "account.outlook",
            }),
          ],
          availability: create(CapabilityAvailabilitySchema, {
            status: CapabilityAvailabilityStatus.AVAILABLE,
          }),
        }),
      ],
    }),
  ],
})

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

  const body = fromJson(
    ListServicesResponseSchema,
    (await response.json()) as JsonValue,
    { ignoreUnknownFields: true }
  )
  return normalizeServices(body.services)
}

function normalizeServices(services: ServiceDescriptor[]): ServiceDescriptor[] {
  return services.map((service) => ({
    ...service,
    health: normalizeHealth(service.health),
    contracts: service.contracts ?? [],
    capabilities: (service.capabilities ?? []).map((capability) => ({
      ...capability,
      kind: normalizeKind(capability.kind),
      targets: capability.targets ?? [],
      dependencies: capability.dependencies ?? [],
      availability: capability.availability ?? create(CapabilityAvailabilitySchema, {
        status: CapabilityAvailabilityStatus.UNKNOWN,
      }),
    })),
  }))
}

function normalizeHealth(value: ServiceHealthStatus): ServiceHealthStatus {
  switch (value) {
    case ServiceHealthStatus.SERVING:
      return ServiceHealthStatus.SERVING
    case ServiceHealthStatus.DEGRADED:
      return ServiceHealthStatus.DEGRADED
    case ServiceHealthStatus.NOT_SERVING:
      return ServiceHealthStatus.NOT_SERVING
    case ServiceHealthStatus.UNKNOWN:
    default:
      return ServiceHealthStatus.UNKNOWN
  }
}

function normalizeKind(value: CapabilityKind): CapabilityKind {
  switch (value) {
    case CapabilityKind.PAGE:
      return CapabilityKind.PAGE
    case CapabilityKind.ACTION:
      return CapabilityKind.ACTION
    case CapabilityKind.WORKFLOW:
      return CapabilityKind.WORKFLOW
    case CapabilityKind.QUERY:
    default:
      return CapabilityKind.QUERY
  }
}
