export default function ProductsLoading() {
  return (
    <div className="min-h-screen bg-gray-50" aria-busy="true" aria-label="Loading products">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6 flex flex-col lg:flex-row gap-4 items-center justify-end">
          <div className="w-full lg:hidden h-10 bg-gray-200 rounded-md animate-pulse" />
          <div className="flex items-center gap-4 w-full lg:w-auto justify-end">
            <div className="h-10 w-32 bg-gray-200 rounded-md animate-pulse" />
            <div className="h-10 w-10 bg-gray-200 rounded-md animate-pulse" />
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          <div className="hidden lg:block w-full lg:w-64 flex-shrink-0">
            <div className="bg-white rounded-lg shadow-sm p-4 space-y-4">
              <div className="h-5 w-24 bg-gray-200 rounded animate-pulse" />
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-9 bg-gray-100 rounded animate-pulse" />
              ))}
            </div>
          </div>

          <div className="flex-1">
            <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 sm:gap-6">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="bg-white rounded-lg shadow-sm p-6 animate-pulse">
                  <div className="w-full h-48 bg-gray-200 rounded-md mb-4" />
                  <div className="h-4 bg-gray-200 rounded mb-2" />
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-4" />
                  <div className="h-6 bg-gray-200 rounded w-1/2" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
