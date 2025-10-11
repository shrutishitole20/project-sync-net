import { DashboardLayout } from '@/components/layout/DashboardLayout';

export default function Tasks() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Tasks</h1>
          <p className="text-muted-foreground">
            Manage tasks across all projects
          </p>
        </div>
        <div className="text-muted-foreground">
          Task management and Kanban board coming soon...
        </div>
      </div>
    </DashboardLayout>
  );
}
