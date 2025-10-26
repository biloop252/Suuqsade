import { Metadata } from 'next';
import { notFound } from 'next/navigation';
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
  is_featured: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

async function getPage(slug: string): Promise<Page | null> {
  try {
    const supabase = createClient();
    const { data: page, error } = await supabase
      .from('pages')
      .select('*')
      .eq('slug', slug)
      .eq('status', 'published')
      .single();

    if (error) return null;
    return page as unknown as Page;
  } catch (error) {
    return null;
  }
}

export async function generateMetadata(): Promise<Metadata> {
  const page = await getPage('terms-of-service');

  if (!page) {
    return {
      title: 'Terms of Service - Suuqsade Marketplace',
      description: 'Read our terms of service to understand the rules and regulations for using Suuqsade Marketplace.',
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

export default async function TermsOfServicePage() {
  const page = await getPage('terms-of-service');

  if (!page) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Title Header */}
        <h1 className="text-4xl font-bold text-gray-900 mb-6">{page.title}</h1>

        {/* Content */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-8 py-8">
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

