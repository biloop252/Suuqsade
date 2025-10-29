'use client';

import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { HomepageSection, HomepageSectionType, Brand, Category } from '@/types/database';
import { 
  Plus, Edit, Trash2, Search, Upload, X, Image as ImageIcon, Tag as TagIcon, Layers, FolderTree 
} from 'lucide-react';
import Pagination from './Pagination';
import HierarchicalCategorySelector from './HierarchicalCategorySelector';

interface ProductTag {
  id: string;
  name: string;
  slug: string;
}

export default function HomepageSectionsManagement() {
  const [sections, setSections] = useState<HomepageSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingSection, setEditingSection] = useState<HomepageSection | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState<HomepageSection | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [tags, setTags] = useState<ProductTag[]>([]);

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    try {
      setLoading(true);

      const [secRes, catRes, brandRes, tagRes] = await Promise.all([
        supabase
          .from('homepage_sections')
          .select('*')
          .order('display_order', { ascending: true })
          .order('created_at', { ascending: false }),
        supabase
          .from('categories')
          .select('*')
          .eq('is_active', true)
          .order('name'),
        supabase
          .from('brands')
          .select('*')
          .eq('is_active', true)
          .order('name'),
        supabase
          .from('product_tags')
          .select('*')
          .order('name')
      ]);

      if (secRes.error) {
        console.error('Error fetching sections:', secRes.error);
      } else {
        setSections(secRes.data || []);
      }

      if (!catRes.error) setCategories(catRes.data || []);
      if (!brandRes.error) setBrands(brandRes.data || []);
      if (!tagRes.error) setTags(tagRes.data || []);
    } catch (e) {
      console.error('Error:', e);
    } finally {
      setLoading(false);
    }
  };

  const filteredSections = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return sections;
    return sections.filter(s =>
      s.title.toLowerCase().includes(term) ||
      (s.subtitle || '').toLowerCase().includes(term) ||
      (s.description || '').toLowerCase().includes(term)
    );
  }, [sections, searchTerm]);

  const totalItems = filteredSections.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedSections = filteredSections.slice(startIndex, endIndex);

  useEffect(() => { setCurrentPage(1); }, [searchTerm, itemsPerPage]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Homepage Sections</h1>
          <p className="mt-1 text-sm text-gray-500">Create dynamic product sections for the homepage</p>
        </div>
        <button
          onClick={() => { setEditingSection(null); setShowModal(true); }}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-orange-600 hover:bg-orange-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Section
        </button>
      </div>

      <div className="bg-white p-4 rounded-lg shadow">
        <div className="flex space-x-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search sections..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500 w-full"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Sections</h3>
        </div>
        <div className="divide-y divide-gray-200">
          {loading ? (
            <div className="p-6 space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-16 bg-gray-100 rounded animate-pulse" />
              ))}
            </div>
          ) : paginatedSections.length > 0 ? (
            paginatedSections.map((s) => {
              const targetLabel = (() => {
                if (s.section_type === 'category') {
                  const cat = categories.find(c => c.id === s.category_id);
                  return cat ? `Category: ${cat.name}` : 'Category: —';
                }
                if (s.section_type === 'brand') {
                  const br = brands.find(b => b.id === s.brand_id);
                  return br ? `Brand: ${br.name}` : 'Brand: —';
                }
                if (s.section_type === 'tag') {
                  const t = tags.find(t => t.id === s.tag_id);
                  return t ? `Tag: ${t.name}` : 'Tag: —';
                }
                if (s.section_type === 'popular') return 'Popular products';
                if (s.section_type === 'trending') return 'Trending products';
                if (s.section_type === 'new_arrivals') return 'New arrivals';
                return '';
              })();

              return (
                <div key={s.id} className="flex items-center justify-between p-4 hover:bg-gray-50">
                  <div className="flex items-center space-x-4">
                    <div className="h-12 w-20 bg-gray-100 rounded overflow-hidden flex items-center justify-center">
                      {s.background_image_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={s.background_image_url} alt="bg" className="h-full w-full object-cover" />
                      ) : (
                        <ImageIcon className="h-5 w-5 text-gray-400" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <h3 className="font-medium text-gray-900">{s.title}</h3>
                        {!s.is_active && (
                          <span className="text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-600 border">Inactive</span>
                        )}
                      </div>
                      <div className="text-sm text-gray-600 capitalize">{s.section_type.replace('_', ' ')}</div>
                      <div className="text-xs text-gray-500">{targetLabel}</div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => { setEditingSection(s); setShowModal(true); }}
                      className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setShowDeleteModal(s)}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="p-6 text-center text-gray-500">No sections yet.</div>
          )}
        </div>

        {totalPages > 1 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalItems}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
            onItemsPerPageChange={(n) => setItemsPerPage(n)}
            showItemsPerPage={true}
          />
        )}
      </div>

      {showModal && (
        <SectionModal
          section={editingSection}
          categories={categories}
          brands={brands}
          tags={tags}
          onClose={() => setShowModal(false)}
          onSaved={async () => { setShowModal(false); await fetchAll(); }}
        />
      )}

      {showDeleteModal && (
        <DeleteSectionModal
          section={showDeleteModal}
          onClose={() => setShowDeleteModal(null)}
          onDeleted={async () => { setShowDeleteModal(null); await fetchAll(); }}
        />
      )}
    </div>
  );
}

