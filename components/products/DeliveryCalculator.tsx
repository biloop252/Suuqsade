'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  MapPin,
  Truck,
  Clock,
  DollarSign,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';

interface DeliveryOption {
  pickup_location_id: string;
  pickup_location_name: string;
  pickup_city: string;
  delivery_method_id: string;
  delivery_method_name: string;
  is_free_delivery: boolean;
  delivery_price: number;
  estimated_min_days: number;
  estimated_max_days: number;
}

interface DeliverySummary {
  can_deliver: boolean;
  has_free_delivery: boolean;
  cheapest_price: number;
  fastest_days: number;
  total_options: number;
  error_message?: string;
}

interface DeliveryCalculatorProps {
  productId: string;
  deliveryCity: string;
  deliveryCountry: string;
  onDeliveryOptionSelect?: (option: DeliveryOption) => void;
  selectedOption?: DeliveryOption | null;
}

export default function DeliveryCalculator({
  productId,
  deliveryCity,
  deliveryCountry,
  onDeliveryOptionSelect,
  selectedOption
}: DeliveryCalculatorProps) {
  const [deliveryOptions, setDeliveryOptions] = useState<DeliveryOption[]>([]);
  const [deliverySummary, setDeliverySummary] = useState<DeliverySummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (productId && deliveryCity && deliveryCountry) {
      calculateDeliveryOptions();
    }
  }, [productId, deliveryCity, deliveryCountry]);

  const calculateDeliveryOptions = async () => {
    setLoading(true);
    setError(null);

    try {
      // First check if delivery is allowed to this city
      const { data: deliveryZone, error: zoneError } = await supabase
        .from('product_delivery_zones')
        .select('is_allowed')
        .eq('product_id', productId)
        .eq('city', deliveryCity)
        .eq('country', deliveryCountry)
        .eq('is_allowed', true)
        .single();

      if (zoneError || !deliveryZone) {
        setDeliverySummary({
          can_deliver: false,
          has_free_delivery: false,
          cheapest_price: 0,
          fastest_days: 0,
          total_options: 0,
          error_message: 'Delivery not allowed to this location'
        });
        setLoading(false);
        return;
      }

      // Get delivery options using the new structure
      const { data: options, error: optionsError } = await supabase
        .from('product_delivery_options')
        .select(`
          id,
          is_free_delivery,
          delivery_rate:delivery_rates(
            id,
            pickup_city,
            delivery_city,
            price,
            estimated_min_days,
            estimated_max_days,
            delivery_method:delivery_methods(
              id,
              name
            )
          )
        `)
        .eq('product_id', productId)
        .eq('delivery_rate.delivery_city', deliveryCity)
        .eq('delivery_rate.is_active', true);

      if (optionsError) {
        console.error('Error fetching delivery options:', optionsError);
        setError('Unable to calculate delivery options');
        return;
      }

      // Get pickup locations for the matching cities
      const pickupCities = Array.from(new Set(options?.map(opt => opt.delivery_rate?.[0]?.pickup_city).filter(Boolean) || []));
      
      let pickupLocations: any[] = [];
      if (pickupCities.length > 0) {
        const { data: locations, error: locationsError } = await supabase
          .from('pickup_locations')
          .select('id, name, city, country')
          .in('city', pickupCities)
          .eq('is_active', true);

        if (!locationsError) {
          pickupLocations = locations || [];
        }
      }

      // Transform the data to match the expected interface
      const transformedOptions: DeliveryOption[] = (options || [])
        .filter(opt => opt.delivery_rate)
        .map(opt => {
          const pickupLocation = pickupLocations.find(pl => pl.city === opt.delivery_rate?.[0]?.pickup_city);
          return {
            pickup_location_id: pickupLocation?.id || '',
            pickup_location_name: pickupLocation?.name || 'Unknown Location',
            pickup_city: opt.delivery_rate?.[0]?.pickup_city || '',
            delivery_method_id: opt.delivery_rate?.[0]?.delivery_method?.[0]?.id || '',
            delivery_method_name: opt.delivery_rate?.[0]?.delivery_method?.[0]?.name || 'Unknown Method',
            is_free_delivery: opt.is_free_delivery,
            delivery_price: opt.delivery_rate?.[0]?.price || 0,
            estimated_min_days: opt.delivery_rate?.[0]?.estimated_min_days || 0,
            estimated_max_days: opt.delivery_rate?.[0]?.estimated_max_days || 0
          };
        })
        .filter(opt => opt.pickup_location_id); // Only include options with valid pickup locations

      setDeliveryOptions(transformedOptions);

      // Calculate summary
      if (transformedOptions.length > 0) {
        const hasFreeDelivery = transformedOptions.some(opt => opt.is_free_delivery);
        const cheapestPrice = Math.min(...transformedOptions.map(opt => opt.delivery_price));
        const fastestDays = Math.min(...transformedOptions.map(opt => opt.estimated_min_days));

        setDeliverySummary({
          can_deliver: true,
          has_free_delivery: hasFreeDelivery,
          cheapest_price: cheapestPrice,
          fastest_days: fastestDays,
          total_options: transformedOptions.length
        });
      } else {
        setDeliverySummary({
          can_deliver: false,
          has_free_delivery: false,
          cheapest_price: 0,
          fastest_days: 0,
          total_options: 0,
          error_message: 'No delivery options available for this location'
        });
      }
    } catch (error) {
      console.error('Error calculating delivery options:', error);
      setError('Unable to calculate delivery options');
    } finally {
      setLoading(false);
    }
  };

  const handleOptionSelect = (option: DeliveryOption) => {
    if (onDeliveryOptionSelect) {
      onDeliveryOptionSelect(option);
    }
  };

  if (loading) {
    return (
      <div className="bg-white border rounded-lg p-4">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-600"></div>
          <span className="ml-2 text-sm text-gray-600">Calculating delivery options...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center">
          <XCircle className="h-5 w-5 text-red-400 mr-2" />
          <span className="text-sm text-red-800">{error}</span>
        </div>
      </div>
    );
  }

  if (!deliverySummary?.can_deliver) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-center">
          <AlertCircle className="h-5 w-5 text-yellow-400 mr-2" />
          <div>
            <p className="text-sm text-yellow-800 font-medium">Delivery not available</p>
            <p className="text-xs text-yellow-700 mt-1">
              This product cannot be delivered to {deliveryCity}, {deliveryCountry}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border rounded-lg p-4 space-y-4">
      {/* Delivery Summary */}
      <div className="bg-gray-50 rounded-lg p-3">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium text-gray-900">Delivery to {deliveryCity}</h3>
          {deliverySummary?.has_free_delivery && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
              <CheckCircle className="h-3 w-3 mr-1" />
              Free delivery available
            </span>
          )}
        </div>
        
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center">
            <DollarSign className="h-4 w-4 text-gray-400 mr-1" />
            <span className="text-gray-600">From ${deliverySummary?.cheapest_price.toFixed(2)}</span>
          </div>
          <div className="flex items-center">
            <Clock className="h-4 w-4 text-gray-400 mr-1" />
            <span className="text-gray-600">As fast as {deliverySummary?.fastest_days} days</span>
          </div>
        </div>
        
        <p className="text-xs text-gray-500 mt-2">
          {deliverySummary?.total_options} delivery option{deliverySummary?.total_options !== 1 ? 's' : ''} available
        </p>
      </div>

      {/* Delivery Options */}
      {deliveryOptions.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-gray-900">Choose delivery option:</h4>
          
          <div className="space-y-2">
            {deliveryOptions.map((option, index) => (
              <div
                key={`${option.pickup_location_id}-${option.delivery_method_id}`}
                className={`border rounded-lg p-3 cursor-pointer transition-colors ${
                  selectedOption?.pickup_location_id === option.pickup_location_id &&
                  selectedOption?.delivery_method_id === option.delivery_method_id
                    ? 'border-orange-500 bg-orange-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => handleOptionSelect(option)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center mb-1">
                      <MapPin className="h-4 w-4 text-gray-400 mr-2" />
                      <span className="text-sm font-medium text-gray-900">
                        {option.pickup_location_name}
                      </span>
                      <span className="text-xs text-gray-500 ml-2">
                        ({option.pickup_city})
                      </span>
                    </div>
                    
                    <div className="flex items-center text-sm text-gray-600">
                      <Truck className="h-4 w-4 text-gray-400 mr-1" />
                      <span>{option.delivery_method_name}</span>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="text-lg font-semibold text-gray-900">
                      {option.is_free_delivery ? (
                        <span className="text-green-600">Free</span>
                      ) : (
                        `$${option.delivery_price.toFixed(2)}`
                      )}
                    </div>
                    
                    <div className="flex items-center text-xs text-gray-500">
                      <Clock className="h-3 w-3 mr-1" />
                      <span>
                        {option.estimated_min_days === option.estimated_max_days
                          ? `${option.estimated_min_days} days`
                          : `${option.estimated_min_days}-${option.estimated_max_days} days`
                        }
                      </span>
                    </div>
                  </div>
                </div>
                
                {option.is_free_delivery && (
                  <div className="mt-2 flex items-center text-xs text-green-600">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    <span>Free delivery for this option</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {deliveryOptions.length === 0 && (
        <div className="text-center py-4 text-gray-500">
          <Truck className="h-8 w-8 mx-auto mb-2 text-gray-300" />
          <p className="text-sm">No delivery options available</p>
        </div>
      )}
    </div>
  );
}




