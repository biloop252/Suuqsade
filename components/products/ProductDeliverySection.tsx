'use client';

import { useState } from 'react';
import DeliveryCalculator from './DeliveryCalculator';
import { MapPin, Truck } from 'lucide-react';

interface ProductDeliverySectionProps {
  productId: string;
  productName: string;
}

export default function ProductDeliverySection({ 
  productId, 
  productName 
}: ProductDeliverySectionProps) {
  const [deliveryCity, setDeliveryCity] = useState('');
  const [deliveryCountry, setDeliveryCountry] = useState('');
  const [selectedDeliveryOption, setSelectedDeliveryOption] = useState<any>(null);

  const handleDeliveryOptionSelect = (option: any) => {
    setSelectedDeliveryOption(option);
    console.log('Selected delivery option:', option);
  };

  return (
    <div className="bg-white border rounded-lg p-6 space-y-4">
      <div className="flex items-center space-x-2 mb-4">
        <Truck className="h-5 w-5 text-orange-600" />
        <h3 className="text-lg font-semibold text-gray-900">Delivery Options</h3>
      </div>

      {/* Delivery Address Input */}
      <div className="space-y-3">
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <MapPin className="h-4 w-4" />
          <span>Enter your delivery address to see available options</span>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              City
            </label>
            <input
              type="text"
              value={deliveryCity}
              onChange={(e) => setDeliveryCity(e.target.value)}
              placeholder="Enter city"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-orange-500 focus:border-orange-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Country
            </label>
            <input
              type="text"
              value={deliveryCountry}
              onChange={(e) => setDeliveryCountry(e.target.value)}
              placeholder="Enter country"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-orange-500 focus:border-orange-500"
            />
          </div>
        </div>
      </div>

      {/* Delivery Calculator */}
      {deliveryCity && deliveryCountry && (
        <DeliveryCalculator
          productId={productId}
          deliveryCity={deliveryCity}
          deliveryCountry={deliveryCountry}
          onDeliveryOptionSelect={handleDeliveryOptionSelect}
          selectedOption={selectedDeliveryOption}
        />
      )}

      {/* Selected Option Summary */}
      {selectedDeliveryOption && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-2">
            <Truck className="h-4 w-4 text-green-600" />
            <span className="text-sm font-medium text-green-800">Selected Delivery Option</span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600">From:</span>
              <span className="ml-2 font-medium">{selectedDeliveryOption.pickup_location_name}</span>
              <span className="ml-1 text-gray-500">({selectedDeliveryOption.pickup_city})</span>
            </div>
            
            <div>
              <span className="text-gray-600">Method:</span>
              <span className="ml-2 font-medium">{selectedDeliveryOption.delivery_method_name}</span>
            </div>
            
            <div>
              <span className="text-gray-600">Cost:</span>
              <span className="ml-2 font-medium text-lg">
                {selectedDeliveryOption.is_free_delivery ? (
                  <span className="text-green-600">Free</span>
                ) : (
                  `$${selectedDeliveryOption.delivery_price.toFixed(2)}`
                )}
              </span>
            </div>
            
            <div>
              <span className="text-gray-600">Delivery Time:</span>
              <span className="ml-2 font-medium">
                {selectedDeliveryOption.estimated_min_days === selectedDeliveryOption.estimated_max_days
                  ? `${selectedDeliveryOption.estimated_min_days} days`
                  : `${selectedDeliveryOption.estimated_min_days}-${selectedDeliveryOption.estimated_max_days} days`
                }
              </span>
            </div>
          </div>
        </div>
      )}

      {!deliveryCity || !deliveryCountry ? (
        <div className="text-center py-8 text-gray-500">
          <MapPin className="h-12 w-12 mx-auto mb-4 text-gray-300" />
          <p className="text-sm">Enter your delivery address above to see available delivery options</p>
        </div>
      ) : null}
    </div>
  );
}




