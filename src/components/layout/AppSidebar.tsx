import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  FolderKanban,
  CheckSquare,
  Bell,
<<<<<<< HEAD
=======
  Users,
  BarChart3,
  Search,
  MessageCircle,
>>>>>>> 1310239 (Added local VS Code project files)
  LogOut,
  Rocket,
} from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  useSidebar,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
<<<<<<< HEAD
import { useAuth } from '@/hooks/useAuth';
=======
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AdvancedSearch } from '@/components/AdvancedSearch';
import { TeamChat } from '@/components/TeamChat';
>>>>>>> 1310239 (Added local VS Code project files)

const navigation = [
  { title: 'Dashboard', url: '/dashboard', icon: LayoutDashboard },
  { title: 'Projects', url: '/projects', icon: FolderKanban },
  { title: 'Tasks', url: '/tasks', icon: CheckSquare },
<<<<<<< HEAD
=======
  { title: 'Team', url: '/team', icon: Users },
  { title: 'Analytics', url: '/analytics', icon: BarChart3 },
>>>>>>> 1310239 (Added local VS Code project files)
  { title: 'Notifications', url: '/notifications', icon: Bell },
];

export function AppSidebar() {
  const { state } = useSidebar();
<<<<<<< HEAD
  const { signOut } = useAuth();
  const collapsed = state === 'collapsed';

=======
  const { signOut, user } = useAuth();
  const collapsed = state === 'collapsed';

  const { data: unreadNotifications } = useQuery({
    queryKey: ['unread-notifications'],
    queryFn: async () => {
      const { count } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user?.id)
        .eq('read', false);
      return count || 0;
    },
    enabled: !!user,
    refetchInterval: 30000, // Refetch every 30 seconds
  });

>>>>>>> 1310239 (Added local VS Code project files)
  return (
    <Sidebar className={collapsed ? 'w-16' : 'w-64'} collapsible="icon">
      <SidebarContent>
        <div className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center shadow-primary">
              <Rocket className="w-5 h-5 text-white" />
            </div>
            {!collapsed && (
              <span className="font-bold text-lg text-sidebar-foreground">
                TeamSync
              </span>
            )}
          </div>
        </div>

        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigation.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      className={({ isActive }) =>
                        isActive
                          ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium'
                          : 'hover:bg-sidebar-accent/50'
                      }
                    >
<<<<<<< HEAD
                      <item.icon className="h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
=======
                      <div className="flex items-center gap-2">
                        <item.icon className="h-4 w-4" />
                        {!collapsed && <span>{item.title}</span>}
                        {item.title === 'Notifications' && unreadNotifications && unreadNotifications > 0 && (
                          <Badge variant="destructive" className="text-xs px-1.5 py-0.5 min-w-[18px] h-[18px] flex items-center justify-center">
                            {unreadNotifications > 99 ? '99+' : unreadNotifications}
                          </Badge>
                        )}
                      </div>
>>>>>>> 1310239 (Added local VS Code project files)
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
<<<<<<< HEAD
=======

        <SidebarGroup>
          <SidebarGroupLabel>Quick Actions</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <AdvancedSearch>
                  <SidebarMenuButton className="w-full">
                    <Search className="h-4 w-4" />
                    {!collapsed && <span>Search</span>}
                  </SidebarMenuButton>
                </AdvancedSearch>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <TeamChat>
                  <SidebarMenuButton className="w-full">
                    <MessageCircle className="h-4 w-4" />
                    {!collapsed && <span>Chat</span>}
                  </SidebarMenuButton>
                </TeamChat>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
>>>>>>> 1310239 (Added local VS Code project files)
      </SidebarContent>

      <SidebarFooter>
        <Button
          variant="ghost"
          className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent"
          onClick={signOut}
        >
          <LogOut className="h-4 w-4" />
          {!collapsed && <span className="ml-2">Sign Out</span>}
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
