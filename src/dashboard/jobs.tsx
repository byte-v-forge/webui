import React, { useEffect, useState } from 'react';
import { Activity, AlertTriangle, CheckCircle2, Clock, Copy, Eye, EyeOff, Inbox, KeyRound, ListChecks, Mail, Play, Plus, QrCode, RefreshCcw, Save, Search, ShieldCheck, Trash2, WalletCards, X } from 'lucide-react';
import QRCode from 'qrcode';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { ConcreteGoPayAddBalanceMethod, DisplayLabelMap, GoPayUserStatusResponse, Job, JobEvent, WorkflowProgress } from './types';
import { GO_PAY_ADD_BALANCE_METHODS } from './constants';
import { EmptyBlock, EmptyTableRow, KV, StatusBadge } from './common';
import { actionText, addBalanceMethodLabel, buttonHint, canConfirmManualAddBalance, canRetryGoPayPaymentRebind, canSelectGoPayAddBalance, canSubmitOtp, compactCellError, eventText, eventTime, formatJobTime, formatJSON, formatUnix, manualAddBalanceView, otpSubmitLabel, short, statusText, stepDuration, stepProgressText, stepText } from './utils';

export function JobDetails({ job, progress, events, nowUnix, onCopy, onOtpSubmit, onManualAddBalanceConfirm, onGoPayAddBalanceSelect, onGoPayRebindRetry }: {
  job: Job;
  progress: WorkflowProgress | null;
  events: JobEvent[];
  nowUnix: number;
  onCopy: (label: string, value: string) => void;
  onOtpSubmit: (job: Job, otp: string) => Promise<void>;
  onManualAddBalanceConfirm: (job: Job) => Promise<void>;
  onGoPayAddBalanceSelect: (job: Job, method: ConcreteGoPayAddBalanceMethod) => Promise<void>;
  onGoPayRebindRetry: (job: Job) => Promise<void>;
}) {
  return (
    <div className="details">
      <section>
        <div className="sectionTitle">
          <h3>工作流</h3>
        </div>
        <KV label="Job" value={job.job_id} mono onCopy={onCopy} />
        <KV label="对象" value={job.account_id || '-'} mono onCopy={onCopy} />
        <KV label="动作" value={actionText(job.action)} copyValue={job.action} onCopy={onCopy} />
        <KV label="状态" value={statusText(job.status)} copyValue={job.status} onCopy={onCopy} />
        <KV label="当前步骤" value={stepText(job.last_step)} copyValue={job.last_step || '-'} onCopy={onCopy} />
        {progress && (
          <>
            <KV label="执行状态" value={`${statusText(progress.status.toUpperCase())} · ${stepText(progress.step_name)}`} copyValue={progress.step_name || '-'} onCopy={onCopy} />
            <KV label="执行刷新" value={formatUnix(progress.updated_at_unix)} onCopy={onCopy} />
          </>
        )}
        <KV label="更新时间" value={formatJobTime(job.updated_at)} onCopy={onCopy} />
	        <KV label="错误" value={job.error_message || '-'} onCopy={onCopy} />
	        {canSubmitOtp(job) && <OtpSubmitter job={job} onSubmit={onOtpSubmit} />}
	        <ManualAddBalancePanel
	          job={job}
	          progress={progress}
	          onConfirm={onManualAddBalanceConfirm}
	          onSelect={onGoPayAddBalanceSelect}
	          onCopy={onCopy}
	        />
          <GoPayRebindPanel job={job} onRetry={onGoPayRebindRetry} />
	        <div className="timeline">
          {(job.steps || []).map((step) => {
            const progressText = stepProgressText(step, progress);
            const isCurrentStep = progress?.step_name === step.step_name && job.status === 'RUNNING';
            return (
              <div className={`step${isCurrentStep ? ' currentStep' : ''}`} key={step.step_name}>
                <div className="stepHeader">
                  <strong>{stepText(step.step_name)} <small className="rawHint">{step.step_name}</small></strong>
                  <span className="stepState">
                    {isCurrentStep && <small className="stepLive">当前</small>}
                    {stepDuration(step, nowUnix)}
                    <StatusBadge status={step.status} />
                  </span>
                </div>
                <div className="stepMeta">
                  {step.started_at ? <small>开始 {formatUnix(step.started_at)}</small> : null}
                  {step.completed_at ? <small>完成 {formatUnix(step.completed_at)}</small> : null}
                  {step.recoverable ? <small>可恢复</small> : null}
                  {step.retryable ? <small>可重试</small> : null}
                </div>
                {progressText && <p className="stepProgress">{progressText}</p>}
                {step.error_message && <p>{step.error_message}</p>}
                {step.detail && (
                  <details className="jsonDetails">
                    <summary>结果数据</summary>
                    <pre>{formatJSON(step.detail)}</pre>
                  </details>
                )}
              </div>
            );
          })}
          {(!job.steps || job.steps.length === 0) && <EmptyBlock text="暂无步骤明细。" />}
        </div>
        <WorkflowEvents events={events} />
      </section>
    </div>
  );
}

