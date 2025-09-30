'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { ChevronDown } from 'lucide-react';

interface Location {
  id: string;
  name: string;
  parent_id: string | null;
  level: number;
}

interface LocationSelectorProps {
  selectedCountryId?: string;
  selectedStateId?: string;
  selectedCityId?: string;
  selectedDistrictId?: string;
  selectedNeighborhoodId?: string;
  onLocationChange: (locations: {
    countryId: string;
    countryName: string;
    stateId: string;
    stateName: string;
    cityId: string;
    cityName: string;
    districtId: string;
    districtName: string;
    neighborhoodId: string;
    neighborhoodName: string;
  }) => void;
  disabled?: boolean;
}

export default function LocationSelector({
  selectedCountryId = '',
  selectedStateId = '',
  selectedCityId = '',
  selectedDistrictId = '',
  selectedNeighborhoodId = '',
  onLocationChange,
  disabled = false
}: LocationSelectorProps) {
  const [countries, setCountries] = useState<Location[]>([]);
  const [states, setStates] = useState<Location[]>([]);
  const [cities, setCities] = useState<Location[]>([]);
  const [districts, setDistricts] = useState<Location[]>([]);
  const [neighborhoods, setNeighborhoods] = useState<Location[]>([]);
  
  const [selectedCountry, setSelectedCountry] = useState(selectedCountryId);
  const [selectedState, setSelectedState] = useState(selectedStateId);
  const [selectedCity, setSelectedCity] = useState(selectedCityId);
  const [selectedDistrict, setSelectedDistrict] = useState(selectedDistrictId);
  const [selectedNeighborhood, setSelectedNeighborhood] = useState(selectedNeighborhoodId);
  
  const [loading, setLoading] = useState({
    countries: true,
    states: false,
    cities: false,
    districts: false,
    neighborhoods: false
  });

  // Load countries on component mount
  useEffect(() => {
    loadCountries();
  }, []);

  // Update internal state when props change
  useEffect(() => {
    setSelectedCountry(selectedCountryId);
    setSelectedState(selectedStateId);
    setSelectedCity(selectedCityId);
    setSelectedDistrict(selectedDistrictId);
    setSelectedNeighborhood(selectedNeighborhoodId);
  }, [selectedCountryId, selectedStateId, selectedCityId, selectedDistrictId, selectedNeighborhoodId]);

  // Load states when country changes
  useEffect(() => {
    if (selectedCountry) {
      loadStates(selectedCountry);
    } else {
      setStates([]);
      setSelectedState('');
    }
  }, [selectedCountry]);

  // Load cities when state or country changes
  useEffect(() => {
    if (selectedState) {
      // Load cities from state
      loadCities(selectedState);
    } else if (selectedCountry) {
      // Load cities directly from country (when state is optional)
      loadCitiesFromCountry(selectedCountry);
    } else {
      setCities([]);
      setSelectedCity('');
    }
  }, [selectedState, selectedCountry]);

  // Load districts when city changes
  useEffect(() => {
    if (selectedCity) {
      loadDistricts(selectedCity);
    } else {
      setDistricts([]);
      setSelectedDistrict('');
    }
  }, [selectedCity]);

  // Load neighborhoods when district changes
  useEffect(() => {
    if (selectedDistrict) {
      loadNeighborhoods(selectedDistrict);
    } else {
      setNeighborhoods([]);
      setSelectedNeighborhood('');
    }
  }, [selectedDistrict]);

  // Notify parent component when selections change
  useEffect(() => {
    if (selectedCountry && selectedCity) {
      const country = countries.find(c => c.id === selectedCountry);
      const state = states.find(s => s.id === selectedState);
      const city = cities.find(c => c.id === selectedCity);
      const district = districts.find(d => d.id === selectedDistrict);
      const neighborhood = neighborhoods.find(n => n.id === selectedNeighborhood);

      if (country && city) {
        onLocationChange({
          countryId: selectedCountry,
          countryName: country.name,
          stateId: selectedState || '',
          stateName: state?.name || '',
          cityId: selectedCity,
          cityName: city.name,
          districtId: selectedDistrict || '',
          districtName: district?.name || '',
          neighborhoodId: selectedNeighborhood || '',
          neighborhoodName: neighborhood?.name || ''
        });
      }
    }
  }, [selectedCountry, selectedState, selectedCity, selectedDistrict, selectedNeighborhood, countries, states, cities, districts, neighborhoods]);

  const loadCountries = async () => {
    try {
      setLoading(prev => ({ ...prev, countries: true }));
      const { data, error } = await supabase
        .from('locations')
        .select('id, name, parent_id, level')
        .eq('level', 0)
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setCountries(data || []);
    } catch (error) {
      console.error('Error loading countries:', error);
    } finally {
      setLoading(prev => ({ ...prev, countries: false }));
    }
  };

  const loadStates = async (countryId: string) => {
    try {
      setLoading(prev => ({ ...prev, states: true }));
      const { data, error } = await supabase
        .from('locations')
        .select('id, name, parent_id, level')
        .eq('parent_id', countryId)
        .eq('level', 1)
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setStates(data || []);
    } catch (error) {
      console.error('Error loading states:', error);
    } finally {
      setLoading(prev => ({ ...prev, states: false }));
    }
  };

  const loadCities = async (stateId: string) => {
    try {
      setLoading(prev => ({ ...prev, cities: true }));
      const { data, error } = await supabase
        .from('locations')
        .select('id, name, parent_id, level')
        .eq('parent_id', stateId)
        .eq('level', 2)
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setCities(data || []);
    } catch (error) {
      console.error('Error loading cities:', error);
    } finally {
      setLoading(prev => ({ ...prev, cities: false }));
    }
  };

  const loadCitiesFromCountry = async (countryId: string) => {
    try {
      setLoading(prev => ({ ...prev, cities: true }));
      const { data, error } = await supabase
        .from('locations')
        .select('id, name, parent_id, level')
        .eq('parent_id', countryId)
        .eq('level', 2)
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setCities(data || []);
    } catch (error) {
      console.error('Error loading cities from country:', error);
    } finally {
      setLoading(prev => ({ ...prev, cities: false }));
    }
  };

  const loadDistricts = async (cityId: string) => {
    try {
      setLoading(prev => ({ ...prev, districts: true }));
      const { data, error } = await supabase
        .from('locations')
        .select('id, name, parent_id, level')
        .eq('parent_id', cityId)
        .eq('level', 3)
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setDistricts(data || []);
    } catch (error) {
      console.error('Error loading districts:', error);
    } finally {
      setLoading(prev => ({ ...prev, districts: false }));
    }
  };

  const loadNeighborhoods = async (districtId: string) => {
    try {
      setLoading(prev => ({ ...prev, neighborhoods: true }));
      const { data, error } = await supabase
        .from('locations')
        .select('id, name, parent_id, level')
        .eq('parent_id', districtId)
        .eq('level', 4)
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setNeighborhoods(data || []);
    } catch (error) {
      console.error('Error loading neighborhoods:', error);
    } finally {
      setLoading(prev => ({ ...prev, neighborhoods: false }));
    }
  };

  const handleCountryChange = (countryId: string) => {
    setSelectedCountry(countryId);
    setSelectedState('');
    setSelectedCity('');
    setSelectedDistrict('');
    setSelectedNeighborhood('');
  };

  const handleStateChange = (stateId: string) => {
    setSelectedState(stateId);
    setSelectedCity('');
    setSelectedDistrict('');
    setSelectedNeighborhood('');
  };

  const handleCityChange = (cityId: string) => {
    setSelectedCity(cityId);
    setSelectedDistrict('');
    setSelectedNeighborhood('');
  };

  const handleDistrictChange = (districtId: string) => {
    setSelectedDistrict(districtId);
    setSelectedNeighborhood('');
  };

  const handleNeighborhoodChange = (neighborhoodId: string) => {
    setSelectedNeighborhood(neighborhoodId);
  };

  return (
    <div className="space-y-4">
      {/* Country Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Country *
        </label>
        <div className="relative">
          <select
            value={selectedCountry}
            onChange={(e) => handleCountryChange(e.target.value)}
            disabled={disabled || loading.countries}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-orange-500 focus:border-orange-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
            required
          >
            <option value="">Select Country</option>
            {countries.map((country) => (
              <option key={country.id} value={country.id}>
                {country.name}
              </option>
            ))}
          </select>
          {loading.countries && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-orange-600"></div>
            </div>
          )}
        </div>
      </div>

      {/* State/Province Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          State/Province (Optional)
        </label>
        <div className="relative">
          <select
            value={selectedState}
            onChange={(e) => handleStateChange(e.target.value)}
            disabled={disabled || !selectedCountry || loading.states}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-orange-500 focus:border-orange-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
          >
            <option value="">Select State/Province (Optional)</option>
            {states.map((state) => (
              <option key={state.id} value={state.id}>
                {state.name}
              </option>
            ))}
          </select>
          {loading.states && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-orange-600"></div>
            </div>
          )}
        </div>
        <p className="text-xs text-gray-500 mt-1">
          Some countries may not have states/provinces. You can skip this step.
        </p>
      </div>

      {/* City Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          City *
        </label>
        <div className="relative">
          <select
            value={selectedCity}
            onChange={(e) => handleCityChange(e.target.value)}
            disabled={disabled || !selectedCountry || loading.cities}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-orange-500 focus:border-orange-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
            required
          >
            <option value="">Select City</option>
            {cities.map((city) => (
              <option key={city.id} value={city.id}>
                {city.name}
              </option>
            ))}
          </select>
          {loading.cities && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-orange-600"></div>
            </div>
          )}
        </div>
      </div>

      {/* District Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          District
        </label>
        <div className="relative">
          <select
            value={selectedDistrict}
            onChange={(e) => handleDistrictChange(e.target.value)}
            disabled={disabled || !selectedCity || loading.districts}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-orange-500 focus:border-orange-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
          >
            <option value="">Select District (Optional)</option>
            {districts.map((district) => (
              <option key={district.id} value={district.id}>
                {district.name}
              </option>
            ))}
          </select>
          {loading.districts && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-orange-600"></div>
            </div>
          )}
        </div>
      </div>

      {/* Neighborhood Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Neighborhood
        </label>
        <div className="relative">
          <select
            value={selectedNeighborhood}
            onChange={(e) => handleNeighborhoodChange(e.target.value)}
            disabled={disabled || !selectedDistrict || loading.neighborhoods}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-orange-500 focus:border-orange-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
          >
            <option value="">Select Neighborhood (Optional)</option>
            {neighborhoods.map((neighborhood) => (
              <option key={neighborhood.id} value={neighborhood.id}>
                {neighborhood.name}
              </option>
            ))}
          </select>
          {loading.neighborhoods && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-orange-600"></div>
            </div>
          )}
        </div>
      </div>

      {/* Selected Location Summary */}
      {selectedCountry && selectedCity && (
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
          <h4 className="text-sm font-medium text-blue-800 mb-1">Selected Location:</h4>
          <p className="text-sm text-blue-700">
            {countries.find(c => c.id === selectedCountry)?.name}
            {selectedState && ` → ${states.find(s => s.id === selectedState)?.name}`}
            {` → ${cities.find(c => c.id === selectedCity)?.name}`}
            {selectedDistrict && ` → ${districts.find(d => d.id === selectedDistrict)?.name}`}
            {selectedNeighborhood && ` → ${neighborhoods.find(n => n.id === selectedNeighborhood)?.name}`}
          </p>
        </div>
      )}
    </div>
  );
}