function SectionModal({
  section,
  categories,
  brands,
  tags,
  onClose,
  onSaved,
}: {
  section: HomepageSection | null;
  categories: Category[];
  brands: Brand[];
  tags: ProductTag[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    title: section?.title || '',
    subtitle: section?.subtitle || '',
    description: section?.description || '',
    section_type: section?.section_type || 'category' as HomepageSectionType,
    background_image_url: section?.background_image_url || '',
    background_color: section?.background_color || '#ffffff',
    text_color: section?.text_color || '#000000',
    category_id: section?.category_id || '',
    brand_id: section?.brand_id || '',
    tag_id: section?.tag_id || '',
    product_limit: section?.product_limit || 12,
    display_order: section?.display_order || 0,
    is_active: section?.is_active ?? true,
  });
  const [saving, setSaving] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(section?.background_image_url || null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!f.type.startsWith('image/')) { alert('Please select an image'); return; }
    if (f.size > 8 * 1024 * 1024) { alert('Max size is 8MB'); return; }
    setSelectedFile(f);
    setPreview(URL.createObjectURL(f));
  };

  const uploadImage = async (file: File): Promise<string | null> => {
    try {
      setUploading(true);
      const ext = file.name.split('.').pop();
      const name = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error } = await supabase.storage
        .from('homepage-sections')
        .upload(name, file, { cacheControl: '3600', upsert: false });
      if (error) { console.error('Upload error', error); return null; }
      const { data: { publicUrl } } = supabase.storage
        .from('homepage-sections')
        .getPublicUrl(name);
      return publicUrl;
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      let bgUrl = form.background_image_url;
      if (selectedFile) {
        const uploaded = await uploadImage(selectedFile);
        if (!uploaded) { alert('Image upload failed'); setSaving(false); return; }
        bgUrl = uploaded;
      }

      const payload = {
        ...form,
        background_image_url: bgUrl || null,
        category_id: form.section_type === 'category' && form.category_id ? form.category_id : null,
        brand_id: form.section_type === 'brand' && form.brand_id ? form.brand_id : null,
        tag_id: form.section_type === 'tag' && form.tag_id ? form.tag_id : null,
      } as any;

      if (section) {
        const { error } = await supabase
          .from('homepage_sections')
          .update(payload)
          .eq('id', section.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('homepage_sections')
          .insert([payload]);
        if (error) throw error;
      }

      onSaved();
    } catch (err) {
      console.error('Save error:', err);
      alert('Failed to save section');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-12 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">{section ? 'Edit Section' : 'Add Section'}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="h-5 w-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Title</label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                required
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-orange-500 focus:border-orange-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Type</label>
              <select
                value={form.section_type}
                onChange={(e) => setForm({ ...form, section_type: e.target.value as HomepageSectionType })}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-orange-500 focus:border-orange-500 capitalize"
              >
                <option value="category">Category</option>
                <option value="brand">Brand</option>
                <option value="tag">Tag</option>
                <option value="popular">Popular</option>
                <option value="trending">Trending</option>
                <option value="new_arrivals">New arrivals</option>
                <option value="best_selling">Best selling</option>
                <option value="recommended">Recommended</option>
                <option value="flash_deals">Flash deals</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700">Subtitle</label>
              <input
                type="text"
                value={form.subtitle}
                onChange={(e) => setForm({ ...form, subtitle: e.target.value })}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-orange-500 focus:border-orange-500"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700">Description</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={3}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-orange-500 focus:border-orange-500"
              />
            </div>
            {form.section_type === 'category' && (
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center"><FolderTree className="h-4 w-4 mr-1" /> Category</label>
                <HierarchicalCategorySelector
                  value={form.category_id || null}
                  onChange={(id) => setForm({ ...form, category_id: id || '' })}
                />
              </div>
            )}
            {form.section_type === 'brand' && (
              <div>
                <label className="block text-sm font-medium text-gray-700">Brand</label>
                <select
                  value={form.brand_id}
                  onChange={(e) => setForm({ ...form, brand_id: e.target.value })}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                >
                  <option value="">Select brand</option>
                  {brands.map(b => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>
            )}
            {form.section_type === 'tag' && (
              <div>
                <label className="block text-sm font-medium text-gray-700">Tag</label>
                <select
                  value={form.tag_id}
                  onChange={(e) => setForm({ ...form, tag_id: e.target.value })}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                >
                  <option value="">Select tag</option>
                  {tags.map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700">Product limit</label>
              <input
                type="number"
                min={1}
                max={48}
                value={form.product_limit}
                onChange={(e) => setForm({ ...form, product_limit: Number(e.target.value || 0) })}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-orange-500 focus:border-orange-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Display order</label>
              <input
                type="number"
                value={form.display_order}
                onChange={(e) => setForm({ ...form, display_order: Number(e.target.value || 0) })}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-orange-500 focus:border-orange-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Background color</label>
              <input
                type="text"
                value={form.background_color}
                onChange={(e) => setForm({ ...form, background_color: e.target.value })}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                placeholder="#ffffff"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Text color</label>
              <input
                type="text"
                value={form.text_color}
                onChange={(e) => setForm({ ...form, text_color: e.target.value })}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                placeholder="#000000"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Background image</label>
              <div className="flex items-center space-x-4">
                <div className="h-16 w-28 bg-gray-100 rounded overflow-hidden flex items-center justify-center">
                  {preview ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={preview} alt="preview" className="h-full w-full object-cover" />
                  ) : (
                    <ImageIcon className="h-5 w-5 text-gray-400" />
                  )}
                </div>
                <label className="relative cursor-pointer bg-white rounded-md font-medium text-orange-600 hover:text-orange-500">
                  <span className="px-3 py-2 inline-block border rounded">{uploading ? 'Uploading...' : 'Upload image'}</span>
                  <input type="file" className="sr-only" accept="image/*" onChange={handleFileChange} />
                </label>
                <button
                  type="button"
                  onClick={() => { setSelectedFile(null); setPreview(null); setForm({ ...form, background_image_url: '' }); }}
                  className="px-3 py-2 text-sm text-gray-600 hover:text-gray-900"
                >
                  Remove
                </button>
              </div>
            </div>
            <div className="md:col-span-2">
              <label className="inline-flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={form.is_active}
                  onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                  className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                />
                <span className="text-sm text-gray-700">Active</span>
              </label>
            </div>
          </div>
          <div className="flex justify-end space-x-2 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">Cancel</button>
            <button type="submit" disabled={saving || uploading} className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700 disabled:opacity-50">
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function DeleteSectionModal({ section, onClose, onDeleted }: { section: HomepageSection; onClose: () => void; onDeleted: () => void }) {
  const [loading, setLoading] = useState(false);
  const handleDelete = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('homepage_sections')
        .update({ is_active: false })
        .eq('id', section.id);
      if (error) throw error;
      onDeleted();
    } catch (e) {
      console.error('Delete error:', e);
      alert('Failed to delete');
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-24 mx-auto p-5 border w-full max-w-md shadow-lg rounded-md bg-white">
        <h3 className="text-lg font-medium text-gray-900 mb-2">Delete Section</h3>
        <p className="text-sm text-gray-600 mb-6">Are you sure you want to delete "{section.title}"?</p>
        <div className="flex justify-end space-x-2">
          <button onClick={onClose} className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">Cancel</button>
          <button onClick={handleDelete} disabled={loading} className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 disabled:opacity-50">{loading ? 'Deleting...' : 'Delete'}</button>
        </div>
      </div>
    </div>
  );
}


