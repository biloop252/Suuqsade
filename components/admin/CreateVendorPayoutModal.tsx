'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface VendorProfile {
  id: string;
  business_name: string;
  commission_rate: number;
  status: string;
}

export interface CreateVendorPayoutModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  /** Pre-select vendor when opening from a pending-commission row */
  initialVendorId?: string;
}

export default function CreateVendorPayoutModal({
  open,
  onClose,
  onSuccess,
  initialVendorId = '',
}: CreateVendorPayoutModalProps) {
  const [loading, setLoading] = useState(false);
  const [vendors, setVendors] = useState<VendorProfile[]>([]);
  const [selectedVendor, setSelectedVendor] = useState('');
  const [payoutMethod, setPayoutMethod] = useState<'zaad' | 'edahab' | 'bank_transfer' | 'check'>('zaad');
  const [accountNumber, setAccountNumber] = useState('');
  const [routingNumber, setRoutingNumber] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (!open) {
      setSelectedVendor('');
      setPayoutMethod('zaad');
      setAccountNumber('');
      setRoutingNumber('');
      setNotes('');
      return;
    }

    (async () => {
      const { data, error } = await supabase
        .from('vendor_profiles')
        .select('id, business_name, commission_rate, status')
        .eq('status', 'active');

      if (error) {
        console.error('CreateVendorPayoutModal loadVendors:', error);
        setVendors([]);
        setSelectedVendor('');
        return;
      }
      setVendors(data || []);
      setSelectedVendor(initialVendorId || '');
    })();
  }, [open, initialVendorId]);

  const handleClose = () => {
    onClose();
  };

  const createPayout = async () => {
    let validationError = '';
    if (!selectedVendor) {
      validationError = 'Please select a vendor';
    } else if (payoutMethod === 'bank_transfer' && (!accountNumber || !routingNumber)) {
      validationError = 'Please provide account number and routing number for bank transfer';
    } else if ((payoutMethod === 'zaad' || payoutMethod === 'edahab') && !accountNumber) {
      validationError = 'Please provide account number';
    }

    if (validationError) {
      alert(validationError);
      return;
    }

    setLoading(true);
    try {
      let parsedPayoutDetails: Record<string, unknown>;
      switch (payoutMethod) {
        case 'bank_transfer':
          parsedPayoutDetails = {
            account_number: accountNumber,
            routing_number: routingNumber,
            method: 'bank_transfer',
          };
          break;
        case 'zaad':
        case 'edahab':
          parsedPayoutDetails = {
            account_number: accountNumber,
            method: payoutMethod,
          };
          break;
        case 'check':
          parsedPayoutDetails = {
            method: 'check',
            notes: notes,
          };
          break;
        default:
          throw new Error('Invalid payout method');
      }

      const { data: commissions, error: commissionsError } = await supabase
        .from('vendor_commissions')
        .select('*')
        .eq('vendor_id', selectedVendor)
        .eq('status', 'pending');

      if (commissionsError) {
        alert(`Error fetching commissions: ${commissionsError.message}`);
        return;
      }

      if (!commissions || commissions.length === 0) {
        alert('No pending commissions found for this vendor');
        return;
      }

      const totalCommission = commissions.reduce((sum, c) => sum + c.commission_amount, 0);
      const periodStart = new Date(Math.min(...commissions.map((c) => new Date(c.created_at).getTime())));
      const periodEnd = new Date(Math.max(...commissions.map((c) => new Date(c.created_at).getTime())));

      const { data: payout, error: payoutError } = await supabase
        .from('vendor_payouts')
        .insert({
          vendor_id: selectedVendor,
          payout_period_start: periodStart.toISOString().split('T')[0],
          payout_period_end: periodEnd.toISOString().split('T')[0],
          total_commission: totalCommission,
          total_orders: commissions.length,
          payout_method: payoutMethod,
          payout_details: parsedPayoutDetails,
          notes: notes,
          status: 'pending',
        })
        .select()
        .single();

      if (payoutError) {
        alert(`Error creating payout record: ${payoutError.message}`);
        return;
      }

      const { data: financeTransaction, error: transactionError } = await supabase
        .from('finance_transactions')
        .insert({
          transaction_type: 'vendor_payout',
          vendor_id: selectedVendor,
          amount: totalCommission,
          description: `Payout to vendor for ${commissions.length} orders`,
          status: 'pending',
          reference_id: payout.id,
        })
        .select()
        .single();

      if (transactionError) {
        await supabase.from('vendor_payouts').delete().eq('id', payout.id);
        alert(`Error creating finance transaction: ${transactionError.message}`);
        return;
      }

      const { error: linkError } = await supabase
        .from('vendor_payouts')
        .update({ transaction_id: financeTransaction.id })
        .eq('id', payout.id);

      if (linkError) {
        alert(`Error linking transaction to payout: ${linkError.message}`);
        return;
      }

      const commissionIds = commissions.map((c) => c.id);

      const { error: updateError } = await supabase
        .from('vendor_commissions')
        .update({
          status: 'paid',
          paid_at: new Date().toISOString(),
          payout_transaction_id: financeTransaction.id,
        })
        .in('id', commissionIds);

      if (updateError) {
        alert(`Error updating commission statuses: ${updateError.message}`);
        return;
      }

      alert('Payout created successfully');
      onSuccess?.();
      handleClose();
    } catch (error) {
      console.error('Unexpected error creating payout:', error);
      alert(`Unexpected error creating payout: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-gray-600/50 p-4 pt-12">
      <div className="relative w-full max-w-md rounded-md border bg-white p-5 shadow-lg">
        <h3 className="mb-4 text-lg font-medium text-gray-900">Create Vendor Payout</h3>

        <div className="mb-4">
          <label className="mb-1 block text-sm font-medium text-gray-700">Vendor</label>
          <select
            value={selectedVendor}
            onChange={(e) => setSelectedVendor(e.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2"
          >
            <option value="">Select a vendor</option>
            {vendors.map((vendor) => (
              <option key={vendor.id} value={vendor.id}>
                {vendor.business_name}
              </option>
            ))}
          </select>
        </div>

        <div className="mb-4">
          <label className="mb-1 block text-sm font-medium text-gray-700">Payout Method</label>
          <select
            value={payoutMethod}
            onChange={(e) =>
              setPayoutMethod(e.target.value as 'zaad' | 'edahab' | 'bank_transfer' | 'check')
            }
            className="w-full rounded-md border border-gray-300 px-3 py-2"
          >
            <option value="zaad">Zaad</option>
            <option value="edahab">Edahab</option>
            <option value="bank_transfer">Bank Transfer</option>
            <option value="check">Check</option>
          </select>
        </div>

        {payoutMethod !== 'check' && (
          <div className="mb-4">
            <label className="mb-1 block text-sm font-medium text-gray-700">Account Number *</label>
            <input
              type="text"
              value={accountNumber}
              onChange={(e) => setAccountNumber(e.target.value)}
              placeholder="Enter account number"
              className="w-full rounded-md border border-gray-300 px-3 py-2"
            />
          </div>
        )}

        {payoutMethod === 'bank_transfer' && (
          <div className="mb-4">
            <label className="mb-1 block text-sm font-medium text-gray-700">Routing Number *</label>
            <input
              type="text"
              value={routingNumber}
              onChange={(e) => setRoutingNumber(e.target.value)}
              placeholder="Enter bank routing number"
              className="w-full rounded-md border border-gray-300 px-3 py-2"
            />
          </div>
        )}

        <div className="mb-4">
          <label className="mb-1 block text-sm font-medium text-gray-700">Notes</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Additional notes or comments"
            className="w-full rounded-md border border-gray-300 px-3 py-2"
            rows={2}
          />
        </div>

        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={handleClose}
            className="rounded-md bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={createPayout}
            disabled={loading}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:brightness-[0.92] disabled:opacity-50"
          >
            {loading ? 'Creating...' : 'Create Payout'}
          </button>
        </div>
      </div>
    </div>
  );
}
