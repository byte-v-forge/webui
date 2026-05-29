import { useEffect, useMemo, useState } from 'react';
import {
  DashboardServiceStatusState,
  DashboardShellSidebar,
  SidebarInset,
  SidebarProvider,
  api,
  useQuery,
  type DashboardShellNavItem
} from '@byte-v-forge/common-ui';
import { DashboardContent } from './app-content';
import {
  buildDashboardNavItems,
  createDashboardModuleViews,
  indexServiceStatus,
  loadDashboardModuleRegistrations,
  type DashboardNavItem,
  type DashboardServiceStatusResponse,
  type ServiceStatusMap
} from './module-registry';

export default function App() {
  const modulesQuery = useQuery({
    queryKey: ['dashboard', 'modules'],
    queryFn: loadDashboardModuleRegistrations,
    staleTime: Number.POSITIVE_INFINITY,
    retry: 1
  });
  const registrations = modulesQuery.data || [];
  const navItems = useMemo(() => buildDashboardNavItems(registrations), [registrations]);
  const views = useMemo(() => createDashboardModuleViews(registrations), [registrations]);
  const [activeView, setActiveView] = useState('');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => localStorage.getItem('byte-v-forge-sidebar') === 'collapsed');
  const serviceStatusQuery = useQuery({
    queryKey: ['dashboard', 'service-status'],
    queryFn: () => api<DashboardServiceStatusResponse>('/api/service-status'),
    refetchInterval: 15000
  });
  const serviceStatus = useMemo<ServiceStatusMap>(() => indexServiceStatus(serviceStatusQuery.data || null), [serviceStatusQuery.data]);
  const sidebarItems = useMemo(() => buildSidebarItems(navItems, serviceStatus), [navItems, serviceStatus]);

  useEffect(() => {
    localStorage.setItem('byte-v-forge-sidebar', sidebarCollapsed ? 'collapsed' : 'expanded');
  }, [sidebarCollapsed]);

  useEffect(() => {
    if (navItems.length === 0) return;
    const selected = viewFromPath(location.pathname, navItems) || navItems[0];
    if (!activeView || !navItems.some((item) => item.key === activeView)) setActiveView(selected.key);
    if (!viewFromPath(location.pathname, navItems)) history.replaceState(null, '', pathForView(selected));
  }, [activeView, navItems]);

  useEffect(() => {
    const onPopState = () => {
      const selected = viewFromPath(location.pathname, navItems);
      if (selected) setActiveView(selected.key);
    };
    addEventListener('popstate', onPopState);
    return () => removeEventListener('popstate', onPopState);
  }, [navItems]);

  const selectView = (key: string) => {
    setActiveView(key);
    const item = navItems.find((candidate) => candidate.key === key);
    if (!item) return;
    const next = pathForView(item);
    if (location.pathname !== next) history.pushState(null, '', next);
  };

  return (
    <div className="shell">
      <SidebarProvider open={!sidebarCollapsed} onOpenChange={(open) => setSidebarCollapsed(!open)}>
        <DashboardShellSidebar items={sidebarItems} activeKey={activeView} onSelect={selectView} />
        <SidebarInset className="contentPane">
          <DashboardContent activeView={activeView} loading={modulesQuery.isLoading} views={views} />
        </SidebarInset>
      </SidebarProvider>
    </div>
  );
}

function pathForView(item: DashboardNavItem) {
  const moduleId = encodePathSegment(item.moduleId);
  const key = encodePathSegment(item.key);
  return item.moduleId === item.key ? `/${moduleId}` : `/${moduleId}/${key}`;
}

function viewFromPath(pathname: string, items: DashboardNavItem[]) {
  const [moduleId = '', key = ''] = pathname.split('/').filter(Boolean).map(decodeURIComponent);
  return items.find((item) => item.moduleId === moduleId && (!key || item.key === key))
    || items.find((item) => item.key === moduleId);
}

function encodePathSegment(value: string) {
  return encodeURIComponent(value).replaceAll('%2F', '');
}

function buildSidebarItems(items: DashboardNavItem[], serviceStatus: ServiceStatusMap): DashboardShellNavItem[] {
  const hasStatus = Object.keys(serviceStatus).length > 0;
  return items.map((item) => {
    const disabled = item.requiredServices.some((service) => {
      const status = serviceStatus[service]?.status;
      return hasStatus && (!status || status !== DashboardServiceStatusState.DASHBOARD_SERVICE_AVAILABLE);
    });
    const disabledReason = disabled
      ? item.requiredServices.map((service) => serviceStatus[service]?.message || `${service} 状态未知`).join('；')
      : undefined;
    return {
      key: item.key,
      label: item.label,
      icon: item.icon,
      section: item.section,
      disabled,
      disabledReason
    };
  });
}
