'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import PromotionalMediaDisplay from '@/components/promotional/PromotionalMediaDisplay';
import PromotionalBanner from '@/components/promotional/PromotionalBanner';

export default function TestPromotionalPage() {
  const [testResults, setTestResults] = useState<any>({});

  useEffect(() => {
    testPromotionalMedia();
  }, []);

  const testPromotionalMedia = async () => {
    const positions = ['homepage_top', 'homepage_middle', 'homepage_bottom', 'category_page', 'sidebar', 'footer'];
    const results: any = {};

    for (const position of positions) {
      try {
        const { data, error } = await supabase
          .from('promotional_media')
          .select('*')
          .eq('banner_position', position)
          .eq('is_active', true);

        if (error) {
          results[position] = { error: error.message, count: 0 };
        } else {
          results[position] = { success: true, count: data?.length || 0, data: data };
        }
      } catch (err: any) {
        results[position] = { error: err.message, count: 0 };
      }
    }

    setTestResults(results);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-center mb-8">Promotional Media Test</h1>
        
        {/* Test Results */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Database Test Results</h2>
          <div className="grid grid-cols-2 gap-4">
            {Object.entries(testResults).map(([position, result]: [string, any]) => (
              <div key={position} className="border rounded p-3">
                <h3 className="font-semibold">{position}</h3>
                {result.error ? (
                  <p className="text-red-600 text-sm">❌ {result.error}</p>
                ) : (
                  <p className="text-green-600 text-sm">✅ {result.count} items found</p>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Visual Tests */}
        <div className="space-y-8">
          <div>
            <h2 className="text-xl font-semibold mb-4">Homepage Top (Slider)</h2>
            <PromotionalMediaDisplay position="homepage_top" className="h-64" maxItems={3} />
          </div>

          <div>
            <h2 className="text-xl font-semibold mb-4">Homepage Middle Banner</h2>
            <PromotionalBanner position="homepage_middle" className="h-32" />
          </div>

          <div>
            <h2 className="text-xl font-semibold mb-4">Homepage Bottom Banner</h2>
            <PromotionalBanner position="homepage_bottom" className="h-32" />
          </div>

          <div>
            <h2 className="text-xl font-semibold mb-4">Category Page Banner</h2>
            <PromotionalBanner position="category_page" className="h-48" />
          </div>

          <div>
            <h2 className="text-xl font-semibold mb-4">Footer Banner</h2>
            <PromotionalBanner position="footer" className="h-24" />
          </div>
        </div>

        <div className="mt-8 text-center">
          <a 
            href="/admin/promotional-media" 
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors mr-4"
          >
            Go to Admin Panel
          </a>
          <a 
            href="/" 
            className="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors"
          >
            Go to Homepage
          </a>
        </div>
      </div>
    </div>
  );
}








