import { Activity, AlertTriangle, CheckCircle2, Clock, Copy, Eye, EyeOff, Inbox, KeyRound, ListChecks, Mail, Play, Plus, QrCode, RefreshCcw, Save, Search, ShieldCheck, Trash2, WalletCards, X } from 'lucide-react';
import type { DisplayLabelMap, GoPayDashboardStateResponse, GoPayUserStatusResponse } from './types';
import { compactCellError, formatUnix } from './utils';

export function GoPayStateStatusPanel({ state, loading }: { state: GoPayDashboardStateResponse | null; loading: boolean }) {
  const status = state?.status;
  const error = state?.error_message || state?.wa_phone_error_message || status?.error_message || '';
  const stage = String(status?.stage || '').trim();
  const waPhone = state?.wa_phone || '';
  const cls = error ? 'bad' : status?.token_present && stage === 'ready' ? 'good' : 'mid';
  const title = loading
    ? 'State 刷新中'
    : error
      ? 'State 异常'
      : status
        ? `State：${goPayStateStageText(stage)}`
        : 'State 未加载';
  const text = error
    ? compactCellError(error)
    : status
      ? `WA ${waPhone || '-'} · ${status.token_present ? 'Token 已保存' : '无 Token'} · ${goPayBalanceText(status)}`
      : '打开 GoPay 页后会读取 local state。';
  const icon = loading ? <Clock size={16} /> : error ? <AlertTriangle size={16} /> : <ShieldCheck size={16} />;
  const latestOtp = latestGoPayOtpWindow(status);

  return (
    <div className="goPayStatePanel">
      <div className={`registrationSummary ${cls}`}>
        {icon}
        <div>
          <strong>{title}</strong>
          <span title={error || text}>{text}</span>
        </div>
      </div>
      <div className="goPayStateGrid">
        <GoPayStateField label="User" value={state?.user_id || 'local'} />
        <GoPayStateField label="WA手机号" value={waPhone || '-'} />
        <GoPayStateField label="阶段" value={goPayStateStageText(stage)} raw={stage || '-'} />
        <GoPayStateField label="GoPay手机号" value={status?.phone || '-'} />
        <GoPayStateField label="Token" value={status?.token_present ? '已保存' : '-'} />
        <GoPayStateField label="余额" value={status ? goPayBalanceText(status) : '-'} />
        <GoPayStateField label="设备" value={status?.device_fingerprint || '-'} />
        <GoPayStateField label="OTP" value={latestOtp || '-'} />
        <GoPayStateField label="注销时间" value={formatUnix(status?.deactivated_at || 0)} />
      </div>
    </div>
  );
}

function GoPayStateField({ label, value, raw }: { label: string; value: string; raw?: string }) {
  return (
    <div className="goPayStateField" title={raw || value}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function goPayStateStageText(stage: string) {
  const labels: DisplayLabelMap = {
    ready: 'ready',
    login_otp_sent: '登录 OTP',
    signup_otp_sent: '注册 OTP',
    signup_pin_otp_sent: 'PIN OTP',
    change_phone_otp_sent: '换绑 OTP',
    deactivation_otp_sent: '注销 OTP'
  };
  return labels[stage] || stage || '未保存';
}

function goPayBalanceText(status: NonNullable<GoPayUserStatusResponse['status']>) {
  const currency = status.balance_currency || 'IDR';
  const amount = Number(status.balance_amount || 0);
  if (!status.token_present && amount === 0) return '-';
  return `${amount} ${currency}${status.has_min_balance ? ' · 足额' : ' · 未达标'}`;
}

function latestGoPayOtpWindow(status: GoPayUserStatusResponse['status']) {
  if (!status) return '';
  const windows = [
    { label: '登录', sent: status.login_otp_sent_at_unix, expires: status.login_otp_expires_at_unix },
    { label: '注册', sent: status.signup_otp_sent_at_unix, expires: status.signup_otp_expires_at_unix },
    { label: 'PIN', sent: status.signup_pin_otp_sent_at_unix, expires: status.signup_pin_otp_expires_at_unix }
  ].filter((item) => item.sent || item.expires);
  if (windows.length === 0) return '';
  windows.sort((a, b) => (b.sent || b.expires) - (a.sent || a.expires));
  const latest = windows[0];
  return `${latest.label} · ${formatUnix(latest.sent)} - ${formatUnix(latest.expires)}`;
}
