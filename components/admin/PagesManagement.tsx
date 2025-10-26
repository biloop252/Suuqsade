'use client';

import { useState, useEffect } from 'react';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  EyeOff, 
  Search, 
  Filter,
  FileText,
  Globe,
  Lock,
  Calendar,
  User
} from 'lucide-react';
import PageForm from './PageForm';
import Link from 'next/link';

interface Page {
  id: string;
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
  created_at: string;
  updated_at: string;
  created_by?: string;
  updated_by?: string;
}

interface PagesManagementProps {
  onPageSelect?: (page: Page) => void;
}

export default function PagesManagement({ onPageSelect }: PagesManagementProps) {
  const [pages, setPages] = useState<Page[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingPage, setEditingPage] = useState<Page | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    fetchPages();
  }, [currentPage, searchTerm, statusFilter, typeFilter]);

  const fetchPages = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: itemsPerPage.toString(),
        search: searchTerm,
        status: statusFilter,
        type: typeFilter
      });

      const response = await fetch(`/api/admin/pages?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch pages');
      }

      const data = await response.json();
      setPages(data.pages || []);
      setTotalPages(data.totalPages || 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (pageId: string) => {
    if (!confirm('Are you sure you want to delete this page?')) {
      return;
    }

    try {
      // Check if we're using test admin
      const isTestAdmin = localStorage.getItem('admin_session') === 'true';
      
      const headers: Record<string, string> = {};
      
      if (isTestAdmin) {
        headers['x-test-admin'] = 'true';
      }
      
      const response = await fetch(`/api/admin/pages/${pageId}`, {
        method: 'DELETE',
        headers,
      });

      if (!response.ok) {
        throw new Error('Failed to delete page');
      }

      await fetchPages();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete page');
    }
  };

  const handleStatusToggle = async (pageId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'published' ? 'draft' : 'published';
    
    try {
      // Check if we're using test admin
      const isTestAdmin = localStorage.getItem('admin_session') === 'true';
      
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      
      if (isTestAdmin) {
        headers['x-test-admin'] = 'true';
      }
      
      const response = await fetch(`/api/admin/pages/${pageId}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        throw new Error('Failed to update page status');
      }

      await fetchPages();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update page status');
    }
  };

  const handleFeaturedToggle = async (pageId: string, currentFeatured: boolean) => {
    try {
      // Check if we're using test admin
      const isTestAdmin = localStorage.getItem('admin_session') === 'true';
      
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      
      if (isTestAdmin) {
        headers['x-test-admin'] = 'true';
      }
      
      const response = await fetch(`/api/admin/pages/${pageId}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ is_featured: !currentFeatured }),
      });

      if (!response.ok) {
        throw new Error('Failed to update page featured status');
      }

      await fetchPages();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update page featured status');
    }
  };

  const handleCreatePage = async (pageData: any) => {
    try {
      // Check if we're using test admin
      const adminSession = localStorage.getItem('admin_session');
      const adminUser = localStorage.getItem('admin_user');
      const adminProfile = localStorage.getItem('admin_profile');
      
      console.log('🔍 PagesManagement - adminSession:', adminSession);
      console.log('🔍 PagesManagement - adminUser:', adminUser);
      console.log('🔍 PagesManagement - adminProfile:', adminProfile);
      
      const isTestAdmin = adminSession === 'true';
      console.log('🔍 PagesManagement - isTestAdmin:', isTestAdmin);
      
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      
      if (isTestAdmin) {
        headers['x-test-admin'] = 'true';
        console.log('✅ Adding x-test-admin header');
      } else {
        console.log('❌ Not adding x-test-admin header - adminSession is not "true"');
      }
      
      console.log('🔍 Headers being sent:', headers);
      
      const response = await fetch('/api/admin/pages', {
        method: 'POST',
        headers,
        body: JSON.stringify(pageData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create page');
      }

      await fetchPages();
      setShowCreateModal(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create page');
      throw err; // Re-throw to let PageForm handle the error
    }
  };

  const handleUpdatePage = async (pageData: any) => {
    if (!pageData.id) {
      throw new Error('Page ID is required for updates');
    }

    try {
      // Check if we're using test admin
      const isTestAdmin = localStorage.getItem('admin_session') === 'true';
      
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      
      if (isTestAdmin) {
        headers['x-test-admin'] = 'true';
      }
      
      const response = await fetch(`/api/admin/pages/${pageData.id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(pageData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update page');
      }

      await fetchPages();
      setEditingPage(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update page');
      throw err; // Re-throw to let PageForm handle the error
    }
  };

  const getStatusBadge = (status: string) => {
    const statusClasses = {
      published: 'bg-green-100 text-green-800',
      draft: 'bg-yellow-100 text-yellow-800',
      archived: 'bg-gray-100 text-gray-800'
    };

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusClasses[status as keyof typeof statusClasses]}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const getTypeBadge = (type: string) => {
    const typeClasses = {
      static: 'bg-blue-100 text-blue-800',
      legal: 'bg-red-100 text-red-800',
      policy: 'bg-purple-100 text-purple-800',
      info: 'bg-green-100 text-green-800'
    };

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${typeClasses[type as keyof typeof typeClasses]}`}>
        {type.charAt(0).toUpperCase() + type.slice(1)}
      </span>
    );
  };

  const filteredPages = pages.filter(page => {
    const matchesSearch = page.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         page.slug.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || page.status === statusFilter;
    const matchesType = typeFilter === 'all' || page.page_type === typeFilter;
    
    return matchesSearch && matchesStatus && matchesType;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pages Management</h1>
          <p className="text-gray-600">Manage static pages, legal documents, and policies</p>
        </div>
        <Link
          href="/admin/pages/create"
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
        >
          <Plus className="h-4 w-4 mr-2" />
          Create New Page
        </Link>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <div className="mt-2 text-sm text-red-700">{error}</div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search pages..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="published">Published</option>
              <option value="draft">Draft</option>
              <option value="archived">Archived</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            >
              <option value="all">All Types</option>
              <option value="static">Static</option>
              <option value="legal">Legal</option>
              <option value="policy">Policy</option>
              <option value="info">Info</option>
            </select>
          </div>
          
          <div className="flex items-end">
            <button
              onClick={fetchPages}
              className="w-full inline-flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
            >
              <Filter className="h-4 w-4 mr-2" />
              Apply Filters
            </button>
          </div>
        </div>
      </div>

      {/* Pages Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Page
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Featured
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Updated
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredPages.map((page) => (
                <tr key={page.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-lg bg-orange-100 flex items-center justify-center">
                          <FileText className="h-5 w-5 text-orange-600" />
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {page.title}
                        </div>
                        <div className="text-sm text-gray-500">
                          /{page.slug}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getTypeBadge(page.page_type)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(page.status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => handleFeaturedToggle(page.id, page.is_featured)}
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        page.is_featured 
                          ? 'bg-yellow-100 text-yellow-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {page.is_featured ? 'Featured' : 'Regular'}
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-1" />
                      {new Date(page.updated_at).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-2">
                      <button
                        onClick={() => window.open(`/${page.slug}`, '_blank')}
                        className="text-gray-400 hover:text-gray-600"
                        title="View Page"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <Link
                        href={`/admin/pages/edit/${page.id}`}
                        className="text-orange-600 hover:text-orange-900"
                        title="Edit Page"
                      >
                        <Edit className="h-4 w-4" />
                      </Link>
                      <button
                        onClick={() => handleStatusToggle(page.id, page.status)}
                        className={`${
                          page.status === 'published' 
                            ? 'text-green-600 hover:text-green-900' 
                            : 'text-gray-400 hover:text-gray-600'
                        }`}
                        title={page.status === 'published' ? 'Unpublish' : 'Publish'}
                      >
                        {page.status === 'published' ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                      <button
                        onClick={() => handleDelete(page.id)}
                        className="text-red-600 hover:text-red-900"
                        title="Delete Page"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Showing page <span className="font-medium">{currentPage}</span> of{' '}
                  <span className="font-medium">{totalPages}</span>
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Empty State */}
      {filteredPages.length === 0 && !loading && (
        <div className="text-center py-12">
          <FileText className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No pages found</h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchTerm || statusFilter !== 'all' || typeFilter !== 'all'
              ? 'Try adjusting your search or filter criteria.'
              : 'Get started by creating a new page.'}
          </p>
          <div className="mt-6">
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create New Page
            </button>
          </div>
        </div>
      )}

      

      {/* Create/Edit now handled in dedicated CMS routes */}
    </div>
  );
}
