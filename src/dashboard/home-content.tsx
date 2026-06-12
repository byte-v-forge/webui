import { ExternalLink, Home } from 'lucide-react';
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  DashboardServiceStatusState,
  WorkspacePanel
} from '@byte-v-forge/common-ui';
import { dashboardNavIcon } from './nav-icons';
import type { DashboardExternalApp, ServiceStatusMap } from './module-registry';

export function DashboardHome({ externalApps, serviceStatus }: { externalApps: DashboardExternalApp[]; serviceStatus: ServiceStatusMap }) {
  return (
    <WorkspacePanel workspaceClassName="">
      <div className="p-6">
        <div className="mb-5 flex items-center gap-2">
          <Home className="size-5" />
          <div>
            <h1 className="text-lg font-semibold">首页</h1>
            <p className="text-sm text-muted-foreground">常用独立应用入口</p>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {externalApps.map((app) => (
            <ExternalAppCard key={app.id} app={app} serviceStatus={serviceStatus} />
          ))}
        </div>
      </div>
    </WorkspacePanel>
  );
}

function ExternalAppCard({ app, serviceStatus }: { app: DashboardExternalApp; serviceStatus: ServiceStatusMap }) {
  const hasStatus = Object.keys(serviceStatus).length > 0;
  const disabled = app.requiredServices.some((service) => {
    const status = serviceStatus[service]?.status;
    return hasStatus && (!status || status !== DashboardServiceStatusState.DASHBOARD_SERVICE_AVAILABLE);
  });
  return (
    <Card className="min-h-40">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {dashboardNavIcon(app.icon)}
          {app.label}
        </CardTitle>
        {app.description && <CardDescription>{app.description}</CardDescription>}
      </CardHeader>
      <CardContent className="flex items-center justify-between gap-3">
        <ServiceBadge disabled={disabled} />
        {disabled ? (
          <Button size="sm" variant="outline" aria-label={`${app.label}服务不可用`} disabled>
            <ExternalLink className="size-4" />
            <span>不可用</span>
          </Button>
        ) : (
          <Button asChild size="sm" variant="outline" aria-label={`打开${app.label}`}>
            <a href={app.href} target="_blank" rel="noreferrer">
              <ExternalLink className="size-4" />
              <span>打开</span>
            </a>
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

function ServiceBadge({ disabled }: { disabled: boolean }) {
  return <Badge variant={disabled ? 'destructive' : 'secondary'}>{disabled ? '服务不可用' : '可用'}</Badge>;
}
