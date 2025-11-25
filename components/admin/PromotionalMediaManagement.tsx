'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { PromotionalMedia, Category, PromotionalMediaType, PromotionalMediaPosition } from '@/types/database';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Search,
  Filter,
  Image as ImageIcon,
  Eye,
  MoreVertical,
  Calendar,
  MapPin,
  ToggleLeft,
  ToggleRight,
  Upload,
  Play,
  Monitor,
  Smartphone
} from 'lucide-react';
import Pagination from './Pagination';
import PromotionalMediaForm from './PromotionalMediaForm';


export default function PromotionalMediaManagement() {
  const router = useRouter();
  const [promotionalMedia, setPromotionalMedia] = useState<PromotionalMedia[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [selectedPosition, setSelectedPosition] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingMedia, setEditingMedia] = useState<PromotionalMedia | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState<PromotionalMedia | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [globalSuccessMessage, setGlobalSuccessMessage] = useState<string | null>(null);

  const mediaTypes: { value: PromotionalMediaType; label: string }[] = [
    { value: 'banner', label: 'Banner' },
    { value: 'slider', label: 'Slider' },
    { value: 'popup', label: 'Popup' },
    { value: 'video', label: 'Video' },
    { value: 'custom', label: 'Custom' }
  ];

  const positions: { value: PromotionalMediaPosition; label: string }[] = [
    { value: 'homepage_top', label: 'Homepage Top' },
    { value: 'homepage_middle', label: 'Homepage Middle' },
    { value: 'homepage_bottom', label: 'Homepage Bottom' },
    { value: 'category_page', label: 'Category Page' },
    { value: 'product_page', label: 'Product Page' },
    { value: 'sidebar', label: 'Sidebar' },
    { value: 'footer', label: 'Footer' },
    { value: 'popup', label: 'Popup' },
    { value: 'header', label: 'Header' },
    { value: 'checkout_page', label: 'Checkout Page' },
    { value: 'cart_page', label: 'Cart Page' }
  ];

  useEffect(() => {
    fetchData();
  }, []);

  const showSuccessMessage = (message: string) => {
    setGlobalSuccessMessage(message);
    setTimeout(() => {
      setGlobalSuccessMessage(null);
    }, 5000);
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch promotional media with explicit column selection
      const { data: mediaData, error: mediaError } = await supabase
        .from('promotional_media')
        .select(`
          id,
          title,
          subtitle,
          description,
          media_type,
          image_url,
          mobile_image_url,
          video_url,
          link_url,
          button_text,
          target,
          banner_position,
          display_order,
          background_color,
          text_color,
          is_active,
          start_date,
          end_date,
          language_code,
          store_id,
          created_by,
          action_type,
          action_params,
          created_at,
          updated_at
        `)
        .order('created_at', { ascending: false });

      if (mediaError) {
        console.error('Error fetching promotional media:', mediaError);
        if (mediaError.message.includes('relation "promotional_media" does not exist')) {
          alert('Database tables not found. Please run the migrations first.');
        }
        return;
      }

      // Fetch categories
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('categories')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (categoriesError) {
        console.error('Error fetching categories:', categoriesError);
        return;
      }

      setPromotionalMedia(mediaData || []);
      setCategories(categoriesData || []);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };


  const handleEdit = (media: PromotionalMedia) => {
    setEditingMedia(media);
    setShowForm(true);
  };

  const handleDelete = async (media: PromotionalMedia) => {
    try {
      const { error } = await supabase
        .from('promotional_media')
        .delete()
        .eq('id', media.id);

      if (error) throw error;

      showSuccessMessage('Promotional media deleted successfully!');
      setShowDeleteModal(null);
      fetchData();
    } catch (error) {
      console.error('Error deleting promotional media:', error);
      alert('Error deleting promotional media. Please try again.');
    }
  };

  const toggleActive = async (media: PromotionalMedia) => {
    try {
      const { error } = await supabase
        .from('promotional_media')
        .update({ is_active: !media.is_active })
        .eq('id', media.id);

      if (error) throw error;

      showSuccessMessage(`Promotional media ${!media.is_active ? 'activated' : 'deactivated'} successfully!`);
      fetchData();
    } catch (error) {
      console.error('Error updating promotional media:', error);
      alert('Error updating promotional media. Please try again.');
    }
  };


  const filteredMedia = promotionalMedia.filter(media => {
    const matchesSearch = media.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         media.subtitle?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         media.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = !selectedType || media.media_type === selectedType;
    const matchesPosition = !selectedPosition || media.banner_position === selectedPosition;
    const matchesStatus = selectedStatus === '' || 
                         (selectedStatus === 'active' && media.is_active) ||
                         (selectedStatus === 'inactive' && !media.is_active);

    return matchesSearch && matchesType && matchesPosition && matchesStatus;
  });

  const totalPages = Math.ceil(filteredMedia.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedMedia = filteredMedia.slice(startIndex, startIndex + itemsPerPage);

  const getStatusBadge = (media: PromotionalMedia) => {
    const now = new Date();
    const startDate = media.start_date ? new Date(media.start_date) : null;
    const endDate = media.end_date ? new Date(media.end_date) : null;

    if (!media.is_active) {
      return <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">Inactive</span>;
    }

    if (startDate && now < startDate) {
      return <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">Scheduled</span>;
    }

    if (endDate && now > endDate) {
      return <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">Expired</span>;
    }

    return <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">Active</span>;
  };

  const getTypeIcon = (type: PromotionalMediaType) => {
    switch (type) {
      case 'video':
        return <Play className="h-4 w-4" />;
      case 'slider':
        return <Monitor className="h-4 w-4" />;
      case 'popup':
        return <MoreVertical className="h-4 w-4" />;
      default:
        return <ImageIcon className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Promotional Media Management</h1>
          <p className="text-gray-600">Manage banners, sliders, popups, and other promotional content</p>
        </div>
        <button
          onClick={() => {
            setEditingMedia(null);
            setShowForm(true);
          }}
          className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Add Promotional Media
        </button>
      </div>

      {/* Success Message */}
      {globalSuccessMessage && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
          {globalSuccessMessage}
        </div>
      )}

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Search by title, subtitle, or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            >
              <option value="">All Types</option>
              {mediaTypes.map(type => (
                <option key={type.value} value={type.value}>{type.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Position</label>
            <select
              value={selectedPosition}
              onChange={(e) => setSelectedPosition(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            >
              <option value="">All Positions</option>
              {positions.map(position => (
                <option key={position.value} value={position.value}>{position.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            >
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>
      </div>

      {/* Media List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Media</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Position</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dates</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedMedia.map((media) => (
                <tr key={media.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {media.image_url ? (
                        <img
                          src={media.image_url}
                          alt={media.title}
                          className="h-12 w-16 object-cover rounded"
                        />
                      ) : (
                        <div className="h-12 w-16 bg-gray-200 rounded flex items-center justify-center">
                          {getTypeIcon(media.media_type)}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{media.title}</div>
                      {media.subtitle && (
                        <div className="text-sm text-gray-500">{media.subtitle}</div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full capitalize">
                      {media.media_type}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center text-sm text-gray-900">
                      <MapPin className="h-4 w-4 mr-1" />
                      {positions.find(p => p.value === media.banner_position)?.label}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(media)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-1" />
                      <div>
                        {media.start_date && (
                          <div>Start: {new Date(media.start_date).toLocaleDateString()}</div>
                        )}
                        {media.end_date && (
                          <div>End: {new Date(media.end_date).toLocaleDateString()}</div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => toggleActive(media)}
                        className="text-gray-600 hover:text-gray-900"
                        title={media.is_active ? 'Deactivate' : 'Activate'}
                      >
                        {media.is_active ? (
                          <ToggleRight className="h-5 w-5 text-green-600" />
                        ) : (
                          <ToggleLeft className="h-5 w-5 text-gray-400" />
                        )}
                      </button>
                      <button
                        onClick={() => handleEdit(media)}
                        className="text-blue-600 hover:text-blue-900"
                        title="Edit"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setShowDeleteModal(media)}
                        className="text-red-600 hover:text-red-900"
                        title="Delete"
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

        {paginatedMedia.length === 0 && (
          <div className="text-center py-12">
            <ImageIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No promotional media found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm || selectedType || selectedPosition || selectedStatus
                ? 'Try adjusting your search criteria.'
                : 'Get started by creating your first promotional media.'}
            </p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          itemsPerPage={itemsPerPage}
          onItemsPerPageChange={setItemsPerPage}
          totalItems={filteredMedia.length}
        />
      )}

      {/* Form Modal */}
      {showForm && (
        <PromotionalMediaForm
          media={editingMedia}
          categories={categories}
          onClose={() => {
            setShowForm(false);
            setEditingMedia(null);
          }}
          onSuccess={() => {
            showSuccessMessage(editingMedia ? 'Promotional media updated successfully!' : 'Promotional media created successfully!');
            fetchData();
          }}
        />
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3 text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                <Trash2 className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mt-2">Delete Promotional Media</h3>
              <div className="mt-2 px-7 py-3">
                <p className="text-sm text-gray-500">
                  Are you sure you want to delete "{showDeleteModal.title}"? This action cannot be undone.
                </p>
              </div>
              <div className="flex justify-center space-x-3 mt-4">
                <button
                  onClick={() => setShowDeleteModal(null)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDelete(showDeleteModal)}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
