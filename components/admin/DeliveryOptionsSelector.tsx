'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  MapPin,
  Truck,
  Check,
  X,
  Plus
} from 'lucide-react';

interface PickupLocation {
  id: string;
  name: string;
  country: string;
  city: string;
  address_line?: string;
  is_active: boolean;
}

interface DeliveryMethod {
  id: string;
  name: string;
  description?: string;
  is_active: boolean;
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


interface DeliveryOptionsSelectorProps {
  productId?: string;
  onDeliveryOptionsChange?: (options: {
    pickupLocationId: string;
    deliveryMethodIds: string[];
    isFreeDelivery: boolean;
    allowedCities: string[];
    allowedDeliveryZones: Array<{city: string, country: string}>;
  }) => void;
  initialData?: {
    pickupLocationId?: string;
    deliveryMethodIds?: string[];
    isFreeDelivery?: boolean;
    allowedCities?: string[];
    allowedDeliveryZones?: Array<{city: string, country: string}>;
  };
}

export default function DeliveryOptionsSelector({ 
  productId, 
  onDeliveryOptionsChange,
  initialData 
}: DeliveryOptionsSelectorProps) {
  const [pickupLocations, setPickupLocations] = useState<PickupLocation[]>([]);
  const [deliveryMethods, setDeliveryMethods] = useState<DeliveryMethod[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Form state
  const [selectedPickupLocation, setSelectedPickupLocation] = useState<string>(initialData?.pickupLocationId || '');
  const [selectedDeliveryMethods, setSelectedDeliveryMethods] = useState<string[]>(initialData?.deliveryMethodIds || []);
  const [isFreeDelivery, setIsFreeDelivery] = useState<boolean>(initialData?.isFreeDelivery || false);
  const [allowedCities, setAllowedCities] = useState<string[]>(initialData?.allowedCities || []);
  const [allowedDeliveryZones, setAllowedDeliveryZones] = useState<Array<{city: string, country: string}>>(initialData?.allowedDeliveryZones || []);
  const [newCity, setNewCity] = useState('');
  const [newCountry, setNewCountry] = useState('');
  
  // Location-based city selection
  const [countries, setCountries] = useState<any[]>([]);
  const [cities, setCities] = useState<any[]>([]);
  const [selectedCountry, setSelectedCountry] = useState<string>('');
  const [selectedCity, setSelectedCity] = useState<string>('');
  

  useEffect(() => {
    loadData();
  }, []);

  // Update internal state when initialData changes
  useEffect(() => {
    if (initialData) {
      console.log('DeliveryOptionsSelector received initialData:', initialData);
      setSelectedPickupLocation(initialData.pickupLocationId || '');
      setSelectedDeliveryMethods(initialData.deliveryMethodIds || []);
      setIsFreeDelivery(initialData.isFreeDelivery || false);
      setAllowedCities(initialData.allowedCities || []);
      setAllowedDeliveryZones(initialData.allowedDeliveryZones || []);
    }
  }, [initialData]);

  useEffect(() => {
    if (onDeliveryOptionsChange) {
      onDeliveryOptionsChange({
        pickupLocationId: selectedPickupLocation,
        deliveryMethodIds: selectedDeliveryMethods,
        isFreeDelivery,
        allowedCities,
        allowedDeliveryZones
      });
    }
  }, [selectedPickupLocation, selectedDeliveryMethods, isFreeDelivery, allowedCities, allowedDeliveryZones, onDeliveryOptionsChange]);

  const loadData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadPickupLocations(),
        loadDeliveryMethods(),
        loadCountries()
      ]);
    } catch (error) {
      console.error('Error loading delivery data:', error);
    } finally {
      setLoading(false);
    }
  };

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


  const handleDeliveryMethodToggle = (methodId: string) => {
    setSelectedDeliveryMethods(prev => 
      prev.includes(methodId) 
        ? prev.filter(id => id !== methodId)
        : [...prev, methodId]
    );
  };

  const handleAddCity = () => {
    if (newCity.trim() && newCountry.trim()) {
      const cityName = newCity.trim();
      const countryName = newCountry.trim();
      
      // Add to allowed cities (for backward compatibility)
      if (!allowedCities.includes(cityName)) {
        setAllowedCities(prev => [...prev, cityName]);
      }
      
      // Add to delivery zones with country information
      const zoneExists = allowedDeliveryZones.some(zone => 
        zone.city === cityName && zone.country === countryName
      );
      
      if (!zoneExists) {
        setAllowedDeliveryZones(prev => [...prev, { city: cityName, country: countryName }]);
      }
      
      setNewCity('');
      setNewCountry('');
    }
  };

  const handleRemoveCity = (city: string) => {
    setAllowedCities(prev => prev.filter(c => c !== city));
    setAllowedDeliveryZones(prev => prev.filter(zone => zone.city !== city));
  };

  const handleRemoveDeliveryZone = (city: string, country: string) => {
    setAllowedDeliveryZones(prev => prev.filter(zone => !(zone.city === city && zone.country === country)));
    // Also remove from allowed cities if no other country has this city
    const cityExistsInOtherCountries = allowedDeliveryZones.some(zone => 
      zone.city === city && zone.country !== country
    );
    if (!cityExistsInOtherCountries) {
      setAllowedCities(prev => prev.filter(c => c !== city));
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddCity();
    }
  };

  const handleCountryChange = (countryId: string) => {
    setSelectedCountry(countryId);
    setSelectedCity('');
    loadCities(countryId);
  };

  const handleCitySelect = (cityId: string) => {
    setSelectedCity(cityId);
    const selectedCityData = cities.find(c => c.id === cityId);
    const selectedCountryData = countries.find(c => c.id === selectedCountry);
    
    if (selectedCityData && selectedCountryData) {
      const cityName = selectedCityData.name;
      const countryName = selectedCountryData.name;
      
      // Add to allowed cities (for backward compatibility)
      if (!allowedCities.includes(cityName)) {
        setAllowedCities(prev => [...prev, cityName]);
      }
      
      // Add to delivery zones with country information
      const zoneExists = allowedDeliveryZones.some(zone => 
        zone.city === cityName && zone.country === countryName
      );
      
      if (!zoneExists) {
        setAllowedDeliveryZones(prev => [...prev, { city: cityName, country: countryName }]);
      }
    }
    setSelectedCity('');
  };


  if (loading) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-600"></div>
        <span className="ml-2 text-sm text-gray-600">Loading delivery options...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Show loaded delivery options indicator */}
      {initialData && (initialData.pickupLocationId || (initialData.deliveryMethodIds && initialData.deliveryMethodIds.length > 0)) && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center">
            <Check className="h-5 w-5 text-green-600 mr-2" />
            <div>
              <h4 className="text-sm font-medium text-green-800">Existing Delivery Options Loaded</h4>
              <p className="text-sm text-green-700">
                {initialData.pickupLocationId && 'Pickup location selected • '}
                {initialData.deliveryMethodIds && initialData.deliveryMethodIds.length > 0 && `${initialData.deliveryMethodIds.length} delivery method(s) selected • `}
                {initialData.isFreeDelivery && 'Free delivery enabled • '}
                {initialData.allowedDeliveryZones && initialData.allowedDeliveryZones.length > 0 && `${initialData.allowedDeliveryZones.length} delivery zone(s) configured`}
              </p>
            </div>
          </div>
        </div>
      )}
      
      {/* First Row: Pickup Location and Free Delivery */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pickup Location Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Pickup Location *
          </label>
          <select
            value={selectedPickupLocation}
            onChange={(e) => setSelectedPickupLocation(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-orange-500 focus:border-orange-500"
            required
          >
            <option value="">Select a pickup location</option>
            {pickupLocations.map((location) => (
              <option key={location.id} value={location.id}>
                {location.name} - {location.city}, {location.country}
              </option>
            ))}
          </select>
          {selectedPickupLocation && (
            <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-md">
              <div className="flex items-center">
                <MapPin className="h-4 w-4 text-blue-600 mr-2" />
                <span className="text-sm text-blue-800">
                  {pickupLocations.find(l => l.id === selectedPickupLocation)?.name} - 
                  {pickupLocations.find(l => l.id === selectedPickupLocation)?.city}, 
                  {pickupLocations.find(l => l.id === selectedPickupLocation)?.country}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Free Delivery Toggle */}
        <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
          <div>
            <h3 className="text-sm font-medium text-gray-900">Free Delivery</h3>
            <p className="text-sm text-gray-500">Enable free delivery for this product</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={isFreeDelivery}
              onChange={(e) => setIsFreeDelivery(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-600"></div>
          </label>
        </div>
      </div>

      {/* Second Row: Delivery Methods and Allowed Cities */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Delivery Methods Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Delivery Methods *
          </label>
          <div className="space-y-2">
            {deliveryMethods.map((method) => (
              <label key={method.id} className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedDeliveryMethods.includes(method.id)}
                  onChange={() => handleDeliveryMethodToggle(method.id)}
                  className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                />
                <div className="ml-3 flex-1">
                  <div className="flex items-center">
                    <Truck className="h-4 w-4 text-gray-400 mr-2" />
                    <span className="text-sm font-medium text-gray-900">{method.name}</span>
                  </div>
                  {method.description && (
                    <p className="text-xs text-gray-500 mt-1">{method.description}</p>
                  )}
                </div>
              </label>
            ))}
          </div>
          {selectedDeliveryMethods.length === 0 && (
            <p className="text-sm text-red-600 mt-1">Please select at least one delivery method</p>
          )}
        </div>

        {/* Allowed Cities */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Allowed Delivery Cities
          </label>
          
          {/* Location-based selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Country
              </label>
              <select
                value={selectedCountry}
                onChange={(e) => handleCountryChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-orange-500 focus:border-orange-500"
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
                value={selectedCity}
                onChange={(e) => handleCitySelect(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                disabled={!selectedCountry}
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
          
          {/* Manual city input */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-3">
            <input
              type="text"
              value={newCountry}
              onChange={(e) => setNewCountry(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Enter country name"
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-orange-500 focus:border-orange-500"
            />
            <input
              type="text"
              value={newCity}
              onChange={(e) => setNewCity(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Enter city name"
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-orange-500 focus:border-orange-500"
            />
            <button
              type="button"
              onClick={handleAddCity}
              disabled={!newCity.trim() || !newCountry.trim()}
              className="px-3 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              <Plus className="h-4 w-4 mr-1" />
              Add
            </button>
          </div>
          
          {allowedDeliveryZones.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-gray-700">Allowed Delivery Zones:</h4>
              {allowedDeliveryZones.map((zone, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-green-50 border border-green-200 rounded-md">
                  <div className="flex items-center">
                    <Check className="h-4 w-4 text-green-600 mr-2" />
                    <span className="text-sm text-green-800">{zone.city}, {zone.country}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveDeliveryZone(zone.city, zone.country)}
                    className="text-red-600 hover:text-red-800"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
          
          <p className="text-xs text-gray-500 mt-2">
            Leave empty to allow delivery to all cities. Add specific cities to restrict delivery.
          </p>
        </div>
      </div>

    </div>
  );
}
