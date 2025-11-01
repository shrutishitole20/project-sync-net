import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Play, Pause, Square, Clock, DollarSign, Calendar, User } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';

interface TimeTrackerProps {
  taskId: string;
  taskTitle: string;
}

interface TimeEntry {
  id: string;
  description: string;
  start_time: string;
  end_time: string | null;
  duration_minutes: number | null;
  user_id: string;
  profiles?: {
    full_name: string;
  };
}

export function TimeTracker({ taskId, taskTitle }: TimeTrackerProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isRunning, setIsRunning] = useState(false);
  const [currentEntry, setCurrentEntry] = useState<any>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [description, setDescription] = useState('');
  const [showDialog, setShowDialog] = useState(false);

  const { data: timeEntries, refetch } = useQuery({
    queryKey: ['time-entries', taskId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('time_entries')
        .select('*')
        .eq('task_id', taskId)
        .order('start_time', { ascending: false });

      if (error) throw error;
      
      // Fetch profiles separately
      const userIds = [...new Set(data.map(e => e.user_id))];
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('id, full_name')
        .in('id', userIds);
      
      const profilesMap = new Map(profilesData?.map(p => [p.id, p]));
      
      return data.map(entry => ({
        ...entry,
        profiles: profilesMap.get(entry.user_id) ? {
          full_name: profilesMap.get(entry.user_id)!.full_name
        } : undefined
      })) as TimeEntry[];
    },
  });

  const { data: activeEntry } = useQuery({
    queryKey: ['active-time-entry', taskId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('time_entries')
        .select('*')
        .eq('task_id', taskId)
        .eq('user_id', user?.id)
        .is('end_time', null)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },
  });

  useEffect(() => {
    if (activeEntry) {
      setIsRunning(true);
      setCurrentEntry(activeEntry);
      setDescription(activeEntry.description || '');
    } else {
      setIsRunning(false);
      setCurrentEntry(null);
    }
  }, [activeEntry]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isRunning && currentEntry) {
      interval = setInterval(() => {
        const startTime = new Date(currentEntry.start_time).getTime();
        const now = Date.now();
        setElapsedTime(Math.floor((now - startTime) / 1000));
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, currentEntry]);

  const startTimer = async () => {
    if (!description.trim()) {
      toast.error('Please enter a description');
      return;
    }

    const { data, error } = await supabase
      .from('time_entries')
      .insert({
        task_id: taskId,
        user_id: user?.id!,
        description: description.trim(),
        start_time: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      toast.error('Failed to start timer');
      return;
    }

    setCurrentEntry(data);
    setIsRunning(true);
    setElapsedTime(0);
    toast.success('Timer started');
    refetch();
  };

  const stopTimer = async () => {
    if (!currentEntry) return;

    const { error } = await supabase
      .from('time_entries')
      .update({
        end_time: new Date().toISOString(),
      })
      .eq('id', currentEntry.id);

    if (error) {
      toast.error('Failed to stop timer');
      return;
    }

    setIsRunning(false);
    setCurrentEntry(null);
    setElapsedTime(0);
    setDescription('');
    toast.success('Timer stopped');
    refetch();
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = Math.floor(minutes % 60);
    
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const totalTime = timeEntries?.reduce((total, entry) => {
    return total + (entry.duration_minutes || 0);
  }, 0) || 0;

  const totalBillableTime = totalTime; // All time is billable by default

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Time Tracking
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Timer Controls */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What are you working on?"
                disabled={isRunning}
              />
            </div>
            
            <div className="flex items-center gap-3">
              {!isRunning ? (
                <Button onClick={startTimer} disabled={!description.trim()}>
                  <Play className="h-4 w-4 mr-2" />
                  Start Timer
                </Button>
              ) : (
                <Button onClick={stopTimer} variant="destructive">
                  <Square className="h-4 w-4 mr-2" />
                  Stop Timer
                </Button>
              )}
              
              {isRunning && (
                <div className="text-2xl font-mono font-bold text-primary">
                  {formatTime(elapsedTime)}
                </div>
              )}
            </div>
          </div>

          {/* Time Summary */}
          <div className="grid grid-cols-2 gap-4 pt-4 border-t">
            <div className="text-center">
              <div className="text-2xl font-bold">{formatDuration(totalTime)}</div>
              <div className="text-sm text-muted-foreground">Total Time</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{formatDuration(totalBillableTime)}</div>
              <div className="text-sm text-muted-foreground">Billable Time</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Time Entries */}
      <Card>
        <CardHeader>
          <CardTitle>Time Entries</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-64">
            <div className="space-y-3">
              {timeEntries?.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No time entries yet
                </div>
              ) : (
                timeEntries?.map((entry) => (
                  <div key={entry.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{entry.description}</p>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                        <div className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {entry.profiles?.full_name}
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {format(new Date(entry.start_time), 'MMM dd, yyyy')}
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {format(new Date(entry.start_time), 'HH:mm')}
                          {entry.end_time && ` - ${format(new Date(entry.end_time), 'HH:mm')}`}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold">
                        {entry.duration_minutes ? formatDuration(entry.duration_minutes) : 'Running...'}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
