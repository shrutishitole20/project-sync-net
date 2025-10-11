import { DashboardLayout } from '@/components/layout/DashboardLayout';

export default function Projects() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Projects</h1>
          <p className="text-muted-foreground">
            Manage and track all your projects
          </p>
        </div>
        <div className="text-muted-foreground">
          Project management features coming soon...
        </div>
      </div>
    </DashboardLayout>
  );
}
