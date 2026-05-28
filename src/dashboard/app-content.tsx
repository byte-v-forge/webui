import { PanelNotice, WorkspacePanel } from '@byte-v-forge/common-ui';
import type { DashboardModuleViews } from './module-registry';

export function DashboardContent({ activeView, loading, views }: {
  activeView: string;
  loading: boolean;
  views: DashboardModuleViews;
}) {
  if (loading) {
    return <Notice kind="info" title="正在加载模块" text="正在加载各服务发布的微前端模块。" />;
  }
  if (!activeView) {
    return <Notice kind="error" title="没有可用模块" text="未加载到任何前端模块，请检查 Traefik 路由和 remoteEntry 配置。" />;
  }
  const View = views[activeView];

  return <>{View ? <View activeView={activeView} /> : <MissingView activeView={activeView} />}</>;
}

function MissingView({ activeView }: { activeView: string }) {
  return (
    <Notice kind="error" title="页面未注册" text={`未找到 ${activeView} 对应的前端模块。`} />
  );
}

function Notice({ kind, title, text }: { kind: 'info' | 'error'; title: string; text: string }) {
  return (
    <WorkspacePanel workspaceClassName="">
      <PanelNotice kind={kind} title={title} text={text} />
    </WorkspacePanel>
  );
}
