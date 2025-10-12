import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import { FolderKanban, CheckSquare, Clock, TrendingUp } from 'lucide-react';

export default function Dashboard() {
  const { user } = useAuth();
  const { roles, isAdmin, isManager } = useUserRole(user?.id);
  const [stats, setStats] = useState({
    totalProjects: 0,
    activeTasks: 0,
    completedTasks: 0,
    overdueTasks: 0,
  });

  useEffect(() => {
    const fetchStats = async () => {
      if (!user) return;

<<<<<<< HEAD
      // Fetch projects
      const { count: projectCount } = await supabase
        .from('projects')
        .select('*', { count: 'exact', head: true });

      // Fetch tasks
      const { data: tasks } = await supabase
        .from('tasks')
        .select('status, due_date');

      const activeTasks = tasks?.filter(t => t.status !== 'done').length || 0;
      const completedTasks = tasks?.filter(t => t.status === 'done').length || 0;
      const overdueTasks = tasks?.filter(
        t => t.status !== 'done' && t.due_date && new Date(t.due_date) < new Date()
      ).length || 0;

      setStats({
        totalProjects: projectCount || 0,
        activeTasks,
        completedTasks,
        overdueTasks,
      });
=======
      try {
        // Fetch projects
        const { count: projectCount } = await supabase
          .from('projects')
          .select('*', { count: 'exact', head: true });

        // Fetch tasks with proper status filtering
        const { data: tasks } = await supabase
          .from('tasks')
          .select('status, due_date');

        const activeTasks = tasks?.filter(t => t.status !== 'done').length || 0;
        const completedTasks = tasks?.filter(t => t.status === 'done').length || 0;
        const overdueTasks = tasks?.filter(
          t => t.status !== 'done' && t.due_date && new Date(t.due_date) < new Date()
        ).length || 0;

        setStats({
          totalProjects: projectCount || 0,
          activeTasks,
          completedTasks,
          overdueTasks,
        });
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
      }
>>>>>>> 1310239 (Added local VS Code project files)
    };

    fetchStats();
  }, [user]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back! Here's what's happening with your projects.
        </p>
        {roles.length > 0 && (
          <div className="mt-2 flex gap-2">
            {roles.map(role => (
              <span
                key={role}
                className="inline-flex items-center rounded-full px-3 py-1 text-xs font-medium bg-primary/10 text-primary"
              >
                {role.replace('_', ' ')}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="hover:shadow-md transition-smooth">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
            <FolderKanban className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalProjects}</div>
            <p className="text-xs text-muted-foreground">
              {isAdmin || isManager ? 'All projects' : 'Your projects'}
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-smooth">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Tasks</CardTitle>
            <CheckSquare className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeTasks}</div>
            <p className="text-xs text-muted-foreground">
              Tasks in progress
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-smooth">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <TrendingUp className="h-4 w-4 text-secondary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completedTasks}</div>
            <p className="text-xs text-muted-foreground">
              Tasks finished
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-smooth">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue</CardTitle>
            <Clock className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.overdueTasks}</div>
            <p className="text-xs text-muted-foreground">
              Needs attention
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>
              Latest updates across your projects
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground">
              Activity feed coming soon...
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>
              Common tasks and shortcuts
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground">
              Quick actions coming soon...
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
