import AdminProtectedRoute from '@/components/admin/AdminProtectedRoute';

export default function AdminAnalyticsPage() {
  return (
    <AdminProtectedRoute>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
          <p className="mt-1 text-sm text-gray-500">
            View detailed analytics and reports
          </p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="text-center py-12">
            <div className="w-20 h-20 bg-gradient-to-br from-orange-100 to-orange-200 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="h-10 w-10 text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Analytics Dashboard</h3>
            <p className="text-gray-500 mb-4">
              Advanced analytics and reporting features will be implemented here.
            </p>
            <div className="text-sm text-gray-400">
              Features coming soon: Sales charts, user growth, product performance, and more.
            </div>
          </div>
        </div>
      </div>
    </AdminProtectedRoute>
  );
}
