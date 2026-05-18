import { create, fromJson, type JsonValue } from "@bufbuild/protobuf"
import {
  CapabilityDescriptorSchema,
  CapabilityKind,
  ContractReferenceSchema,
  ListServicesResponseSchema,
  ServiceDescriptorSchema,
  ServiceHealthStatus,
  type ServiceDescriptor,
} from "@byte-v-forge/contracts-ts/byte/v/forge/contracts/servicecatalog/v1/catalog_pb"

export { CapabilityKind, ServiceHealthStatus }
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
