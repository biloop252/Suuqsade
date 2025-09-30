'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { MapPin, ChevronDown } from 'lucide-react';

interface Location {
  id: string;
  name: string;
  parent_id?: string;
  level: number;
}

interface LocationSelectorProps {
  onLocationSelect: (country: string, city: string) => void;
  selectedCountry?: string;
  selectedCity?: string;
}

export default function LocationSelector({ 
  onLocationSelect, 
  selectedCountry = '', 
  selectedCity = '' 
}: LocationSelectorProps) {
  const [countries, setCountries] = useState<Location[]>([]);
  const [cities, setCities] = useState<Location[]>([]);
  const [selectedCountryId, setSelectedCountryId] = useState<string>('');
  const [selectedCityId, setSelectedCityId] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadCountries();
  }, []);

  useEffect(() => {
    if (selectedCountryId) {
      loadCities(selectedCountryId);
    } else {
      setCities([]);
      setSelectedCityId('');
    }
  }, [selectedCountryId]);

  const loadCountries = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('locations')
        .select('*')
        .eq('level', 0)
        .order('name');

      if (error) {
        console.error('Error loading countries:', error);
        setError('Failed to load countries');
      } else {
        setCountries(data || []);
      }
    } catch (error) {
      console.error('Error loading countries:', error);
      setError('Failed to load countries');
    } finally {
      setLoading(false);
    }
  };

  const loadCities = async (countryId: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('locations')
        .select('*')
        .eq('level', 2)
        .eq('parent_id', countryId)
        .order('name');

      if (error) {
        console.error('Error loading cities:', error);
        setError('Failed to load cities');
      } else {
        setCities(data || []);
      }
    } catch (error) {
      console.error('Error loading cities:', error);
      setError('Failed to load cities');
    } finally {
      setLoading(false);
    }
  };

  const handleCountryChange = (countryId: string) => {
    setSelectedCountryId(countryId);
    setSelectedCityId('');
    
    const country = countries.find(c => c.id === countryId);
    if (country) {
      onLocationSelect(country.name, '');
    }
  };

  const handleCityChange = (cityId: string) => {
    setSelectedCityId(cityId);
    
    const country = countries.find(c => c.id === selectedCountryId);
    const city = cities.find(c => c.id === cityId);
    
    if (country && city) {
      onLocationSelect(country.name, city.name);
    }
  };

  if (loading && countries.length === 0) {
    return (
      <div className="flex items-center justify-center py-4">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-600"></div>
        <span className="ml-2 text-sm text-gray-600">Loading locations...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center">
          <MapPin className="h-5 w-5 text-red-400 mr-2" />
          <span className="text-sm text-red-800">{error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border rounded-lg p-4 space-y-4">
      <div className="flex items-center mb-3">
        <MapPin className="h-5 w-5 text-orange-600 mr-2" />
        <h3 className="text-lg font-medium text-gray-900">Check Delivery</h3>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Country Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Country *
          </label>
          <div className="relative">
            <select
              value={selectedCountryId}
              onChange={(e) => handleCountryChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-orange-500 focus:border-orange-500 appearance-none bg-white"
              required
            >
              <option value="">Select a country</option>
              {countries.map((country) => (
                <option key={country.id} value={country.id}>
                  {country.name}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
          </div>
        </div>

        {/* City Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            City *
          </label>
          <div className="relative">
            <select
              value={selectedCityId}
              onChange={(e) => handleCityChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-orange-500 focus:border-orange-500 appearance-none bg-white disabled:bg-gray-100 disabled:cursor-not-allowed"
              required
              disabled={!selectedCountryId}
            >
              <option value="">Select a city</option>
              {cities.map((city) => (
                <option key={city.id} value={city.id}>
                  {city.name}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
          </div>
        </div>
      </div>

      {!selectedCountryId && (
        <div className="text-sm text-gray-500 text-center py-2">
          Select a country to see available cities
        </div>
      )}

      {selectedCountryId && cities.length === 0 && !loading && (
        <div className="text-sm text-gray-500 text-center py-2">
          No cities available for the selected country
        </div>
      )}
    </div>
  );
}
