import type { ReactNode } from 'react';
import type { MailboxOperation } from '@/proto/mailbox_service';
import type { GoPayUserStatusResponse } from '@/proto/orchestrator_gopay_app';
import type { Job, JobEvent, JobSnapshot, JobStep as Step, WorkflowProgress } from '@/proto/orchestrator_job';

export type { GoPayUserStatusResponse, Job, JobEvent, JobSnapshot, MailboxOperation, Step, WorkflowProgress };

export type Account = {
  account_id: string;
  email: string;
  password: string;
  status: string;
  error_message: string;
  activation_channel?: string;
  session_token: string;
  access_token: string;
  plus_trial_eligible?: boolean;
  plus_active?: boolean;
  tier: string;
  created_at: number;
  updated_at: number;
};

export type ManualAddBalanceConfirmResponse = {
  success: boolean;
  job_id: string;
  error_message?: string;
};

export type Mailbox = {
  email_address: string;
  password: string;
  refresh_token: string;
  access_token: string;
  auth_status: string;
  last_error: string;
  is_primary: boolean;
  primary_email: string;
  created_at: number;
  updated_at: number;
  latest_otp: string;
  latest_otp_subject: string;
  latest_otp_received_at_unix: number;
};

export type GPTEmailAllocation = {
  email: string;
  primary_email: string;
  is_primary: boolean;
  status: string;
  splittable: boolean;
  assigned_account_id: string;
  last_error: string;
  created_at: number;
  updated_at: number;
};

export type MailboxOAuthResponse = {
  started: boolean;
  job_id: string;
  error_message: string;
};

export type InboxMessage = {
  id: string;
  mailbox_email: string;
  subject: string;
  from_address: string;
  body_preview: string;
  received_at_unix: number;
  recipients: string[];
  otp: string;
};

export type InboxResult = {
  mailbox?: Mailbox;
  messages?: InboxMessage[];
  error_message?: string;
};

export type BanDetection = {
  account_id: string;
  email_address: string;
  mailbox_email: string;
  from_address: string;
  subject: string;
  received_at_unix: number;
  account_updated: boolean;
  error_message: string;
};

export type InboxResponse = {
  results?: InboxResult[];
  mailbox_count: number;
  fetched_count: number;
  failed_count: number;
  message_count: number;
  bans?: BanDetection[];
  ban_count: number;
};

export type GoPayDashboardStateResponse = GoPayUserStatusResponse & {
  user_id: string;
  wa_phone: string;
  wa_phone_error_message?: string;
};

export type LatestOtp = {
  otp: string;
  subject: string;
  received_at_unix: number;
};

export type AccountMailboxContext = {
  account_email: string;
  primary_email: string;
  is_split: boolean;
  known: boolean;
};

export type GoPayOTPChannel = '' | 'sms' | 'wa';
export type ConcreteGoPayPaymentChannel = Exclude<GoPayOTPChannel, ''>;
export type GoPayAddBalanceMethod = '' | 'manual_transfer' | 'envelope' | 'rekberinaja';
export type ConcreteGoPayAddBalanceMethod = Exclude<GoPayAddBalanceMethod, ''>;

export type Toast = { kind: 'ok' | 'error'; text: string } | null;
export type ViewKey = 'accounts' | 'gopay' | 'mailboxes' | 'jobs';
export type WorkflowTab = 'all' | 'gpt' | 'gopay' | 'mailbox';
export type MailboxDetailTab = 'overview' | 'aliases' | 'inbox';
export type DisplayLabelMap = Record<string, string>;
export type PanelState = { loading: boolean; error: string };
export type RowActionDescriptor = {
  label: string;
  icon: ReactNode;
  onClick: () => void;
  disabled?: boolean;
  kind?: 'primary' | 'secondary' | 'danger';
};
