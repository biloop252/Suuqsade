'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export interface AddRevenueRecordModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

type RevenueSourceType = 'vendor' | 'user' | 'advertiser';

type SourceOption = {
  id: string;
  label: string;
  subtitle?: string;
};

export default function AddRevenueRecordModal({
  open,
  onClose,
  onSuccess,
}: AddRevenueRecordModalProps) {
  const [loading, setLoading] = useState(false);
  const [revenueType, setRevenueType] = useState('subscription');
  const [sourceType, setSourceType] = useState<RevenueSourceType>('vendor');
  const [sourceId, setSourceId] = useState('');
  const [sourceSearch, setSourceSearch] = useState('');
  const [sourceOptions, setSourceOptions] = useState<SourceOption[]>([]);
  const [sourceSearchLoading, setSourceSearchLoading] = useState(false);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [organizationName, setOrganizationName] = useState('');
  const [notes, setNotes] = useState('');
  const [periodStart, setPeriodStart] = useState('');
  const [periodEnd, setPeriodEnd] = useState('');

  useEffect(() => {
    if (!open) {
      setRevenueType('subscription');
      setSourceType('vendor');
      setSourceId('');
      setSourceSearch('');
      setSourceOptions([]);
      setOrganizationName('');
      setNotes('');
      setAmount('');
      setDescription('');
      setPeriodStart('');
      setPeriodEnd('');
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;

    // Clear selection/search when switching source type.
    setSourceId('');
    setSourceSearch('');
    setSourceOptions([]);
    if (sourceType !== 'advertiser') {
      setOrganizationName('');
      setNotes('');
    }
  }, [open, sourceType]);

  useEffect(() => {
    if (!open) return;

    const query = sourceSearch.trim();
    if (query.length < 2) {
      setSourceOptions([]);
      return;
    }

    const timer = setTimeout(async () => {
      setSourceSearchLoading(true);
      try {
        if (sourceType === 'vendor') {
          const { data, error } = await supabase
            .from('vendor_profiles')
            .select('id,business_name')
            .ilike('business_name', `%${query}%`)
            .limit(10);

          if (error) throw error;

          setSourceOptions(
            (data || []).map((v: any) => ({
              id: v.id,
              label: v.business_name || v.id,
              subtitle: v.business_name ? v.id : undefined,
            }))
          );
          return;
        }

        if (sourceType === 'user') {
          const { data, error } = await supabase
            .from('profiles')
            .select('id,email,first_name,last_name')
            .eq('role', 'customer')
            .or(
              [
                `email.ilike.%${query}%`,
                `first_name.ilike.%${query}%`,
                `last_name.ilike.%${query}%`,
              ].join(',')
            )
            .limit(10);

          if (error) throw error;

          setSourceOptions(
            (data || []).map((u: any) => {
              const name = [u.first_name, u.last_name].filter(Boolean).join(' ').trim();
              return {
                id: u.id,
                label: name || u.email || u.id,
                subtitle: name && u.email ? u.email : u.email ? u.id : undefined,
              };
            })
          );
          return;
        }

        // sourceType === 'advertiser'
        const { data, error } = await supabase
          .from('advertisers')
          .select('id,organization_name,notes')
          .ilike('organization_name', `%${query}%`)
          .limit(10);

        if (error) throw error;

        setSourceOptions(
          (data || []).map((a: any) => {
            return {
              id: a.id,
              label: a.organization_name || a.id,
              subtitle: a.notes ? String(a.notes) : undefined,
            };
          })
        );
      } catch (e) {
        console.error('Error searching source:', e);
        setSourceOptions([]);
      } finally {
        setSourceSearchLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [open, sourceSearch, sourceType]);

  const handleClose = () => {
    onClose();
  };

  const selectSource = (opt: SourceOption) => {
    setSourceId(opt.id);
    setSourceSearch(opt.label);
    setSourceOptions([]);
    if (sourceType === 'advertiser') {
      setOrganizationName(opt.label);
      setNotes(opt.subtitle || '');
    }
  };

  const createRevenue = async () => {
    if (!amount || !description) {
      alert('Please fill in all required fields');
      return;
    }
    if ((sourceType === 'vendor' || sourceType === 'user') && !sourceId.trim()) {
      alert('Please select a source from the dropdown');
      return;
    }
    if (sourceType === 'advertiser' && !organizationName.trim()) {
      alert('Please provide Organization Name for the advertiser');
      return;
    }

    setLoading(true);
    try {
      let finalSourceId: string | null = null;

      if (sourceType === 'advertiser') {
        // If an existing advertiser was selected, use it. Otherwise create one.
        if (sourceId.trim()) {
          finalSourceId = sourceId.trim();
        } else {
          const { data: advertiser, error: advertiserError } = await supabase
            .from('advertisers')
            .insert({
              organization_name: organizationName.trim(),
              notes: notes.trim() || null,
            })
            .select('id')
            .single();

          if (advertiserError) throw advertiserError;
          finalSourceId = advertiser.id;
        }
      } else {
        finalSourceId = sourceId.trim();
      }

      const { data, error } = await supabase
        .from('admin_revenues')
        .insert({
          revenue_type: revenueType,
          source_type: sourceType,
          source_id: finalSourceId,
          amount: parseFloat(amount),
          description: description,
          period_start: periodStart || null,
          period_end: periodEnd || null,
          status: 'confirmed',
        })
        .select()
        .single();

      if (error) throw error;

      const { error: transactionError } = await supabase.from('finance_transactions').insert({
        transaction_type: 'admin_revenue',
        amount: parseFloat(amount),
        description: description,
        status: 'completed',
        reference_id: data.id,
      });

      if (transactionError) throw transactionError;

      alert('Revenue record created successfully');
      onSuccess?.();
      handleClose();
    } catch (error) {
      console.error('Error creating revenue:', error);
      alert('Error creating revenue record');
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-gray-600/50 p-4 pt-16">
      <div className="relative w-full max-w-md rounded-md border bg-white p-5 shadow-lg">
        <h3 className="mb-4 text-lg font-medium text-gray-900">Add Revenue Record</h3>

        <div className="mb-4">
          <label className="mb-1 block text-sm font-medium text-gray-700">Revenue Type</label>
          <select
            value={revenueType}
            onChange={(e) => setRevenueType(e.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2"
          >
            <option value="subscription">Subscription</option>
            <option value="advertising">Advertising</option>
            <option value="listing_fee">Listing Fee</option>
            <option value="premium_features">Premium Features</option>
            <option value="other">Other</option>
          </select>
        </div>

        <div className="mb-4">
          <label className="mb-1 block text-sm font-medium text-gray-700">Source Type</label>
          <select
            value={sourceType}
            onChange={(e) => setSourceType(e.target.value as RevenueSourceType)}
            className="w-full rounded-md border border-gray-300 px-3 py-2"
          >
            <option value="vendor">Vendor</option>
            <option value="user">User</option>
            <option value="advertiser">Advertiser</option>
          </select>
        </div>

        {sourceType === 'advertiser' ? (
          <>
            <div className="mb-4">
              <label className="mb-1 block text-sm font-medium text-gray-700">Advertiser *</label>
              <div className="relative">
                <input
                  type="text"
                  value={sourceSearch}
                  onChange={(e) => {
                    setSourceSearch(e.target.value);
                    setSourceId('');
                  }}
                  className="w-full rounded-md border border-gray-300 px-3 py-2"
                  placeholder="Search advertiser organization…"
                />

                <div className="mt-1 text-xs text-gray-500">
                  Selected advertiser ID:{' '}
                  <span className="font-mono">{sourceId ? sourceId.slice(0, 8) + '…' : 'New advertiser'}</span>
                  {sourceSearchLoading ? <span className="ml-2">Searching…</span> : null}
                </div>

                {sourceOptions.length > 0 ? (
                  <div className="absolute z-10 mt-2 w-full overflow-hidden rounded-md border border-gray-200 bg-white shadow-lg">
                    {sourceOptions.map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => selectSource(opt)}
                        className="w-full px-3 py-2 text-left hover:bg-gray-50"
                      >
                        <div className="text-sm font-medium text-gray-900">{opt.label}</div>
                        {opt.subtitle ? <div className="text-xs text-gray-500">{opt.subtitle}</div> : null}
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>
            </div>

            <div className="mb-4">
              <label className="mb-1 block text-sm font-medium text-gray-700">Organization Name *</label>
              <input
                type="text"
                value={organizationName}
                onChange={(e) => setOrganizationName(e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2"
                placeholder="Advertiser organization name"
              />
            </div>

            <div className="mb-4">
              <label className="mb-1 block text-sm font-medium text-gray-700">Notes (Optional)</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2"
                rows={3}
                placeholder="Internal notes about this advertiser..."
              />
            </div>
          </>
        ) : (
          <div className="mb-4">
            <label className="mb-1 block text-sm font-medium text-gray-700">Source *</label>
            <div className="relative">
              <input
                type="text"
                value={sourceSearch}
                onChange={(e) => setSourceSearch(e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2"
                placeholder={sourceType === 'vendor' ? 'Search vendor business name…' : 'Search user name/email…'}
              />

              <div className="mt-1 text-xs text-gray-500">
                Selected ID: <span className="font-mono">{sourceId ? sourceId.slice(0, 8) + '…' : 'None'}</span>
                {sourceSearchLoading ? <span className="ml-2">Searching…</span> : null}
              </div>

              {sourceOptions.length > 0 ? (
                <div className="absolute z-10 mt-2 w-full overflow-hidden rounded-md border border-gray-200 bg-white shadow-lg">
                  {sourceOptions.map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => selectSource(opt)}
                      className="w-full px-3 py-2 text-left hover:bg-gray-50"
                    >
                      <div className="text-sm font-medium text-gray-900">{opt.label}</div>
                      {opt.subtitle ? <div className="text-xs text-gray-500">{opt.subtitle}</div> : null}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          </div>
        )}

        <div className="mb-4">
          <label className="mb-1 block text-sm font-medium text-gray-700">Amount *</label>
          <input
            type="number"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2"
            placeholder="0.00"
          />
        </div>

        <div className="mb-4">
          <label className="mb-1 block text-sm font-medium text-gray-700">Description *</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2"
            rows={3}
            placeholder="Describe the revenue source..."
          />
        </div>

        <div className="mb-4">
          <label className="mb-1 block text-sm font-medium text-gray-700">Period Start (Optional)</label>
          <input
            type="date"
            value={periodStart}
            onChange={(e) => setPeriodStart(e.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2"
          />
        </div>

        <div className="mb-4">
          <label className="mb-1 block text-sm font-medium text-gray-700">Period End (Optional)</label>
          <input
            type="date"
            value={periodEnd}
            onChange={(e) => setPeriodEnd(e.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2"
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
            onClick={createRevenue}
            disabled={loading}
            className="rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50"
          >
            {loading ? 'Creating...' : 'Create Revenue'}
          </button>
        </div>
      </div>
    </div>
  );
}
