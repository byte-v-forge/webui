import React, { useEffect, useState } from 'react';
import { Activity, AlertTriangle, CheckCircle2, Clock, Copy, Eye, EyeOff, Inbox, KeyRound, ListChecks, Mail, Play, Plus, QrCode, RefreshCcw, Save, Search, ShieldCheck, Trash2, WalletCards, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { Account, AccountMailboxContext, ConcreteGoPayPaymentChannel, Job, LatestOtp, RowActionDescriptor } from './types';
import { GO_PAY_PAYMENT_CHANNELS } from './constants';
import { EmptyBlock, EmptyTableRow, KV, StatusBadge, TierEligibilityBadges } from './common';
import { LinkedWorkflowButton } from './jobs';
import { accountActivationChannel, accountInboxHint, actionText, api, buttonHint, canGoPayPayment, canLoginSession, canProbeAccount, canRefreshAccessToken, canRegister, compactCellError, errorText, formatJobTime, formatUnix, goPayPaymentChannelLabel, isUserAlreadyExistsAccount, loginActionHint, loginActionLabel, mask, maskEmail, maskPreview, paymentChannelValue, probeAccountHint, short, statusText, tierEligibilityText } from './utils';

export function AccountDetails({ account, showSecrets, busy, inboxLoading, refreshingAccessToken, mailboxContext, latestOtp, activationChannel, onCopy, onFetchInbox, onSessionSave, onAccessSave, onActivationChannelSave, onProbeAccount, onLogin, onRefreshAccessToken }: {
  account: Account;
  showSecrets: boolean;
  busy: boolean;
  inboxLoading: boolean;
  refreshingAccessToken: boolean;
  mailboxContext: AccountMailboxContext | null;
  latestOtp: LatestOtp | null;
  activationChannel: string;
  onCopy: (label: string, value: string) => void;
  onFetchInbox: (emailAddress?: string) => Promise<void>;
  onSessionSave: (account: Account, sessionToken: string) => Promise<void>;
  onAccessSave: (account: Account, accessToken: string) => Promise<void>;
  onActivationChannelSave: (account: Account, activationChannel: string) => Promise<void>;
  onProbeAccount: (account: Account) => void;
  onLogin: (account: Account) => void;
  onRefreshAccessToken: (account: Account) => Promise<void>;
}) {
  return (
    <div className="details">
      <section>
        <div className="sectionTitle">
          <h3>账号</h3>
          <div className="sectionActions">
            {canRefreshAccessToken(account) && (
              <Button {...buttonHint('使用当前 Session 自动获取 Access Token')} disabled={busy || refreshingAccessToken} onClick={() => void onRefreshAccessToken(account)}>
                <KeyRound size={14} /> {refreshingAccessToken ? '获取中' : '自动获取 Access Token'}
              </Button>
            )}
            {canLoginSession(account) && (
              <Button {...buttonHint(loginActionHint(account))} disabled={busy} onClick={() => onLogin(account)}>
                <KeyRound size={14} /> {loginActionLabel(account)}
              </Button>
            )}
            <Button {...buttonHint(probeAccountHint(account))} disabled={busy || !canProbeAccount(account)} onClick={() => onProbeAccount(account)}>
              <Search size={14} /> 探测账号
            </Button>
            <Button {...buttonHint(accountInboxHint(account.email, mailboxContext, showSecrets))} disabled={busy || inboxLoading || !account.email} onClick={() => void onFetchInbox(account.email)}>
              <Inbox size={14} /> {inboxLoading ? '拉取中' : '拉取 OTP'}
            </Button>
          </div>
        </div>
        <AccountOtpPanel latestOtp={latestOtp} showSecrets={showSecrets} loading={inboxLoading} onCopy={onCopy} />
        <KV label="ID" value={account.account_id} mono onCopy={onCopy} />
        <KV label="状态" value={statusText(account.status)} copyValue={account.status || '-'} onCopy={onCopy} />
        <KV label="Tier/资格" value={tierEligibilityText(account)} />
        <ActivationChannelEditor account={account} activationChannel={activationChannel} onSave={onActivationChannelSave} />
        <KV label="邮箱" value={showSecrets ? account.email : maskEmail(account.email)} copyValue={account.email} copyDisabled={!account.email} masked={!showSecrets} onCopy={onCopy} />
        <KV label="密码" value={showSecrets ? account.password : mask(account.password)} copyValue={account.password} copyDisabled={!account.password} masked={!showSecrets} mono onCopy={onCopy} />
        <TokenEditor label="Session" field="session_token" account={account} showSecrets={showSecrets} onCopy={onCopy} onSave={onSessionSave} />
        <TokenEditor label="Access" field="access_token" account={account} showSecrets={showSecrets} onCopy={onCopy} onSave={onAccessSave} />
        <KV label="创建时间" value={formatUnix(account.created_at)} onCopy={onCopy} />
        <KV label="更新时间" value={formatUnix(account.updated_at)} onCopy={onCopy} />
      </section>
    </div>
  );
}

function AccountOtpPanel({ latestOtp, showSecrets, loading, onCopy }: {
  latestOtp: LatestOtp | null;
  showSecrets: boolean;
  loading: boolean;
  onCopy: (label: string, value: string) => void;
}) {
  const hasOtp = !!latestOtp?.otp;
  const subject = latestOtp?.subject || 'Latest OTP';
  const displaySubject = showSecrets ? subject : maskPreview(subject);
  const code = hasOtp ? latestOtp.otp : '';
  const receivedAt = latestOtp?.received_at_unix || 0;

  return (
    <div className={`accountOtpPanel${hasOtp ? ' hasOtp' : ''}`} role="status" aria-live="polite">
      <div>
        <span>{loading ? '正在拉取 OTP' : '最近 OTP'}</span>
        <strong className={hasOtp ? 'mono' : ''}>{hasOtp ? (showSecrets ? code : mask(code)) : '暂无 OTP'}</strong>
        <small title={displaySubject}>
          {hasOtp ? `${formatUnix(receivedAt)} · ${displaySubject}` : '点击拉取 OTP 后在这里显示最新验证码'}
        </small>
      </div>
      <Button className="copyButton" {...buttonHint('复制 OTP')} disabled={!hasOtp} onClick={() => onCopy('OTP', code)}>
        <Copy size={14} />
      </Button>
    </div>
  );
}

export function AccountTable({ accounts, jobs, selected, showSecrets, runningAccountIds, runningWorkflowByAccountID, refreshingAccessTokenIds, busy, onSelect, onOpenWorkflow, onRegister, onLogin, onGoPayPayment, onProbeAccount, onRegisterActivate, onRefreshAccessToken, onDelete }: {
  accounts: Account[];
  jobs: Job[];
  selected?: string;
  showSecrets: boolean;
  runningAccountIds: Set<string>;
  runningWorkflowByAccountID: Map<string, Job>;
  refreshingAccessTokenIds: Set<string>;
  busy: boolean;
  onSelect: (a: Account) => void;
  onOpenWorkflow: (job: Job) => void;
  onRegister: (a: Account) => void;
  onLogin: (a: Account) => void;
  onGoPayPayment: (a: Account, channel: ConcreteGoPayPaymentChannel) => void;
  onProbeAccount: (a: Account) => void;
  onRegisterActivate: (a: Account) => void;
  onRefreshAccessToken: (a: Account) => Promise<void>;
  onDelete: (a: Account) => void;
}) {
  return (
    <div className="tableWrap">
      <Table className="responsiveTable accountsTable">
        <TableHeader>
          <TableRow>
            <TableHead>账号</TableHead>
            <TableHead>密码</TableHead>
            <TableHead>状态</TableHead>
            <TableHead>Tier/资格</TableHead>
            <TableHead>渠道</TableHead>
            <TableHead>更新</TableHead>
            <TableHead>操作</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {accounts.length === 0 && <EmptyTableRow colSpan={7} text="暂无账号。可以先创建账号，或切换为全部状态查看。" />}
          {accounts.map((account) => {
            const accountBusy = runningAccountIds.has(account.account_id);
            const currentWorkflow = runningWorkflowByAccountID.get(account.account_id);
            const refreshingAccessToken = refreshingAccessTokenIds.has(account.account_id);
            return (
              <TableRow key={account.account_id} className={selected === account.account_id ? 'selected' : ''} onClick={() => onSelect(account)}>
                <TableCell data-label="账号">
                  <div className="cellStack">
                    <span>{showSecrets ? (account.email || '-') : maskEmail(account.email)}</span>
                    <small className="mono">{short(account.account_id)}</small>
                  </div>
                </TableCell>
                <TableCell data-label="密码" className="secret">{showSecrets ? account.password : mask(account.password)}</TableCell>
                <TableCell data-label="状态">
                  <div className="cellStack">
                    <StatusBadge status={account.status} />
                  </div>
                </TableCell>
                <TableCell data-label="Tier/资格"><TierEligibilityBadges account={account} /></TableCell>
            <TableCell data-label="渠道">
                  <span className="activationChannel">{accountActivationChannel(account, jobs)}</span>
                </TableCell>
                <TableCell data-label="更新">{formatUnix(account.updated_at)}</TableCell>
                <TableCell data-label="操作">
                  <AccountRowActions
                    account={account}
                    accountBusy={accountBusy}
                    currentWorkflow={currentWorkflow}
                    busy={busy}
                    refreshingAccessToken={refreshingAccessToken}
                    onOpenWorkflow={onOpenWorkflow}
                    onRegister={onRegister}
                    onLogin={onLogin}
                    onGoPayPayment={onGoPayPayment}
                    onProbeAccount={onProbeAccount}
                    onRegisterActivate={onRegisterActivate}
                    onRefreshAccessToken={onRefreshAccessToken}
                    onDelete={onDelete}
                  />
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

function AccountRowActions({ account, accountBusy, currentWorkflow, busy, refreshingAccessToken, onOpenWorkflow, onRegister, onLogin, onGoPayPayment, onProbeAccount, onRegisterActivate, onRefreshAccessToken, onDelete }: {
  account: Account;
  accountBusy: boolean;
  currentWorkflow?: Job;
  busy: boolean;
  refreshingAccessToken: boolean;
  onOpenWorkflow: (job: Job) => void;
  onRegister: (a: Account) => void;
  onLogin: (a: Account) => void;
  onGoPayPayment: (a: Account, channel: ConcreteGoPayPaymentChannel) => void;
  onProbeAccount: (a: Account) => void;
  onRegisterActivate: (a: Account) => void;
  onRefreshAccessToken: (a: Account) => Promise<void>;
  onDelete: (a: Account) => void;
}) {
  if (accountBusy && currentWorkflow && !isUserAlreadyExistsAccount(account)) {
    return (
      <div className="rowActions" onClick={(event) => event.stopPropagation()}>
        <LinkedWorkflowButton job={currentWorkflow} onOpen={onOpenWorkflow} />
      </div>
    );
  }

  const actions: RowActionDescriptor[] = [];
  if (canRegister(account)) actions.push({ label: '注册账号', icon: <Play size={14} />, onClick: () => onRegister(account), disabled: busy, kind: 'primary' });
  if (canRefreshAccessToken(account)) actions.push({ label: refreshingAccessToken ? '获取中' : '获取 Access', icon: <KeyRound size={14} />, onClick: () => void onRefreshAccessToken(account), disabled: busy || refreshingAccessToken, kind: actions.length ? 'secondary' : 'primary' });
  if (canLoginSession(account)) actions.push({ label: loginActionLabel(account), icon: <KeyRound size={14} />, onClick: () => onLogin(account), disabled: busy, kind: actions.length ? 'secondary' : 'primary' });
  if (canProbeAccount(account)) actions.push({ label: '探测账号', icon: <Search size={14} />, onClick: () => onProbeAccount(account), disabled: busy, kind: 'secondary' });
  if (canRegister(account)) actions.push({ label: '注册并激活', icon: <ShieldCheck size={14} />, onClick: () => onRegisterActivate(account), disabled: busy, kind: 'secondary' });
  actions.push({ label: '删除账号', icon: <Trash2 size={14} />, onClick: () => onDelete(account), disabled: busy, kind: 'danger' });

  const paymentActions: RowActionDescriptor[] = canGoPayPayment(account)
    ? GO_PAY_PAYMENT_CHANNELS.map((channel) => ({
      label: goPayPaymentChannelLabel(channel),
      icon: <WalletCards size={14} />,
      onClick: () => onGoPayPayment(account, channel),
      disabled: busy,
      kind: 'secondary' as const
    }))
    : [];

  const primary = actions.find((action) => action.kind === 'primary' && !action.disabled) ||
    actions.find((action) => !action.disabled) ||
    actions[0];
  const secondary = actions.filter((action) => action !== primary);

  return (
    <div className="rowActions" onClick={(event) => event.stopPropagation()}>
      <div className="rowActionsMain">
        <RowActionButton action={primary} showLabel />
        {secondary.map((action) => <RowActionButton key={action.label} action={action} />)}
      </div>
      {paymentActions.length > 0 && (
        <div className="rowActionsPayment">
          {paymentActions.map((action) => <RowActionButton key={action.label} action={action} showLabel fullLabel />)}
        </div>
      )}
    </div>
  );
}

function RowActionButton({ action, showLabel, fullLabel }: { action: RowActionDescriptor; showLabel?: boolean; fullLabel?: boolean }) {
  const className = [
    showLabel ? 'rowButtonText' : 'iconButton',
    fullLabel ? 'rowPaymentButton' : '',
    action.kind === 'primary' ? 'primaryRowAction' : '',
    action.kind === 'danger' ? 'dangerButton' : ''
  ].filter(Boolean).join(' ');

  return (
    <Button className={className} {...buttonHint(action.label)} disabled={action.disabled} onClick={action.onClick}>
      {action.icon}
      {showLabel && <span>{action.label}</span>}
    </Button>
  );
}

export function CreateAccountForm({ onDone, onError }: {
  onDone: (message: string) => void;
  onError: (message: string) => void;
}) {
  const [form, setForm] = useState({
    email: '',
    password: '',
    use_split_strategy: true
  });
  const [working, setWorking] = useState('');

  function update(key: 'email' | 'password', value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function payload() {
    return {
      email: form.email,
      password: form.password,
      use_split_strategy: form.use_split_strategy
    };
  }

  async function run(label: string, path: string, payload: unknown) {
    setWorking(label);
    try {
      const resp = await api<any>(path, { method: 'POST', body: JSON.stringify(payload) });
      if (resp.error_message) {
        onError(resp.error_message);
      } else {
        onDone(`${label} 已提交: ${resp.job_id || resp.account_id || 'ok'}`);
      }
    } catch (err) {
      onError(errorText(err));
    } finally {
      setWorking('');
    }
  }

  return (
    <div className="createAccount">
      <div className="formGrid">
        <Input placeholder="邮箱，可空" value={form.email} onChange={(e) => update('email', e.target.value)} />
        <Input placeholder="密码，可空" type="password" value={form.password} onChange={(e) => update('password', e.target.value)} />
        <label className="checkboxControl">
          <input
            type="checkbox"
            checked={form.use_split_strategy}
            onChange={(event) => setForm((prev) => ({ ...prev, use_split_strategy: event.target.checked }))}
          />
          <span>分裂策略</span>
        </label>
      </div>
      <div className="buttonRow">
        <Button onClick={() => run('创建账号', '/api/accounts', payload())} disabled={!!working}><Plus size={15} /> 创建账号</Button>
      </div>
      {working && <p className="hint">正在执行：{working}</p>}
    </div>
  );
}

function TokenEditor({ label, field, account, showSecrets, onCopy, onSave }: {
  label: string;
  field: 'session_token' | 'access_token';
  account: Account;
  showSecrets: boolean;
  onCopy: (label: string, value: string) => void;
  onSave: (account: Account, token: string) => Promise<void>;
}) {
  const current = account[field] || '';
  const [value, setValue] = useState(current);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setValue(account[field] || '');
  }, [account.account_id, account.session_token, account.access_token, field]);

  async function save() {
    setSaving(true);
    try {
      await onSave(account, value.trim());
    } finally {
      setSaving(false);
    }
  }

  function copyFromInput(event: React.ClipboardEvent<HTMLInputElement>) {
    if (!value.trim()) return;
    event.preventDefault();
    event.clipboardData.setData('text/plain', value);
  }

  return (
    <div className="editLine">
      <span>{label}</span>
      <Input
        className="mono"
        type={showSecrets ? 'text' : 'password'}
        value={value}
        onChange={(event) => setValue(event.target.value)}
        onCopy={copyFromInput}
        placeholder={`${label.toLowerCase()} token`}
      />
      <Button
        className="copyButton"
        {...buttonHint(`复制 ${label}`)}
        disabled={!value.trim()}
        onClick={() => onCopy(label, value)}
      >
        <Copy size={14} />
      </Button>
      <Button {...buttonHint(`保存 ${label}`)} onClick={save} disabled={saving || value.trim() === current}>
        <Save size={14} /> 保存
      </Button>
    </div>
  );
}

function ActivationChannelEditor({ account, activationChannel, onSave }: {
  account: Account;
  activationChannel: string;
  onSave: (account: Account, activationChannel: string) => Promise<void>;
}) {
  const stored = paymentChannelValue(account.activation_channel || '');
  const derived = paymentChannelValue(activationChannel);
  const current = stored || derived;
  const [value, setValue] = useState(current);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setValue(stored || derived);
  }, [account.account_id, account.activation_channel, stored, derived]);

  async function save() {
    setSaving(true);
    try {
      await onSave(account, value);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="editLine channelEditLine">
      <span>渠道</span>
      <NativeSelect value={value} onChange={(event) => setValue(paymentChannelValue(event.target.value))}>
        <NativeSelectOption value="">未设置</NativeSelectOption>
        <NativeSelectOption value="gopay_sms">Gopay-SMS</NativeSelectOption>
        <NativeSelectOption value="gopay_wa">Gopay-WA</NativeSelectOption>
      </NativeSelect>
      <Button {...buttonHint('保存渠道')} onClick={save} disabled={saving || value === stored}>
        <Save size={14} /> 保存
      </Button>
    </div>
  );
}
