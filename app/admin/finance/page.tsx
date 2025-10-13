import FinanceDashboard from '@/components/admin/FinanceDashboard';
import FinanceSubNavigation from '@/components/admin/FinanceSubNavigation';

export default function FinancePage() {
  return (
    <div>
      <FinanceSubNavigation />
      <FinanceDashboard />
    </div>
  );
}
