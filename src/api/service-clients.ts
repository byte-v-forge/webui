export type ServiceEndpointKey =
  | "gptRegister"
  | "outlookRegister"
  | "sms"
  | "mailbox"
  | "gptAccountManager"
  | "outlookAccountManager"
  | "browserAutomation"

export type ServiceEndpoint = {
  key: ServiceEndpointKey
  name: string
  contractRef: string
  transport: "grpc-web" | "http"
  baseUrlEnv: string
}

export const serviceEndpoints: ServiceEndpoint[] = [
  {
    key: "gptRegister",
    name: "GPT 注册",
    contractRef: "internal-contracts/gptregister/v1",
    transport: "grpc-web",
    baseUrlEnv: "VITE_GPT_REGISTER_API_BASE_URL",
  },
  {
    key: "outlookRegister",
    name: "Outlook 注册",
    contractRef: "internal-contracts/outlookregister/v1",
    transport: "grpc-web",
    baseUrlEnv: "VITE_OUTLOOK_REGISTER_API_BASE_URL",
  },
  {
    key: "sms",
    name: "SMS",
    contractRef: "contracts/sms/v1",
    transport: "grpc-web",
    baseUrlEnv: "VITE_SMS_API_BASE_URL",
  },
  {
    key: "mailbox",
    name: "Mailbox",
    contractRef: "contracts/mailbox/v1",
    transport: "grpc-web",
    baseUrlEnv: "VITE_MAILBOX_API_BASE_URL",
  },
  {
    key: "gptAccountManager",
    name: "GPT 账号",
    contractRef: "internal-contracts/gptaccount/v1",
    transport: "grpc-web",
    baseUrlEnv: "VITE_GPT_ACCOUNT_MANAGER_API_BASE_URL",
  },
  {
    key: "outlookAccountManager",
    name: "Outlook 账号",
    contractRef: "internal-contracts/outlookaccount/v1",
    transport: "grpc-web",
    baseUrlEnv: "VITE_OUTLOOK_ACCOUNT_MANAGER_API_BASE_URL",
  },
  {
    key: "browserAutomation",
    name: "浏览器自动化",
    contractRef: "internal-contracts/browserautomation/v1",
    transport: "grpc-web",
    baseUrlEnv: "VITE_BROWSER_AUTOMATION_API_BASE_URL",
  },
]
