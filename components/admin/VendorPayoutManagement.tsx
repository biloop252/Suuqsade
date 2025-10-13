'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

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

interface VendorProfile {
  id: string;
  business_name: string;
  commission_rate: number;
  status: string;
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
  const [vendors, setVendors] = useState<VendorProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState('');
  const [payoutMethod, setPayoutMethod] = useState('bank_transfer');
  const [payoutDetails, setPayoutDetails] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [routingNumber, setRoutingNumber] = useState('');
  const [paypalEmail, setPaypalEmail] = useState('');
  const [stripeAccountId, setStripeAccountId] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadPayouts(),
        loadPendingCommissions(),
        loadVendors()
      ]);
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

  const loadVendors = async () => {
    const { data, error } = await supabase
      .from('vendor_profiles')
      .select('id, business_name, commission_rate, status')
      .eq('status', 'active');
    
    if (error) throw error;
    setVendors(data || []);
  };

  const createPayout = async () => {
    // Validate required fields based on payout method
    let validationError = '';
    if (!selectedVendor) {
      validationError = 'Please select a vendor';
    } else if (payoutMethod === 'bank_transfer' && (!accountNumber || !routingNumber)) {
      validationError = 'Please provide account number and routing number for bank transfer';
    } else if (payoutMethod === 'paypal' && !paypalEmail) {
      validationError = 'Please provide PayPal email address';
    } else if (payoutMethod === 'stripe' && !stripeAccountId) {
      validationError = 'Please provide Stripe account ID';
    }

    if (validationError) {
      alert(validationError);
      return;
    }

    setLoading(true);
    try {
      console.log('Starting payout creation process...', {
        selectedVendor,
        payoutMethod,
        accountNumber,
        routingNumber,
        paypalEmail,
        stripeAccountId,
        notes
      });

      // Build payout details object based on method
      let parsedPayoutDetails;
      switch (payoutMethod) {
        case 'bank_transfer':
          parsedPayoutDetails = {
            account_number: accountNumber,
            routing_number: routingNumber,
            method: 'bank_transfer'
          };
          break;
        case 'paypal':
          parsedPayoutDetails = {
            email: paypalEmail,
            method: 'paypal'
          };
          break;
        case 'stripe':
          parsedPayoutDetails = {
            account_id: stripeAccountId,
            method: 'stripe'
          };
          break;
        case 'check':
          parsedPayoutDetails = {
            method: 'check',
            notes: notes
          };
          break;
        default:
          throw new Error('Invalid payout method');
      }

      // Get pending commissions for the selected vendor
      console.log('Fetching pending commissions for vendor:', selectedVendor);
      const { data: commissions, error: commissionsError } = await supabase
        .from('vendor_commissions')
        .select('*')
        .eq('vendor_id', selectedVendor)
        .eq('status', 'pending');
      
      if (commissionsError) {
        console.error('Error fetching commissions:', commissionsError);
        alert(`Error fetching commissions: ${commissionsError.message}`);
        return;
      }
      
      if (!commissions || commissions.length === 0) {
        alert('No pending commissions found for this vendor');
        return;
      }

      console.log('Found', commissions.length, 'pending commissions');

      const totalCommission = commissions.reduce((sum, c) => sum + c.commission_amount, 0);
      const periodStart = new Date(Math.min(...commissions.map(c => new Date(c.created_at).getTime())));
      const periodEnd = new Date(Math.max(...commissions.map(c => new Date(c.created_at).getTime())));

      console.log('Payout details:', {
        totalCommission,
        periodStart: periodStart.toISOString().split('T')[0],
        periodEnd: periodEnd.toISOString().split('T')[0],
        totalOrders: commissions.length
      });

      // Create payout record
      console.log('Creating payout record...');
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
          status: 'pending'
        })
        .select()
        .single();
      
      if (payoutError) {
        console.error('Error creating payout record:', payoutError);
        alert(`Error creating payout record: ${payoutError.message}`);
        return;
      }

      console.log('Payout record created successfully:', payout.id);

      // Create finance transaction
      console.log('Creating finance transaction...');
      const { data: financeTransaction, error: transactionError } = await supabase
        .from('finance_transactions')
        .insert({
          transaction_type: 'vendor_payout',
          vendor_id: selectedVendor,
          amount: totalCommission,
          description: `Payout to vendor for ${commissions.length} orders`,
          status: 'pending',
          reference_id: payout.id
        })
        .select()
        .single();
      
      if (transactionError) {
        console.error('Error creating finance transaction:', transactionError);
        // Try to clean up the payout record
        await supabase.from('vendor_payouts').delete().eq('id', payout.id);
        alert(`Error creating finance transaction: ${transactionError.message}`);
        return;
      }

      console.log('Finance transaction created successfully:', financeTransaction.id);

      // Update payout record with transaction_id
      console.log('Linking finance transaction to payout...');
      const { error: linkError } = await supabase
        .from('vendor_payouts')
        .update({ transaction_id: financeTransaction.id })
        .eq('id', payout.id);
      
      if (linkError) {
        console.error('Error linking transaction to payout:', linkError);
        alert(`Error linking transaction to payout: ${linkError.message}`);
        return;
      }

      console.log('Payout linked to finance transaction successfully');

      // Update commission status to paid
      console.log('Updating commission statuses...');
      const commissionIds = commissions.map(c => c.id);
      console.log('Updating commission IDs:', commissionIds);
      
      const { error: updateError } = await supabase
        .from('vendor_commissions')
        .update({ 
          status: 'paid', 
          paid_at: new Date().toISOString(),
          payout_transaction_id: financeTransaction.id
        })
        .in('id', commissionIds);
      
      if (updateError) {
        console.error('Error updating commission statuses:', updateError);
        alert(`Error updating commission statuses: ${updateError.message}`);
        return;
      }

      console.log('Commission statuses updated successfully');
      
      // Verify the update worked
      const { data: updatedCommissions, error: verifyError } = await supabase
        .from('vendor_commissions')
        .select('id, status')
        .in('id', commissionIds);
      
      if (verifyError) {
        console.error('Error verifying commission updates:', verifyError);
      } else {
        console.log('Verification - Updated commissions:', updatedCommissions);
        const stillPending = updatedCommissions?.filter(c => c.status === 'pending');
        if (stillPending && stillPending.length > 0) {
          console.warn('Warning: Some commissions are still pending after update:', stillPending);
        }
      }
      alert('Payout created successfully');
      setShowCreateModal(false);
      resetForm();
      loadData();
    } catch (error) {
      console.error('Unexpected error creating payout:', error);
      alert(`Unexpected error creating payout: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const updatePayoutStatus = async (payoutId: string, status: string) => {
    setLoading(true);
    try {
      console.log('Updating payout status...', { payoutId, status });

      // Update payout status
      const { error } = await supabase
        .from('vendor_payouts')
        .update({ 
          status,
          processed_at: status === 'completed' ? new Date().toISOString() : null
        })
        .eq('id', payoutId);
      
      if (error) {
        console.error('Error updating payout status:', error);
        alert(`Error updating payout status: ${error.message}`);
        return;
      }

      console.log('Payout status updated successfully');

      // Update related finance transaction
      const { error: transactionError } = await supabase
        .from('finance_transactions')
        .update({ 
          status,
          processed_at: status === 'completed' ? new Date().toISOString() : null
        })
        .eq('reference_id', payoutId);
      
      if (transactionError) {
        console.error('Error updating finance transaction:', transactionError);
        alert(`Error updating finance transaction: ${transactionError.message}`);
        return;
      }

      console.log('Finance transaction updated successfully');

      // If payout is being marked as completed, ensure all related commissions are marked as paid
      if (status === 'completed') {
        console.log('Ensuring commissions are marked as paid for completed payout...');
        
        // Get the payout to find the vendor_id and transaction_id
        const { data: payoutData, error: payoutError } = await supabase
          .from('vendor_payouts')
          .select('vendor_id, transaction_id')
          .eq('id', payoutId)
          .single();
        
        if (payoutError) {
          console.error('Error fetching payout data:', payoutError);
        } else if (payoutData) {
          // First, check what pending commissions exist for this vendor
          const { data: pendingCommissions, error: checkError } = await supabase
            .from('vendor_commissions')
            .select('id, status, commission_amount')
            .eq('vendor_id', payoutData.vendor_id)
            .eq('status', 'pending');
          
          if (checkError) {
            console.error('Error checking pending commissions:', checkError);
          } else {
            console.log('Found', pendingCommissions?.length || 0, 'pending commissions for vendor', payoutData.vendor_id);
            
            if (pendingCommissions && pendingCommissions.length > 0) {
              // Update any commissions for this vendor that might still be pending
              const { error: commissionError } = await supabase
                .from('vendor_commissions')
                .update({ 
                  status: 'paid',
                  paid_at: new Date().toISOString(),
                  payout_transaction_id: payoutData.transaction_id
                })
                .eq('vendor_id', payoutData.vendor_id)
                .eq('status', 'pending');
              
              if (commissionError) {
                console.error('Error updating commission statuses:', commissionError);
              } else {
                console.log('Commission statuses updated successfully for completed payout');
                
                // Verify the update
                const { data: verifyCommissions, error: verifyError } = await supabase
                  .from('vendor_commissions')
                  .select('id, status')
                  .in('id', pendingCommissions.map(c => c.id));
                
                if (verifyError) {
                  console.error('Error verifying commission updates:', verifyError);
                } else {
                  const stillPending = verifyCommissions?.filter(c => c.status === 'pending');
                  if (stillPending && stillPending.length > 0) {
                    console.warn('Warning: Some commissions are still pending after payout completion:', stillPending);
                  } else {
                    console.log('All commissions successfully marked as paid');
                  }
                }
              }
            }
          }
        }
      }

      // Reload all data to reflect changes
      console.log('Reloading data...');
      await loadData();
      
      alert(`Payout status updated to ${status}`);
    } catch (error) {
      console.error('Error updating payout status:', error);
      alert(`Error updating payout status: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setSelectedVendor('');
    setPayoutMethod('bank_transfer');
    setPayoutDetails('');
    setAccountNumber('');
    setRoutingNumber('');
    setPaypalEmail('');
    setStripeAccountId('');
    setNotes('');
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
      processing: 'bg-blue-100 text-blue-800',
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
          onClick={() => setShowCreateModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
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
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 text-sm"
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
                      onClick={() => {
                        setSelectedVendor(commission.vendor_id);
                        setShowCreateModal(true);
                      }}
                      className="text-blue-600 hover:text-blue-900"
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
                    {payout.status === 'pending' && (
                      <div className="flex space-x-2">
                        <button
                          onClick={() => updatePayoutStatus(payout.id, 'processing')}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          Process
                        </button>
                        <button
                          onClick={() => updatePayoutStatus(payout.id, 'completed')}
                          className="text-green-600 hover:text-green-900"
                        >
                          Complete
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Payout Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Create Vendor Payout</h3>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Vendor
                </label>
                <select
                  value={selectedVendor}
                  onChange={(e) => setSelectedVendor(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
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
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Payout Method
                </label>
                <select
                  value={payoutMethod}
                  onChange={(e) => setPayoutMethod(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                >
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="paypal">PayPal</option>
                  <option value="stripe">Stripe</option>
                  <option value="check">Check</option>
                </select>
              </div>

              {/* Bank Transfer Details */}
              {payoutMethod === 'bank_transfer' && (
                <>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Account Number *
                    </label>
                    <input
                      type="text"
                      value={accountNumber}
                      onChange={(e) => setAccountNumber(e.target.value)}
                      placeholder="Enter bank account number"
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                    />
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Routing Number *
                    </label>
                    <input
                      type="text"
                      value={routingNumber}
                      onChange={(e) => setRoutingNumber(e.target.value)}
                      placeholder="Enter bank routing number"
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                    />
                  </div>
                </>
              )}

              {/* PayPal Details */}
              {payoutMethod === 'paypal' && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    PayPal Email Address *
                  </label>
                  <input
                    type="email"
                    value={paypalEmail}
                    onChange={(e) => setPaypalEmail(e.target.value)}
                    placeholder="vendor@example.com"
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                  />
                </div>
              )}

              {/* Stripe Details */}
              {payoutMethod === 'stripe' && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Stripe Account ID *
                  </label>
                  <input
                    type="text"
                    value={stripeAccountId}
                    onChange={(e) => setStripeAccountId(e.target.value)}
                    placeholder="acct_xxxxxxxxxxxxx"
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                  />
                </div>
              )}

              {/* Check Details */}
              {payoutMethod === 'check' && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Check Details
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Enter check mailing address or other details"
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                    rows={3}
                  />
                </div>
              )}

              {/* Notes field - only show for non-check methods */}
              {payoutMethod !== 'check' && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notes
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Additional notes or comments"
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                    rows={2}
                  />
                </div>
              )}

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    resetForm();
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  onClick={createPayout}
                  disabled={loading}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? 'Creating...' : 'Create Payout'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
