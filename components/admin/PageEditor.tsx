'use client';

import { useEffect, useMemo, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle, Save, ArrowLeft, Eye, EyeOff } from 'lucide-react';
import RichTextEditor, { RichTextEditorHandle } from './RichTextEditor';

interface Page {
  id?: string;
  slug: string;
  title: string;
  content: string;
  meta_title?: string;
  meta_description?: string;
  meta_keywords?: string;
  page_type: 'static' | 'legal' | 'policy' | 'info';
  status: 'draft' | 'published' | 'archived';
  is_featured: boolean;
  sort_order: number;
}

interface PageEditorProps {
  mode: 'create' | 'edit';
  initialPage?: Page | null;
  pageId?: string;
}

export default function PageEditor({ mode, initialPage, pageId }: PageEditorProps) {
  const router = useRouter();
  const [formData, setFormData] = useState<Page>(() => initialPage || {
    slug: '',
    title: '',
    content: '',
    meta_title: '',
    meta_description: '',
    meta_keywords: '',
    page_type: 'static',
    status: 'draft',
    is_featured: false,
    sort_order: 0,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const isEdit = mode === 'edit';
  const editorRef = useRef<RichTextEditorHandle | null>(null);

  // On edit without initialPage, fetch client-side
  useEffect(() => {
    let ignore = false;
    const fetchPage = async () => {
      if (isEdit && !initialPage && pageId) {
        try {
          const headers: Record<string, string> = {};
          if (typeof window !== 'undefined' && localStorage.getItem('admin_session') === 'true') {
            headers['x-test-admin'] = 'true';
          }
          const res = await fetch(`/api/admin/pages/${pageId}`, { headers });
          if (res.ok) {
            const data = await res.json();
            if (!ignore) setFormData(data.page);
          }
        } catch (_) {}
      }
    };
    fetchPage();
    return () => { ignore = true; };
  }, [isEdit, initialPage, pageId]);

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  };

  const handleTitleChange = (title: string) => {
    const slug = generateSlug(title);
    setFormData(prev => ({
      ...prev,
      title,
      slug: prev.slug || slug
    }));
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.title.trim()) newErrors.title = 'Title is required';
    if (!formData.slug.trim()) newErrors.slug = 'Slug is required';
    else if (!/^[a-z0-9-]+$/.test(formData.slug)) newErrors.slug = 'Use lowercase letters, numbers, hyphens';
    if (!formData.content.trim()) newErrors.content = 'Content is required';
    if (formData.meta_title && formData.meta_title.length > 60) newErrors.meta_title = 'Max 60 characters';
    if (formData.meta_description && formData.meta_description.length > 160) newErrors.meta_description = 'Max 160 characters';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const headersWithAdmin = useMemo(() => {
    const isTestAdmin = typeof window !== 'undefined' && localStorage.getItem('admin_session') === 'true';
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (isTestAdmin) headers['x-test-admin'] = 'true';
    return headers;
  }, []);

  const handleSave = async () => {
    if (!validateForm()) return;
    setLoading(true);
    try {
      // Upload pending images first
      const pending = editorRef.current?.getPendingImages() || [];
      for (const item of pending) {
        const form = new FormData();
        form.append('file', item.file);
        form.append('image_type', 'page');
        form.append('alt_text', item.file.name);
        form.append('is_active', 'true');
        const res = await fetch('/api/admin/settings/images', { method: 'POST', body: form });
        const data = await res.json();
        if (res.ok && data?.image?.image_url) {
          editorRef.current?.replacePendingImage(item.id, data.image.image_url);
        } else {
          throw new Error(data?.error || 'Image upload failed');
        }
      }

      // Refresh content after replacements
      const html = editorRef.current?.getHtml() || formData.content;
      const payload = { ...formData, content: html };

      if (isEdit && pageId) {
        const res = await fetch(`/api/admin/pages/${pageId}`, {
          method: 'PUT',
          headers: headersWithAdmin,
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error('Failed to update page');
      } else {
        const res = await fetch('/api/admin/pages', {
          method: 'POST',
          headers: headersWithAdmin,
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error('Failed to create page');
      }
      router.push('/admin/pages');
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.push('/admin/pages')}
            className="inline-flex items-center px-3 py-1.5 rounded-md border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
          >
            <ArrowLeft className="h-4 w-4 mr-1.5" />
            Back
          </button>
          <h1 className="text-2xl font-bold text-gray-900">{isEdit ? 'Edit Page' : 'Create Page'}</h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setPreviewMode(!previewMode)}
            className="inline-flex items-center px-3 py-2 rounded-md border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
          >
            {previewMode ? <EyeOff className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
            {previewMode ? 'Edit' : 'Preview'}
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={handleSave}
            className="inline-flex items-center px-4 py-2 rounded-md bg-orange-600 text-white hover:bg-orange-700 disabled:opacity-50"
          >
            {loading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Save
          </button>
        </div>
      </div>

      {previewMode ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-3xl font-bold mb-4">{formData.title || 'Untitled Page'}</h2>
          <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: formData.content }} />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent ${errors.title ? 'border-red-300' : 'border-gray-300'}`}
                  placeholder="Enter page title"
                />
                {errors.title && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {errors.title}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Slug *</label>
                <input
                  type="text"
                  value={formData.slug}
                  onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                  className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent ${errors.slug ? 'border-red-300' : 'border-gray-300'}`}
                  placeholder="page-slug"
                />
                {errors.slug && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {errors.slug}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Content *</label>
                <RichTextEditor ref={editorRef} value={formData.content} onChange={(html) => setFormData(prev => ({ ...prev, content: html }))} />
                {errors.content && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {errors.content}
                  </p>
                )}
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-4">
              <h3 className="text-lg font-semibold">SEO</h3>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Meta Title</label>
                <input
                  type="text"
                  value={formData.meta_title || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, meta_title: e.target.value }))}
                  className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent ${errors.meta_title ? 'border-red-300' : 'border-gray-300'}`}
                  placeholder="SEO title (60 characters max)"
                  maxLength={60}
                />
                <div className="flex justify-between mt-1">
                  {errors.meta_title && (
                    <p className="text-sm text-red-600 flex items-center">
                      <AlertCircle className="h-4 w-4 mr-1" />
                      {errors.meta_title}
                    </p>
                  )}
                  <p className="text-sm text-gray-500 ml-auto">{(formData.meta_title || '').length}/60</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Meta Description</label>
                <textarea
                  rows={3}
                  value={formData.meta_description || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, meta_description: e.target.value }))}
                  className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent ${errors.meta_description ? 'border-red-300' : 'border-gray-300'}`}
                  placeholder="SEO description (160 characters max)"
                  maxLength={160}
                />
                <div className="flex justify-between mt-1">
                  {errors.meta_description && (
                    <p className="text-sm text-red-600 flex items-center">
                      <AlertCircle className="h-4 w-4 mr-1" />
                      {errors.meta_description}
                    </p>
                  )}
                  <p className="text-sm text-gray-500 ml-auto">{(formData.meta_description || '').length}/160</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Meta Keywords</label>
                <input
                  type="text"
                  value={formData.meta_keywords || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, meta_keywords: e.target.value }))}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="keyword1, keyword2, keyword3"
                />
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-4">
              <h3 className="text-lg font-semibold">Settings</h3>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Page Type</label>
                <select
                  value={formData.page_type}
                  onChange={(e) => setFormData(prev => ({ ...prev, page_type: e.target.value as Page['page_type'] }))}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                >
                  <option value="static">Static</option>
                  <option value="legal">Legal</option>
                  <option value="policy">Policy</option>
                  <option value="info">Info</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as Page['status'] }))}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                  <option value="archived">Archived</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Sort Order</label>
                <input
                  type="number"
                  value={formData.sort_order}
                  onChange={(e) => setFormData(prev => ({ ...prev, sort_order: parseInt(e.target.value) || 0 }))}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="0"
                />
              </div>

              <div className="flex items-center">
                <input
                  id="is_featured"
                  type="checkbox"
                  checked={formData.is_featured}
                  onChange={(e) => setFormData(prev => ({ ...prev, is_featured: e.target.checked }))}
                  className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                />
                <label htmlFor="is_featured" className="ml-2 text-sm text-gray-900">Featured page</label>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


