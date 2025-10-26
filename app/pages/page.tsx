import { Metadata } from 'next';
import Link from 'next/link';
import { createClient } from '@/lib/supabase';

interface Page {
  id: string;
  slug: string;
  title: string;
  content: string;
  meta_title?: string;
  meta_description?: string;
  meta_keywords?: string;
  page_type: string;
  status: string;
  is_featured: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

async function getAllPages(): Promise<Page[]> {
  try {
    const supabase = createClient();
    const { data: pages, error } = await supabase
      .from('pages')
      .select('*')
      .eq('status', 'published')
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: false });

    if (error) {
      return [];
    }

    return (pages || []) as unknown as Page[];
  } catch (error) {
    return [];
  }
}

export const metadata: Metadata = {
  title: 'All Pages - Suuqsade Marketplace',
  description: 'Browse all pages and information on Suuqsade Marketplace',
};

export default async function AllPagesPage() {
  const pages = await getAllPages();

  const featuredPages = pages.filter(page => page.is_featured);
  const regularPages = pages.filter(page => !page.is_featured);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Pages & Information</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Find all the information you need about Suuqsade Marketplace, our policies, and services.
          </p>
        </div>

        {/* Featured Pages */}
        {featuredPages.length > 0 && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
              <svg className="w-6 h-6 mr-2 text-orange-600" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
              </svg>
              Featured Pages
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredPages.map((page) => (
                <Link
                  key={page.id}
                  href={`/${page.slug}`}
                  className="group block bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-lg transition-all duration-200 overflow-hidden"
                >
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-3">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                        <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
                        </svg>
                        Featured
                      </span>
                      <span className="text-xs text-gray-500 capitalize">{page.page_type}</span>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 group-hover:text-orange-600 transition-colors mb-2">
                      {page.title}
                    </h3>
                    <p className="text-sm text-gray-600 line-clamp-3">
                      {page.meta_description || 'Learn more about this topic.'}
                    </p>
                    <div className="mt-4 flex items-center text-sm text-gray-500">
                      <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd"></path>
                      </svg>
                      Updated {new Date(page.updated_at).toLocaleDateString()}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Regular Pages */}
        {regularPages.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">All Pages</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {regularPages.map((page) => (
                <Link
                  key={page.id}
                  href={`/${page.slug}`}
                  className="group block bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200 overflow-hidden"
                >
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs text-gray-500 capitalize bg-gray-100 px-2 py-1 rounded">
                        {page.page_type}
                      </span>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 group-hover:text-orange-600 transition-colors mb-2">
                      {page.title}
                    </h3>
                    <p className="text-sm text-gray-600 line-clamp-3">
                      {page.meta_description || 'Learn more about this topic.'}
                    </p>
                    <div className="mt-4 flex items-center text-sm text-gray-500">
                      <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd"></path>
                      </svg>
                      Updated {new Date(page.updated_at).toLocaleDateString()}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {pages.length === 0 && (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No pages found</h3>
            <p className="mt-1 text-sm text-gray-500">
              There are no published pages available at the moment.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}



