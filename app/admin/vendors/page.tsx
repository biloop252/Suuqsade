'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  Plus,
  Edit,
  Trash2,
  Search,
  Filter,
  Building2,
  Mail,
  Phone,
  MapPin,
  Calendar,
  X,
  Save,
  User,
  Upload,
  FileText,
  Eye,
  EyeOff,
  Image,
  Percent
} from 'lucide-react';

interface Vendor {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  avatar_url?: string;
  role: string;
  is_active: boolean;
  business_name: string;
  business_description: string;
  logo_url?: string;
  address: string;
  city: string;
  district: string;
  neighborhood: string;
  country: string;
  tax_id: string;
  business_license_url?: string;
  national_id_url?: string;
  commission_rate: number;
  status: 'active' | 'inactive' | 'pending' | 'suspended';
  created_at: string;
  updated_at: string;
  total_products?: number;
  total_orders?: number;
}

export default function VendorsManagement() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingVendor, setEditingVendor] = useState<Vendor | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [saving, setSaving] = useState(false);
  const [formErrors, setFormErrors] = useState<any>({});

  const [formData, setFormData] = useState({
    business_name: '',
    business_description: '',
    logo_file: null as File | null,
    email: '',
    password: '',
    confirmPassword: '',
    first_name: '',
    last_name: '',
    phone: '',
    address: '',
    city: '',
    district: '',
    neighborhood: '',
    country: '',
    tax_id: '',
    commission_rate: 10.00,
    business_license_file: null as File | null,
    national_id_file: null as File | null,
    status: 'pending' as 'active' | 'inactive' | 'pending' | 'suspended'
  });

  const [uploading, setUploading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    loadVendors();
  }, []);


  const loadVendors = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .rpc('get_vendor_with_profile')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading vendors:', error);
        // Fallback to direct query if RPC doesn't work
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('vendor_profiles')
          .select(`
            *,
            profiles!inner(*)
          `)
          .order('created_at', { ascending: false });

        if (fallbackError) {
          console.error('Fallback query error:', fallbackError);
        } else {
          // Transform the data to match our interface
          const transformedData = fallbackData?.map(item => ({
            ...item,
            ...item.profiles,
            business_name: item.business_name,
            business_description: item.business_description,
            logo_url: item.logo_url,
            address: item.address,
            city: item.city,
            district: item.district,
            neighborhood: item.neighborhood,
            country: item.country,
            tax_id: item.tax_id,
            business_license_url: item.business_license_url,
            national_id_url: item.national_id_url,
            commission_rate: item.commission_rate,
            status: item.status
          })) || [];
          setVendors(transformedData);
          // Load stats for fallback data
          if (transformedData.length > 0) {
            await loadVendorStats(transformedData);
          }
        }
      } else {
        setVendors(data || []);
      }

      // Load stats for the loaded vendors (only for RPC data)
      if (data && data.length > 0) {
        await loadVendorStats(data);
      }

    } catch (error) {
      console.error('Error loading vendors:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadVendorStats = async (vendorsList = vendors) => {
    try {
      const vendorsWithStats = await Promise.all(
        vendorsList.map(async (vendor) => {
          // Get products count
          const { count: productsCount } = await supabase
            .from('products')
            .select('*', { count: 'exact', head: true })
            .eq('vendor_id', vendor.id);

          // Get orders count
          const { count: ordersCount } = await supabase
            .from('orders')
            .select('*', { count: 'exact', head: true })
            .eq('vendor_id', vendor.id);

          return {
            ...vendor,
            total_products: typeof productsCount === 'number' ? productsCount : 0,
            total_orders: typeof ordersCount === 'number' ? ordersCount : 0
          };
        })
      );

      setVendors(vendorsWithStats);
    } catch (error) {
      console.error('Error loading vendor stats:', error);
    }
  };

  const uploadFile = async (file: File, path: string): Promise<string | null> => {
    try {
      const { data, error } = await supabase.storage
        .from('vendor-documents')
        .upload(`${path}/${Date.now()}-${file.name}`, file);

      if (error) {
        console.error('Error uploading file:', error);
        return null;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('vendor-documents')
        .getPublicUrl(data.path);

      return publicUrl;
    } catch (error) {
      console.error('Error uploading file:', error);
      return null;
    }
  };

  const handleCreateVendor = () => {
    setEditingVendor(null);
    setFormData({
      business_name: '',
      business_description: '',
      logo_file: null,
      email: '',
      password: '',
      confirmPassword: '',
      first_name: '',
      last_name: '',
      phone: '',
      address: '',
      city: '',
      district: '',
      neighborhood: '',
      country: '',
      tax_id: '',
      commission_rate: 10.00,
      business_license_file: null,
      national_id_file: null,
      status: 'pending'
    });
    setFormErrors({});
    setShowForm(true);
  };

  const handleEditVendor = (vendor: Vendor) => {
    setEditingVendor(vendor);
    setFormData({
      business_name: vendor.business_name,
      business_description: vendor.business_description || '',
      logo_file: null,
      email: vendor.email,
      password: '', // Don't populate password for editing
      confirmPassword: '', // Don't populate password for editing
      first_name: vendor.first_name || '',
      last_name: vendor.last_name || '',
      phone: vendor.phone || '',
      address: vendor.address || '',
      city: vendor.city || '',
      district: vendor.district || '',
      neighborhood: vendor.neighborhood || '',
      country: vendor.country || '',
      tax_id: vendor.tax_id || '',
      commission_rate: vendor.commission_rate,
      business_license_file: null,
      national_id_file: null,
      status: vendor.status
    });
    setFormErrors({});
    setShowForm(true);
  };

  const handleSaveVendor = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setUploading(true);
    setFormErrors({});

    try {
      const { 
        business_name, 
        business_description, 
        logo_file, 
        email, 
        password, 
        confirmPassword, 
        first_name, 
        last_name, 
        phone, 
        address, 
        city, 
        district, 
        neighborhood, 
        country, 
        tax_id, 
        commission_rate, 
        business_license_file, 
        national_id_file, 
        status 
      } = formData;

      if (!business_name || !email || !business_description || !phone || !address || !city || !district || !neighborhood || !country || !tax_id || commission_rate === undefined || commission_rate === null) {
        setFormErrors({ general: 'All fields except business license are required' });
        setSaving(false);
        setUploading(false);
        return;
      }

      // Password validation for new vendors
      if (!editingVendor) {
        if (!password || !confirmPassword) {
          setFormErrors({ general: 'Password and confirm password are required for new vendors' });
          setSaving(false);
          setUploading(false);
          return;
        }
        if (password !== confirmPassword) {
          setFormErrors({ general: 'Passwords do not match' });
          setSaving(false);
          setUploading(false);
          return;
        }
        if (password.length < 6) {
          setFormErrors({ general: 'Password must be at least 6 characters long' });
          setSaving(false);
          setUploading(false);
          return;
        }
      }

      // Commission rate validation
      if (commission_rate < 0 || commission_rate > 100) {
        setFormErrors({ commission_rate: 'Commission rate must be between 0 and 100' });
        setSaving(false);
        setUploading(false);
        return;
      }

      // Upload files if provided
      let logo_url = null;
      let business_license_url = null;
      let national_id_url = null;

      if (logo_file) {
        logo_url = await uploadFile(logo_file, 'logos');
        if (!logo_url) {
          setFormErrors({ general: 'Error uploading logo file' });
          setSaving(false);
          setUploading(false);
          return;
        }
      }

      if (business_license_file) {
        business_license_url = await uploadFile(business_license_file, 'business-licenses');
        if (!business_license_url) {
          setFormErrors({ general: 'Error uploading business license file' });
          setSaving(false);
          setUploading(false);
          return;
        }
      }

      if (national_id_file) {
        national_id_url = await uploadFile(national_id_file, 'national-ids');
        if (!national_id_url) {
          setFormErrors({ general: 'Error uploading national ID file' });
          setSaving(false);
          setUploading(false);
          return;
        }
      }

      if (editingVendor) {
        // Update existing vendor
        const { error: profileError } = await supabase
          .from('profiles')
          .update({
            email,
            first_name: first_name || null,
            last_name: last_name || null,
            phone: phone || null
          })
          .eq('id', editingVendor.id);

        if (profileError) throw profileError;

        const { error: vendorError } = await supabase
          .from('vendor_profiles')
          .update({
            business_name,
            business_description,
            address,
            city,
            district,
            neighborhood,
            country,
            tax_id,
            commission_rate: parseFloat(commission_rate.toString()),
            status,
            ...(logo_url && { logo_url }),
            ...(business_license_url && { business_license_url }),
            ...(national_id_url && { national_id_url })
          })
          .eq('id', editingVendor.id);

        if (vendorError) throw vendorError;
      } else {
        // CREATE NEW VENDOR WITH AUTH USER
        try {
          const response = await fetch('/api/admin/create-vendor', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              email,
              password,
              first_name,
              last_name,
              phone,
              business_name,
              business_description,
              address,
              city,
              district,
              neighborhood,
              country,
              tax_id,
              commission_rate,
              logo_url,
              business_license_url,
              national_id_url,
              status
            }),
          });

          const result = await response.json();

          if (!response.ok) {
            console.error('API Error:', result);
            throw new Error(result.error || 'Failed to create vendor');
          }

          console.log('Vendor created successfully:', result);

        } catch (error) {
          console.error('Error creating vendor with auth:', error);
          setFormErrors({ general: error instanceof Error ? error.message : 'Error creating vendor account. Please try again.' });
          setSaving(false);
          setUploading(false);
          return;
        }
      }

      await loadVendors();
      setShowForm(false);
      setEditingVendor(null);
      setFormData({
        business_name: '',
        business_description: '',
        logo_file: null,
        email: '',
        password: '',
        confirmPassword: '',
        first_name: '',
        last_name: '',
        phone: '',
        address: '',
        city: '',
        district: '',
        neighborhood: '',
        country: '',
        tax_id: '',
        commission_rate: 10.00,
        business_license_file: null,
        national_id_file: null,
        status: 'pending'
      });
    } catch (error) {
      console.error('Error saving vendor:', error);
      setFormErrors({ general: 'Error saving vendor' });
    } finally {
      setSaving(false);
      setUploading(false);
    }
  };

  const handleDeleteVendor = async (id: string) => {
    if (!confirm('Are you sure you want to delete this vendor? This will also delete their user account. This action cannot be undone.')) return;

    try {
      // Delete vendor profile first
      const { error: vendorError } = await supabase
        .from('vendor_profiles')
        .delete()
        .eq('id', id);

      if (vendorError) throw vendorError;

      // Update user role back to customer
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ role: 'customer' })
        .eq('id', id);

      if (profileError) throw profileError;

      await loadVendors();
    } catch (error) {
      console.error('Error deleting vendor:', error);
      alert('Error deleting vendor');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'inactive':
        return 'bg-gray-100 text-gray-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'suspended':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredVendors = vendors.filter(vendor => {
    const matchesSearch = vendor.business_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         `${vendor.first_name} ${vendor.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         vendor.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || vendor.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Vendors Management</h1>
          <p className="text-gray-600">Manage your marketplace vendors</p>
        </div>
        <button
          onClick={handleCreateVendor}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Vendor
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search vendors..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-orange-500 focus:border-orange-500"
              />
            </div>
          </div>
          <div className="sm:w-48">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-orange-500 focus:border-orange-500"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="pending">Pending</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>
        </div>
      </div>

      {/* Vendors Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        {filteredVendors.length === 0 ? (
          <div className="text-center py-12">
            <Building2 className="h-12 w-12 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No vendors found</h3>
            <p className="text-gray-500 mb-4">
              {searchTerm || statusFilter !== 'all' 
                ? 'Try adjusting your search or filter criteria.' 
                : 'Get started by adding your first vendor.'}
            </p>
            {!searchTerm && statusFilter === 'all' && (
              <button
                onClick={handleCreateVendor}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Vendor
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Vendor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Location
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Commission
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Stats
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredVendors.map((vendor) => (
                  <tr key={vendor.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 flex-shrink-0">
                          {vendor.logo_url ? (
                            <img
                              src={vendor.logo_url}
                              alt={`${vendor.business_name} logo`}
                              className="h-10 w-10 rounded-full object-cover"
                            />
                          ) : (
                            <div className="h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center">
                              <Building2 className="h-5 w-5 text-orange-600" />
                            </div>
                          )}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {vendor.business_name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {vendor.first_name} {vendor.last_name}
                          </div>
                          {vendor.business_description && (
                            <div className="text-xs text-gray-400 mt-1 max-w-xs truncate">
                              {vendor.business_description}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 flex items-center">
                        <Mail className="h-4 w-4 text-gray-400 mr-2" />
                        {vendor.email}
                      </div>
                      {vendor.phone && (
                        <div className="text-sm text-gray-500 flex items-center">
                          <Phone className="h-4 w-4 text-gray-400 mr-2" />
                          {vendor.phone}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 flex items-center">
                        <MapPin className="h-4 w-4 text-gray-400 mr-2" />
                        {vendor.city && vendor.country ? `${vendor.city}, ${vendor.country}` : 'Not specified'}
                      </div>
                      {vendor.district && (
                        <div className="text-sm text-gray-500">
                          {vendor.district}{vendor.neighborhood ? `, ${vendor.neighborhood}` : ''}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(vendor.status)}`}>
                        {vendor.status.charAt(0).toUpperCase() + vendor.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-gray-900">
                        <Percent className="h-4 w-4 text-gray-400 mr-1" />
                        <span className="font-medium">{vendor.commission_rate}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="space-y-1">
                        <div>Products: {vendor.total_products || 0}</div>
                        <div>Orders: {vendor.total_orders || 0}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => handleEditVendor(vendor)}
                          className="text-orange-600 hover:text-orange-900"
                          title="Edit vendor"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteVendor(vendor.id)}
                          className="text-red-600 hover:text-red-900"
                          title="Delete vendor"
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
        )}
      </div>

      {/* Vendor Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  {editingVendor ? 'Edit Vendor' : 'Add New Vendor'}
                </h3>
                <button
                  onClick={() => {
                    setShowForm(false);
                    setEditingVendor(null);
                    setFormData({
                      business_name: '',
                      business_description: '',
                      logo_file: null,
                      email: '',
                      password: '',
                      confirmPassword: '',
                      first_name: '',
                      last_name: '',
                      phone: '',
                      address: '',
                      city: '',
                      district: '',
                      neighborhood: '',
                      country: '',
                      tax_id: '',
                      commission_rate: 10.00,
                      business_license_file: null,
                      national_id_file: null,
                      status: 'pending'
                    });
                    setFormErrors({});
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              {formErrors.general && (
                <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                  {formErrors.general}
                </div>
              )}

              <form onSubmit={handleSaveVendor}>
                <div className="space-y-4">
                  {/* Business Information */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Business Name *</label>
                      <input
                        type="text"
                        value={formData.business_name}
                        onChange={(e) => setFormData({ ...formData, business_name: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                        required
                      />
                    </div>
                  </div>

                  {/* Business Description */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Business Description *</label>
                    <textarea
                      value={formData.business_description}
                      onChange={(e) => setFormData({ ...formData, business_description: e.target.value })}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                      placeholder="Describe your business, services, and what makes you unique..."
                      required
                    />
                  </div>

                  {/* Logo Upload */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Business Logo</label>
                    <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md hover:border-gray-400 transition-colors">
                      <div className="space-y-1 text-center">
                        <Image className="mx-auto h-12 w-12 text-gray-400" />
                        <div className="flex text-sm text-gray-600">
                          <label
                            htmlFor="logo-upload"
                            className="relative cursor-pointer bg-white rounded-md font-medium text-orange-600 hover:text-orange-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-orange-500"
                          >
                            <span>Upload logo</span>
                            <input
                              id="logo-upload"
                              name="logo-upload"
                              type="file"
                              accept=".jpg,.jpeg,.png,.svg"
                              className="sr-only"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  setFormData({ ...formData, logo_file: file });
                                }
                              }}
                            />
                          </label>
                          <p className="pl-1">or drag and drop</p>
                        </div>
                        <p className="text-xs text-gray-500">PNG, JPG, SVG up to 5MB</p>
                        {formData.logo_file && (
                          <p className="text-sm text-green-600 flex items-center justify-center">
                            <Image className="h-4 w-4 mr-1" />
                            {formData.logo_file.name}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Contact Information */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Phone *</label>
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                        required
                      />
                    </div>
                  </div>

                  {/* User Information */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                      <input
                        type="text"
                        value={formData.first_name}
                        onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                      <input
                        type="text"
                        value={formData.last_name}
                        onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                      />
                    </div>
                  </div>

                  {/* Password Fields - Only for new vendors */}
                  {!editingVendor && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Password *</label>
                        <div className="relative">
                          <input
                            type={showPassword ? "text" : "password"}
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                            required
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute inset-y-0 right-0 pr-3 flex items-center"
                          >
                            {showPassword ? <EyeOff className="h-4 w-4 text-gray-400" /> : <Eye className="h-4 w-4 text-gray-400" />}
                          </button>
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password *</label>
                        <div className="relative">
                          <input
                            type={showConfirmPassword ? "text" : "password"}
                            value={formData.confirmPassword}
                            onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                            className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                            required
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute inset-y-0 right-0 pr-3 flex items-center"
                          >
                            {showConfirmPassword ? <EyeOff className="h-4 w-4 text-gray-400" /> : <Eye className="h-4 w-4 text-gray-400" />}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Address Information */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Address *</label>
                    <textarea
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">City *</label>
                      <input
                        type="text"
                        value={formData.city}
                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Country *</label>
                      <input
                        type="text"
                        value={formData.country}
                        onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">District *</label>
                      <input
                        type="text"
                        value={formData.district}
                        onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Neighborhood *</label>
                      <input
                        type="text"
                        value={formData.neighborhood}
                        onChange={(e) => setFormData({ ...formData, neighborhood: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                        required
                      />
                    </div>
                  </div>

                  {/* Business Details */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Tax ID *</label>
                      <input
                        type="text"
                        value={formData.tax_id}
                        onChange={(e) => setFormData({ ...formData, tax_id: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Commission Rate (%) *</label>
                      <div className="relative">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          step="0.01"
                          value={formData.commission_rate}
                          onChange={(e) => setFormData({ ...formData, commission_rate: parseFloat(e.target.value) || 0 })}
                          className="w-full px-3 py-2 pr-8 border border-gray-300 rounded-md focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                          placeholder="10.00"
                          required
                        />
                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                          <Percent className="h-4 w-4 text-gray-400" />
                        </div>
                      </div>
                      {formErrors.commission_rate && (
                        <p className="mt-1 text-sm text-red-600">{formErrors.commission_rate}</p>
                      )}
                      <p className="mt-1 text-xs text-gray-500">
                        Percentage of each sale that goes to the marketplace (0-100%)
                      </p>
                    </div>
                  </div>

                  {/* File Uploads */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Business License</label>
                      <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md hover:border-gray-400 transition-colors">
                        <div className="space-y-1 text-center">
                          <Upload className="mx-auto h-12 w-12 text-gray-400" />
                          <div className="flex text-sm text-gray-600">
                            <label
                              htmlFor="business-license-upload"
                              className="relative cursor-pointer bg-white rounded-md font-medium text-orange-600 hover:text-orange-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-orange-500"
                            >
                              <span>Upload a file</span>
                              <input
                                id="business-license-upload"
                                name="business-license-upload"
                                type="file"
                                accept=".pdf,.jpg,.jpeg,.png"
                                className="sr-only"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    setFormData({ ...formData, business_license_file: file });
                                  }
                                }}
                              />
                            </label>
                            <p className="pl-1">or drag and drop</p>
                          </div>
                          <p className="text-xs text-gray-500">PDF, PNG, JPG up to 10MB</p>
                          {formData.business_license_file && (
                            <p className="text-sm text-green-600 flex items-center justify-center">
                              <FileText className="h-4 w-4 mr-1" />
                              {formData.business_license_file.name}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">National ID</label>
                      <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md hover:border-gray-400 transition-colors">
                        <div className="space-y-1 text-center">
                          <Upload className="mx-auto h-12 w-12 text-gray-400" />
                          <div className="flex text-sm text-gray-600">
                            <label
                              htmlFor="national-id-upload"
                              className="relative cursor-pointer bg-white rounded-md font-medium text-orange-600 hover:text-orange-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-orange-500"
                            >
                              <span>Upload a file</span>
                              <input
                                id="national-id-upload"
                                name="national-id-upload"
                                type="file"
                                accept=".pdf,.jpg,.jpeg,.png"
                                className="sr-only"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    setFormData({ ...formData, national_id_file: file });
                                  }
                                }}
                              />
                            </label>
                            <p className="pl-1">or drag and drop</p>
                          </div>
                          <p className="text-xs text-gray-500">PDF, PNG, JPG up to 10MB</p>
                          {formData.national_id_file && (
                            <p className="text-sm text-green-600 flex items-center justify-center">
                              <FileText className="h-4 w-4 mr-1" />
                              {formData.national_id_file.name}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Status */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                    >
                      <option value="pending">Pending</option>
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                      <option value="suspended">Suspended</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    type="button"
                    onClick={() => {
                      setShowForm(false);
                      setEditingVendor(null);
                      setFormData({
                        business_name: '',
                        business_description: '',
                        logo_file: null,
                        email: '',
                        password: '',
                        confirmPassword: '',
                        first_name: '',
                        last_name: '',
                        phone: '',
                        address: '',
                        city: '',
                        district: '',
                        neighborhood: '',
                        country: '',
                        tax_id: '',
                        commission_rate: 10.00,
                        business_license_file: null,
                        national_id_file: null,
                        status: 'pending'
                      });
                      setFormErrors({});
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving || uploading}
                    className="px-4 py-2 bg-orange-600 text-white rounded-md text-sm font-medium hover:bg-orange-700 disabled:opacity-50"
                  >
                    {uploading ? 'Uploading...' : saving ? 'Saving...' : (editingVendor ? 'Update' : 'Create')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}