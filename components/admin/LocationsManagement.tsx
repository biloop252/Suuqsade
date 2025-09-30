'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { MapPinIcon, PlusIcon, PencilIcon, TrashIcon, ChevronDownIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

interface Location {
  id: string;
  name: string;
  parent_id: string | null;
  level: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  children?: Location[];
  parent?: Location;
}

interface LocationFormData {
  name: string;
  parent_id: string | null;
  level: number;
  is_active: boolean;
}

export default function LocationsManagement() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingLocation, setEditingLocation] = useState<Location | null>(null);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [levelFilter, setLevelFilter] = useState<number | 'all'>('all');
  const [formData, setFormData] = useState<LocationFormData>({
    name: '',
    parent_id: null,
    level: 0,
    is_active: true
  });

  useEffect(() => {
    fetchLocations();
  }, []);

  const fetchLocations = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('locations')
        .select('*')
        .order('level', { ascending: true })
        .order('name', { ascending: true });

      if (error) {
        console.error('Error fetching locations:', error);
        return;
      }

      // Build hierarchical structure
      const locationMap = new Map<string, Location>();
      const rootLocations: Location[] = [];

      // First pass: create all location objects
      data?.forEach(location => {
        locationMap.set(location.id, { ...location, children: [] });
      });

      // Second pass: build hierarchy
      data?.forEach(location => {
        const locationObj = locationMap.get(location.id)!;
        if (location.parent_id) {
          const parent = locationMap.get(location.parent_id);
          if (parent) {
            parent.children!.push(locationObj);
            locationObj.parent = parent;
          }
        } else {
          rootLocations.push(locationObj);
        }
      });

      setLocations(rootLocations);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateLocation = () => {
    setEditingLocation(null);
    setFormData({
      name: '',
      parent_id: null,
      level: 0,
      is_active: true
    });
    setShowForm(true);
  };

  const handleEditLocation = (location: Location) => {
    setEditingLocation(location);
    setFormData({
      name: location.name,
      parent_id: location.parent_id,
      level: location.level,
      is_active: location.is_active
    });
    setShowForm(true);
  };

  const handleDeleteLocation = async (location: Location) => {
    if (!confirm(`Are you sure you want to delete "${location.name}" and all its children?`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('locations')
        .delete()
        .eq('id', location.id);

      if (error) {
        console.error('Error deleting location:', error);
        alert('Error deleting location. Please try again.');
        return;
      }

      fetchLocations();
    } catch (error) {
      console.error('Error:', error);
      alert('Error deleting location. Please try again.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      alert('Please enter a location name');
      return;
    }

    // Validate parent selection
    if (formData.level > 0 && formData.parent_id) {
      const availableParents = getAvailableParentLocations(formData.level);
      const selectedParent = availableParents.find(p => p.id === formData.parent_id);
      if (!selectedParent) {
        alert('Selected parent location is not valid for this level');
        return;
      }
    }

    try {
      if (editingLocation) {
        // Update existing location
        const { error } = await supabase
          .from('locations')
          .update({
            name: formData.name.trim(),
            parent_id: formData.parent_id || null,
            level: formData.level,
            is_active: formData.is_active,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingLocation.id);

        if (error) {
          console.error('Error updating location:', error);
          alert('Error updating location. Please try again.');
          return;
        }
      } else {
        // Create new location
        const { error } = await supabase
          .from('locations')
          .insert({
            name: formData.name.trim(),
            parent_id: formData.parent_id || null,
            level: formData.level,
            is_active: formData.is_active
          });

        if (error) {
          console.error('Error creating location:', error);
          alert('Error creating location. Please try again.');
          return;
        }
      }

      setShowForm(false);
      setEditingLocation(null);
      fetchLocations();
    } catch (error) {
      console.error('Error:', error);
      alert('Error saving location. Please try again.');
    }
  };

  const toggleNode = (locationId: string) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(locationId)) {
      newExpanded.delete(locationId);
    } else {
      newExpanded.add(locationId);
    }
    setExpandedNodes(newExpanded);
  };

  const getLevelName = (level: number) => {
    const levelNames = ['Country', 'State/Province', 'City', 'District', 'Neighborhood'];
    return levelNames[level] || `Level ${level}`;
  };

  const getIndentClass = (level: number) => {
    return `ml-${level * 4}`;
  };

  // Flatten hierarchical locations into a flat list for parent selection
  const flattenLocations = (locationList: Location[], level: number = 0): Location[] => {
    const result: Location[] = [];
    
    locationList.forEach(location => {
      // Only include locations that are at a level below the selected level
      if (location.level < level) {
        result.push(location);
      }
      
      // Recursively add children
      if (location.children && location.children.length > 0) {
        result.push(...flattenLocations(location.children, level));
      }
    });
    
    return result;
  };

  // Get available parent locations based on selected level
  const getAvailableParentLocations = (selectedLevel: number): Location[] => {
    if (selectedLevel === 0) {
      return []; // Countries have no parents
    }
    
    return flattenLocations(locations, selectedLevel);
  };

  const renderLocationNode = (location: Location, level: number = 0) => {
    const hasChildren = location.children && location.children.length > 0;
    const isExpanded = expandedNodes.has(location.id);
    const isVisible = levelFilter === 'all' || location.level === levelFilter;
    const matchesSearch = searchTerm === '' || 
      location.name.toLowerCase().includes(searchTerm.toLowerCase());

    if (!isVisible || !matchesSearch) {
      return null;
    }

    return (
      <div key={location.id} className={`${getIndentClass(level)} border-b border-gray-100`}>
        <div className="flex items-center justify-between py-3 px-4 hover:bg-gray-50">
          <div className="flex items-center space-x-3">
            {hasChildren ? (
              <button
                onClick={() => toggleNode(location.id)}
                className="p-1 hover:bg-gray-200 rounded"
              >
                {isExpanded ? (
                  <ChevronDownIcon className="h-4 w-4 text-gray-500" />
                ) : (
                  <ChevronRightIcon className="h-4 w-4 text-gray-500" />
                )}
              </button>
            ) : (
              <div className="w-6" />
            )}
            
            <MapPinIcon className="h-5 w-5 text-gray-400" />
            
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-medium text-gray-900">{location.name}</span>
                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                  {getLevelName(location.level)}
                </span>
                {!location.is_active && (
                  <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">
                    Inactive
                  </span>
                )}
              </div>
              {location.parent && (
                <div className="text-sm text-gray-500">
                  Under: {location.parent.name}
                </div>
              )}
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => handleEditLocation(location)}
              className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded"
              title="Edit location"
            >
              <PencilIcon className="h-4 w-4" />
            </button>
            <button
              onClick={() => handleDeleteLocation(location)}
              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
              title="Delete location"
            >
              <TrashIcon className="h-4 w-4" />
            </button>
          </div>
        </div>
        
        {hasChildren && isExpanded && (
          <div>
            {location.children!.map(child => renderLocationNode(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  const filteredLocations = locations.filter(location => {
    if (levelFilter !== 'all' && location.level !== levelFilter) return false;
    if (searchTerm && !location.name.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Locations Management</h1>
          <p className="text-gray-600">Manage hierarchical locations (countries, states, cities, districts)</p>
        </div>
        <button
          onClick={handleCreateLocation}
          className="flex items-center space-x-2 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700"
        >
          <PlusIcon className="h-5 w-5" />
          <span>Add Location</span>
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm p-4">
        <div className="flex space-x-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search locations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div>
            <select
              value={levelFilter}
              onChange={(e) => setLevelFilter(e.target.value as number | 'all')}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="all">All Levels</option>
              <option value={0}>Countries</option>
              <option value={1}>States/Provinces</option>
              <option value={2}>Cities</option>
              <option value={3}>Districts</option>
              <option value={4}>Neighborhoods</option>
            </select>
          </div>
        </div>
      </div>

      {/* Locations Tree */}
      <div className="bg-white rounded-lg shadow-sm">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Locations Hierarchy</h2>
        </div>
        
        {filteredLocations.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <MapPinIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>No locations found</p>
            {searchTerm && (
              <p className="text-sm">Try adjusting your search criteria</p>
            )}
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filteredLocations.map(location => renderLocationNode(location))}
          </div>
        )}
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              {editingLocation ? 'Edit Location' : 'Add New Location'}
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Location Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Enter location name"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Level
                </label>
                <select
                  value={formData.level}
                  onChange={(e) => {
                    const newLevel = parseInt(e.target.value);
                    setFormData({ 
                      ...formData, 
                      level: newLevel,
                      parent_id: null // Reset parent when level changes
                    });
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value={0}>Country</option>
                  <option value={1}>State/Province</option>
                  <option value={2}>City</option>
                  <option value={3}>District</option>
                  <option value={4}>Neighborhood</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Parent Location {formData.level === 0 ? '(Not applicable for countries)' : '(Optional)'}
                </label>
                <select
                  value={formData.parent_id || ''}
                  onChange={(e) => setFormData({ ...formData, parent_id: e.target.value || null })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  disabled={formData.level === 0}
                >
                  <option value="">
                    {formData.level === 0 ? 'Countries have no parent' : 'No parent (Root level)'}
                  </option>
                  {getAvailableParentLocations(formData.level).map(location => (
                    <option key={location.id} value={location.id}>
                      {location.name} ({getLevelName(location.level)})
                    </option>
                  ))}
                </select>
                {formData.level > 0 && getAvailableParentLocations(formData.level).length === 0 && (
                  <p className="text-sm text-gray-500 mt-1">
                    No parent locations available. Create locations at level {formData.level - 1} first.
                  </p>
                )}
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <label htmlFor="is_active" className="ml-2 block text-sm text-gray-700">
                  Active
                </label>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
                >
                  {editingLocation ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

