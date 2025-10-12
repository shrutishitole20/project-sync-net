<<<<<<< HEAD
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
=======
import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Plus, Calendar, CheckSquare, Square, Trash2, Edit } from 'lucide-react';
import type { Enums, Tables } from '@/integrations/supabase/types';

const statusColumns = [
  { id: 'todo', title: 'To Do' },
  { id: 'in_progress', title: 'In Progress' },
  { id: 'review', title: 'Review' },
  { id: 'done', title: 'Done' },
] as const;

const priorityColors: Record<string, string> = {
  low: 'bg-gray-100 text-gray-800',
  medium: 'bg-blue-100 text-blue-800',
  high: 'bg-orange-100 text-orange-800',
  urgent: 'bg-red-100 text-red-800',
};

export default function Tasks() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<Enums<'task_priority'>>('medium');
  const [dueDate, setDueDate] = useState('');
  const [assignedTo, setAssignedTo] = useState('');
  const [selectedTasks, setSelectedTasks] = useState<Set<string>>(new Set());

  const { data: projects } = useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      const { data, error } = await supabase.from('projects').select('*').order('title');
      if (error) throw error;
      return data as Tables<'projects'>[];
    },
  });

  const { data: tasks, isLoading, refetch } = useQuery({
    queryKey: ['tasks'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tasks')
        .select(`
          *,
          projects:project_id(title),
          assignee:assigned_to(full_name, avatar_url),
          creator:created_by(full_name, avatar_url)
        `)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const { data: profiles } = useQuery({
    queryKey: ['profiles'],
    queryFn: async () => {
      const { data, error } = await supabase.from('profiles').select('*').order('full_name');
      if (error) throw error;
      return data as Tables<'profiles'>[];
    },
  });

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setPriority('medium');
    setDueDate('');
    setAssignedTo('');
    setSelectedProject('');
  };

  const createTask = async () => {
    if (!title.trim() || !selectedProject) {
      toast.error('Title and project are required');
      return;
    }

    const payload = {
      title: title.trim(),
      description: description.trim() || null,
      project_id: selectedProject,
      priority,
      due_date: dueDate ? new Date(dueDate).toISOString() : null,
      assigned_to: assignedTo || null,
      created_by: user?.id!,
      status: 'todo' as Enums<'task_status'>,
    };

    const { error } = await supabase.from('tasks').insert(payload);
    if (error) return toast.error(error.message);

    toast.success('Task created');
    setOpen(false);
    resetForm();
    refetch();
  };

  const toggleTaskSelection = (taskId: string) => {
    const next = new Set(selectedTasks);
    if (next.has(taskId)) next.delete(taskId); else next.add(taskId);
    setSelectedTasks(next);
  };

  const selectAllTasks = () => {
    setSelectedTasks(new Set((tasks || []).map((t: any) => t.id)));
  };

  const clearSelection = () => setSelectedTasks(new Set());

  const bulkUpdateStatus = async (newStatus: Enums<'task_status'>) => {
    if (selectedTasks.size === 0) return;
    const { error } = await supabase.from('tasks').update({ status: newStatus }).in('id', Array.from(selectedTasks));
    if (error) return toast.error('Failed to update tasks');
    toast.success(`Updated ${selectedTasks.size} task(s)`);
    clearSelection();
    refetch();
  };

  const bulkDeleteTasks = async () => {
    if (selectedTasks.size === 0) return;
    const { error } = await supabase.from('tasks').delete().in('id', Array.from(selectedTasks));
    if (error) return toast.error('Failed to delete tasks');
    toast.success(`Deleted ${selectedTasks.size} task(s)`);
    clearSelection();
    refetch();
  };

  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString();
  const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('').toUpperCase();
  const getTasksByStatus = (status: Enums<'task_status'>) => (tasks || []).filter((t: any) => t.status === status);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Tasks</h1>
            <p className="text-muted-foreground">Manage tasks across all projects</p>
          </div>
          <div className="flex gap-2">
            {selectedTasks.size > 0 && (
              <div className="flex items-center gap-2">
                <Badge variant="secondary">{selectedTasks.size} selected</Badge>
                <Button variant="outline" size="sm" onClick={() => bulkUpdateStatus('in_progress')}>
                  <Edit className="h-4 w-4 mr-2" /> Mark In Progress
                </Button>
                <Button variant="outline" size="sm" onClick={() => bulkUpdateStatus('done')}>
                  <CheckSquare className="h-4 w-4 mr-2" /> Mark Done
                </Button>
                <Button variant="outline" size="sm" onClick={bulkDeleteTasks} className="text-red-600 hover:text-red-700">
                  <Trash2 className="h-4 w-4 mr-2" /> Delete
                </Button>
                <Button variant="ghost" size="sm" onClick={clearSelection}>Clear</Button>
              </div>
            )}
            <Button variant="outline" onClick={selectedTasks.size === (tasks?.length || 0) ? clearSelection : selectAllTasks}>
              {selectedTasks.size === (tasks?.length || 0) ? (
                <>
                  <Square className="mr-2 h-4 w-4" /> Deselect All
                </>
              ) : (
                <>
                  <CheckSquare className="mr-2 h-4 w-4" /> Select All
                </>
              )}
            </Button>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" /> New Task
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Create New Task</DialogTitle>
                  <DialogDescription>Add a new task to your project</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Title</Label>
                    <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Task title" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Task description" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="project">Project</Label>
                    <Select value={selectedProject} onValueChange={setSelectedProject}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select project" />
                      </SelectTrigger>
                      <SelectContent>
                        {projects?.map((project) => (
                          <SelectItem key={project.id} value={project.id}>{project.title}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="priority">Priority</Label>
                      <Select value={priority} onValueChange={(v) => setPriority(v as Enums<'task_priority'>)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Low</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                          <SelectItem value="urgent">Urgent</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="dueDate">Due Date</Label>
                      <Input id="dueDate" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="assignee">Assign To</Label>
                    <Select value={assignedTo || 'unassigned'} onValueChange={(v) => setAssignedTo(v === 'unassigned' ? '' : v)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select assignee" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="unassigned">Unassigned</SelectItem>
                        {profiles?.map((profile) => (
                          <SelectItem key={profile.id} value={profile.id}>{profile.full_name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                  <Button onClick={createTask}>Create Task</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {isLoading ? (
          <div className="text-muted-foreground">Loading tasks...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {statusColumns.map((column) => {
              const columnTasks = getTasksByStatus(column.id as Enums<'task_status'>);
              return (
                <div key={column.id} className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-lg">{column.title}</h3>
                    <Badge variant="secondary" className="text-xs">{columnTasks.length}</Badge>
                  </div>
                  <div className="space-y-3 min-h-[200px] p-2 border-2 border-dashed border-transparent rounded-lg">
                    {columnTasks.map((task: any) => (
                      <Card key={task.id} className="cursor-pointer hover:shadow-md transition-shadow">
                        <CardContent className="p-4">
                          <div className="space-y-3">
                            <div className="flex items-start justify-between">
                              <h4 className="font-medium text-sm line-clamp-2">{task.title}</h4>
                              <Badge className={`text-xs ${priorityColors[task.priority]}`}>{task.priority}</Badge>
                            </div>
                            {task.description && (
                              <p className="text-xs text-muted-foreground line-clamp-2">{task.description}</p>
                            )}
                            <div className="flex items-center justify-between text-xs text-muted-foreground">
                              <div className="flex items-center gap-2">
                                {task.assignee && (
                                  <div className="flex items-center gap-1">
                                    <Avatar className="h-4 w-4">
                                      <AvatarImage src={task.assignee.avatar_url || ''} />
                                      <AvatarFallback className="text-xs">{getInitials(task.assignee.full_name)}</AvatarFallback>
                                    </Avatar>
                                    <span>{task.assignee.full_name}</span>
                                  </div>
                                )}
                              </div>
                              {task.due_date && (
                                <div className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  <span>{formatDate(task.due_date)}</span>
                                </div>
                              )}
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-muted-foreground">{(task.projects as any)?.title || 'Unknown Project'}</span>
                              <Button variant="ghost" size="sm" className="h-6 px-2" onClick={() => toggleTaskSelection(task.id)}>
                                {selectedTasks.has(task.id) ? <CheckSquare className="h-4 w-4 text-primary" /> : <Square className="h-4 w-4" />}
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                    {columnTasks.length === 0 && (
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-sm">No tasks</CardTitle>
                          <CardDescription>Drop or create tasks to get started</CardDescription>
                        </CardHeader>
                      </Card>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
>>>>>>> 1310239 (Added local VS Code project files)
      </div>
    </DashboardLayout>
  );
}