function WorkflowEvents({ events }: { events: JobEvent[] }) {
  return (
    <div className="workflowEvents">
      <div className="sectionTitle">
        <h3>事件</h3>
        <span className="muted">{events.length}</span>
      </div>
      <div className="eventList">
        {events.length === 0 && <EmptyBlock text="暂无事件流数据。" />}
        {events.slice(0, 30).map((event) => {
          const snapshot = event.snapshot;
          const job = snapshot?.job;
          const progress = snapshot?.progress;
          const step = progress?.step_name || job?.last_step || '';
          const status = progress?.status || job?.status || '';
          return (
            <div className="eventItem" key={event.event_id}>
              <div>
                <strong>{eventText(event.event_type)}</strong>
                <span>{step ? stepText(step) : '-'}</span>
              </div>
              <small>{status ? statusText(status.toUpperCase()) : '-'} · {eventTime(event)}</small>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function OtpSubmitter({ job, onSubmit }: {
  job: Job;
  onSubmit: (job: Job, otp: string) => Promise<void>;
}) {
  const [otp, setOtp] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const label = otpSubmitLabel(job);

  async function submit() {
    const value = otp.trim();
    if (!value) return;
    setSubmitting(true);
    try {
      await onSubmit(job, value);
      setOtp('');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="otpSubmitter">
      <span><KeyRound size={14} /> {label}</span>
      <div>
        <Input
          inputMode="numeric"
          autoComplete="one-time-code"
          placeholder="验证码"
          value={otp}
          onChange={(event) => setOtp(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') void submit();
          }}
        />
        <Button className="primaryButton" disabled={submitting || !otp.trim()} onClick={() => void submit()}>
          <KeyRound size={14} /> 提交
        </Button>
      </div>
    </div>
  );
}

function ManualAddBalancePanel({ job, progress, onConfirm, onSelect, onCopy }: {
  job: Job;
  progress: WorkflowProgress | null;
  onConfirm: (job: Job) => Promise<void>;
  onSelect: (job: Job, method: ConcreteGoPayAddBalanceMethod) => Promise<void>;
  onCopy: (label: string, value: string) => void;
}) {
  const [submitting, setSubmitting] = useState(false);
  const [selecting, setSelecting] = useState('');
  const balance = manualAddBalanceView(job);
  const canSelect = canSelectGoPayAddBalance(job, progress, balance);
  if (!canSelect && (!balance || balance.method !== 'manual_transfer')) return null;

  const transfer = balance?.transfer || { qr_payload: '', instructions: '', amount: 0, currency: 'IDR' };
  const canConfirm = canConfirmManualAddBalance(job, progress, balance);
  async function select(method: ConcreteGoPayAddBalanceMethod) {
    setSelecting(method);
    try {
      await onSelect(job, method);
    } finally {
      setSelecting('');
    }
  }

  async function confirm() {
    setSubmitting(true);
    try {
      await onConfirm(job);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="manualBalancePanel">
      <div className="manualBalanceHead">
        <span><QrCode size={15} /> {canSelect ? '选择加余额方式' : '手动转账'}</span>
        <StatusBadge status={canSelect || canConfirm ? 'RUNNING' : balance?.status === 'confirmed' ? 'SUCCEEDED' : 'RUNNING'} />
      </div>
      {canSelect && (
        <div className="addBalanceChoiceList">
          {GO_PAY_ADD_BALANCE_METHODS.map((method) => (
            <Button
              key={method}
              className={method === 'manual_transfer' ? 'secondaryButton' : 'primaryButton'}
              disabled={!!selecting}
              onClick={() => void select(method)}
            >
              <WalletCards size={14} /> {selecting === method ? '选择中' : addBalanceMethodLabel(method)}
            </Button>
          ))}
        </div>
      )}
      {!canSelect && (
      <div className="transferBox">
        <TransferQRCode payload={transfer.qr_payload} />
        <div className="transferMeta">
          <strong>{transfer.amount > 0 ? `${transfer.amount} ${transfer.currency || 'IDR'}` : (transfer.currency || 'IDR')}</strong>
          <span>{transfer.instructions || '转账后点击确认继续流程。'}</span>
          <div className="transferActions">
            <Button className="copyButton" {...buttonHint('复制二维码内容')} disabled={!transfer.qr_payload} onClick={() => onCopy('二维码内容', transfer.qr_payload)}>
              <Copy size={14} />
            </Button>
            <Button className="primaryButton" disabled={!canConfirm || submitting} onClick={() => void confirm()}>
              <CheckCircle2 size={14} /> 已转账，继续
            </Button>
          </div>
        </div>
      </div>
      )}
    </div>
  );
}

function GoPayRebindPanel({ job, onRetry }: {
  job: Job;
  onRetry: (job: Job) => Promise<void>;
}) {
  const [submitting, setSubmitting] = useState(false);
  if (!canRetryGoPayPaymentRebind(job)) return null;

  async function retry() {
    setSubmitting(true);
    try {
      await onRetry(job);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="manualBalancePanel">
      <div className="manualBalanceHead">
        <span><RefreshCcw size={15} /> 支付后换绑</span>
        <StatusBadge status={job.status} />
      </div>
      <div className="rebindRetryBox">
        <span>支付已完成，可单独执行 SMS 换绑。</span>
        <Button className="primaryButton" disabled={submitting} onClick={() => void retry()}>
          <RefreshCcw size={14} /> 开始换绑
        </Button>
      </div>
    </div>
  );
}

function TransferQRCode({ payload }: { payload: string }) {
  const [dataUrl, setDataUrl] = useState('');

  useEffect(() => {
    let cancelled = false;
    setDataUrl('');
    if (!payload) return () => {
      cancelled = true;
    };
    QRCode.toDataURL(payload, { width: 224, margin: 1, errorCorrectionLevel: 'M' })
      .then((value) => {
        if (!cancelled) setDataUrl(value);
      })
      .catch(() => {
        if (!cancelled) setDataUrl('');
      });
    return () => {
      cancelled = true;
    };
  }, [payload]);

  if (dataUrl) {
    return <img className="transferQr" src={dataUrl} alt="GoPay 转账二维码" />;
  }
  return (
    <div className="transferQr transferQrEmpty">
      <QrCode size={34} />
      <span>未配置二维码</span>
    </div>
  );
}

export function LinkedWorkflowButton({ job, onOpen }: { job: Job; onOpen: (job: Job) => void }) {
  return (
    <Button className="rowButtonText linkedWorkflowButton" {...buttonHint(`查看工作流：${actionText(job.action)}`)} onClick={() => onOpen(job)}>
      <Activity size={14} /> 工作流
    </Button>
  );
}

export function JobTable({ jobs, selected, emptyText = '暂无工作流任务', onSelect, onGoPayRebindRetry }: {
  jobs: Job[];
  selected?: string;
  emptyText?: string;
  onSelect: (j: Job) => void;
  onGoPayRebindRetry?: (job: Job) => Promise<void>;
}) {
  return (
    <div className="tableWrap">
      <Table className="responsiveTable jobTable">
        <TableHeader>
          <TableRow><TableHead>Job</TableHead><TableHead>对象</TableHead><TableHead>动作</TableHead><TableHead>状态</TableHead><TableHead>步骤</TableHead><TableHead>更新</TableHead><TableHead>错误</TableHead><TableHead>操作</TableHead></TableRow>
        </TableHeader>
        <TableBody>
          {jobs.length === 0 && <EmptyTableRow colSpan={8} text={emptyText} />}
          {jobs.map((job) => (
            <TableRow key={job.job_id} className={selected === job.job_id ? 'selected' : ''} onClick={() => onSelect(job)}>
              <TableCell data-label="Job" className="mono">
                <div className="cellStack">
                  <span>{short(job.job_id)}</span>
                  {canSubmitOtp(job) && <small className="needsOtp">需要 OTP</small>}
                </div>
              </TableCell>
              <TableCell data-label="对象" className="mono">{short(job.account_id || '-', 10)}</TableCell>
              <TableCell data-label="动作" title={job.action}>{actionText(job.action)}</TableCell>
              <TableCell data-label="状态"><StatusBadge status={job.status} /></TableCell>
              <TableCell data-label="步骤" title={job.last_step}>{stepText(job.last_step)}</TableCell>
              <TableCell data-label="更新">{formatJobTime(job.updated_at)}</TableCell>
              <TableCell data-label="错误" className="errorCell" title={job.error_message}>{compactCellError(job.error_message || '-')}</TableCell>
              <TableCell data-label="操作">
                {onGoPayRebindRetry && canRetryGoPayPaymentRebind(job)
                  ? <GoPayRebindRowButton job={job} onRetry={onGoPayRebindRetry} />
                  : <span className="muted">-</span>}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function GoPayRebindRowButton({ job, onRetry }: { job: Job; onRetry: (job: Job) => Promise<void> }) {
  const [submitting, setSubmitting] = useState(false);
  async function retry(event: React.MouseEvent) {
    event.stopPropagation();
    setSubmitting(true);
    try {
      await onRetry(job);
    } finally {
      setSubmitting(false);
    }
  }
  return (
    <Button className="rowButtonText linkedWorkflowButton" disabled={submitting} {...buttonHint(job.action === 'GOPAY_PAYMENT_REBIND' ? '重试换绑' : '执行换绑')} onClick={(event) => void retry(event)}>
      <RefreshCcw size={14} /> <span>{job.action === 'GOPAY_PAYMENT_REBIND' ? '重试换绑' : '换绑'}</span>
    </Button>
  );
}

export function WorkflowSummary({ job, runningCount, runningTitle, runningText, idleTitle, idleText }: {
  job?: Job;
  runningCount: number;
  runningTitle: (count: number) => string;
  runningText: string;
  idleTitle: string;
  idleText: string;
}) {
  const icon = runningCount > 0 ? <Clock size={16} /> : job?.status?.startsWith('FAILED') ? <AlertTriangle size={16} /> : <CheckCircle2 size={16} />;
  const title = runningCount > 0 ? runningTitle(runningCount) : job ? `最近一次：${statusText(job.status)}` : idleTitle;
  const text = runningCount > 0
    ? runningText
    : job
      ? `${actionText(job.action)} · ${stepText(job.last_step)}${job.error_message ? ` · ${compactCellError(job.error_message)}` : ''}`
      : idleText;

  return (
    <div className={`registrationSummary ${job?.status?.startsWith('FAILED') ? 'bad' : runningCount > 0 ? 'mid' : 'good'}`}>
      {icon}
      <div>
        <strong>{title}</strong>
        <span title={job?.error_message || text}>{text}</span>
      </div>
    </div>
  );
}
