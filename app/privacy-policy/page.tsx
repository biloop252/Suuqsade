import { Metadata } from 'next';
import { notFound } from 'next/navigation';

interface Page {
  id: string;
  slug: string;
  title: string;
  content: string;
  meta_title?: string;
  meta_description?: string;
  meta_keywords?: string;
  page_type: string;
  is_featured: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

async function getPage(slug: string): Promise<Page | null> {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/pages?slug=${slug}`, {
      cache: 'no-store'
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return data.page || null;
  } catch (error) {
    console.error('Error fetching page:', error);
    return null;
  }
}

export async function generateMetadata(): Promise<Metadata> {
  const page = await getPage('privacy-policy');

  if (!page) {
    return {
      title: 'Privacy Policy - Suuqsade Marketplace',
      description: 'Read our privacy policy to understand how we collect, use, and protect your personal information on Suuqsade Marketplace.',
    };
  }

  return {
    title: page.meta_title || page.title,
    description: page.meta_description || `Read our ${page.title} on Suuqsade Marketplace`,
    keywords: page.meta_keywords,
    openGraph: {
      title: page.meta_title || page.title,
      description: page.meta_description || `Read our ${page.title} on Suuqsade Marketplace`,
      type: 'article',
    },
  };
}

export default async function PrivacyPolicyPage() {
  const page = await getPage('privacy-policy');

  if (!page) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <nav className="flex mb-8" aria-label="Breadcrumb">
          <ol className="inline-flex items-center space-x-1 md:space-x-3">
            <li className="inline-flex items-center">
              <a href="/" className="inline-flex items-center text-sm font-medium text-gray-700 hover:text-orange-600">
                <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z"></path>
                </svg>
                Home
              </a>
            </li>
            <li>
              <div className="flex items-center">
                <svg className="w-6 h-6 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd"></path>
                </svg>
                <span className="ml-1 text-sm font-medium text-gray-500 md:ml-2">Privacy Policy</span>
              </div>
            </li>
          </ol>
        </nav>

        {/* Page Content */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">{page.title}</h1>
                <div className="flex items-center space-x-4 text-sm text-gray-500">
                  <span className="flex items-center">
                    <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd"></path>
                    </svg>
                    Last updated: {new Date(page.updated_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>

            <div 
              className="prose prose-lg max-w-none prose-headings:text-gray-900 prose-p:text-gray-700 prose-a:text-orange-600 prose-a:no-underline hover:prose-a:underline prose-strong:text-gray-900 prose-ul:text-gray-700 prose-ol:text-gray-700 prose-li:text-gray-700"
              dangerouslySetInnerHTML={{ __html: page.content }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

