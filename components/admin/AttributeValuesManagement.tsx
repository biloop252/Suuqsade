'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { ProductAttribute, AttributeValue } from '@/types/database';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Search,
  Filter,
  Tag,
  ChevronDown,
  ChevronRight,
  Eye,
  EyeOff
} from 'lucide-react';
import Pagination from './Pagination';

interface AttributeValuesManagementProps {
  showHeader?: boolean;
}

export default function AttributeValuesManagement({ showHeader = true }: AttributeValuesManagementProps) {
  const [attributes, setAttributes] = useState<ProductAttribute[]>([]);
  const [attributeValues, setAttributeValues] = useState<AttributeValue[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAttribute, setSelectedAttribute] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingValue, setEditingValue] = useState<AttributeValue | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState<AttributeValue | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [expandedAttributes, setExpandedAttributes] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch attributes
      const { data: attributesData, error: attributesError } = await supabase
        .from('product_attributes')
        .select('*')
        .eq('is_active', true)
        .order('sort_order')
        .order('name');

      if (attributesError) {
        console.error('Error fetching attributes:', attributesError);
        return;
      }

      // Fetch attribute values
      const { data: valuesData, error: valuesError } = await supabase
        .from('attribute_values')
        .select(`
          *,
          product_attributes!inner(*)
        `)
        .eq('is_active', true)
        .order('sort_order')
        .order('value');

      if (valuesError) {
        console.error('Error fetching attribute values:', valuesError);
        return;
      }

      setAttributes(attributesData || []);
      setAttributeValues(valuesData || []);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredValues = attributeValues.filter(value => {
    const matchesSearch = value.value.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         value.display_value?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesAttribute = !selectedAttribute || value.attribute_id === selectedAttribute;
    
    return matchesSearch && matchesAttribute;
  });

  // Group values by attribute
  const groupedValues = filteredValues.reduce((acc, value) => {
    if (!acc[value.attribute_id]) {
      acc[value.attribute_id] = [];
    }
    acc[value.attribute_id].push(value);
    return acc;
  }, {} as Record<string, AttributeValue[]>);

  // Pagination logic
  const totalItems = filteredValues.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedValues = filteredValues.slice(startIndex, endIndex);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedAttribute]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleItemsPerPageChange = (newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1);
  };

  const toggleAttributeExpansion = (attributeId: string) => {
    const newExpanded = new Set(expandedAttributes);
    if (newExpanded.has(attributeId)) {
      newExpanded.delete(attributeId);
    } else {
      newExpanded.add(attributeId);
    }
    setExpandedAttributes(newExpanded);
  };

  const getAttributeName = (attributeId: string) => {
    return attributes.find(attr => attr.id === attributeId)?.name || 'Unknown Attribute';
  };

  const getAttributeType = (attributeId: string) => {
    return attributes.find(attr => attr.id === attributeId)?.type || 'text';
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-gray-200 rounded w-1/4 animate-pulse"></div>
        <div className="bg-white rounded-lg shadow">
          <div className="p-6">
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-16 bg-gray-200 rounded animate-pulse"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {showHeader && (
        <>
          {/* Breadcrumb */}
          <nav className="flex" aria-label="Breadcrumb">
            <ol className="flex items-center space-x-4">
              <li>
                <Link href="/admin" className="text-gray-400 hover:text-gray-500">
                  Admin
                </Link>
              </li>
              <li>
                <div className="flex items-center">
                  <svg className="flex-shrink-0 h-5 w-5 text-gray-300" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                  <Link href="/admin/attributes" className="ml-4 text-gray-400 hover:text-gray-500">
                    Attributes
                  </Link>
                </div>
              </li>
              <li>
                <div className="flex items-center">
                  <svg className="flex-shrink-0 h-5 w-5 text-gray-300" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="ml-4 text-gray-500">Attribute Values</span>
                </div>
              </li>
            </ol>
          </nav>

          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Attribute Values</h1>
              <p className="mt-1 text-sm text-gray-500">
                Manage values for product attributes
              </p>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-orange-600 hover:bg-orange-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Value
            </button>
          </div>
        </>
      )}

      {!showHeader && (
        <div className="flex justify-end">
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-orange-600 hover:bg-orange-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Value
          </button>
        </div>
      )}

      {/* Search and Filters */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search attribute values..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500 w-full"
              />
            </div>
          </div>
          <div>
            <select
              value={selectedAttribute}
              onChange={(e) => setSelectedAttribute(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500"
            >
              <option value="">All Attributes</option>
              {attributes.map(attribute => (
                <option key={attribute.id} value={attribute.id}>{attribute.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Attribute Values - Grouped View */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <div className="px-4 py-5 sm:p-6">
          {Object.keys(groupedValues).length === 0 ? (
            <div className="text-center py-12">
              <Tag className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No attribute values found</h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchTerm || selectedAttribute 
                  ? 'Try adjusting your search or filter criteria.'
                  : 'Get started by creating a new attribute value.'
                }
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {Object.entries(groupedValues).map(([attributeId, values]) => {
                const attribute = attributes.find(attr => attr.id === attributeId);
                const isExpanded = expandedAttributes.has(attributeId);
                
                return (
                  <div key={attributeId} className="border border-gray-200 rounded-lg">
                    <div 
                      className="p-4 cursor-pointer hover:bg-gray-50 flex items-center justify-between"
                      onClick={() => toggleAttributeExpansion(attributeId)}
                    >
                      <div className="flex items-center space-x-3">
                        {isExpanded ? (
                          <ChevronDown className="h-4 w-4 text-gray-400" />
                        ) : (
                          <ChevronRight className="h-4 w-4 text-gray-400" />
                        )}
                        <div className="flex-shrink-0 h-8 w-8">
                          <div className="h-8 w-8 rounded-md bg-orange-100 flex items-center justify-center">
                            <Tag className="h-4 w-4 text-orange-600" />
                          </div>
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {attribute?.name || 'Unknown Attribute'}
                          </div>
                          <div className="text-sm text-gray-500">
                            {attribute?.type} • {values.length} value{values.length !== 1 ? 's' : ''}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                          {attribute?.type}
                        </span>
                      </div>
                    </div>
                    
                    {isExpanded && (
                      <div className="border-t border-gray-200">
                        <div className="overflow-x-auto">
                          <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                              <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Value
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Display Value
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Sort Order
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Status
                                </th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Actions
                                </th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                              {values.map((value) => (
                                <tr key={value.id} className="hover:bg-gray-50">
                                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                    {value.value}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                    {value.display_value || '-'}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                    {value.sort_order}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                      value.is_active 
                                        ? 'bg-green-100 text-green-800' 
                                        : 'bg-red-100 text-red-800'
                                    }`}>
                                      {value.is_active ? 'Active' : 'Inactive'}
                                    </span>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <div className="flex items-center justify-end space-x-2">
                                      <button
                                        onClick={() => setEditingValue(value)}
                                        className="text-gray-400 hover:text-blue-600"
                                        title="Edit value"
                                      >
                                        <Edit className="h-4 w-4" />
                                      </button>
                                      <button
                                        onClick={() => setShowDeleteModal(value)}
                                        className="text-gray-400 hover:text-red-600"
                                        title="Delete value"
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
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
        
        {/* Pagination */}
        {totalPages > 1 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalItems}
            itemsPerPage={itemsPerPage}
            onPageChange={handlePageChange}
            onItemsPerPageChange={handleItemsPerPageChange}
            showItemsPerPage={true}
          />
        )}
      </div>

      {/* Add/Edit Value Modal */}
      {showAddModal && (
        <AttributeValueModal
          value={null}
          attributes={attributes}
          onClose={() => setShowAddModal(false)}
          onSave={fetchData}
        />
      )}

      {/* Edit Value Modal */}
      {editingValue && (
        <AttributeValueModal
          value={editingValue}
          attributes={attributes}
          onClose={() => setEditingValue(null)}
          onSave={fetchData}
        />
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <DeleteAttributeValueModal
          value={showDeleteModal}
          onClose={() => setShowDeleteModal(null)}
          onDelete={fetchData}
        />
      )}
    </div>
  );
}

// Attribute Value Modal Component
function AttributeValueModal({ 
  value, 
  attributes,
  onClose, 
  onSave 
}: { 
  value: AttributeValue | null; 
  attributes: ProductAttribute[];
  onClose: () => void; 
  onSave: () => void; 
}) {
  const [formData, setFormData] = useState({
    attribute_id: value?.attribute_id || '',
    value: value?.value || '',
    display_value: value?.display_value || '',
    sort_order: value?.sort_order || 0,
    is_active: value?.is_active ?? true
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (value) {
        // Update existing value
        const { error } = await supabase
          .from('attribute_values')
          .update(formData)
          .eq('id', value.id);

        if (error) throw error;
      } else {
        // Create new value
        const { error } = await supabase
          .from('attribute_values')
          .insert([formData]);

        if (error) throw error;
      }

      onSave();
      onClose();
    } catch (error) {
      console.error('Error saving attribute value:', error);
    } finally {
      setLoading(false);
    }
  };

  const selectedAttribute = attributes.find(attr => attr.id === formData.attribute_id);

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            {value ? 'Edit Attribute Value' : 'Add New Attribute Value'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Attribute *</label>
              <select
                value={formData.attribute_id}
                onChange={(e) => setFormData({ ...formData, attribute_id: e.target.value })}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                required
              >
                <option value="">Select an attribute</option>
                {attributes.map(attribute => (
                  <option key={attribute.id} value={attribute.id}>
                    {attribute.name} ({attribute.type})
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Value *</label>
              <input
                type="text"
                value={formData.value}
                onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                placeholder="e.g., red, small, cotton"
                required
              />
              {selectedAttribute && (
                <p className="mt-1 text-xs text-gray-500">
                  Type: {selectedAttribute.type}
                </p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Display Value</label>
              <input
                type="text"
                value={formData.display_value}
                onChange={(e) => setFormData({ ...formData, display_value: e.target.value })}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                placeholder="e.g., Red, Small, Cotton"
              />
              <p className="mt-1 text-xs text-gray-500">
                Optional. Used for display purposes (e.g., "Red" for color code "#FF0000")
              </p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Sort Order</label>
              <input
                type="number"
                value={formData.sort_order}
                onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) || 0 })}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                min="0"
              />
            </div>
            
            <div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-700">Active</span>
              </label>
            </div>
            
            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700 disabled:opacity-50"
              >
                {loading ? 'Saving...' : (value ? 'Update' : 'Create')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

// Delete Confirmation Modal
function DeleteAttributeValueModal({ 
  value, 
  onClose, 
  onDelete 
}: { 
  value: AttributeValue; 
  onClose: () => void; 
  onDelete: () => void; 
}) {
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('attribute_values')
        .update({ is_active: false })
        .eq('id', value.id);

      if (error) throw error;

      onDelete();
      onClose();
    } catch (error) {
      console.error('Error deleting attribute value:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Delete Attribute Value</h3>
          <p className="text-sm text-gray-500 mb-6">
            Are you sure you want to delete the value "{value.value}"? This action cannot be undone.
          </p>
          <div className="flex justify-end space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              disabled={loading}
              className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 disabled:opacity-50"
            >
              {loading ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
