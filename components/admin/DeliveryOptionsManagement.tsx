'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  Plus,
  X,
  Edit,
  Trash2,
  MapPin,
  Truck,
  Clock,
  DollarSign
} from 'lucide-react';

interface PickupLocation {
  id: string;
  name: string;
  country: string;
  city: string;
  address_line?: string;
  contact_phone?: string;
  contact_email?: string;
  is_active: boolean;
}

interface DeliveryMethod {
  id: string;
  name: string;
  description?: string;
  is_active: boolean;
}

interface DeliveryRate {
  id: string;
  pickup_city: string;
  delivery_city: string;
  delivery_method_id: string;
  price: number;
  estimated_min_days: number;
  estimated_max_days: number;
  is_active: boolean;
  delivery_method?: DeliveryMethod;
}

interface ProductDeliveryOption {
  id: string;
  product_id: string;
  pickup_location_id: string;
  delivery_method_id: string;
  is_free_delivery: boolean;
  pickup_location?: PickupLocation;
  delivery_method?: DeliveryMethod;
}

interface ProductDeliveryZone {
  id: string;
  product_id: string;
  city: string;
  country: string;
  is_allowed: boolean;
}

interface DeliveryOptionsManagementProps {
  productId: string;
  productName: string;
}

export default function DeliveryOptionsManagement({ 
  productId, 
  productName 
}: DeliveryOptionsManagementProps) {
  const [pickupLocations, setPickupLocations] = useState<PickupLocation[]>([]);
  const [deliveryMethods, setDeliveryMethods] = useState<DeliveryMethod[]>([]);
  const [deliveryRates, setDeliveryRates] = useState<DeliveryRate[]>([]);
  const [productDeliveryOptions, setProductDeliveryOptions] = useState<ProductDeliveryOption[]>([]);
  const [productDeliveryZones, setProductDeliveryZones] = useState<ProductDeliveryZone[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'options' | 'zones' | 'rates'>('options');
  
  // Form states
  const [showPickupLocationForm, setShowPickupLocationForm] = useState(false);
  const [showDeliveryMethodForm, setShowDeliveryMethodForm] = useState(false);
  const [showDeliveryRateForm, setShowDeliveryRateForm] = useState(false);
  const [showProductOptionForm, setShowProductOptionForm] = useState(false);
  const [showZoneForm, setShowZoneForm] = useState(false);
  
  const [editingItem, setEditingItem] = useState<any>(null);

  // Load data
  useEffect(() => {
    loadData();
  }, [productId]);

  const loadData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadPickupLocations(),
        loadDeliveryMethods(),
        loadDeliveryRates(),
        loadProductDeliveryOptions(),
        loadProductDeliveryZones()
      ]);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadPickupLocations = async () => {
    const { data, error } = await supabase
      .from('pickup_locations')
      .select('*')
      .eq('is_active', true)
      .order('city');

    if (error) {
      console.error('Error loading pickup locations:', error);
    } else {
      setPickupLocations(data || []);
    }
  };

  const loadDeliveryMethods = async () => {
    const { data, error } = await supabase
      .from('delivery_methods')
      .select('*')
      .eq('is_active', true)
      .order('name');

    if (error) {
      console.error('Error loading delivery methods:', error);
    } else {
      setDeliveryMethods(data || []);
    }
  };

  const loadDeliveryRates = async () => {
    const { data, error } = await supabase
      .from('delivery_rates')
      .select(`
        *,
        delivery_method:delivery_methods(*)
      `)
      .eq('is_active', true)
      .order('pickup_city');

    if (error) {
      console.error('Error loading delivery rates:', error);
    } else {
      setDeliveryRates(data || []);
    }
  };

  const loadProductDeliveryOptions = async () => {
    const { data, error } = await supabase
      .from('product_delivery_options')
      .select(`
        *,
        pickup_location:pickup_locations(*),
        delivery_method:delivery_methods(*)
      `)
      .eq('product_id', productId);

    if (error) {
      console.error('Error loading product delivery options:', error);
    } else {
      setProductDeliveryOptions(data || []);
    }
  };

  const loadProductDeliveryZones = async () => {
    const { data, error } = await supabase
      .from('product_delivery_zones')
      .select('*')
      .eq('product_id', productId)
      .order('country, city');

    if (error) {
      console.error('Error loading product delivery zones:', error);
    } else {
      setProductDeliveryZones(data || []);
    }
  };

  const handleAddProductOption = async (formData: any) => {
    try {
      const { error } = await supabase
        .from('product_delivery_options')
        .insert([{
          product_id: productId,
          pickup_location_id: formData.pickup_location_id,
          delivery_method_id: formData.delivery_method_id,
          is_free_delivery: formData.is_free_delivery
        }]);

      if (error) throw error;

      await loadProductDeliveryOptions();
      setShowProductOptionForm(false);
    } catch (error) {
      console.error('Error adding product delivery option:', error);
      alert('Error adding delivery option');
    }
  };

  const handleAddZone = async (formData: any) => {
    try {
      const { error } = await supabase
        .from('product_delivery_zones')
        .insert([{
          product_id: productId,
          city: formData.city,
          country: formData.country,
          is_allowed: formData.is_allowed
        }]);

      if (error) throw error;

      await loadProductDeliveryZones();
      setShowZoneForm(false);
    } catch (error) {
      console.error('Error adding delivery zone:', error);
      alert('Error adding delivery zone');
    }
  };


  const handleDeleteProductOption = async (id: string) => {
    if (!confirm('Are you sure you want to delete this delivery option?')) return;

    try {
      const { error } = await supabase
        .from('product_delivery_options')
        .delete()
        .eq('id', id);

      if (error) throw error;

      await loadProductDeliveryOptions();
    } catch (error) {
      console.error('Error deleting delivery option:', error);
      alert('Error deleting delivery option');
    }
  };

  const handleDeleteZone = async (id: string) => {
    if (!confirm('Are you sure you want to delete this delivery zone?')) return;

    try {
      const { error } = await supabase
        .from('product_delivery_zones')
        .delete()
        .eq('id', id);

      if (error) throw error;

      await loadProductDeliveryZones();
    } catch (error) {
      console.error('Error deleting delivery zone:', error);
      alert('Error deleting delivery zone');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-3 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            Delivery Options for "{productName}"
          </h2>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-4">
            <button
              type="button"
              onClick={() => setActiveTab('options')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'options'
                  ? 'border-orange-500 text-orange-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Delivery Options
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('zones')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'zones'
                  ? 'border-orange-500 text-orange-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Delivery Zones
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('rates')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'rates'
                  ? 'border-orange-500 text-orange-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Delivery Rates
            </button>
          </nav>
        </div>

        <div className="p-4">
          {/* Delivery Options Tab */}
          {activeTab === 'options' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium text-gray-900">Product Delivery Options</h3>
                <button
                  type="button"
                  onClick={() => setShowProductOptionForm(true)}
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Option
                </button>
              </div>

              {productDeliveryOptions.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Truck className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No delivery options configured for this product.</p>
                  <p className="text-sm">Add pickup locations and delivery methods to get started.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Pickup Location
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Delivery Method
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Free Delivery
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {productDeliveryOptions.map((option) => (
                        <tr key={option.id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <MapPin className="h-4 w-4 text-gray-400 mr-2" />
                              <div>
                                <div className="text-sm font-medium text-gray-900">
                                  {option.pickup_location?.name}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {option.pickup_location?.city}, {option.pickup_location?.country}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <Truck className="h-4 w-4 text-gray-400 mr-2" />
                              <span className="text-sm text-gray-900">
                                {option.delivery_method?.name}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              option.is_free_delivery
                                ? 'bg-green-100 text-green-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {option.is_free_delivery ? 'Yes' : 'No'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <button
                              type="button"
                              onClick={() => handleDeleteProductOption(option.id)}
                              className="text-red-600 hover:text-red-900"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Delivery Zones Tab */}
          {activeTab === 'zones' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium text-gray-900">Delivery Zones</h3>
                <button
                  type="button"
                  onClick={() => setShowZoneForm(true)}
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Zone
                </button>
              </div>

              {productDeliveryZones.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <MapPin className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No delivery zones configured for this product.</p>
                  <p className="text-sm">Add cities where this product can be delivered.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          City
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Country
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {productDeliveryZones.map((zone) => (
                        <tr key={zone.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {zone.city}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {zone.country}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              zone.is_allowed
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {zone.is_allowed ? 'Allowed' : 'Restricted'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <button
                              type="button"
                              onClick={() => handleDeleteZone(zone.id)}
                              className="text-red-600 hover:text-red-900"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Delivery Rates Tab */}
          {activeTab === 'rates' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium text-gray-900">Delivery Rates</h3>
                <button
                  type="button"
                  onClick={() => setShowDeliveryRateForm(true)}
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Rate
                </button>
              </div>

              {deliveryRates.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <DollarSign className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No delivery rates configured.</p>
                  <p className="text-sm">Add delivery rates to define pricing between cities.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          From City
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          To City
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Method
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Price
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Delivery Time
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {deliveryRates.map((rate) => (
                        <tr key={rate.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {rate.pickup_city}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {rate.delivery_city}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {rate.delivery_method?.name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            ${rate.price.toFixed(2)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <div className="flex items-center">
                              <Clock className="h-4 w-4 text-gray-400 mr-1" />
                              {rate.estimated_min_days}-{rate.estimated_max_days} days
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Add Product Option Modal */}
      {showProductOptionForm && (
        <ProductOptionForm
          pickupLocations={pickupLocations}
          deliveryMethods={deliveryMethods}
          onSubmit={handleAddProductOption}
          onCancel={() => setShowProductOptionForm(false)}
        />
      )}

      {/* Add Zone Modal */}
      {showZoneForm && (
        <ZoneForm
          onSubmit={handleAddZone}
          onCancel={() => setShowZoneForm(false)}
        />
      )}

    </div>
  );
}

// Product Option Form Component
function ProductOptionForm({ 
  pickupLocations, 
  deliveryMethods, 
  onSubmit, 
  onCancel 
}: {
  pickupLocations: PickupLocation[];
  deliveryMethods: DeliveryMethod[];
  onSubmit: (data: any) => void;
  onCancel: () => void;
}) {
  const [formData, setFormData] = useState({
    pickup_location_id: '',
    delivery_method_id: '',
    is_free_delivery: false
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Add Delivery Option</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Pickup Location
              </label>
              <select
                value={formData.pickup_location_id}
                onChange={(e) => setFormData({ ...formData, pickup_location_id: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                required
              >
                <option value="">Select pickup location</option>
                {pickupLocations.map((location) => (
                  <option key={location.id} value={location.id}>
                    {location.name} - {location.city}, {location.country}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Delivery Method
              </label>
              <select
                value={formData.delivery_method_id}
                onChange={(e) => setFormData({ ...formData, delivery_method_id: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                required
              >
                <option value="">Select delivery method</option>
                {deliveryMethods.map((method) => (
                  <option key={method.id} value={method.id}>
                    {method.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="is_free_delivery"
                checked={formData.is_free_delivery}
                onChange={(e) => setFormData({ ...formData, is_free_delivery: e.target.checked })}
                className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
              />
              <label htmlFor="is_free_delivery" className="ml-2 block text-sm text-gray-900">
                Free delivery for this option
              </label>
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onCancel}
                className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700"
              >
                Add Option
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

// Zone Form Component
function ZoneForm({ 
  onSubmit, 
  onCancel 
}: {
  onSubmit: (data: any) => void;
  onCancel: () => void;
}) {
  const [formData, setFormData] = useState({
    city: '',
    country: '',
    is_allowed: true
  });
  const [countries, setCountries] = useState<any[]>([]);
  const [cities, setCities] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

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

    setLoading(true);
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
    } finally {
      setLoading(false);
    }
  };

  const handleCountryChange = (countryId: string) => {
    setFormData({ ...formData, country: countryId, city: '' });
    loadCities(countryId);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Get the actual names from the selected IDs
    const selectedCountry = countries.find(c => c.id === formData.country);
    const selectedCity = cities.find(c => c.id === formData.city);
    
    onSubmit({
      city: selectedCity?.name || '',
      country: selectedCountry?.name || '',
      is_allowed: formData.is_allowed
    });
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Add Delivery Zone</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Country
              </label>
              <select
                value={formData.country}
                onChange={(e) => handleCountryChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-orange-500 focus:border-orange-500"
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
              <label className="block text-sm font-medium text-gray-700 mb-1">
                City
              </label>
              <select
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                required
                disabled={!formData.country || loading}
              >
                <option value="">Select city</option>
                {cities.map((city) => (
                  <option key={city.id} value={city.id}>
                    {city.name}
                  </option>
                ))}
              </select>
              {loading && (
                <p className="text-xs text-gray-500 mt-1">Loading cities...</p>
              )}
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="is_allowed"
                checked={formData.is_allowed}
                onChange={(e) => setFormData({ ...formData, is_allowed: e.target.checked })}
                className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
              />
              <label htmlFor="is_allowed" className="ml-2 block text-sm text-gray-900">
                Allow delivery to this city
              </label>
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onCancel}
                className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700"
              >
                Add Zone
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}


