import PromotionalMediaDisplay from '@/components/promotional/PromotionalMediaDisplay';
import PromotionalBanner from '@/components/promotional/PromotionalBanner';
import SidebarPromotional from '@/components/promotional/SidebarPromotional';

export default function PromotionalMediaDemoPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-center mb-8">Promotional Media System Demo</h1>
        
        <div className="space-y-8">
          {/* Homepage Top Slider */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">Homepage Top Slider</h2>
            <PromotionalMediaDisplay 
              position="homepage_top" 
              className="h-64"
              maxItems={5}
            />
          </section>

          {/* Homepage Middle Banner */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">Homepage Middle Banner</h2>
            <PromotionalBanner 
              position="homepage_middle" 
              className="h-32"
              showTitle={true}
              showDescription={true}
            />
          </section>

          {/* Homepage Bottom Banner */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">Homepage Bottom Banner</h2>
            <PromotionalBanner 
              position="homepage_bottom" 
              className="h-32"
              showTitle={true}
              showDescription={true}
            />
          </section>

          {/* Category Page Banner */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">Category Page Banner</h2>
            <PromotionalBanner 
              position="category_page" 
              className="h-48"
              showTitle={true}
              showDescription={true}
            />
          </section>

          {/* Sidebar Promotional */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">Sidebar Promotional</h2>
            <div className="max-w-xs">
              <SidebarPromotional maxItems={3} />
            </div>
          </section>

          {/* Footer Banner */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">Footer Banner</h2>
            <PromotionalBanner 
              position="footer" 
              className="h-24"
              showTitle={true}
              showDescription={false}
            />
          </section>
        </div>

        <div className="mt-12 p-6 bg-blue-50 rounded-lg">
          <h3 className="text-lg font-semibold mb-2">How to Use:</h3>
          <ol className="list-decimal list-inside space-y-2 text-sm">
            <li>Go to <code className="bg-blue-100 px-2 py-1 rounded">/admin/promotional-media</code> to manage promotional media</li>
            <li>Create banners, sliders, or popups with different positions</li>
            <li>Set start and end dates for automatic scheduling</li>
            <li>Upload images (desktop and mobile versions)</li>
            <li>Add links, button text, and styling options</li>
            <li>Activate/deactivate promotional media as needed</li>
          </ol>
        </div>
      </div>
    </div>
  );
}



