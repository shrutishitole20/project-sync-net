import { DashboardLayout } from '@/components/layout/DashboardLayout';

export default function Notifications() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Notifications</h1>
          <p className="text-muted-foreground">
            Stay updated with project activities
          </p>
        </div>
        <div className="text-muted-foreground">
          Notifications coming soon...
        </div>
      </div>
    </DashboardLayout>
  );
}
