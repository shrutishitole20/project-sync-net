import { useEffect, useMemo, useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
<<<<<<< HEAD
import { Plus, RefreshCcw } from 'lucide-react';
=======
import { Plus, RefreshCcw, FileText } from 'lucide-react';
import { ProjectTemplateSelector } from '@/components/ProjectTemplateSelector';
>>>>>>> 1310239 (Added local VS Code project files)
import type { Enums, Tables } from '@/integrations/supabase/types';

const statusVariants: Record<Enums<'project_status'>, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  planning: { label: 'Planning', variant: 'secondary' },
  active: { label: 'Active', variant: 'default' },
  on_hold: { label: 'On Hold', variant: 'outline' },
  completed: { label: 'Completed', variant: 'secondary' },
};

export default function Projects() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [deadline, setDeadline] = useState<string>('');
  const [status, setStatus] = useState<Enums<'project_status'>>('planning');

  const envReady = useMemo(() => Boolean(import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY), []);

  const { data: projects, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('updated_at', { ascending: false });
      if (error) throw error;
      return data as Tables<'projects'>[];
    },
    enabled: envReady && !!user,
  });

  useEffect(() => {
    if (!envReady) return;
    const ch = supabase
      .channel('projects-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'projects' }, () => {
        queryClient.invalidateQueries({ queryKey: ['projects'] });
      })
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [queryClient, envReady]);

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setDeadline('');
    setStatus('planning');
  };

  const createProject = async () => {
    if (!title.trim()) {
      toast.error('Title is required');
      return;
    }
    const payload: Tables<'projects'> & { id?: string } = {
      title: title.trim(),
      description: description.trim() || null,
      deadline: deadline ? new Date(deadline).toISOString() : null,
      manager_id: user?.id ?? null,
      progress: 0,
      status: status,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      id: '' as any, // will be ignored by Supabase
    } as any;

    const { error } = await supabase.from('projects').insert({
      title: payload.title,
      description: payload.description,
      deadline: payload.deadline,
      manager_id: payload.manager_id,
      progress: payload.progress,
      status: payload.status,
    });
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success('Project created');
    setOpen(false);
    resetForm();
    refetch();
  };

<<<<<<< HEAD
=======
  const createProjectFromTemplate = async (template: any) => {
    try {
      // Create the project
      const { data: project, error: projectError } = await supabase
        .from('projects')
        .insert({
          title: template.name,
          description: template.description,
          manager_id: user?.id ?? null,
          progress: 0,
          status: 'planning',
        })
        .select()
        .single();

      if (projectError) {
        toast.error('Failed to create project');
        return;
      }

      // Create tasks from template
      if (template.tasks && template.tasks.length > 0) {
        const tasksToInsert = template.tasks.map((task: any) => ({
          project_id: project.id,
          title: task.title,
          description: task.description,
          priority: task.priority,
          status: 'todo',
          created_by: user?.id!,
        }));

        const { error: tasksError } = await supabase
          .from('tasks')
          .insert(tasksToInsert);

        if (tasksError) {
          toast.error('Project created but failed to add tasks');
          return;
        }
      }

      toast.success('Project created from template successfully');
      refetch();
    } catch (error) {
      toast.error('Failed to create project from template');
      console.error('Template project creation error:', error);
    }
  };

>>>>>>> 1310239 (Added local VS Code project files)
  const updateProject = async (id: string, updates: Partial<Tables<'projects'>>) => {
    const { error } = await supabase.from('projects').update(updates).eq('id', id);
    if (error) toast.error(error.message);
  };

  if (!envReady) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">Projects</h1>
            <p className="text-muted-foreground">Connect Supabase to manage projects.</p>
          </div>
          <Card>
            <CardHeader>
              <CardTitle>Supabase not configured</CardTitle>
              <CardDescription>
                Provide VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY, then refresh. Use Open MCP popover to connect Supabase.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Projects</h1>
            <p className="text-muted-foreground">Manage and track all your projects</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => refetch()} disabled={isFetching}>
              <RefreshCcw className={`mr-2 h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} /> Refresh
            </Button>
<<<<<<< HEAD
=======
            <ProjectTemplateSelector onTemplateSelect={createProjectFromTemplate}>
              <Button variant="outline">
                <FileText className="mr-2 h-4 w-4" /> From Template
              </Button>
            </ProjectTemplateSelector>
>>>>>>> 1310239 (Added local VS Code project files)
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" /> New Project
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>New Project</DialogTitle>
                  <DialogDescription>Create a project with basic details.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Title</Label>
                    <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Website Redesign" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="desc">Description</Label>
                    <Textarea id="desc" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Goals, scope, and outcomes" />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="deadline">Deadline</Label>
                      <Input id="deadline" type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>Status</Label>
                      <Select value={status} onValueChange={(v) => setStatus(v as Enums<'project_status'>)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="planning">Planning</SelectItem>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="on_hold">On Hold</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                  <Button onClick={createProject}>Create</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {isLoading ? (
          <div className="text-muted-foreground">Loading projects...</div>
        ) : !projects || projects.length === 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>No projects yet</CardTitle>
              <CardDescription>Click "New Project" to create your first project.</CardDescription>
            </CardHeader>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {projects.map((p) => (
              <Card key={p.id} className="hover:shadow-md transition-smooth">
                <CardHeader className="space-y-1">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{p.title}</CardTitle>
                    <Badge variant={statusVariants[p.status].variant}>{statusVariants[p.status].label}</Badge>
                  </div>
                  {p.description && (
                    <CardDescription className="line-clamp-2">{p.description}</CardDescription>
                  )}
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between text-sm mb-2">
                      <span>Progress</span>
                      <span className="text-muted-foreground">{p.progress}%</span>
                    </div>
                    <Progress value={p.progress} />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs">Status</Label>
                      <Select
                        defaultValue={p.status}
                        onValueChange={(v) => updateProject(p.id, { status: v as any })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="planning">Planning</SelectItem>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="on_hold">On Hold</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Progress</Label>
                      <Slider
                        defaultValue={[p.progress]}
                        max={100}
                        step={5}
                        onValueCommit={(val) => updateProject(p.id, { progress: val[0] })}
                      />
                    </div>
                  </div>

                  <div className="text-xs text-muted-foreground">
                    {p.deadline ? `Due ${new Date(p.deadline).toLocaleDateString()}` : 'No deadline'}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
