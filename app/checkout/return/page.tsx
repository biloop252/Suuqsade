'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { CheckIcon, XCircleIcon, LoaderIcon } from 'lucide-react';
import { useCart } from '@/lib/cart-context';
import { useAuth } from '@/lib/auth-context';

export default function CheckoutReturnPage() {
  const searchParams = useSearchParams();
  const { clearCart } = useCart();
  const { loading: authLoading } = useAuth();
  const [state, setState] = useState<'loading' | 'success' | 'failure' | 'error'>('loading');
  const [orderNumber, setOrderNumber] = useState<string | null>(null);
  const [message, setMessage] = useState<string>('');

  useEffect(() => {
    const sid = searchParams.get('sid');
    const sessionId = searchParams.get('session_id');

    if (!sessionId) {
      setState('error');
      setMessage('Missing order reference. Please contact support if you completed payment.');
      return;
    }

    // Avoid racing clearCart before auth is hydrated after gateway redirect (mobile / WebView).
    if (authLoading) {
      return;
    }

    (async () => {
      try {
        const res = await fetch('/api/checkout/sifalopay/complete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sid: sid || undefined, session_id: sessionId }),
        });
        const data = await res.json();

        if (!res.ok) {
          setState('error');
          setMessage(data?.error || 'Something went wrong.');
          return;
        }

        if (data.success) {
          setOrderNumber(data.order_number || null);
          setState('success');
          await clearCart();
        } else {
          setOrderNumber(data.order_number || null);
          setState(data.status === 'pending' ? 'loading' : 'failure');
          setMessage(
            data.status === 'pending'
              ? 'Your payment is being processed.'
              : 'Payment was not successful. You can try again from your orders.'
          );
        }
      } catch {
        setState('error');
        setMessage('Unable to verify payment. Please check your orders or contact support.');
      }
    })();
  }, [searchParams, clearCart, authLoading]);

  if (state === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <LoaderIcon className="animate-spin h-12 w-12 text-primary-600 mx-auto mb-4" />
          <p className="text-gray-600">Verifying your payment...</p>
        </div>
      </div>
    );
  }

  if (state === 'success') {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckIcon className="h-8 w-8 text-green-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Payment Successful</h1>
            <p className="text-gray-600 mb-4">
              Thank you for your order. Your payment was completed successfully.
              {orderNumber && (
                <span className="block mt-2 font-medium text-gray-900">Order number: {orderNumber}</span>
              )}
            </p>
            <div className="flex space-x-4 justify-center">
              <Link
                href="/orders"
                className="bg-primary-600 text-white px-6 py-3 rounded-md font-medium hover:bg-primary-700"
              >
                View Orders
              </Link>
              <Link
                href="/products"
                className="bg-gray-100 text-gray-700 px-6 py-3 rounded-md font-medium hover:bg-gray-200"
              >
                Continue Shopping
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (state === 'failure') {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <XCircleIcon className="h-8 w-8 text-red-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Payment Unsuccessful</h1>
            <p className="text-gray-600 mb-4">{message}</p>
            <div className="flex space-x-4 justify-center">
              <Link href="/orders" className="bg-primary-600 text-white px-6 py-3 rounded-md font-medium hover:bg-primary-700">
                View Orders
              </Link>
              <Link href="/checkout" className="bg-gray-100 text-gray-700 px-6 py-3 rounded-md font-medium hover:bg-gray-200">
                Try Again
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-sm p-8 text-center">
          <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <XCircleIcon className="h-8 w-8 text-amber-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Verification Issue</h1>
          <p className="text-gray-600 mb-4">{message}</p>
          <div className="flex space-x-4 justify-center">
            <Link href="/orders" className="bg-primary-600 text-white px-6 py-3 rounded-md font-medium hover:bg-primary-700">
              View Orders
            </Link>
            <Link href="/" className="bg-gray-100 text-gray-700 px-6 py-3 rounded-md font-medium hover:bg-gray-200">
              Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
