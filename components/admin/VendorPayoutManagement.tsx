'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import CreateVendorPayoutModal from './CreateVendorPayoutModal';

interface VendorPayout {
  id: string;
  vendor_id: string;
  payout_period_start: string;
  payout_period_end: string;
  total_commission: number;
  total_orders: number;
  payout_method: string;
  payout_details: any;
  status: string;
  transaction_id?: string;
  processed_at?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

interface PendingCommission {
  vendor_id: string;
  total_commission: number;
  total_orders: number;
  business_name: string;
}

export default function VendorPayoutManagement() {
  const [payouts, setPayouts] = useState<VendorPayout[]>([]);
  const [pendingCommissions, setPendingCommissions] = useState<PendingCommission[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [payoutModalVendorId, setPayoutModalVendorId] = useState('');
  const [statusEdits, setStatusEdits] = useState<Record<string, string>>({});
  const [savingStatusFor, setSavingStatusFor] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      await Promise.all([loadPayouts(), loadPendingCommissions()]);
    } catch (error) {
      console.error('Error loading payout data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadPayouts = async () => {
    const { data, error } = await supabase
      .rpc('get_vendor_payouts_with_profiles');
    
    if (error) throw error;
    setPayouts(data || []);
    setStatusEdits((prev) => {
      const next = { ...prev };
      for (const p of data || []) {
        if (typeof next[p.id] !== 'string') next[p.id] = p.status;
      }
      return next;
    });
  };

  const loadPendingCommissions = async () => {
    try {
      console.log('Loading pending commissions...');
      
      const { data, error } = await supabase
        .rpc('get_vendor_commissions_with_profiles', {
          status_filter: 'pending',
          vendor_id_filter: null
        });
      
      if (error) {
        console.error('Error loading pending commissions:', error);
        // Fallback to basic query if function doesn't exist
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('vendor_commissions')
          .select('*')
          .eq('status', 'pending');
        
        if (fallbackError) {
          console.error('Fallback query also failed:', fallbackError);
          setPendingCommissions([]);
          return;
        }
        
        console.log('Using fallback query, found', fallbackData?.length || 0, 'pending commissions');
        
        // Group by vendor for fallback data
        const grouped = (fallbackData || []).reduce((acc: Record<string, any>, commission: any) => {
          const vendorId = commission.vendor_id;
          if (!acc[vendorId]) {
            acc[vendorId] = {
              vendor_id: vendorId,
              total_commission: 0,
              total_orders: 0,
              business_name: 'Unknown Vendor'
            };
          }
          acc[vendorId].total_commission += commission.commission_amount;
          acc[vendorId].total_orders += 1;
          return acc;
        }, {} as Record<string, any>);
        
        setPendingCommissions(Object.values(grouped));
        return;
      }
      
      console.log('Found', data?.length || 0, 'pending commissions');
      
      // Group by vendor
      const grouped = (data || []).reduce((acc: Record<string, any>, commission: any) => {
        const vendorId = commission.vendor_id;
        if (!acc[vendorId]) {
          acc[vendorId] = {
            vendor_id: vendorId,
            total_commission: 0,
            total_orders: 0,
            business_name: (commission as any).business_name || 'Unknown Vendor'
          };
        }
        acc[vendorId].total_commission += commission.commission_amount;
        acc[vendorId].total_orders += 1;
        return acc;
      }, {} as Record<string, any>);
      
      const pendingCommissions = Object.values(grouped) as PendingCommission[];
      console.log('Grouped into', pendingCommissions.length, 'vendors with pending commissions');
      setPendingCommissions(pendingCommissions);
    } catch (error) {
      console.error('Error in loadPendingCommissions:', error);
      setPendingCommissions([]);
    }
  };

  const savePayoutStatus = async (payoutId: string) => {
    const status = statusEdits[payoutId];
    if (!status) return;

    setSavingStatusFor(payoutId);
    try {
      const res = await fetch(`/api/admin/finance/payouts/${payoutId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert(json?.error || 'Failed to update payout status');
        return;
      }

      await loadData();
    } catch (e) {
      alert(`Failed to update payout status: ${e instanceof Error ? e.message : 'Unknown error'}`);
    } finally {
      setSavingStatusFor(null);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getStatusBadge = (status: string) => {
    const statusColors = {
      pending: 'bg-yellow-100 text-yellow-800',
      processing: 'bg-primary/10 text-primary',
      completed: 'bg-green-100 text-green-800',
      failed: 'bg-red-100 text-red-800',
      cancelled: 'bg-gray-100 text-gray-800'
    };
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[status as keyof typeof statusColors] || 'bg-gray-100 text-gray-800'}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  return (
    <div className="p-6">
      <div className="mb-6 flex justify-end items-center">
        <button
          type="button"
          onClick={() => {
            setPayoutModalVendorId('');
            setShowCreateModal(true);
          }}
          className="rounded-md bg-primary px-4 py-2 text-white hover:brightness-[0.92]"
        >
          Create Payout
        </button>
      </div>

      {/* Pending Commissions */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Pending Commissions</h2>
          <button
            onClick={() => loadPendingCommissions()}
            disabled={loading}
            className="bg-primary text-white px-4 py-2 rounded-md hover:brightness-[0.92] disabled:opacity-50 text-sm"
          >
            {loading ? 'Loading...' : 'Refresh'}
          </button>
        </div>
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Vendor
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Pending Commission
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Orders
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {pendingCommissions.map((commission) => (
                <tr key={commission.vendor_id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {commission.business_name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatCurrency(commission.total_commission)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {commission.total_orders}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <button
                      type="button"
                      onClick={() => {
                        setPayoutModalVendorId(commission.vendor_id);
                        setShowCreateModal(true);
                      }}
                      className="text-primary hover:opacity-80"
                    >
                      Create Payout
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Payout History */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Payout History</h2>
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Vendor
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Period
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Method
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {payouts.map((payout) => (
                <tr key={payout.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {(payout as any).business_name || 'Unknown Vendor'}
                    </div>
                    <div className="text-sm text-gray-500">
                      {(payout as any).email || payout.vendor_id.slice(0, 8) + '...'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(payout.payout_period_start)} - {formatDate(payout.payout_period_end)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatCurrency(payout.total_commission)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {payout.payout_method.replace('_', ' ').toUpperCase()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(payout.status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(payout.created_at)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex items-center gap-3">
                      <select
                        value={statusEdits[payout.id] ?? payout.status}
                        onChange={(e) => setStatusEdits((prev) => ({ ...prev, [payout.id]: e.target.value }))}
                        disabled={savingStatusFor === payout.id}
                        className="rounded-md border border-gray-300 bg-white px-2 py-1 text-sm text-gray-900"
                      >
                        <option value="pending">Pending</option>
                        <option value="processing">Processing</option>
                        <option value="completed">Completed</option>
                        <option value="failed">Failed</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                      <button
                        type="button"
                        onClick={() => savePayoutStatus(payout.id)}
                        disabled={savingStatusFor === payout.id || (statusEdits[payout.id] ?? payout.status) === payout.status}
                        className="rounded-md bg-primary px-3 py-1.5 text-sm text-white hover:brightness-[0.92] disabled:opacity-50"
                      >
                        {savingStatusFor === payout.id ? 'Saving...' : 'Save'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <CreateVendorPayoutModal
        open={showCreateModal}
        initialVendorId={payoutModalVendorId}
        onClose={() => {
          setShowCreateModal(false);
          setPayoutModalVendorId('');
        }}
        onSuccess={() => loadData()}
      />
    </div>
  );
}
