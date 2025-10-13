import VendorPayoutManagement from '@/components/admin/VendorPayoutManagement';
import FinanceSubNavigation from '@/components/admin/FinanceSubNavigation';

export default function VendorPayoutsPage() {
  return (
    <div>
      <FinanceSubNavigation />
      <VendorPayoutManagement />
    </div>
  );
}
