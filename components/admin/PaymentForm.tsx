'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Payment } from '@/types/database';
import { XIcon, CreditCardIcon } from 'lucide-react';

interface PaymentFormProps {
  payment: Payment | null;
  onClose: () => void;
  onSave: () => void;
}

export default function PaymentForm({ payment, onClose, onSave }: PaymentFormProps) {
  const [formData, setFormData] = useState({
    status: payment?.status || 'pending'
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (payment) {
      setFormData({
        status: payment.status
      });
    }
  }, [payment]);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payment) return;
    
    setLoading(true);

    try {
      // Update only the status
      const { error } = await supabase
        .from('payments')
        .update({ status: formData.status })
        .eq('id', payment.id);

      if (error) {
        console.error('Error updating payment status:', error);
        alert('Error updating payment status. Please try again.');
        return;
      }

      alert('Payment status updated successfully!');
      onSave();
    } catch (error) {
      console.error('Error:', error);
      alert('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };


  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <CreditCardIcon className="h-6 w-6 text-primary-600" />
            <h2 className="text-xl font-semibold text-gray-900">
              Update Payment Status
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <XIcon className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Payment Information Display */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-gray-900 mb-3">Payment Information</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Transaction ID:</span>
                <p className="font-medium">{payment?.transaction_id || 'N/A'}</p>
              </div>
              <div>
                <span className="text-gray-500">Amount:</span>
                <p className="font-medium">{payment?.currency} {payment?.amount}</p>
              </div>
              <div>
                <span className="text-gray-500">Payment Method:</span>
                <p className="font-medium capitalize">{payment?.payment_method?.replace('_', ' ') || 'N/A'}</p>
              </div>
              <div>
                <span className="text-gray-500">Order ID:</span>
                <p className="font-medium">{payment?.order_id || 'N/A'}</p>
              </div>
            </div>
          </div>

          {/* Status Update */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Update Status *
            </label>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="pending">Pending</option>
              <option value="paid">Paid</option>
              <option value="failed">Failed</option>
              <option value="refunded">Refunded</option>
            </select>
            <p className="text-sm text-gray-500 mt-1">
              Current status: <span className="font-medium capitalize">{payment?.status || 'N/A'}</span>
            </p>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Updating...' : 'Update Status'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
