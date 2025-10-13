import RevenueManagement from '@/components/admin/RevenueManagement';
import FinanceSubNavigation from '@/components/admin/FinanceSubNavigation';

export default function AdminRevenuesPage() {
  return (
    <div>
      <FinanceSubNavigation />
      <RevenueManagement />
    </div>
  );
}
