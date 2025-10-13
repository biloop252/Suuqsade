import FinanceManagement from '@/components/admin/FinanceManagement';
import FinanceSubNavigation from '@/components/admin/FinanceSubNavigation';

export default function FinanceOverviewPage() {
  return (
    <div>
      <FinanceSubNavigation />
      <FinanceManagement />
    </div>
  );
}
