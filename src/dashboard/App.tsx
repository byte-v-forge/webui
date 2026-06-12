import { useEffect, useMemo, useState } from 'react';
import { ExternalLink, Home } from 'lucide-react';
import {
  DashboardServiceStatusState,
  DashboardShellSidebar,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  api,
  useQuery,
  type DashboardShellNavItem
} from '@byte-v-forge/common-ui';
import { DashboardContent } from './app-content';
import {
  DASHBOARD_HOME_VIEW_KEY,
  buildDashboardNavItems,
  createDashboardModuleViews,
  indexServiceStatus,
  loadDashboardExternalApps,
  loadDashboardModuleRegistrations,
  type DashboardNavItem,
  type DashboardServiceStatusResponse,
  type ServiceStatusMap
} from './module-registry';

const PROXY_RUNTIME_HOST_PREFIX = 'proxy-runtime.';

export default function App() {
  const modulesQuery = useQuery({
    queryKey: ['dashboard', 'modules'],
    queryFn: loadDashboardModuleRegistrations,
    staleTime: Number.POSITIVE_INFINITY,
    retry: 1
  });
  const registrations = modulesQuery.data || [];
  const externalApps = useMemo(() => loadDashboardExternalApps(), []);
  const moduleNavItems = useMemo(() => buildDashboardNavItems(registrations), [registrations]);
  const homeNavItem = useMemo<DashboardNavItem>(() => ({
    key: DASHBOARD_HOME_VIEW_KEY,
    moduleId: DASHBOARD_HOME_VIEW_KEY,
    label: '首页',
    icon: <Home size={17} />,
    section: 'main',
    requiredServices: [],
    order: 0
  }), []);
  const navItems = useMemo(() => [homeNavItem, ...moduleNavItems], [homeNavItem, moduleNavItems]);
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
    const selected = viewFromPath(location.pathname, navItems);
    if (selected) {
      if (activeView !== selected.key) setActiveView(selected.key);
      return;
    }
    if (modulesQuery.isLoading) return;

    const fallback = navItems[0];
    if (!activeView || !navItems.some((item) => item.key === activeView)) setActiveView(fallback.key);
    history.replaceState(null, '', pathForView(fallback));
  }, [activeView, modulesQuery.isLoading, navItems]);

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
        <DashboardShellSidebar items={sidebarItems} activeKey={activeView} onSelect={selectView} footerActions={<MihomoPanelSidebarAction />} />
        <SidebarInset className="contentPane">
          <DashboardContent
            activeView={activeView}
            externalApps={externalApps}
            loading={modulesQuery.isLoading}
            serviceStatus={serviceStatus}
            views={views}
          />
        </SidebarInset>
      </SidebarProvider>
    </div>
  );
}

function MihomoPanelSidebarAction() {
  const mihomoPanelURL = useMemo(() => resolveMihomoPanelURL(), []);
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton asChild size="lg" tooltip="Mihomo 面板" aria-label="Mihomo 面板" className="justify-center">
          <a href={mihomoPanelURL}>
            <ExternalLink className="size-4" />
            <span className="sr-only">Mihomo 面板</span>
          </a>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}

function resolveMihomoPanelURL() {
  const { protocol, hostname, port } = window.location;
  const host = hostname.startsWith(PROXY_RUNTIME_HOST_PREFIX) ? hostname : `${PROXY_RUNTIME_HOST_PREFIX}${hostname}`;
  return `${protocol}//${host}${port ? `:${port}` : ''}/`;
}

function pathForView(item: DashboardNavItem) {
  if (item.key === DASHBOARD_HOME_VIEW_KEY) return '/';
  const moduleId = encodePathSegment(item.moduleId);
  const key = encodePathSegment(item.key);
  return item.moduleId === item.key ? `/${moduleId}` : `/${moduleId}/${key}`;
}

function viewFromPath(pathname: string, items: DashboardNavItem[]) {
  const segments = pathname.split('/').filter(Boolean).map(decodeURIComponent);
  if (segments.length === 0) return items.find((item) => item.key === DASHBOARD_HOME_VIEW_KEY);
  const [moduleId = '', key = ''] = segments;
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
