'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useNotification } from '@/lib/notification-context';
import { supabase } from '@/lib/supabase';
import { XIcon, MapPinIcon } from 'lucide-react';
import LocationSelector from '@/components/common/LocationSelector';

interface Address {
  id: string;
  user_id: string;
  type: 'billing' | 'shipping';
  first_name: string;
  last_name: string;
  company?: string;
  address_line_1: string;
  address_line_2?: string;
  city: string;
  district: string;
  neighborhood: string;
  country: string;
  country_id?: string;
  state_id?: string;
  city_id?: string;
  district_id?: string;
  neighborhood_id?: string;
  phone?: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

interface AddressFormProps {
  address?: Address | null;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AddressForm({ address, onClose, onSuccess }: AddressFormProps) {
  const { user } = useAuth();
  const { showSuccess, showError } = useNotification();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    type: 'shipping' as 'billing' | 'shipping',
    first_name: '',
    last_name: '',
    company: '',
    address_line_1: '',
    address_line_2: '',
    city: '',
    district: '',
    neighborhood: '',
    country: 'Turkey',
    country_id: null as string | null,
    state_id: null as string | null,
    city_id: null as string | null,
    district_id: null as string | null,
    neighborhood_id: null as string | null,
    phone: '',
    is_default: false,
  });

  // Location selector state
  const [selectedLocations, setSelectedLocations] = useState({
    countryId: '',
    countryName: '',
    cityId: '',
    cityName: '',
    districtId: '',
    districtName: '',
    neighborhoodId: '',
    neighborhoodName: '',
  });

  useEffect(() => {
    if (address) {
      setFormData({
        type: address.type,
        first_name: address.first_name,
        last_name: address.last_name,
        company: address.company || '',
        address_line_1: address.address_line_1,
        address_line_2: address.address_line_2 || '',
        city: address.city,
        district: address.district,
        neighborhood: address.neighborhood,
        country: address.country,
        country_id: address.country_id || null,
        state_id: null, // No longer using state
        city_id: address.city_id || null,
        district_id: address.district_id || null,
        neighborhood_id: address.neighborhood_id || null,
        phone: address.phone || '',
        is_default: address.is_default,
      });

      // Set location selector state for editing
      setSelectedLocations({
        countryId: address.country_id || '',
        countryName: address.country,
        cityId: address.city_id || '',
        cityName: address.city,
        districtId: address.district_id || '',
        districtName: address.district,
        neighborhoodId: address.neighborhood_id || '',
        neighborhoodName: address.neighborhood,
      });
    }
  }, [address]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const handleLocationChange = (locations: {
    countryId: string;
    countryName: string;
    cityId: string;
    cityName: string;
    districtId: string;
    districtName: string;
    neighborhoodId: string;
    neighborhoodName: string;
  }) => {
    setSelectedLocations(locations);
    
    // Update form data with location information
    // Convert empty strings to null for UUID columns
    setFormData(prev => ({
      ...prev,
      country: locations.countryName,
      city: locations.cityName,
      district: locations.districtName,
      neighborhood: locations.neighborhoodName,
      country_id: locations.countryId || null,
      state_id: null, // No longer using state
      city_id: locations.cityId || null,
      district_id: locations.districtId || null,
      neighborhood_id: locations.neighborhoodId || null,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsLoading(true);
    try {
      // Prepare the data for submission
      // Ensure UUID columns are null instead of empty strings
      const addressData = {
        ...formData,
        user_id: user.id,
        country_id: formData.country_id || null,
        state_id: null, // No longer using state
        city_id: formData.city_id || null,
        district_id: formData.district_id || null,
        neighborhood_id: formData.neighborhood_id || null,
      };

      if (address) {
        // Update existing address
        const { error } = await supabase
          .from('addresses')
          .update(addressData)
          .eq('id', address.id);

        if (error) throw error;
        showSuccess(
          'Address Updated!',
          'Your address has been updated successfully'
        );
      } else {
        // Create new address
        const { error } = await supabase
          .from('addresses')
          .insert(addressData);

        if (error) throw error;
        showSuccess(
          'Address Added!',
          'Your new address has been added successfully'
        );
      }

      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Error saving address:', error);
      showError(
        'Address Save Failed',
        error.message || 'Failed to save address. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center">
            <MapPinIcon className="h-5 w-5 mr-2" />
            {address ? 'Edit Address' : 'Add New Address'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <XIcon className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-2">
                Address Type
              </label>
              <select
                id="type"
                name="type"
                value={formData.type}
                onChange={handleChange}
                className="input-field"
                required
              >
                <option value="shipping">Shipping Address</option>
                <option value="billing">Billing Address</option>
              </select>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="is_default"
                name="is_default"
                checked={formData.is_default}
                onChange={handleChange}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <label htmlFor="is_default" className="ml-2 block text-sm text-gray-900">
                Set as default address
              </label>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="first_name" className="block text-sm font-medium text-gray-700 mb-2">
                First Name
              </label>
              <input
                type="text"
                id="first_name"
                name="first_name"
                value={formData.first_name}
                onChange={handleChange}
                className="input-field"
                placeholder="Enter first name"
                required
              />
            </div>

            <div>
              <label htmlFor="last_name" className="block text-sm font-medium text-gray-700 mb-2">
                Last Name
              </label>
              <input
                type="text"
                id="last_name"
                name="last_name"
                value={formData.last_name}
                onChange={handleChange}
                className="input-field"
                placeholder="Enter last name"
                required
              />
            </div>
          </div>

          <div>
            <label htmlFor="company" className="block text-sm font-medium text-gray-700 mb-2">
              Company (Optional)
            </label>
            <input
              type="text"
              id="company"
              name="company"
              value={formData.company}
              onChange={handleChange}
              className="input-field"
              placeholder="Enter company name"
            />
          </div>

          <div>
            <label htmlFor="address_line_1" className="block text-sm font-medium text-gray-700 mb-2">
              Address Line 1
            </label>
            <input
              type="text"
              id="address_line_1"
              name="address_line_1"
              value={formData.address_line_1}
              onChange={handleChange}
              className="input-field"
              placeholder="Enter street address"
              required
            />
          </div>

          <div>
            <label htmlFor="address_line_2" className="block text-sm font-medium text-gray-700 mb-2">
              Address Line 2 (Optional)
            </label>
            <input
              type="text"
              id="address_line_2"
              name="address_line_2"
              value={formData.address_line_2}
              onChange={handleChange}
              className="input-field"
              placeholder="Apartment, suite, unit, etc."
            />
          </div>

          {/* Location Selection */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Location</h3>
            <LocationSelector
              selectedCountryId={selectedLocations.countryId}
              selectedCityId={selectedLocations.cityId}
              selectedDistrictId={selectedLocations.districtId}
              selectedNeighborhoodId={selectedLocations.neighborhoodId}
              onLocationChange={handleLocationChange}
              disabled={isLoading}
            />
          </div>

          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
              Phone Number (Optional)
            </label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className="input-field"
              placeholder="Enter phone number"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-md hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Saving...' : address ? 'Update Address' : 'Add Address'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
