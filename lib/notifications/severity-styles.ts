import type { AppNotificationSeverity } from '@/types/database';

export function severityRingClass(severity: AppNotificationSeverity): string {
  switch (severity) {
    case 'success':
      return 'ring-emerald-500/30 bg-emerald-50 text-emerald-700';
    case 'warning':
      return 'ring-amber-500/30 bg-amber-50 text-amber-800';
    case 'danger':
      return 'ring-red-500/30 bg-red-50 text-red-700';
    default:
      return 'ring-sky-500/30 bg-sky-50 text-sky-800';
  }
}

export function severityBorderClass(severity: AppNotificationSeverity): string {
  switch (severity) {
    case 'success':
      return 'border-l-emerald-500';
    case 'warning':
      return 'border-l-amber-500';
    case 'danger':
      return 'border-l-red-500';
    default:
      return 'border-l-sky-500';
  }
}

export function priorityBadgeClass(priority: string | null): string {
  switch (priority) {
    case 'urgent':
      return 'bg-red-100 text-red-800';
    case 'high':
      return 'bg-orange-100 text-orange-800';
    case 'medium':
      return 'bg-amber-100 text-amber-900';
    case 'low':
      return 'bg-slate-100 text-slate-600';
    default:
      return 'bg-slate-100 text-slate-500';
  }
}
