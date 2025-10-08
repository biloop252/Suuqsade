'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { ProductAttribute, AttributeValue, ProductAttributeAssignment } from '@/types/database';
import { 
  getColorHex, 
  isValidHexColor, 
  getAttributeDisplayName, 
  getAttributeType, 
  getSizeCategory,
  COLOR_MAPPINGS 
} from './AttributeUtils';

interface ProductOptionsProps {
  productId: string;
  onAttributeChange?: (selections: Record<string, string>) => void;
}

interface AttributeSelection {
  attributeId: string;
  attributeName: string;
  attributeSlug: string;
  attributeType: string;
  selectedValue: string;
  availableValues: AttributeValue[];
}

export default function ProductOptions({ productId, onAttributeChange }: ProductOptionsProps) {
  const [attributeSelections, setAttributeSelections] = useState<AttributeSelection[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (productId) {
      fetchProductAttributes();
    }
  }, [productId]);

  const fetchProductAttributes = async () => {
    try {
      setLoading(true);
      
      // For now, let's use a simpler approach - fetch variants and extract unique attributes
      const { data: variantsData, error: variantsError } = await supabase
        .from('product_variants')
        .select('*')
        .eq('product_id', productId)
        .eq('is_active', true);

      if (variantsError) {
        console.error('Error fetching variants:', variantsError);
        return;
      }

      console.log('Fetched variants:', variantsData);

      // Extract unique attributes from variants
      const attributeMap = new Map<string, AttributeSelection>();
      
      variantsData?.forEach((variant: any) => {
        if (!variant.attributes) return;
        
        Object.entries(variant.attributes).forEach(([attrSlug, attrValue]) => {
          if (!attributeMap.has(attrSlug)) {
            attributeMap.set(attrSlug, {
              attributeId: attrSlug, // Use slug as ID for simplicity
              attributeName: getAttributeDisplayName(attrSlug),
              attributeSlug: attrSlug,
              attributeType: 'select', // Default type
              selectedValue: '',
              availableValues: []
            });
          }
          
          const selection = attributeMap.get(attrSlug)!;
          const existingValue = selection.availableValues.find(v => v.value === attrValue);
          
          if (!existingValue) {
            selection.availableValues.push({
              id: `${attrSlug}-${attrValue}`,
              attribute_id: attrSlug,
              value: attrValue as string,
              display_value: attrValue as string,
              sort_order: 0,
              is_active: true,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            });
          }
        });
      });

      // Convert map to array and sort
      const selections = Array.from(attributeMap.values());
      selections.forEach(selection => {
        // Determine attribute type based on slug and values
        const firstValue = selection.availableValues[0]?.value;
        selection.attributeType = getAttributeType(selection.attributeSlug, firstValue);
        
        // Sort values appropriately based on type
        if (selection.attributeType === 'size') {
          // Sort sizes in logical order
          const sizeCategory = getSizeCategory(firstValue || '');
          if (sizeCategory === 'clothing') {
            selection.availableValues.sort((a, b) => {
              const sizes = ['XXS', 'XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'];
              return sizes.indexOf(a.value.toUpperCase()) - sizes.indexOf(b.value.toUpperCase());
            });
          } else if (sizeCategory === 'shoes') {
            selection.availableValues.sort((a, b) => parseInt(a.value) - parseInt(b.value));
          } else if (sizeCategory === 'rings') {
            selection.availableValues.sort((a, b) => parseInt(a.value) - parseInt(b.value));
          } else {
            selection.availableValues.sort((a, b) => a.value.localeCompare(b.value));
          }
        } else {
          selection.availableValues.sort((a, b) => a.value.localeCompare(b.value));
        }
      });

      console.log('Processed attribute selections:', selections);

      setAttributeSelections(selections);
      
      // Initialize with first value for each attribute
      const initialSelections: Record<string, string> = {};
      selections.forEach(selection => {
        if (selection.availableValues.length > 0) {
          selection.selectedValue = selection.availableValues[0].value;
          initialSelections[selection.attributeSlug] = selection.availableValues[0].value;
        }
      });
      
      setAttributeSelections([...selections]);
      onAttributeChange?.(initialSelections);
      
    } catch (error) {
      console.error('Error fetching product attributes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAttributeValueChange = (attributeId: string, value: string) => {
    setAttributeSelections(prev => 
      prev.map(selection => 
        selection.attributeId === attributeId 
          ? { ...selection, selectedValue: value }
          : selection
      )
    );

    // Notify parent component of the change with attribute slugs
    const currentSelections: Record<string, string> = {};
    attributeSelections.forEach(selection => {
      if (selection.attributeId === attributeId) {
        currentSelections[selection.attributeSlug] = value;
      } else {
        currentSelections[selection.attributeSlug] = selection.selectedValue;
      }
    });
    
    onAttributeChange?.(currentSelections);
  };

  const renderAttributeInput = (selection: AttributeSelection) => {
    const { attributeType, availableValues, selectedValue } = selection;

    switch (attributeType) {
      case 'color':
        return (
          <div className="flex flex-wrap gap-3">
            {availableValues.map((value) => {
              const colorHex = isValidHexColor(value.value) ? value.value : getColorHex(value.value);
              const isSelected = selectedValue === value.value;
              
              return (
                <button
                  key={value.id}
                  onClick={() => handleAttributeValueChange(selection.attributeId, value.value)}
                  className={`relative w-12 h-12 rounded-full border-2 transition-all duration-200 hover:scale-110 ${
                    isSelected
                      ? 'border-gray-800 ring-2 ring-gray-300 shadow-lg'
                      : 'border-gray-300 hover:border-gray-500'
                  }`}
                  style={{ 
                    backgroundColor: colorHex,
                    backgroundImage: colorHex.includes('gradient') ? colorHex : undefined
                  }}
                  title={value.display_value || value.value}
                >
                  {isSelected && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center">
                        <svg className="w-4 h-4 text-gray-800" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        );

      case 'size':
        const sizeCategory = getSizeCategory(availableValues[0]?.value || '');
        return (
          <div className="flex flex-wrap gap-2">
            {availableValues.map((value) => {
              const isSelected = selectedValue === value.value;
              const isOutOfStock = false; // You can add stock checking logic here
              
              return (
                <button
                  key={value.id}
                  onClick={() => handleAttributeValueChange(selection.attributeId, value.value)}
                  disabled={isOutOfStock}
                  className={`relative px-4 py-2 text-sm font-medium border rounded-md transition-all duration-200 ${
                    isSelected
                      ? 'border-primary-600 bg-primary-50 text-primary-700 ring-2 ring-primary-200'
                      : isOutOfStock
                      ? 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'border-gray-300 hover:border-gray-400 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {value.display_value || value.value}
                  {isOutOfStock && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-full h-px bg-gray-400 transform rotate-12"></div>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        );

      case 'material':
        return (
          <div className="flex flex-wrap gap-2">
            {availableValues.map((value) => {
              const isSelected = selectedValue === value.value;
              
              return (
                <button
                  key={value.id}
                  onClick={() => handleAttributeValueChange(selection.attributeId, value.value)}
                  className={`px-4 py-2 text-sm border rounded-md transition-all duration-200 ${
                    isSelected
                      ? 'border-primary-600 bg-primary-50 text-primary-700 ring-2 ring-primary-200'
                      : 'border-gray-300 hover:border-gray-400 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 rounded-full bg-gradient-to-br from-gray-200 to-gray-400"></div>
                    <span>{value.display_value || value.value}</span>
                  </div>
                </button>
              );
            })}
          </div>
        );

      case 'select':
      case 'multiselect':
        return (
          <div className="flex flex-wrap gap-2">
            {availableValues.map((value) => {
              const isSelected = selectedValue === value.value;
              
              return (
                <button
                  key={value.id}
                  onClick={() => handleAttributeValueChange(selection.attributeId, value.value)}
                  className={`px-4 py-2 text-sm border rounded-md transition-all duration-200 ${
                    isSelected
                      ? 'border-primary-600 bg-primary-50 text-primary-700 ring-2 ring-primary-200'
                      : 'border-gray-300 hover:border-gray-400 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {value.display_value || value.value}
                </button>
              );
            })}
          </div>
        );

      case 'text':
      case 'number':
        return (
          <select
            value={selectedValue}
            onChange={(e) => handleAttributeValueChange(selection.attributeId, e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="">Select {selection.attributeName}</option>
            {availableValues.map((value) => (
              <option key={value.id} value={value.value}>
                {value.display_value || value.value}
              </option>
            ))}
          </select>
        );

      case 'boolean':
        return (
          <div className="flex gap-4">
            {availableValues.map((value) => (
              <label key={value.id} className="flex items-center">
                <input
                  type="radio"
                  name={selection.attributeId}
                  value={value.value}
                  checked={selectedValue === value.value}
                  onChange={(e) => handleAttributeValueChange(selection.attributeId, e.target.value)}
                  className="mr-2 text-primary-600 focus:ring-primary-500"
                />
                <span className="text-sm text-gray-700">
                  {value.display_value || value.value}
                </span>
              </label>
            ))}
          </div>
        );

      default:
        return (
          <div className="flex flex-wrap gap-2">
            {availableValues.map((value) => {
              const isSelected = selectedValue === value.value;
              
              return (
                <button
                  key={value.id}
                  onClick={() => handleAttributeValueChange(selection.attributeId, value.value)}
                  className={`px-4 py-2 text-sm border rounded-md transition-all duration-200 ${
                    isSelected
                      ? 'border-primary-600 bg-primary-50 text-primary-700 ring-2 ring-primary-200'
                      : 'border-gray-300 hover:border-gray-400 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {value.display_value || value.value}
                </button>
              );
            })}
          </div>
        );
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">Options</h3>
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          <div className="h-8 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (attributeSelections.length === 0) {
    return null;
  }

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900">Options</h3>
      
      {attributeSelections.map((selection) => (
        <div key={selection.attributeId} className="space-y-2">
          <label className="text-sm font-medium text-gray-700">
            {selection.attributeName}
            <span className="text-red-500 ml-1">*</span>
          </label>
          
          {renderAttributeInput(selection)}
          
          {selection.selectedValue && (
            <p className="text-xs text-gray-500">
              Selected: {selection.availableValues.find(v => v.value === selection.selectedValue)?.display_value || selection.selectedValue}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}
