'use client';

import { Banknote, PiggyBank, Timer } from 'lucide-react';

export interface FinanceKpiMetrics {
  total_sales: number;
  admin_commission: number;
  pending_payout: number;
}

interface FinanceKpiStripProps {
  metrics: FinanceKpiMetrics | null;
  loading?: boolean;
  periodLabel?: string;
  formatCurrency: (n: number) => string;
}

export default function FinanceKpiStrip({
  metrics,
  loading,
  periodLabel,
  formatCurrency,
}: FinanceKpiStripProps) {
  const items = [
    {
      label: 'Total sales',
      hint: 'Sum of line totals (vendor_commissions.order_amount)',
      value: metrics?.total_sales ?? 0,
      icon: Banknote,
      accent: 'from-emerald-500/10 to-emerald-600/5 border-emerald-200/80',
      iconClass: 'text-emerald-600',
    },
    {
      label: 'Admin commission',
      hint: 'Sum of platform share (vendor_commissions.admin_amount)',
      value: metrics?.admin_commission ?? 0,
      icon: PiggyBank,
      accent: 'from-violet-500/10 to-violet-600/5 border-violet-200/80',
      iconClass: 'text-violet-600',
    },
    {
      label: 'Pending payout',
      hint: 'Sum of vendor share (vendor_commissions.commission_amount)',
      value: metrics?.pending_payout ?? 0,
      icon: Timer,
      accent: 'from-amber-500/10 to-amber-600/5 border-amber-200/80',
      iconClass: 'text-amber-600',
    },
  ];

  return (
    <div className="space-y-3">
      {periodLabel && (
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
          {periodLabel}
        </p>
      )}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <div
            key={item.label}
            className={`relative overflow-hidden rounded-xl border bg-gradient-to-br ${item.accent} p-5 shadow-sm`}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-slate-600">{item.label}</p>
                <p className="mt-1 text-2xl font-semibold tabular-nums tracking-tight text-slate-900">
                  {loading ? '—' : formatCurrency(item.value)}
                </p>
                <p className="mt-2 text-xs text-slate-500">{item.hint}</p>
              </div>
              <div
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-white/80 shadow-sm ring-1 ring-slate-200/60`}
              >
                <item.icon className={`h-5 w-5 ${item.iconClass}`} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
