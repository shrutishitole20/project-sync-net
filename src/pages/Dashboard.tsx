import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import { FolderKanban, CheckSquare, Clock, TrendingUp } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { Pie, PieChart, Cell, BarChart, Bar, XAxis, ResponsiveContainer, Tooltip } from 'recharts';

export default function Dashboard() {
  const { user } = useAuth();
  const { roles, isAdmin, isManager } = useUserRole(user?.id);
  const [stats, setStats] = useState({
    totalProjects: 0,
    activeTasks: 0,
    completedTasks: 0,
    overdueTasks: 0,
  });

  const envReady = useMemo(() => Boolean(import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY), []);

  const { data: tasks = [] } = useQuery({
    queryKey: ['tasks-all'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tasks')
        .select('id, title, status, due_date, assigned_to, project_id, updated_at')
        .order('updated_at', { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
    enabled: envReady && !!user,
  });

  const { data: projects = [] } = useQuery({
    queryKey: ['projects-all'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('projects')
        .select('id, title, progress, status, updated_at')
        .order('updated_at', { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
    enabled: envReady && !!user,
  });

  const { data: activity = [] } = useQuery({
    queryKey: ['activity-comments'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('task_comments')
        .select('content, created_at, profiles(full_name)')
        .order('created_at', { ascending: false })
        .limit(8);
      if (error) throw error;
      return data ?? [];
    },
    enabled: envReady && !!user,
  });

  useEffect(() => {
    const fetchStats = async () => {
      if (!user) return;

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

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Task Distribution</CardTitle>
            <CardDescription>Breakdown of tasks by status</CardDescription>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                {(() => {
                  const statusCounts = ['todo','in_progress','review','done'].map((k) => ({ key: k, value: (tasks as any[]).filter((t) => t.status === k).length }));
                  const COLORS = ['#60a5fa', '#34d399', '#f59e0b', '#22c55e'];
                  return (
                    <Pie dataKey="value" data={statusCounts} innerRadius={48} outerRadius={80} paddingAngle={2}>
                      {statusCounts.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                  );
                })()}
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Project Progress</CardTitle>
            <CardDescription>Top projects by completion</CardDescription>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={(projects as any[]).slice(0,6).map((p) => ({ name: p.title, progress: p.progress }))} layout="vertical" margin={{ left: 20 }}>
                <XAxis type="number" domain={[0, 100]} hide />
                <Tooltip />
                <Bar dataKey="progress" fill="#60a5fa" radius={6} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Deadlines</CardTitle>
            <CardDescription>Next due tasks</CardDescription>
          </CardHeader>
          <CardContent>
            {(() => {
              const upcoming = (tasks as any[])
                .filter((t) => t.status !== 'done' && t.due_date && new Date(t.due_date) >= new Date())
                .sort((a, b) => new Date(a.due_date!).getTime() - new Date(b.due_date!).getTime())
                .slice(0, 5);
              return upcoming.length === 0 ? (
                <div className="text-sm text-muted-foreground">No upcoming tasks.</div>
              ) : (
                <ul className="space-y-2 text-sm">
                  {upcoming.map((t) => (
                    <li key={t.id} className="flex items-center justify-between">
                      <span className="truncate mr-2">{t.title}</span>
                      <span className="text-muted-foreground">{new Date(t.due_date).toLocaleDateString()}</span>
                    </li>
                  ))}
                </ul>
              );
            })()}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Team Activity</CardTitle>
            <CardDescription>Recent comments and updates</CardDescription>
          </CardHeader>
          <CardContent>
            {(activity as any[]).length === 0 ? (
              <div className="text-sm text-muted-foreground">No recent activity.</div>
            ) : (
              <ul className="space-y-3 text-sm">
                {(activity as any[]).map((a, i) => (
                  <li key={`${a.created_at}-${i}`}>
                    <div className="font-medium">{a.profiles?.full_name ?? 'Someone'}</div>
                    <div className="text-muted-foreground">{a.content}</div>
                    <div className="text-xs text-muted-foreground">{new Date(a.created_at).toLocaleString()}</div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
