import { isSupabaseConfigured, supabase } from '../lib/supabaseClient';

export type ReplyNotification = {
  id: string;
  kind: string;
  refId: string | null;
  title: string;
  preview: string;
  linkPath: string | null;
  isRead: boolean;
  isDismissed: boolean;
  createdAt: string | null;
};

const mapReplyNotification = (row: Record<string, unknown> | null): ReplyNotification | null => {
  if (!row) return null;
  return {
    id: String(row.id),
    kind: String(row.kind || ''),
    refId: row.ref_id ? String(row.ref_id) : null,
    title: String(row.title || 'You have a reply'),
    preview: String(row.preview || ''),
    linkPath: row.link_path ? String(row.link_path) : null,
    isRead: Boolean(row.is_read),
    isDismissed: Boolean(row.is_dismissed),
    createdAt: row.created_at ? String(row.created_at) : null,
  };
};

export const fetchReplyNotifications = async (userId: string): Promise<ReplyNotification[]> => {
  if (!isSupabaseConfigured || !supabase || !userId) return [];

  const { data, error } = await supabase
    .from('reply_notifications')
    .select('id, kind, ref_id, title, preview, link_path, is_read, is_dismissed, created_at')
    .eq('user_id', userId)
    .eq('is_dismissed', false)
    .order('created_at', { ascending: false })
    .limit(30);

  if (error) throw new Error(error.message);
  return (data || [])
    .map((row) => mapReplyNotification(row as Record<string, unknown>))
    .filter(Boolean) as ReplyNotification[];
};

export const fetchUnreadReplyNotificationCount = async (userId: string): Promise<number> => {
  const notifications = await fetchReplyNotifications(userId);
  return notifications.filter((item) => !item.isRead).length;
};

export const markReplyNotificationRead = async ({
  notificationId,
  userId,
}: {
  notificationId: string;
  userId: string;
}): Promise<void> => {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error('Supabase is not configured.');
  }

  const { error } = await supabase
    .from('reply_notifications')
    .update({ is_read: true })
    .eq('id', notificationId)
    .eq('user_id', userId);

  if (error) throw new Error(error.message);
};

export const formatReplyNotificationTime = (value: string | null | undefined): string => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
};

export const replyNotificationKindLabel = (kind: string): string => {
  switch (String(kind || '').trim()) {
    case 'application_status':
      return 'Application status';
    case 'new_application':
      return 'New application';
    case 'job_question':
      return 'Job question reply';
    case 'site_feedback':
      return 'Feedback reply';
    default:
      return 'Notification';
  }
};
