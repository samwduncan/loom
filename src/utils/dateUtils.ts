export type TimeCategory = 'Today' | 'Yesterday' | 'Last 7 Days' | 'Older';

export function getTimeCategory(dateString: string, now: Date): TimeCategory {
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return 'Older';

  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const weekAgo = new Date(today);
  weekAgo.setDate(weekAgo.getDate() - 7);

  if (date >= today) return 'Today';
  if (date >= yesterday) return 'Yesterday';
  if (date >= weekAgo) return 'Last 7 Days';
  return 'Older';
}

export function groupSessionsByTime<T>(
  sessions: T[],
  now: Date,
  getDate: (item: T) => string,
): Map<TimeCategory, T[]> {
  const order: TimeCategory[] = ['Today', 'Yesterday', 'Last 7 Days', 'Older'];
  const groups = new Map<TimeCategory, T[]>(order.map(cat => [cat, []]));

  for (const session of sessions) {
    const dateStr = getDate(session);
    const category = getTimeCategory(dateStr, now);
    groups.get(category)!.push(session);
  }

  // Remove empty groups
  for (const [key, value] of groups) {
    if (value.length === 0) groups.delete(key);
  }

  return groups;
}

export const formatTimeAgo = (dateString: string, currentTime: Date) => {
  const date = new Date(dateString);
  const now = currentTime;

  // Check if date is valid
  if (isNaN(date.getTime())) {
    return 'Unknown';
  }

  const diffInMs = now.getTime() - date.getTime();
  const diffInSeconds = Math.floor(diffInMs / 1000);
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

  if (diffInSeconds < 60) return 'Just now';
  if (diffInMinutes === 1) return '1 min ago';
  if (diffInMinutes < 60) return `${diffInMinutes} mins ago`;
  if (diffInHours === 1) return '1 hour ago';
  if (diffInHours < 24) return `${diffInHours} hours ago`;
  if (diffInDays === 1) return '1 day ago';
  if (diffInDays < 7) return `${diffInDays} days ago`;
  return date.toLocaleDateString();
};
