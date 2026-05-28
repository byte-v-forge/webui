import { Circle } from 'lucide-react';
import { createElement, type ComponentType, type ReactNode } from 'react';
import {
  DashboardNavSection,
  type DashboardServiceStatus,
  type DashboardServiceStatusResponse
} from '@byte-v-forge/common-ui';
import { loadDashboardModuleRegistrations as loadRemoteDashboardModuleRegistrations } from './generated-module-registry';
import type { DashboardModuleRegistration, DashboardModuleViewProps } from './module-contract';

export type { DashboardModuleManifest, DashboardModuleRegistration } from './module-contract';

export async function loadDashboardModuleRegistrations(): Promise<DashboardModuleRegistration[]> {
  return loadRemoteDashboardModuleRegistrations();
}

export type { DashboardServiceStatus, DashboardServiceStatusResponse } from '@byte-v-forge/common-ui';

export type DashboardNavItem = {
  key: string;
  label: string;
  icon: ReactNode;
  section: 'main' | 'infrastructure' | 'lab';
  requiredServices: string[];
  order: number;
};

export type DashboardModuleViews = Record<string, ComponentType<DashboardModuleViewProps>>;
export type ServiceStatusMap = Record<string, DashboardServiceStatus>;

export function createDashboardModuleViews(registrations: DashboardModuleRegistration[]): DashboardModuleViews {
  return Object.assign({}, ...registrations.map((registration) => registration.views || {}));
}

export function buildDashboardNavItems(registrations: DashboardModuleRegistration[]): DashboardNavItem[] {
  return registrations
    .flatMap((registration) => (registration.manifest.nav || []).map((entry) => ({ entry, registration })))
    .map((entry, index) => ({
      key: entry.entry.key,
      label: entry.entry.label,
      icon: entry.registration.icons?.[entry.entry.icon] || createElement(Circle, { size: 17 }),
      section: dashboardNavSection(entry.entry.section),
      requiredServices: entry.entry.required_services || [],
      order: entry.entry.order || index
    }))
    .sort((left, right) => left.order - right.order || left.label.localeCompare(right.label));
}

export function indexServiceStatus(response: DashboardServiceStatusResponse | null): ServiceStatusMap {
  return Object.fromEntries((response?.services || []).map((service) => [service.name, service]));
}

function dashboardNavSection(section: DashboardNavSection | undefined): 'main' | 'infrastructure' | 'lab' {
  if (section === DashboardNavSection.DASHBOARD_NAV_SECTION_LAB) return 'lab';
  if (section === DashboardNavSection.DASHBOARD_NAV_SECTION_INFRASTRUCTURE) return 'infrastructure';
  return 'main';
}
