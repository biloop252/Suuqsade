import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase';

// Don't cache so newly published pages show up and we don't serve stale 404s
export const dynamic = 'force-dynamic';

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

interface PageProps {
  params: {
    slug: string;
  };
}

function normalizeSlug(slug: string): string {
  try {
    const decoded = decodeURIComponent(slug).trim().toLowerCase();
    return decoded.replace(/\s+/g, '-').replace(/-+/g, '-').replace(/^-+|-+$/g, '');
  } catch {
    return slug.trim().toLowerCase().replace(/\s+/g, '-').replace(/-+/g, '-').replace(/^-+|-+$/g, '');
  }
}

async function getPage(slug: string): Promise<Page | null> {
  try {
    const normalized = normalizeSlug(slug);
    if (!normalized) return null;

    const supabase = createClient();
    // Case-insensitive slug match so /My-Page matches DB "my-page"
    const { data: page, error } = await supabase
      .from('pages')
      .select('*')
      .eq('status', 'published')
      .ilike('slug', normalized)
      .maybeSingle();

    if (error) {
      return null;
    }

    return page as unknown as Page;
  } catch (error) {
    return null;
  }
}

async function getRelatedPages(excludeId: string): Promise<Page[]> {
  try {
    const supabase = createClient();
    const { data: pages, error } = await supabase
      .from('pages')
      .select('*')
      .eq('status', 'published')
      .neq('id', excludeId)
      .order('sort_order', { ascending: true })
      .order('updated_at', { ascending: false })
      .limit(6);

    if (error) return [];
    return (pages || []) as unknown as Page[];
  } catch (error) {
    return [];
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const page = await getPage(params.slug);

  if (!page) {
    return {
      title: 'Page Not Found',
    };
  }

  return {
    title: page.meta_title || page.title,
    description: page.meta_description || `Read about ${page.title} on Suuqsade Marketplace`,
    keywords: page.meta_keywords,
    openGraph: {
      title: page.meta_title || page.title,
      description: page.meta_description || `Read about ${page.title} on Suuqsade Marketplace`,
      type: 'article',
    },
  };
}

export default async function DynamicPage({ params }: PageProps) {
  const page = await getPage(params.slug);

  if (!page) {
    notFound();
  }

  const relatedPages = await getRelatedPages(page.id);

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

        {/* Related Pages - other published pages from the CMS */}
        {relatedPages.length > 0 && (
          <div className="mt-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Related Pages</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {relatedPages.map((p) => (
                <a
                  key={p.id}
                  href={`/${p.slug}`}
                  className="block p-4 bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
                >
                  <h3 className="font-medium text-gray-900 mb-2">{p.title}</h3>
                  <p className="text-sm text-gray-600">
                    {p.meta_description || 'Learn more about this topic.'}
                  </p>
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
