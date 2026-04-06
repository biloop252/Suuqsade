import type { AppNotificationSeverity } from '@/types/database';

export function severityRingClass(severity: AppNotificationSeverity): string {
  switch (severity) {
    case 'success':
      return 'ring-emerald-500/30 bg-emerald-50 text-emerald-700';
    case 'info':
      return 'ring-sky-500/30 bg-sky-50 text-sky-700';
    case 'warning':
      return 'ring-amber-500/35 bg-amber-50 text-amber-800';
    case 'danger':
      return 'ring-red-500/35 bg-red-50 text-red-700';
    default:
      return 'ring-gray-200 bg-gray-50 text-gray-700';
  }
}

export function severityBorderClass(severity: AppNotificationSeverity): string {
  switch (severity) {
    case 'success':
      return 'border-l-emerald-500';
    case 'info':
      return 'border-l-sky-500';
    case 'warning':
      return 'border-l-amber-500';
    case 'danger':
      return 'border-l-red-500';
    default:
      return 'border-l-gray-300';
  }
}

export function priorityBadgeClass(priority: string | null | undefined): string {
  switch (priority) {
    case 'urgent':
      return 'bg-red-100 text-red-800';
    case 'high':
      return 'bg-orange-100 text-orange-800';
    case 'medium':
      return 'bg-amber-100 text-amber-900';
    case 'low':
      return 'bg-gray-100 text-gray-700';
    default:
      return 'bg-gray-100 text-gray-600';
  }
}
