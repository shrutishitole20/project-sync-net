import { useEffect } from 'react';
import { useHotkeys } from 'react-hotkeys-hook';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

interface KeyboardShortcutsProps {
  onNewTask?: () => void;
  onNewProject?: () => void;
  onSearch?: () => void;
  onRefresh?: () => void;
}

export function KeyboardShortcuts({ 
  onNewTask, 
  onNewProject, 
  onSearch, 
  onRefresh 
}: KeyboardShortcutsProps) {
  const navigate = useNavigate();

  // Navigation shortcuts
  useHotkeys('ctrl+d, cmd+d', () => {
    navigate('/dashboard');
    toast.success('Navigated to Dashboard');
  }, { preventDefault: true });

  useHotkeys('ctrl+p, cmd+p', () => {
    navigate('/projects');
    toast.success('Navigated to Projects');
  }, { preventDefault: true });

  useHotkeys('ctrl+t, cmd+t', () => {
    navigate('/tasks');
    toast.success('Navigated to Tasks');
  }, { preventDefault: true });

  useHotkeys('ctrl+u, cmd+u', () => {
    navigate('/team');
    toast.success('Navigated to Team');
  }, { preventDefault: true });

  useHotkeys('ctrl+a, cmd+a', () => {
    navigate('/analytics');
    toast.success('Navigated to Analytics');
  }, { preventDefault: true });

  useHotkeys('ctrl+n, cmd+n', () => {
    navigate('/notifications');
    toast.success('Navigated to Notifications');
  }, { preventDefault: true });

  // Action shortcuts
  useHotkeys('ctrl+shift+t, cmd+shift+t', () => {
    if (onNewTask) {
      onNewTask();
      toast.success('New Task dialog opened');
    }
  }, { preventDefault: true });

  useHotkeys('ctrl+shift+p, cmd+shift+p', () => {
    if (onNewProject) {
      onNewProject();
      toast.success('New Project dialog opened');
    }
  }, { preventDefault: true });

  useHotkeys('ctrl+k, cmd+k', () => {
    if (onSearch) {
      onSearch();
      toast.success('Search opened');
    }
  }, { preventDefault: true });

  useHotkeys('ctrl+r, cmd+r', () => {
    if (onRefresh) {
      onRefresh();
      toast.success('Data refreshed');
    }
  }, { preventDefault: true });

  // Global shortcuts
  useHotkeys('ctrl+/, cmd+/', () => {
    showShortcutsHelp();
  }, { preventDefault: true });

  const showShortcutsHelp = () => {
    toast.info(
      <div className="space-y-2 text-sm">
        <div className="font-semibold">Keyboard Shortcuts:</div>
        <div>Ctrl/Cmd + D - Dashboard</div>
        <div>Ctrl/Cmd + P - Projects</div>
        <div>Ctrl/Cmd + T - Tasks</div>
        <div>Ctrl/Cmd + U - Team</div>
        <div>Ctrl/Cmd + A - Analytics</div>
        <div>Ctrl/Cmd + N - Notifications</div>
        <div>Ctrl/Cmd + Shift + T - New Task</div>
        <div>Ctrl/Cmd + Shift + P - New Project</div>
        <div>Ctrl/Cmd + K - Search</div>
        <div>Ctrl/Cmd + R - Refresh</div>
        <div>Ctrl/Cmd + / - Show this help</div>
      </div>,
      { duration: 8000 }
    );
  };

  return null; // This component doesn't render anything
}

// Hook for using keyboard shortcuts in components
export function useKeyboardShortcuts() {
  const navigate = useNavigate();

  const shortcuts = {
    // Navigation
    dashboard: () => navigate('/dashboard'),
    projects: () => navigate('/projects'),
    tasks: () => navigate('/tasks'),
    team: () => navigate('/team'),
    analytics: () => navigate('/analytics'),
    notifications: () => navigate('/notifications'),
    
    // Common actions
    refresh: () => window.location.reload(),
    search: () => {
      // Focus search input if available
      const searchInput = document.querySelector('input[placeholder*="search" i]') as HTMLInputElement;
      if (searchInput) {
        searchInput.focus();
      }
    },
  };

  return shortcuts;
}
