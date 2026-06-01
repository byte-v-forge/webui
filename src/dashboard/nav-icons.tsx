import openAIIcon from '@lobehub/icons-static-svg/icons/openai.svg?url';
import { Circle, Mailbox, MessageCircle, MessageSquareText, Router, WalletCards, Workflow, type LucideIcon } from 'lucide-react';
import { createElement, type ReactNode } from 'react';

const NAV_ICON_IMAGES: Record<string, string> = { gpt: openAIIcon, openai: openAIIcon };

const NAV_ICONS: Record<string, LucideIcon> = {
  'message-circle': MessageCircle,
  'wallet-cards': WalletCards,
  mailbox: Mailbox,
  mailboxes: Mailbox,
  sms: MessageSquareText,
  'proxy-runtime': Router,
  proxy_runtime: Router,
  workflow: Workflow,
  'workflow-runtime': Workflow
};

export function dashboardNavIcon(name: string | undefined, fallback = Circle): ReactNode {
  if (name && NAV_ICON_IMAGES[name]) return createElement('img', { src: NAV_ICON_IMAGES[name], alt: '', style: { width: 17, height: 17 } });
  const Icon = (name && NAV_ICONS[name]) || fallback;
  return createElement(Icon, { size: 17, strokeWidth: 2.2 });
}
