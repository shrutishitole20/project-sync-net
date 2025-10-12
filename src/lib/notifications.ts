import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';

export async function createNotification(
  userId: string,
  title: string,
  message: string,
  type: string
) {
  const { error } = await supabase
    .from('notifications')
    .insert({
      user_id: userId,
      title,
      message,
      type,
      read: false,
    });

  if (error) {
    console.error('Failed to create notification:', error);
    return false;
  }

  return true;
}

export async function notifyTaskAssigned(
  assigneeId: string,
  taskTitle: string,
  projectTitle: string
) {
  return createNotification(
    assigneeId,
    'New Task Assigned',
    `You have been assigned to "${taskTitle}" in project "${projectTitle}"`,
    'task_assigned'
  );
}

export async function notifyTaskDue(
  assigneeId: string,
  taskTitle: string,
  dueDate: string
) {
  const dueDateFormatted = new Date(dueDate).toLocaleDateString();
  return createNotification(
    assigneeId,
    'Task Due Soon',
    `Task "${taskTitle}" is due on ${dueDateFormatted}`,
    'task_due'
  );
}

export async function notifyProjectUpdate(
  userId: string,
  projectTitle: string,
  updateType: string
) {
  return createNotification(
    userId,
    'Project Updated',
    `Project "${projectTitle}" has been ${updateType}`,
    'project_update'
  );
}

export async function notifyTaskStatusChange(
  assigneeId: string,
  taskTitle: string,
  newStatus: string
) {
  return createNotification(
    assigneeId,
    'Task Status Updated',
    `Task "${taskTitle}" status changed to ${newStatus}`,
    'task_assigned'
  );
}
