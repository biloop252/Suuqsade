'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { ProductVariant, ProductAttribute, ProductVariantAttribute } from '@/types/database';
import { 
  getColorHex, 
  isValidHexColor, 
  getAttributeDisplayName, 
  getAttributeType, 
  getSizeCategory 
} from './AttributeUtils';

interface ProductVariantsProps {
  productId: string;
  onVariantSelect?: (variant: ProductVariant) => void;
}

export default function ProductVariants({ productId, onVariantSelect }: ProductVariantsProps) {
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [attributes, setAttributes] = useState<ProductAttribute[]>([]);
  const [variantAttributes, setVariantAttributes] = useState<ProductVariantAttribute[]>([]);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchVariantsAndAttributes();
  }, [productId]);

  const fetchVariantsAndAttributes = async () => {
    try {
      setLoading(true);
      
      // Fetch variants for the product
      const { data: variantsData, error: variantsError } = await supabase
        .from('product_variants')
        .select('*')
        .eq('product_id', productId)
        .eq('is_active', true)
        .order('created_at');

      if (variantsError) {
        console.error('Error fetching variants:', variantsError);
        return;
      }

      // Fetch all attributes
      const { data: attributesData, error: attributesError } = await supabase
        .from('product_attributes')
        .select('*')
        .eq('is_active', true)
        .eq('is_variant_attribute', true)
        .order('sort_order');

      if (attributesError) {
        console.error('Error fetching attributes:', attributesError);
        return;
      }

      // Fetch variant attributes
      const { data: variantAttributesData, error: variantAttributesError } = await supabase
        .from('product_variant_attributes')
        .select('*')
        .in('variant_id', variantsData?.map(v => v.id) || []);

      if (variantAttributesError) {
        console.error('Error fetching variant attributes:', variantAttributesError);
        return;
      }

      setVariants(variantsData || []);
      setAttributes(attributesData || []);
      setVariantAttributes(variantAttributesData || []);
      
      // Set first variant as selected by default
      if (variantsData && variantsData.length > 0) {
        setSelectedVariant(variantsData[0]);
        onVariantSelect?.(variantsData[0]);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleVariantSelect = (variant: ProductVariant) => {
    setSelectedVariant(variant);
    onVariantSelect?.(variant);
  };

  const getVariantAttributeValue = (variantId: string, attributeSlug: string) => {
    const attribute = attributes.find(attr => attr.slug === attributeSlug);
    if (!attribute) return null;

    const variantAttribute = variantAttributes.find(
      va => va.variant_id === variantId && va.attribute_id === attribute.id
    );

    return variantAttribute?.display_value || variantAttribute?.value || null;
  };

  const getAvailableOptions = (attributeSlug: string) => {
    const attribute = attributes.find(attr => attr.slug === attributeSlug);
    if (!attribute) return [];

    const values = new Set<string>();
    variantAttributes
      .filter(va => va.attribute_id === attribute.id)
      .forEach(va => {
        values.add(va.display_value || va.value);
      });

    return Array.from(values);
  };

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
        <div className="space-y-2">
          <div className="h-3 bg-gray-200 rounded w-1/3"></div>
          <div className="h-3 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  if (variants.length === 0) {
    return null;
  }

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900">Product Options</h3>
      
      {/* Render variant attributes */}
      {attributes.map((attribute) => {
        const availableOptions = getAvailableOptions(attribute.slug);
        if (availableOptions.length === 0) return null;

        const attributeType = getAttributeType(attribute.slug, availableOptions[0]);
        
        return (
          <div key={attribute.id} className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              {getAttributeDisplayName(attribute.slug)}
              {attribute.is_required && <span className="text-red-500 ml-1">*</span>}
            </label>
            
            <div className="flex flex-wrap gap-2">
              {availableOptions.map((option) => {
                const isSelected = selectedVariant && 
                  getVariantAttributeValue(selectedVariant.id, attribute.slug) === option;
                
                // Render based on attribute type
                if (attributeType === 'color') {
                  const colorHex = isValidHexColor(option) ? option : getColorHex(option);
                  return (
                    <button
                      key={option}
                      onClick={() => {
                        const variant = variants.find(v => 
                          getVariantAttributeValue(v.id, attribute.slug) === option
                        );
                        if (variant) handleVariantSelect(variant);
                      }}
                      className={`relative w-12 h-12 rounded-full border-2 transition-all duration-200 hover:scale-110 ${
                        isSelected
                          ? 'border-gray-800 ring-2 ring-gray-300 shadow-lg'
                          : 'border-gray-300 hover:border-gray-500'
                      }`}
                      style={{ backgroundColor: colorHex }}
                      title={option}
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
                } else if (attributeType === 'size') {
                  return (
                    <button
                      key={option}
                      onClick={() => {
                        const variant = variants.find(v => 
                          getVariantAttributeValue(v.id, attribute.slug) === option
                        );
                        if (variant) handleVariantSelect(variant);
                      }}
                      className={`relative px-4 py-2 text-sm font-medium border rounded-md transition-all duration-200 ${
                        isSelected
                          ? 'border-primary-600 bg-primary-50 text-primary-700 ring-2 ring-primary-200'
                          : 'border-gray-300 hover:border-gray-400 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {option}
                    </button>
                  );
                } else {
                  return (
                    <button
                      key={option}
                      onClick={() => {
                        const variant = variants.find(v => 
                          getVariantAttributeValue(v.id, attribute.slug) === option
                        );
                        if (variant) handleVariantSelect(variant);
                      }}
                      className={`px-4 py-2 text-sm border rounded-md transition-all duration-200 ${
                        isSelected
                          ? 'border-primary-600 bg-primary-50 text-primary-700 ring-2 ring-primary-200'
                          : 'border-gray-300 hover:border-gray-400 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {option}
                    </button>
                  );
                }
              })}
            </div>
          </div>
        );
      })}

      {/* Selected variant details */}
      {selectedVariant && (
        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="font-medium text-gray-900 mb-2">Selected Option</h4>
          <div className="space-y-1 text-sm text-gray-600">
            <p><span className="font-medium">Name:</span> {selectedVariant.name}</p>
            <p><span className="font-medium">SKU:</span> {selectedVariant.sku}</p>
            <p><span className="font-medium">Price:</span> 
              {selectedVariant.sale_price ? (
                <span>
                  <span className="text-orange-600 font-semibold">${selectedVariant.sale_price}</span>
                  <span className="text-gray-400 line-through ml-2">${selectedVariant.price}</span>
                </span>
              ) : (
                <span className="font-semibold">${selectedVariant.price}</span>
              )}
            </p>
            <p><span className="font-medium">Stock:</span> {selectedVariant.stock_quantity} available</p>
          </div>
        </div>
      )}
    </div>
  );
}














