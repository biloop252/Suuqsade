'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  Plus,
  Edit,
  Trash2,
  MapPin,
  Truck,
  Clock,
  DollarSign,
  X
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

interface Product {
  id: string;
  name: string;
  slug: string;
}

interface ProductDeliveryOption {
  id: string;
  product_id: string;
  delivery_rate_id: string;
  is_free_delivery: boolean;
  product?: Product;
  delivery_rate?: DeliveryRate;
}

interface Location {
  id: string;
  name: string;
  parent_id?: string;
  level: number;
}

export default function DeliveryManagement() {
  const [activeTab, setActiveTab] = useState<'pickup' | 'methods' | 'rates' | 'product-options'>('pickup');
  const [pickupLocations, setPickupLocations] = useState<PickupLocation[]>([]);
  const [deliveryMethods, setDeliveryMethods] = useState<DeliveryMethod[]>([]);
  const [deliveryRates, setDeliveryRates] = useState<DeliveryRate[]>([]);
  const [productDeliveryOptions, setProductDeliveryOptions] = useState<ProductDeliveryOption[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [countries, setCountries] = useState<Location[]>([]);
  const [cities, setCities] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [formData, setFormData] = useState<any>({});
  const [formErrors, setFormErrors] = useState<any>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadPickupLocations(),
        loadDeliveryMethods(),
        loadDeliveryRates(),
        loadProductDeliveryOptions(),
        loadProducts(),
        loadCountries()
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
      .order('pickup_city');

    if (error) {
      console.error('Error loading delivery rates:', error);
    } else {
      setDeliveryRates(data || []);
    }
  };

  const loadCountries = async () => {
    const { data, error } = await supabase
      .from('locations')
      .select('*')
      .eq('level', 0)
      .order('name');

    if (error) {
      console.error('Error loading countries:', error);
    } else {
      setCountries(data || []);
    }
  };

  const loadCities = async (countryId: string) => {
    if (!countryId) {
      setCities([]);
      return;
    }

    const { data, error } = await supabase
      .from('locations')
      .select('*')
      .eq('level', 2)
      .eq('parent_id', countryId)
      .order('name');

    if (error) {
      console.error('Error loading cities:', error);
    } else {
      setCities(data || []);
    }
  };

  const loadAllCities = async () => {
    const { data, error } = await supabase
      .from('locations')
      .select('*')
      .eq('level', 2)
      .order('name');

    if (error) {
      console.error('Error loading cities:', error);
    } else {
      setCities(data || []);
    }
  };

  const loadProductDeliveryOptions = async () => {
    const { data, error } = await supabase
      .from('product_delivery_options')
      .select(`
        *,
        product:products(id, name, slug),
        delivery_rate:delivery_rates(*)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading product delivery options:', error);
    } else {
      setProductDeliveryOptions(data || []);
    }
  };

  const loadProducts = async () => {
    const { data, error } = await supabase
      .from('products')
      .select('id, name, slug')
      .eq('is_active', true)
      .order('name');

    if (error) {
      console.error('Error loading products:', error);
    } else {
      setProducts(data || []);
    }
  };

  const handleEditPickupLocation = async (location: PickupLocation) => {
    setEditingItem(location);
    
    // Find the country and city IDs based on the names
    const country = countries.find(c => c.name === location.country);
    if (country) {
      await loadCities(country.id);
      const city = cities.find(c => c.name === location.city);
      
      setFormData({
        name: location.name,
        country_id: country.id,
        city_id: city?.id || '',
        address_line: location.address_line || '',
        contact_phone: location.contact_phone || '',
        contact_email: location.contact_email || '',
        is_active: location.is_active
      });
    } else {
      setFormData({
        name: location.name,
        country_id: '',
        city_id: '',
        address_line: location.address_line || '',
        contact_phone: location.contact_phone || '',
        contact_email: location.contact_email || '',
        is_active: location.is_active
      });
    }
    
    setShowForm(true);
  };

  const handleSavePickupLocation = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setFormErrors({});

    try {
      const { name, country_id, city_id, address_line, contact_phone, contact_email, is_active } = formData;

      if (!name || !country_id || !city_id) {
        setFormErrors({ general: 'Name, country, and city are required' });
        setSaving(false);
        return;
      }

      // Get country and city names from the selected IDs
      const selectedCountry = countries.find(c => c.id === country_id);
      const selectedCity = cities.find(c => c.id === city_id);

      if (!selectedCountry || !selectedCity) {
        setFormErrors({ general: 'Invalid country or city selection' });
        setSaving(false);
        return;
      }

      const data = {
        name,
        country: selectedCountry.name,
        city: selectedCity.name,
        address_line: address_line || null,
        contact_phone: contact_phone || null,
        contact_email: contact_email || null,
        is_active: is_active ?? true
      };

      if (editingItem) {
        // Update existing
        const { error } = await supabase
          .from('pickup_locations')
          .update(data)
          .eq('id', editingItem.id);

        if (error) throw error;
      } else {
        // Create new
        const { error } = await supabase
          .from('pickup_locations')
          .insert([data]);

        if (error) throw error;
      }

      await loadPickupLocations();
      setShowForm(false);
      setEditingItem(null);
      setFormData({});
    } catch (error) {
      console.error('Error saving pickup location:', error);
      setFormErrors({ general: 'Error saving pickup location' });
    } finally {
      setSaving(false);
    }
  };

  const handleDeletePickupLocation = async (id: string) => {
    if (!confirm('Are you sure you want to delete this pickup location?')) return;

    try {
      const { error } = await supabase
        .from('pickup_locations')
        .delete()
        .eq('id', id);

      if (error) throw error;

      await loadPickupLocations();
    } catch (error) {
      console.error('Error deleting pickup location:', error);
      alert('Error deleting pickup location');
    }
  };

  const handleEditDeliveryMethod = (method: DeliveryMethod) => {
    setEditingItem(method);
    setFormData({
      name: method.name,
      description: method.description || '',
      is_active: method.is_active
    });
    setShowForm(true);
  };

  const handleSaveDeliveryMethod = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setFormErrors({});

    try {
      const { name, description, is_active } = formData;

      if (!name) {
        setFormErrors({ general: 'Name is required' });
        setSaving(false);
        return;
      }

      const data = {
        name,
        description: description || null,
        is_active: is_active ?? true
      };

      if (editingItem) {
        // Update existing
        const { error } = await supabase
          .from('delivery_methods')
          .update(data)
          .eq('id', editingItem.id);

        if (error) throw error;
      } else {
        // Create new
        const { error } = await supabase
          .from('delivery_methods')
          .insert([data]);

        if (error) throw error;
      }

      await loadDeliveryMethods();
      setShowForm(false);
      setEditingItem(null);
      setFormData({});
    } catch (error) {
      console.error('Error saving delivery method:', error);
      setFormErrors({ general: 'Error saving delivery method' });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteDeliveryMethod = async (id: string) => {
    if (!confirm('Are you sure you want to delete this delivery method?')) return;

    try {
      const { error } = await supabase
        .from('delivery_methods')
        .delete()
        .eq('id', id);

      if (error) throw error;

      await loadDeliveryMethods();
    } catch (error) {
      console.error('Error deleting delivery method:', error);
      alert('Error deleting delivery method');
    }
  };

  const handleEditDeliveryRate = async (rate: DeliveryRate) => {
    setEditingItem(rate);
    
    // Load all cities first
    await loadAllCities();
    
    // Find the city IDs based on the names
    const pickupCity = cities.find(c => c.name === rate.pickup_city);
    const deliveryCity = cities.find(c => c.name === rate.delivery_city);
    
    setFormData({
      pickup_city_id: pickupCity?.id || '',
      delivery_city_id: deliveryCity?.id || '',
      delivery_method_id: rate.delivery_method_id,
      price: rate.price,
      estimated_min_days: rate.estimated_min_days,
      estimated_max_days: rate.estimated_max_days,
      is_active: rate.is_active
    });
    
    setShowForm(true);
  };

  const handleSaveDeliveryRate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setFormErrors({});

    try {
      const { pickup_city_id, delivery_city_id, delivery_method_id, price, estimated_min_days, estimated_max_days, is_active } = formData;

      if (!pickup_city_id || !delivery_city_id || !delivery_method_id || !price || !estimated_min_days || !estimated_max_days) {
        setFormErrors({ general: 'All fields are required' });
        setSaving(false);
        return;
      }

      if (estimated_min_days >= estimated_max_days) {
        setFormErrors({ general: 'Minimum days must be less than maximum days' });
        setSaving(false);
        return;
      }

      // Get city names from the selected IDs
      const selectedPickupCity = cities.find(c => c.id === pickup_city_id);
      const selectedDeliveryCity = cities.find(c => c.id === delivery_city_id);

      if (!selectedPickupCity || !selectedDeliveryCity) {
        setFormErrors({ general: 'Invalid city selection' });
        setSaving(false);
        return;
      }

      const data = {
        pickup_city: selectedPickupCity.name,
        delivery_city: selectedDeliveryCity.name,
        delivery_method_id,
        price: parseFloat(price),
        estimated_min_days: parseInt(estimated_min_days),
        estimated_max_days: parseInt(estimated_max_days),
        is_active: is_active ?? true
      };

      if (editingItem) {
        // Update existing
        const { error } = await supabase
          .from('delivery_rates')
          .update(data)
          .eq('id', editingItem.id);

        if (error) throw error;
      } else {
        // Create new
        const { error } = await supabase
          .from('delivery_rates')
          .insert([data]);

        if (error) throw error;
      }

      await loadDeliveryRates();
      setShowForm(false);
      setEditingItem(null);
      setFormData({});
    } catch (error) {
      console.error('Error saving delivery rate:', error);
      setFormErrors({ general: 'Error saving delivery rate' });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteDeliveryRate = async (id: string) => {
    if (!confirm('Are you sure you want to delete this delivery rate?')) return;

    try {
      const { error } = await supabase
        .from('delivery_rates')
        .delete()
        .eq('id', id);

      if (error) throw error;

      await loadDeliveryRates();
    } catch (error) {
      console.error('Error deleting delivery rate:', error);
      alert('Error deleting delivery rate');
    }
  };

  const handleEditProductDeliveryOption = (option: ProductDeliveryOption) => {
    setEditingItem(option);
    setFormData({
      product_id: option.product_id,
      delivery_rate_id: option.delivery_rate_id,
      is_free_delivery: option.is_free_delivery
    });
    loadAllCities();
    setShowForm(true);
  };

  const handleSaveProductDeliveryOption = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setFormErrors({});

    try {
      const { product_id, delivery_rate_id, is_free_delivery } = formData;

      if (!product_id || !delivery_rate_id) {
        setFormErrors({ general: 'Product and delivery rate are required' });
        setSaving(false);
        return;
      }

      const data = {
        product_id,
        delivery_rate_id,
        is_free_delivery: is_free_delivery ?? false
      };

      if (editingItem) {
        // Update existing
        const { error } = await supabase
          .from('product_delivery_options')
          .update(data)
          .eq('id', editingItem.id);

        if (error) throw error;
      } else {
        // Create new
        const { error } = await supabase
          .from('product_delivery_options')
          .insert([data]);

        if (error) throw error;
      }

      await loadProductDeliveryOptions();
      setShowForm(false);
      setEditingItem(null);
      setFormData({});
    } catch (error) {
      console.error('Error saving product delivery option:', error);
      setFormErrors({ general: 'Error saving product delivery option' });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteProductDeliveryOption = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product delivery option?')) return;

    try {
      const { error } = await supabase
        .from('product_delivery_options')
        .delete()
        .eq('id', id);

      if (error) throw error;

      await loadProductDeliveryOptions();
    } catch (error) {
      console.error('Error deleting product delivery option:', error);
      alert('Error deleting product delivery option');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  const renderForm = () => {
    if (!showForm) return null;

    const isEditing = !!editingItem;
    const formTitle = isEditing ? 
      `Edit ${activeTab === 'pickup' ? 'Pickup Location' : 
               activeTab === 'methods' ? 'Delivery Method' : 
               activeTab === 'rates' ? 'Delivery Rate' : 
               'Product Delivery Option'}` : 
      `Add ${activeTab === 'pickup' ? 'Pickup Location' : 
             activeTab === 'methods' ? 'Delivery Method' : 
             activeTab === 'rates' ? 'Delivery Rate' : 
             'Product Delivery Option'}`;

    return (
      <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
        <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
          <div className="mt-3">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">{formTitle}</h3>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setEditingItem(null);
                  setFormData({});
                  setFormErrors({});
                  setCities([]);
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

            <form onSubmit={
              activeTab === 'pickup' ? handleSavePickupLocation : 
              activeTab === 'methods' ? handleSaveDeliveryMethod : 
              activeTab === 'rates' ? handleSaveDeliveryRate :
              handleSaveProductDeliveryOption
            }>
              {activeTab === 'pickup' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Name *</label>
                    <input
                      type="text"
                      value={formData.name || ''}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Country *</label>
                    <select
                      value={formData.country_id || ''}
                      onChange={(e) => {
                        const countryId = e.target.value;
                        setFormData({ ...formData, country_id: countryId, city_id: '' });
                        loadCities(countryId);
                      }}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                      required
                    >
                      <option value="">Select a country</option>
                      {countries.map((country) => (
                        <option key={country.id} value={country.id}>
                          {country.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">City *</label>
                    <select
                      value={formData.city_id || ''}
                      onChange={(e) => setFormData({ ...formData, city_id: e.target.value })}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                      required
                      disabled={!formData.country_id}
                    >
                      <option value="">Select a city</option>
                      {cities.map((city) => (
                        <option key={city.id} value={city.id}>
                          {city.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Address Line</label>
                    <input
                      type="text"
                      value={formData.address_line || ''}
                      onChange={(e) => setFormData({ ...formData, address_line: e.target.value })}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Contact Phone</label>
                    <input
                      type="tel"
                      value={formData.contact_phone || ''}
                      onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Contact Email</label>
                    <input
                      type="email"
                      value={formData.contact_email || ''}
                      onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                    />
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="is_active_pickup"
                      checked={formData.is_active ?? true}
                      onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                      className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                    />
                    <label htmlFor="is_active_pickup" className="ml-2 block text-sm text-gray-900">
                      Active
                    </label>
                  </div>
                </div>
              )}

              {activeTab === 'methods' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Name *</label>
                    <input
                      type="text"
                      value={formData.name || ''}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Description</label>
                    <textarea
                      rows={3}
                      value={formData.description || ''}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                    />
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="is_active_method"
                      checked={formData.is_active ?? true}
                      onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                      className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                    />
                    <label htmlFor="is_active_method" className="ml-2 block text-sm text-gray-900">
                      Active
                    </label>
                  </div>
                </div>
              )}

              {activeTab === 'rates' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Pickup City *</label>
                    <select
                      value={formData.pickup_city_id || ''}
                      onChange={(e) => setFormData({ ...formData, pickup_city_id: e.target.value })}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                      required
                    >
                      <option value="">Select a city</option>
                      {cities.map((city) => (
                        <option key={city.id} value={city.id}>
                          {city.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Delivery City *</label>
                    <select
                      value={formData.delivery_city_id || ''}
                      onChange={(e) => setFormData({ ...formData, delivery_city_id: e.target.value })}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                      required
                    >
                      <option value="">Select a city</option>
                      {cities.map((city) => (
                        <option key={city.id} value={city.id}>
                          {city.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Delivery Method *</label>
                    <select
                      value={formData.delivery_method_id || ''}
                      onChange={(e) => setFormData({ ...formData, delivery_method_id: e.target.value })}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                      required
                    >
                      <option value="">Select a method</option>
                      {deliveryMethods.map((method) => (
                        <option key={method.id} value={method.id}>
                          {method.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Price ($) *</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.price || ''}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Min Days *</label>
                      <input
                        type="number"
                        min="1"
                        value={formData.estimated_min_days || ''}
                        onChange={(e) => setFormData({ ...formData, estimated_min_days: e.target.value })}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Max Days *</label>
                      <input
                        type="number"
                        min="1"
                        value={formData.estimated_max_days || ''}
                        onChange={(e) => setFormData({ ...formData, estimated_max_days: e.target.value })}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                        required
                      />
                    </div>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="is_active_rate"
                      checked={formData.is_active ?? true}
                      onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                      className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                    />
                    <label htmlFor="is_active_rate" className="ml-2 block text-sm text-gray-900">
                      Active
                    </label>
                  </div>
                </div>
              )}

              {activeTab === 'product-options' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Product *</label>
                    <select
                      value={formData.product_id || ''}
                      onChange={(e) => setFormData({ ...formData, product_id: e.target.value })}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                      required
                    >
                      <option value="">Select a product</option>
                      {products.map((product) => (
                        <option key={product.id} value={product.id}>
                          {product.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Delivery Rate *</label>
                    <select
                      value={formData.delivery_rate_id || ''}
                      onChange={(e) => setFormData({ ...formData, delivery_rate_id: e.target.value })}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                      required
                    >
                      <option value="">Select a delivery rate</option>
                      {deliveryRates.map((rate) => (
                        <option key={rate.id} value={rate.id}>
                          {rate.pickup_city} → {rate.delivery_city} ({rate.delivery_method?.name}) - ${rate.price}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="is_free_delivery_option"
                      checked={formData.is_free_delivery ?? false}
                      onChange={(e) => setFormData({ ...formData, is_free_delivery: e.target.checked })}
                      className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                    />
                    <label htmlFor="is_free_delivery_option" className="ml-2 block text-sm text-gray-900">
                      Free delivery for this option
                    </label>
                  </div>
                </div>
              )}

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingItem(null);
                    setFormData({});
                    setFormErrors({});
                    setCities([]);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 bg-orange-600 text-white rounded-md text-sm font-medium hover:bg-orange-700 disabled:opacity-50"
                >
                  {saving ? 'Saving...' : (isEditing ? 'Update' : 'Create')}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {renderForm()}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-3 border-b border-gray-200">
          <h1 className="text-xl font-semibold text-gray-900">Delivery Management</h1>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-4">
            <button
              type="button"
              onClick={() => setActiveTab('pickup')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'pickup'
                  ? 'border-orange-500 text-orange-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Pickup Locations
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('methods')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'methods'
                  ? 'border-orange-500 text-orange-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Delivery Methods
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
            <button
              type="button"
              onClick={() => setActiveTab('product-options')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'product-options'
                  ? 'border-orange-500 text-orange-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Product Options
            </button>
          </nav>
        </div>

        <div className="p-4">
          {/* Pickup Locations Tab */}
          {activeTab === 'pickup' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium text-gray-900">Pickup Locations</h3>
                <button
                  type="button"
                  onClick={() => {
                    setEditingItem(null);
                    setFormData({});
                    setShowForm(true);
                  }}
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Location
                </button>
              </div>

              {pickupLocations.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <MapPin className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No pickup locations configured.</p>
                  <p className="text-sm">Add pickup locations to get started.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Name
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Location
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Contact
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
                      {pickupLocations.map((location) => (
                        <tr key={location.id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {location.name}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {location.city}, {location.country}
                            </div>
                            {location.address_line && (
                              <div className="text-sm text-gray-500">
                                {location.address_line}
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {location.contact_phone}
                            </div>
                            <div className="text-sm text-gray-500">
                              {location.contact_email}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              location.is_active
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {location.is_active ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex items-center justify-end space-x-2">
                              <button
                                type="button"
                                onClick={() => handleEditPickupLocation(location)}
                                className="text-orange-600 hover:text-orange-900"
                                title="Edit location"
                              >
                                <Edit className="h-4 w-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeletePickupLocation(location.id)}
                                className="text-red-600 hover:text-red-900"
                                title="Delete location"
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
          )}

          {/* Delivery Methods Tab */}
          {activeTab === 'methods' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium text-gray-900">Delivery Methods</h3>
                <button
                  type="button"
                  onClick={() => {
                    setEditingItem(null);
                    setShowForm(true);
                  }}
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Method
                </button>
              </div>

              {deliveryMethods.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Truck className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No delivery methods configured.</p>
                  <p className="text-sm">Add delivery methods to get started.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Name
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Description
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
                      {deliveryMethods.map((method) => (
                        <tr key={method.id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {method.name}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-500">
                              {method.description || 'No description'}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              method.is_active
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {method.is_active ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex items-center justify-end space-x-2">
                              <button
                                type="button"
                                onClick={() => handleEditDeliveryMethod(method)}
                                className="text-orange-600 hover:text-orange-900"
                                title="Edit method"
                              >
                                <Edit className="h-4 w-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteDeliveryMethod(method.id)}
                                className="text-red-600 hover:text-red-900"
                                title="Delete method"
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
          )}

          {/* Delivery Rates Tab */}
          {activeTab === 'rates' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium text-gray-900">Delivery Rates</h3>
                <button
                  type="button"
                  onClick={() => {
                    setEditingItem(null);
                    setFormData({});
                    loadAllCities();
                    setShowForm(true);
                  }}
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
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
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
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex items-center justify-end space-x-2">
                              <button
                                type="button"
                                onClick={() => handleEditDeliveryRate(rate)}
                                className="text-orange-600 hover:text-orange-900"
                                title="Edit rate"
                              >
                                <Edit className="h-4 w-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteDeliveryRate(rate.id)}
                                className="text-red-600 hover:text-red-900"
                                title="Delete rate"
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
          )}

          {/* Product Delivery Options Tab */}
          {activeTab === 'product-options' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium text-gray-900">Product Delivery Options</h3>
                <button
                  type="button"
                  onClick={() => {
                    setEditingItem(null);
                    setFormData({});
                    setShowForm(true);
                  }}
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Option
                </button>
              </div>

              {productDeliveryOptions.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Truck className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No product delivery options configured.</p>
                  <p className="text-sm">Add product delivery options to link products with delivery rates.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Product
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Delivery Route
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Method
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Price
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
                            <div className="text-sm font-medium text-gray-900">
                              {option.product?.name}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {option.delivery_rate?.pickup_city} → {option.delivery_rate?.delivery_city}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-500">
                              {option.delivery_rate?.delivery_method?.name}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            ${option.delivery_rate?.price.toFixed(2)}
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
                            <div className="flex items-center justify-end space-x-2">
                              <button
                                type="button"
                                onClick={() => handleEditProductDeliveryOption(option)}
                                className="text-orange-600 hover:text-orange-900"
                                title="Edit option"
                              >
                                <Edit className="h-4 w-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteProductDeliveryOption(option.id)}
                                className="text-red-600 hover:text-red-900"
                                title="Delete option"
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
          )}
        </div>
      </div>
    </div>
  );
}

