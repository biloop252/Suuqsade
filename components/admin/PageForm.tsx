'use client';

import { useState, useEffect } from 'react';
import { X, Save, Eye, EyeOff, AlertCircle } from 'lucide-react';
import dynamic from 'next/dynamic';
const RichText = dynamic(() => import('./RichTextEditor'), { ssr: false });

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

interface PageFormProps {
  page?: Page | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (page: Page) => void;
}

export default function PageForm({ page, isOpen, onClose, onSave }: PageFormProps) {
  const [formData, setFormData] = useState<Page>({
    slug: '',
    title: '',
    content: '',
    meta_title: '',
    meta_description: '',
    meta_keywords: '',
    page_type: 'static',
    status: 'draft',
    is_featured: false,
    sort_order: 0
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);

  // Debug logging
  useEffect(() => {
    console.log('PageForm props:', { page, isOpen, onClose, onSave });
  }, [page, isOpen, onClose, onSave]);

  useEffect(() => {
    if (page) {
      setFormData(page);
    } else {
      setFormData({
        slug: '',
        title: '',
        content: '',
        meta_title: '',
        meta_description: '',
        meta_keywords: '',
        page_type: 'static',
        status: 'draft',
        is_featured: false,
        sort_order: 0
      });
    }
    setErrors({});
  }, [page, isOpen]);

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

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }

    if (!formData.slug.trim()) {
      newErrors.slug = 'Slug is required';
    } else if (!/^[a-z0-9-]+$/.test(formData.slug)) {
      newErrors.slug = 'Slug can only contain lowercase letters, numbers, and hyphens';
    }

    if (!formData.content.trim()) {
      newErrors.content = 'Content is required';
    }

    if (formData.meta_title && formData.meta_title.length > 60) {
      newErrors.meta_title = 'Meta title should be 60 characters or less';
    }

    if (formData.meta_description && formData.meta_description.length > 160) {
      newErrors.meta_description = 'Meta description should be 160 characters or less';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      await onSave(formData);
      onClose();
    } catch (error) {
      console.error('Error saving page:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleContentChange = (content: string) => {
    setFormData(prev => ({ ...prev, content }));
  };

  console.log('PageForm render - isOpen:', isOpen, 'page:', page?.title || 'new page');

  if (!isOpen) {
    console.log('PageForm not rendering - isOpen is false');
    return null;
  }

  console.log('PageForm rendering modal');
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose}></div>

        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
          <form onSubmit={handleSubmit}>
            <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  {page ? 'Edit Page' : 'Create New Page'}
                </h3>
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => setPreviewMode(!previewMode)}
                    className="inline-flex items-center px-3 py-1 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
                  >
                    {previewMode ? <EyeOff className="h-4 w-4 mr-1" /> : <Eye className="h-4 w-4 mr-1" />}
                    {previewMode ? 'Edit' : 'Preview'}
                  </button>
                  <button
                    type="button"
                    onClick={onClose}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>
              </div>

              {previewMode ? (
                <div className="space-y-4">
                  <div className="border rounded-lg p-6">
                    <h1 className="text-3xl font-bold text-gray-900 mb-4">{formData.title}</h1>
                    <div 
                      className="prose max-w-none"
                      dangerouslySetInnerHTML={{ __html: formData.content }}
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Basic Information */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Title *
                      </label>
                      <input
                        type="text"
                        value={formData.title}
                        onChange={(e) => handleTitleChange(e.target.value)}
                        className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent ${
                          errors.title ? 'border-red-300' : 'border-gray-300'
                        }`}
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
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Slug *
                      </label>
                      <input
                        type="text"
                        value={formData.slug}
                        onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                        className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent ${
                          errors.slug ? 'border-red-300' : 'border-gray-300'
                        }`}
                        placeholder="page-slug"
                      />
                      {errors.slug && (
                        <p className="mt-1 text-sm text-red-600 flex items-center">
                          <AlertCircle className="h-4 w-4 mr-1" />
                          {errors.slug}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Page Settings */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Page Type
                      </label>
                      <select
                        value={formData.page_type}
                        onChange={(e) => setFormData(prev => ({ ...prev, page_type: e.target.value as any }))}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      >
                        <option value="static">Static</option>
                        <option value="legal">Legal</option>
                        <option value="policy">Policy</option>
                        <option value="info">Info</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Status
                      </label>
                      <select
                        value={formData.status}
                        onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as any }))}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      >
                        <option value="draft">Draft</option>
                        <option value="published">Published</option>
                        <option value="archived">Archived</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Sort Order
                      </label>
                      <input
                        type="number"
                        value={formData.sort_order}
                        onChange={(e) => setFormData(prev => ({ ...prev, sort_order: parseInt(e.target.value) || 0 }))}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        placeholder="0"
                      />
                    </div>
                  </div>

                  {/* Featured Toggle */}
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="is_featured"
                      checked={formData.is_featured}
                      onChange={(e) => setFormData(prev => ({ ...prev, is_featured: e.target.checked }))}
                      className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                    />
                    <label htmlFor="is_featured" className="ml-2 block text-sm text-gray-900">
                      Mark as featured page
                    </label>
                  </div>

                  {/* Content */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Content *
                    </label>
                    <RichText value={formData.content} onChange={handleContentChange} className={` ${errors.content ? '' : ''}`} />
                    {errors.content && (
                      <p className="mt-1 text-sm text-red-600 flex items-center">
                        <AlertCircle className="h-4 w-4 mr-1" />
                        {errors.content}
                      </p>
                    )}
                    <p className="mt-1 text-sm text-gray-500">
                      Use the editor toolbar to format content. The HTML will be saved.
                    </p>
                  </div>

                  {/* SEO Fields */}
                  <div className="space-y-4">
                    <h4 className="text-lg font-medium text-gray-900">SEO Settings</h4>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Meta Title
                      </label>
                      <input
                        type="text"
                        value={formData.meta_title || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, meta_title: e.target.value }))}
                        className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent ${
                          errors.meta_title ? 'border-red-300' : 'border-gray-300'
                        }`}
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
                        <p className="text-sm text-gray-500 ml-auto">
                          {(formData.meta_title || '').length}/60
                        </p>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Meta Description
                      </label>
                      <textarea
                        value={formData.meta_description || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, meta_description: e.target.value }))}
                        rows={3}
                        className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent ${
                          errors.meta_description ? 'border-red-300' : 'border-gray-300'
                        }`}
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
                        <p className="text-sm text-gray-500 ml-auto">
                          {(formData.meta_description || '').length}/160
                        </p>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Meta Keywords
                      </label>
                      <input
                        type="text"
                        value={formData.meta_keywords || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, meta_keywords: e.target.value }))}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        placeholder="keyword1, keyword2, keyword3"
                      />
                      <p className="mt-1 text-sm text-gray-500">
                        Separate keywords with commas
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
              <button
                type="submit"
                disabled={loading}
                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-orange-600 text-base font-medium text-white hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                {page ? 'Update Page' : 'Create Page'}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
