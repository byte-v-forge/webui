export type ServiceEndpointKey =
  | "gptRegister"
  | "outlookRegister"
  | "sms"
  | "mailbox"
  | "accountManager"
  | "browserAutomation"

export type ServiceEndpoint = {
  key: ServiceEndpointKey
  name: string
  publicContract: string
  transport: "grpc-web" | "http"
  baseUrlEnv: string
}

export const serviceEndpoints: ServiceEndpoint[] = [
  {
    key: "gptRegister",
    name: "GPT 注册",
    publicContract: "contracts/gptregister/v1",
    transport: "grpc-web",
    baseUrlEnv: "VITE_GPT_REGISTER_API_BASE_URL",
  },
  {
    key: "outlookRegister",
    name: "Outlook 注册",
    publicContract: "contracts/outlookregister/v1",
    transport: "grpc-web",
    baseUrlEnv: "VITE_OUTLOOK_REGISTER_API_BASE_URL",
  },
  {
    key: "sms",
    name: "SMS",
    publicContract: "contracts/sms/v1",
    transport: "grpc-web",
    baseUrlEnv: "VITE_SMS_API_BASE_URL",
  },
  {
    key: "mailbox",
    name: "Mailbox",
    publicContract: "contracts/mailbox/v1",
    transport: "grpc-web",
    baseUrlEnv: "VITE_MAILBOX_API_BASE_URL",
  },
  {
    key: "accountManager",
    name: "账号管理",
    publicContract: "contracts/account/v1",
    transport: "grpc-web",
    baseUrlEnv: "VITE_ACCOUNT_MANAGER_API_BASE_URL",
  },
  {
    key: "browserAutomation",
    name: "浏览器自动化",
    publicContract: "contracts/browserautomation/v1",
    transport: "grpc-web",
    baseUrlEnv: "VITE_BROWSER_AUTOMATION_API_BASE_URL",
  },
]
