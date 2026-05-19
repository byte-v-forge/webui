import type { ConcreteGoPayAddBalanceMethod, ConcreteGoPayPaymentChannel, DisplayLabelMap } from './types';

export const GO_PAY_PAYMENT_CHANNELS: ConcreteGoPayPaymentChannel[] = ['sms', 'wa'];
export const GO_PAY_ADD_BALANCE_METHODS: ConcreteGoPayAddBalanceMethod[] = ['manual_transfer', 'envelope', 'rekberinaja'];
export const runningJobsPollMs = 5000;

export const statusOptions = ['', 'UNREGISTERED', 'REGISTERED', 'ACTIVATED', 'DEACTIVATED', 'USER_ALREADY_EXISTS', 'REGISTER_FAILED', 'PAYMENT_FAILED'];
export const jobStatusOptions = ['', 'RUNNING', 'SUCCEEDED', 'FAILED_RETRYABLE', 'FAILED_RECOVERABLE', 'FAILED_FINAL'];
export const mailboxStatusOptions = ['', 'AUTHORIZED', 'OAUTH_PENDING', 'AUTH_FAILED', 'NEEDS_MANUAL_VERIFICATION'];

export const accountStatusLabels: DisplayLabelMap = {
  UNREGISTERED: '未注册',
  REGISTERED: '已注册',
  ACTIVATED: '已激活',
  DEACTIVATED: '已停用',
  USER_ALREADY_EXISTS: '用户已存在',
  EMAIL_ALREADY_EXISTS: '用户已存在',
  REGISTER_FAILED: '注册失败',
  PAYMENT_FAILED: '支付失败'
};

export const jobStatusLabels: DisplayLabelMap = {
  RUNNING: '运行中',
  SUCCEEDED: '成功',
  FAILED_RETRYABLE: '失败',
  FAILED_RECOVERABLE: '失败，需处理',
  FAILED_FINAL: '最终失败'
};

export const emailAllocationStatusLabels: DisplayLabelMap = {
  AVAILABLE: '可用',
  ASSIGNED: '已分配',
  REGISTERED: '已注册',
  USER_ALREADY_EXISTS: '用户已存在',
  REGISTRATION_FAILED: '注册失败',
  BLOCKED: '停止分配'
};

export const mailboxStatusLabels: DisplayLabelMap = {
  AUTHORIZED: '已授权',
  OAUTH_PENDING: '待 OAuth',
  AUTH_FAILED: '认证失败',
  NEEDS_MANUAL_VERIFICATION: '需人工验证'
};

export const actionLabels: DisplayLabelMap = {
  REGISTER: '注册账号',
  LOGIN_SESSION: '登录取 Token',
  ACTIVATE: '激活支付',
  AUTOPAY: '自动支付',
  GOPAY_APP: 'GoPay App',
  GOPAY_PAYMENT: 'GoPay 支付',
  GOPAY_PAYMENT_REBIND: 'GoPay 支付换绑',
  REGISTER_AND_ACTIVATE: '注册并激活',
  PROBE_ACCOUNT: '探测账号',
  REGISTER_MAILBOX: '注册 Outlook 邮箱',
  MAILBOX_OAUTH: 'Microsoft OAuth'
};

export const mailboxOperationActionLabels: DisplayLabelMap = {
  REGISTER_MAILBOX: '注册邮箱',
  MAILBOX_OAUTH: '邮箱 OAuth',
  FETCH_INBOXES: '拉取收件箱'
};

export const gptWorkflowActions = new Set(['REGISTER', 'LOGIN_SESSION', 'ACTIVATE', 'AUTOPAY', 'REGISTER_AND_ACTIVATE', 'PROBE_ACCOUNT']);
export const gopayWorkflowActions = new Set(['GOPAY_APP', 'GOPAY_PAYMENT', 'GOPAY_PAYMENT_REBIND']);
export const mailboxWorkflowActions = new Set(['REGISTER_MAILBOX', 'MAILBOX_OAUTH']);

export const stepLabels: DisplayLabelMap = {
  register_account: '注册账号',
  login_session: '登录取 Token',
  ensure_logon: '确认登录',
  create_email: '创建邮箱',
  wait_outlook_otp: '等待 Outlook OTP',
  gopay_app_login: 'GoPay 登录',
  gopay_app_ensure_token_available: 'EnsureTokenAvailable',
  gopay_app_ensure_pin_settled: 'EnsurePinSettled',
  gopay_app_change_phone: 'GoPay 换绑',
  gopay_app_change_phone_start: '开始换绑',
  gopay_app_change_phone_sms_wait: '等待换绑短信',
  gopay_app_change_phone_retry: '重发换绑短信',
  gopay_app_change_phone_cancel: '取消换绑号码',
  gopay_app_change_phone_complete: '完成换绑',
  gopay_app_signup_phone: '获取未注册 GoPay 号',
  gopay_app_resolve_wa_phone: '解析 WA 手机号',
  gopay_app_deactivate: 'GoPay 注销',
  gopay_app_deactivate_start: '开始注销',
  gopay_app_deactivate_sms_wait: '等待注销短信',
  gopay_app_deactivate_sms_finish: '结束注销号码',
  gopay_app_deactivate_complete: '完成注销',
  gopay_app_signup: 'GoPay 注册',
  gopay_app_create_pin: 'EnsurePinSettled',
  gopay_app_add_balance: 'GoPay 加余额',
  gopay_app_add_balance_confirm: '等待转账确认',
  gopay_app_sms_finish: '结束 GoPay 接码',
  gopay_app_sms_request_more: '追加短信接码',
  gopay_login: 'GoPay 登录',
  gopay_payment_prepare: '准备 GoPay 支付',
  gopay_payment: 'GoPay 支付',
  gopay_payment_rebind: 'GoPay 支付换绑',
  probe_plus_trial: '探测 0 元资格',
  probe_tier: '探测套餐',
  register_mailbox: '注册邮箱',
  mailbox_oauth: '邮箱 OAuth',
  oauth_exchange: '交换 OAuth Token',
  captcha: '验证码/风控验证'
};
