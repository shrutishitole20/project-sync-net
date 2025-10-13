import { useEffect, useMemo, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { Bot, Send, MessageCircle, X } from 'lucide-react';
import type { Enums, Tables } from '@/integrations/supabase/types';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  ts: number;
}

const helpText = `I can help with:
• list projects
• create project <title> [due YYYY-MM-DD]
• set status <project title> to <planning|active|on_hold|completed>
• set progress <project title> to <0-100>
�� overdue tasks
• help`;

export function Chatbot() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [lastRequest, setLastRequest] = useState<number>(0);
  const [messages, setMessages] = useState<ChatMessage[]>([{
    id: 'welcome', role: 'assistant', ts: Date.now(),
    content: 'Hi! Ask me about your projects and tasks. Type "help" to see commands.'
  }]);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  const envReady = useMemo(() => Boolean(import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY), []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, open]);

  const append = (role: ChatMessage['role'], content: string) =>
    setMessages((m) => [...m, { id: Math.random().toString(36).slice(2), role, content, ts: Date.now() }]);

  const parseCreate = (text: string) => {
    // create project Title due 2025-01-31
    const dueMatch = text.match(/due\s+(\d{4}-\d{2}-\d{2})/i);
    const title = text
      .replace(/^create\s+project\s+/i, '')
      .replace(/\s+due\s+\d{4}-\d{2}-\d{2}.*/i, '')
      .trim();
    const deadline = dueMatch ? new Date(dueMatch[1]).toISOString() : null;
    return { title, deadline };
  };

  const handleListProjects = async () => {
    const { data, error } = await supabase.from('projects').select('*').order('updated_at', { ascending: false }).limit(10);
    if (error) throw error;
    if (!data || data.length === 0) return 'You have no projects yet.';
    const lines = data.map((p) => `• ${p.title} (${p.status}) – ${p.progress}%${p.deadline ? `, due ${new Date(p.deadline).toLocaleDateString()}` : ''}`);
    return lines.join('\n');
  };

  const handleCreateProject = async (title: string, deadline: string | null) => {
    if (!title) return 'Please provide a project title.';
    const payload: Partial<Tables<'projects'>> = {
      title,
      description: null,
      deadline: deadline,
      manager_id: user?.id ?? null,
      progress: 0,
      status: 'planning' as Enums<'project_status'>,
    };
    const { error } = await supabase.from('projects').insert(payload);
    if (error) throw error;
    return `Created project "${title}"${deadline ? ` (due ${new Date(deadline).toLocaleDateString()})` : ''}.`;
  };

  // Security: Escape wildcards in user input to prevent filter injection
  const escapeWildcards = (input: string): string => {
    return input.replace(/[%_]/g, '\\$&');
  };

  const handleSetStatus = async (title: string, status: Enums<'project_status'>) => {
    const sanitizedTitle = escapeWildcards(title.trim());
    
    // Validate title length
    if (sanitizedTitle.length === 0 || sanitizedTitle.length > 200) {
      return 'Project title must be between 1 and 200 characters.';
    }
    
    const { error, count } = await supabase
      .from('projects')
      .update({ status })
      .ilike('title', sanitizedTitle)
      .select('*', { count: 'exact' });
    
    if (error) throw error;
    if (!count) return `No project found matching "${sanitizedTitle}".`;
    
    // Warn if multiple matches
    if (count > 1) {
      return `Warning: Updated ${count} projects matching "${sanitizedTitle}". Consider using more specific titles.`;
    }
    
    return `Updated status of ${count} project(s) to ${status}.`;
  };

  const handleSetProgress = async (title: string, progress: number) => {
    const sanitizedTitle = escapeWildcards(title.trim());
    
    // Validate title length
    if (sanitizedTitle.length === 0 || sanitizedTitle.length > 200) {
      return 'Project title must be between 1 and 200 characters.';
    }
    
    const clamped = Math.max(0, Math.min(100, Math.round(progress)));
    const { error, count } = await supabase
      .from('projects')
      .update({ progress: clamped })
      .ilike('title', sanitizedTitle)
      .select('*', { count: 'exact' });
    
    if (error) throw error;
    if (!count) return `No project found matching "${sanitizedTitle}".`;
    
    // Warn if multiple matches
    if (count > 1) {
      return `Warning: Updated ${count} projects matching "${sanitizedTitle}". Consider using more specific titles.`;
    }
    
    return `Updated progress of ${count} project(s) to ${clamped}%.`;
  };

  const handleOverdueTasks = async () => {
    const { data, error } = await supabase
      .from('tasks')
      .select('title, due_date, status')
      .neq('status', 'done')
      .lt('due_date', new Date().toISOString())
      .order('due_date', { ascending: true })
      .limit(10);
    if (error) throw error;
    if (!data || data.length === 0) return 'No overdue tasks. Great job!';
    return data.map((t) => `• ${t.title} – due ${t.due_date ? new Date(t.due_date).toLocaleDateString() : 'unknown'} (${t.status})`).join('\n');
  };

  const process = async (text: string) => {
    const q = text.trim();
    
    // Security: Validate input length
    if (!q) return 'Please type something.';
    if (q.length > 500) return 'Message too long. Please keep messages under 500 characters.';
    
    if (!user) return 'Please sign in to use the assistant.';
    if (!envReady) return 'Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY.';

    const lower = q.toLowerCase();
    if (lower === 'help') return helpText;
    if (lower.startsWith('list projects')) return await handleListProjects();
    if (lower.startsWith('create project')) {
      const { title, deadline } = parseCreate(q);
      return await handleCreateProject(title, deadline);
    }
    if (lower.startsWith('set status')) {
      // set status <project> to <status>
      const m = q.match(/^set\s+status\s+(.+)\s+to\s+(planning|active|on_hold|completed)$/i);
      if (!m) return 'Try: set status <project title> to <planning|active|on_hold|completed>';
      return await handleSetStatus(m[1].trim(), m[2].toLowerCase() as Enums<'project_status'>);
    }
    if (lower.startsWith('set progress')) {
      // set progress <project> to 75
      const m = q.match(/^set\s+progress\s+(.+)\s+to\s+(\d{1,3})%?$/i);
      if (!m) return 'Try: set progress <project title> to <0-100>'; 
      return await handleSetProgress(m[1].trim(), Number(m[2]));
    }
    if (lower.includes('overdue') && lower.includes('tasks')) return await handleOverdueTasks();

    return `I didn't understand.\n${helpText}`;
  };

  const onSend = async () => {
    const text = input;
    if (!text.trim() || busy) return;
    
    // Security: Rate limiting - prevent spam/abuse
    const now = Date.now();
    if (now - lastRequest < 1000) {
      toast.error('Please wait before sending another message');
      return;
    }
    setLastRequest(now);
    
    append('user', text);
    setInput('');
    setBusy(true);
    try {
      const reply = await process(text);
      append('assistant', reply);
    } catch (e: any) {
      toast.error(e.message || 'Something went wrong');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {!open ? (
        <Button size="lg" className="shadow-primary" onClick={() => setOpen(true)}>
          <MessageCircle className="mr-2 h-5 w-5" /> Ask TeamSync
        </Button>
      ) : (
        <Card className="w-[340px] sm:w-[380px] shadow-lg">
          <CardHeader className="py-3 px-4 flex flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <Bot className="h-5 w-5 text-primary" />
              <CardTitle className="text-base">TeamSync Assistant</CardTitle>
            </div>
            <Button variant="ghost" size="icon" onClick={() => setOpen(false)}>
              <X className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent className="px-0 pt-0">
            <ScrollArea className="h-64 px-4">
              <div className="space-y-3 py-3">
                {messages.map((m) => (
                  <div key={m.id} className={m.role === 'user' ? 'text-right' : 'text-left'}>
                    <div className={`inline-block rounded-lg px-3 py-2 text-sm ${m.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-secondary'}`}>
                      {m.content}
                    </div>
                  </div>
                ))}
                <div ref={bottomRef} />
              </div>
            </ScrollArea>
            <div className="flex items-center gap-2 p-3 border-t">
              <Input
                placeholder='Type a message…'
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') onSend(); }}
                disabled={busy}
              />
              <Button onClick={onSend} disabled={busy}>
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
