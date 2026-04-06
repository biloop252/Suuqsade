'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { X, UserPlus, Building2 } from 'lucide-react';
import AdminModalBackdrop, { AdminTallFormPanel } from './AdminModalBackdrop';

interface PromoteToVendorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  userId: string;
  userEmail: string;
  userName: string;
}

export default function PromoteToVendorModal({ 
  isOpen, 
  onClose, 
  onSuccess, 
  userId, 
  userEmail, 
  userName 
}: PromoteToVendorModalProps) {
  const [formData, setFormData] = useState({
    business_name: '',
    business_description: '',
    phone: '',
    address: '',
    city: '',
    district: '',
    neighborhood: '',
    country: '',
    tax_id: '',
    commission_rate: 10.00
  });
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<any>({});
  
  // Location-based selection
  const [countries, setCountries] = useState<any[]>([]);
  const [cities, setCities] = useState<any[]>([]);
  const [selectedCountryId, setSelectedCountryId] = useState<string>('');
  const [selectedCityId, setSelectedCityId] = useState<string>('');

  useEffect(() => {
    loadCountries();
  }, []);

  const loadCountries = async () => {
    try {
      const { data, error } = await supabase
        .from('locations')
        .select('id, name')
        .eq('level', 0)
        .eq('is_active', true)
        .order('name');

      if (error) {
        console.error('Error loading countries:', error);
      } else {
        setCountries(data || []);
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const loadCities = async (countryId: string) => {
    if (!countryId) {
      setCities([]);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('locations')
        .select('id, name')
        .eq('level', 2)
        .eq('parent_id', countryId)
        .eq('is_active', true)
        .order('name');

      if (error) {
        console.error('Error loading cities:', error);
      } else {
        setCities(data || []);
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleCountryChange = (countryId: string) => {
    setSelectedCountryId(countryId);
    setSelectedCityId('');
    setFormData({ ...formData, country: '', city: '' });
    loadCities(countryId);
  };

  const handleCityChange = (cityId: string) => {
    setSelectedCityId(cityId);
    const selectedCountry = countries.find(c => c.id === selectedCountryId);
    const selectedCity = cities.find(c => c.id === cityId);
    setFormData({ 
      ...formData, 
      country: selectedCountry?.name || '', 
      city: selectedCity?.name || '' 
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrors({});

    try {
      const { business_name, business_description, phone, address, city, district, neighborhood, country, tax_id, commission_rate } = formData;

      if (!business_name || !business_description || !phone || !address || !city || !district || !neighborhood || !country || !tax_id) {
        setErrors({ general: 'All fields are required' });
        setSaving(false);
        return;
      }

      if (commission_rate < 0 || commission_rate > 100) {
        setErrors({ commission_rate: 'Commission rate must be between 0 and 100' });
        setSaving(false);
        return;
      }

      // Use the promote_user_to_vendor function
      const { error } = await supabase.rpc('promote_user_to_vendor', {
        user_id: userId,
        business_name,
        business_description,
        phone,
        address,
        city,
        district,
        neighborhood,
        country,
        tax_id,
        commission_rate
      });

      if (error) throw error;

      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error promoting user to vendor:', error);
      setErrors({ general: 'Error promoting user to vendor' });
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AdminModalBackdrop>
      <AdminTallFormPanel className="w-full max-w-2xl">
        <div className="flex shrink-0 items-center justify-between border-b border-gray-200 px-5 py-4">
            <div className="flex items-center">
              <UserPlus className="h-6 w-6 text-primary mr-2" />
              <h3 className="text-lg font-medium text-gray-900">
                Promote User to Vendor
              </h3>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
            <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4 space-y-4">
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>User:</strong> {userName} ({userEmail})
            </p>
            <p className="text-sm text-blue-800 mt-1">
              This will promote the user to vendor status and create a vendor profile.
            </p>
          </div>

          {errors.general && (
            <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              {errors.general}
            </div>
          )}

            <div className="space-y-4">
              {/* Business Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Business Name *</label>
                  <input
                    type="text"
                    value={formData.business_name}
                    onChange={(e) => setFormData({ ...formData, business_name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
                  placeholder="Describe your business, services, and what makes you unique..."
                  required
                />
              </div>

              {/* Contact Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone *</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Commission Rate (%) *</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    value={formData.commission_rate}
                    onChange={(e) => setFormData({ ...formData, commission_rate: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
                    required
                  />
                  {errors.commission_rate && (
                    <p className="mt-1 text-sm text-red-600">{errors.commission_rate}</p>
                  )}
                </div>
              </div>

              {/* Address Information */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Address *</label>
                <textarea
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Country *</label>
                  <select
                    value={selectedCountryId}
                    onChange={(e) => handleCountryChange(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
                    required
                  >
                    <option value="">Select country</option>
                    {countries.map((country) => (
                      <option key={country.id} value={country.id}>
                        {country.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">City *</label>
                  <select
                    value={selectedCityId}
                    onChange={(e) => handleCityChange(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
                    required
                    disabled={!selectedCountryId}
                  >
                    <option value="">Select city</option>
                    {cities.map((city) => (
                      <option key={city.id} value={city.id}>
                        {city.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">District *</label>
                  <input
                    type="text"
                    value={formData.district}
                    onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Neighborhood *</label>
                  <input
                    type="text"
                    value={formData.neighborhood}
                    onChange={(e) => setFormData({ ...formData, neighborhood: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
                    required
                  />
                </div>
              </div>

              {/* Tax ID */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tax ID *</label>
                <input
                  type="text"
                  value={formData.tax_id}
                  onChange={(e) => setFormData({ ...formData, tax_id: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
                  required
                />
              </div>
            </div>
            </div>

            <div className="flex shrink-0 justify-end gap-3 border-t border-gray-200 bg-gray-50 px-5 py-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 bg-primary text-white rounded-md text-sm font-medium hover:brightness-[0.92] disabled:opacity-50"
              >
                {saving ? 'Promoting...' : 'Promote to Vendor'}
              </button>
            </div>
          </form>
      </AdminTallFormPanel>
    </AdminModalBackdrop>
  );
}
