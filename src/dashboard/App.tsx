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
    if (navItems.length === 0) {
      return;
    }
    if (!activeView || !navItems.some((item) => item.key === activeView)) {
      setActiveView(navItems[0].key);
    }
  }, [activeView, navItems]);

  return (
    <div className="shell">
      <SidebarProvider open={!sidebarCollapsed} onOpenChange={(open) => setSidebarCollapsed(!open)}>
        <DashboardShellSidebar items={sidebarItems} activeKey={activeView} onSelect={setActiveView} />
        <SidebarInset className="contentPane">
          <DashboardContent activeView={activeView} loading={modulesQuery.isLoading} views={views} />
        </SidebarInset>
      </SidebarProvider>
    </div>
  );
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
