'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Product, Category, Brand, ProductAttribute, AttributeValue, ProductWithDetails, ProductVariant, ReturnPolicy, CodPolicy, CancellationPolicy, Vendor } from '@/types/database';
import { 
  Upload,
  X,
  Plus,
  Trash2,
  ChevronDown
} from 'lucide-react';
import DeliveryOptionsManagement from './DeliveryOptionsManagement';
import DeliveryOptionsSelector from './DeliveryOptionsSelector';

interface ProductFormProps {
  product?: ProductWithDetails | null;
  categories: Category[];
  brands: Brand[];
  attributes: ProductAttribute[];
  onSave: (product: ProductWithDetails) => void;
  onCancel: () => void;
  loading?: boolean;
}

export default function ProductForm({ 
  product, 
  categories, 
  brands, 
  attributes,
  onSave, 
  onCancel,
  loading = false
}: ProductFormProps) {
  const [formData, setFormData] = useState({
    name: product?.name || '',
    slug: product?.slug || '',
    description: product?.description || '',
    short_description: product?.short_description || '',
    sku: product?.sku || '',
    category_id: product?.category_id || '',
    brand_id: product?.brand_id || '',
    vendor_id: product?.vendor_id || '',
    price: product?.price || 0,
    stock_quantity: product?.stock_quantity || 0,
    min_stock_level: product?.min_stock_level || 5,
    weight: product?.weight || 0,
    is_active: product?.is_active ?? true,
    is_featured: product?.is_featured ?? false,
    meta_title: product?.meta_title || '',
    meta_description: product?.meta_description || '',
    is_cod_allowed: product?.cod_policy?.is_cod_allowed ?? false,
    is_returnable: product?.return_policy?.is_returnable ?? false,
    is_cancelable: product?.cancellation_policy?.is_cancelable ?? false,
    return_days: product?.return_policy?.return_days || 14,
    cancel_until_status: product?.cancellation_policy?.cancel_until_status || 'shipped'
  });

  // Delivery options state
  const [deliveryOptions, setDeliveryOptions] = useState({
    pickupLocationId: '',
    deliveryMethodIds: [] as string[],
    isFreeDelivery: false,
    allowedCities: [] as string[],
    allowedDeliveryZones: [] as Array<{city: string, country: string}>
  });

  // Update form data when product changes (for editing)
  useEffect(() => {
    if (product) {
      setFormData(prev => ({
        ...prev,
        is_cod_allowed: product.cod_policy?.is_cod_allowed ?? false,
        is_returnable: product.return_policy?.is_returnable ?? false,
        is_cancelable: product.cancellation_policy?.is_cancelable ?? false,
        return_days: product.return_policy?.return_days || 14,
        cancel_until_status: product.cancellation_policy?.cancel_until_status || 'shipped'
      }));

      // Load existing delivery options
      loadDeliveryOptions(product.id);
    }
  }, [product]);


  // Load existing delivery options for editing
  const loadDeliveryOptions = async (productId: string) => {
    try {
      // Load delivery options with delivery rates
      const { data: deliveryOptionsData, error: optionsError } = await supabase
        .from('product_delivery_options')
        .select(`
          *,
          delivery_rate:delivery_rates(
            id,
            pickup_city,
            delivery_method_id,
            delivery_method:delivery_methods(id, name)
          )
        `)
        .eq('product_id', productId);

      if (optionsError) {
        console.error('Error loading delivery options:', optionsError);
        return;
      }

      // Load delivery zones
      const { data: deliveryZonesData, error: zonesError } = await supabase
        .from('product_delivery_zones')
        .select('city, country')
        .eq('product_id', productId)
        .eq('is_allowed', true);

      if (zonesError) {
        console.error('Error loading delivery zones:', zonesError);
      }

      if (deliveryOptionsData && deliveryOptionsData.length > 0) {
        console.log('Loading delivery options for product:', productId);
        console.log('Delivery options data:', deliveryOptionsData);
        
        const firstOption = deliveryOptionsData[0];
        
        // Get unique pickup cities and delivery method IDs from the delivery rates
        const pickupCitiesSet = new Set(deliveryOptionsData.map(opt => opt.delivery_rate?.pickup_city).filter(Boolean));
        const deliveryMethodIdsSet = new Set(deliveryOptionsData.map(opt => opt.delivery_rate?.delivery_method_id).filter(Boolean));
        const pickupCities = Array.from(pickupCitiesSet);
        const deliveryMethodIds = Array.from(deliveryMethodIdsSet);
        
        console.log('Pickup cities found:', pickupCities);
        console.log('Delivery method IDs found:', deliveryMethodIds);
        
        // Find pickup location ID based on the pickup city
        let pickupLocationId = '';
        if (pickupCities.length > 0) {
          const { data: pickupLocation, error: pickupError } = await supabase
            .from('pickup_locations')
            .select('id')
            .eq('city', pickupCities[0])
            .eq('is_active', true)
            .limit(1);
          
          if (!pickupError && pickupLocation && pickupLocation.length > 0) {
            pickupLocationId = pickupLocation[0].id;
          }
        }

        const newDeliveryOptions = {
          pickupLocationId,
          deliveryMethodIds,
          isFreeDelivery: firstOption.is_free_delivery,
          allowedCities: deliveryZonesData?.map(zone => zone.city) || [],
          allowedDeliveryZones: deliveryZonesData?.map(zone => ({ city: zone.city, country: zone.country })) || []
        };
        
        console.log('Setting delivery options:', newDeliveryOptions);
        setDeliveryOptions(newDeliveryOptions);
      } else {
        setDeliveryOptions({
          pickupLocationId: '',
          deliveryMethodIds: [],
          isFreeDelivery: false,
          allowedCities: deliveryZonesData?.map(zone => zone.city) || [],
          allowedDeliveryZones: deliveryZonesData?.map(zone => ({ city: zone.city, country: zone.country })) || []
        });
      }
    } catch (error) {
      console.error('Error loading delivery options:', error);
    }
  };

  const loadVendors = async () => {
    try {
      setLoadingVendors(true);
      const { data, error } = await supabase
        .from('vendor_profiles')
        .select(`
          id,
          business_name,
          business_description,
          logo_url,
          address,
          city,
          district,
          neighborhood,
          country,
          tax_id,
          business_license_url,
          national_id_url,
          commission_rate,
          status,
          created_at,
          updated_at
        `)
        .eq('status', 'active')
        .order('business_name');

      if (error) {
        console.error('Error loading vendors:', error);
        return;
      }

      setVendors(data || []);
    } catch (error) {
      console.error('Error loading vendors:', error);
    } finally {
      setLoadingVendors(false);
    }
  };

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({});
  const [existingImages, setExistingImages] = useState<any[]>([]);
  const [imagesToDelete, setImagesToDelete] = useState<string[]>([]);
  const [selectedAttributes, setSelectedAttributes] = useState<{ id: string; name: string; type: string }[]>([]);
  const [attributeValues, setAttributeValues] = useState<{ [key: string]: string[] }>({});
  const [availableAttributeValues, setAvailableAttributeValues] = useState<{ [key: string]: AttributeValue[] }>({});
  const [loadingAttributeValues, setLoadingAttributeValues] = useState<{ [key: string]: boolean }>({});
  const [newVariantAttributeId, setNewVariantAttributeId] = useState('');
  const [newSpecAttributeId, setNewSpecAttributeId] = useState('');
  const [newValueIds, setNewValueIds] = useState<{ [key: string]: string }>({});
  const [variants, setVariants] = useState<any[]>([]);
  const [showVariantsModal, setShowVariantsModal] = useState(false);
  
  // Auto-generated variants state
  const [generatedVariants, setGeneratedVariants] = useState<Array<{
    id: string;
    name: string;
    attributes: Record<string, string>;
    price: number;
    stock_quantity: number;
    sku: string;
  }>>([]);
  const [showVariants, setShowVariants] = useState(false);

  // Vendors state
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loadingVendors, setLoadingVendors] = useState(false);

  // Initialize existing images when editing
  useEffect(() => {
    if (product && product.images) {
      setExistingImages(product.images);
    }
  }, [product]);

  // Load vendors on component mount
  useEffect(() => {
    loadVendors();
  }, []);

  // Initialize attributes when editing
  useEffect(() => {
    if (product && product.attribute_assignments) {
      // Extract unique attribute IDs from assignments
      const attrs = (product.attribute_assignments || [])
        .map((assignment: any) => assignment.attribute_value?.attribute_id)
        .filter(Boolean);
      const uniqueAttributeIds = Array.from(new Set(attrs));
      
      // Get attribute details for selected attributes
      const selectedAttrs = uniqueAttributeIds.map(attrId => {
        const attr = attributes.find(a => a.id === attrId);
        return attr ? { id: attr.id, name: attr.name, type: attr.type } : null;
      }).filter(Boolean) as { id: string; name: string; type: string }[];
      
      setSelectedAttributes(selectedAttrs);
      
      // For editing, we need to fetch the attribute values and map them properly
      const values: { [key: string]: string[] } = {};
      
      // Fetch attribute values for all selected attributes
      uniqueAttributeIds.forEach((attributeId: string) => {
        fetchAttributeValues(attributeId);
      });
      
      // Map attribute assignments to values
      (product.attribute_assignments || []).forEach((assignment: any) => {
        const attributeId = assignment.attribute_value?.attribute_id;
        const valueId = assignment.attribute_value_id;
        
        if (attributeId && valueId) {
          if (!values[attributeId]) {
            values[attributeId] = [];
          }
          values[attributeId].push(valueId);
        }
      });
      setAttributeValues(values);
    }
  }, [product, attributes]);

  // Load existing variants when editing
  useEffect(() => {
    const loadExistingVariants = async () => {
      if (product?.id) {
        const { data: variantsData, error } = await supabase
          .from('product_variants')
          .select('*')
          .eq('product_id', product.id)
          .eq('is_active', true);

        if (!error && variantsData) {
          const existingVariants = variantsData.map(variant => ({
            id: variant.id,
            name: variant.name,
            attributes: variant.attributes || {},
            price: variant.price || 0,
            stock_quantity: variant.stock_quantity || 0,
            sku: variant.sku || ''
          }));
          
          setGeneratedVariants(existingVariants);
          if (existingVariants.length > 0) {
            setShowVariants(true);
          }
        }
      }
    };

    loadExistingVariants();
  }, [product?.id]);

  // Auto-generate variants when attributes or values change
  useEffect(() => {
    if (selectedAttributes.length > 0 && Object.keys(attributeValues).length > 0) {
      // Filter to only variant attributes
      const variantAttributes = selectedAttributes.filter(attr => 
        attributes.find(a => a.id === attr.id)?.is_variant_attribute === true
      );
      
      if (variantAttributes.length > 0) {
        // Check if all variant attributes have values
        const allVariantAttributesHaveValues = variantAttributes.every(attr => 
          attributeValues[attr.id] && attributeValues[attr.id].length > 0
        );
        
        if (allVariantAttributesHaveValues) {
          generateVariants();
        } else {
          setGeneratedVariants([]);
          setShowVariants(false);
        }
      } else {
        setGeneratedVariants([]);
        setShowVariants(false);
      }
    } else {
      setGeneratedVariants([]);
      setShowVariants(false);
    }
  }, [selectedAttributes, attributeValues, attributes]);


  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setSelectedFiles(prev => [...prev, ...files]);
    
    // Create previews
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreviews(prev => [...prev, e.target?.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const removeExistingImage = (imageId: string) => {
    setImagesToDelete(prev => [...prev, imageId]);
    setExistingImages(prev => prev.filter(img => img.id !== imageId));
  };

  // Fetch attribute values for a specific attribute
  const fetchAttributeValues = async (attributeId: string) => {
    setLoadingAttributeValues(prev => ({ ...prev, [attributeId]: true }));
    
    try {
      console.log('Fetching attribute values for attribute:', attributeId);
      const { data, error } = await supabase
        .from('attribute_values')
        .select('*')
        .eq('attribute_id', attributeId)
        .eq('is_active', true)
        .order('sort_order')
        .order('value');

      if (error) {
        console.error('Error fetching attribute values:', error);
        return;
      }

      console.log('Fetched attribute values:', data);
      setAvailableAttributeValues(prev => {
        const newValues = {
          ...prev,
          [attributeId]: data || []
        };
        console.log('Updated available attribute values:', newValues);
        return newValues;
      });
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoadingAttributeValues(prev => ({ ...prev, [attributeId]: false }));
    }
  };

  const handleAddVariantAttribute = () => {
    console.log('Adding variant attribute:', { newVariantAttributeId, selectedAttributes });
    
    if (newVariantAttributeId && !selectedAttributes.find(attr => attr.id === newVariantAttributeId)) {
      const attribute = attributes.find(attr => attr.id === newVariantAttributeId);
      if (attribute) {
        console.log('Found variant attribute:', attribute);
        setSelectedAttributes(prev => {
          const newAttrs = [...prev, { id: attribute.id, name: attribute.name, type: attribute.type }];
          console.log('Updated selected attributes:', newAttrs);
          return newAttrs;
        });
        setAttributeValues(prev => ({ ...prev, [attribute.id]: [] }));
        
        // Fetch attribute values if not already loaded
        if (!availableAttributeValues[attribute.id]) {
          console.log('Fetching attribute values for:', attribute.id);
          fetchAttributeValues(attribute.id);
        }
      }
      setNewVariantAttributeId('');
    }
  };

  const handleAddSpecAttribute = () => {
    console.log('Adding spec attribute:', { newSpecAttributeId, selectedAttributes });
    
    if (newSpecAttributeId && !selectedAttributes.find(attr => attr.id === newSpecAttributeId)) {
      const attribute = attributes.find(attr => attr.id === newSpecAttributeId);
      if (attribute) {
        console.log('Found spec attribute:', attribute);
        setSelectedAttributes(prev => {
          const newAttrs = [...prev, { id: attribute.id, name: attribute.name, type: attribute.type }];
          console.log('Updated selected attributes:', newAttrs);
          return newAttrs;
        });
        setAttributeValues(prev => ({ ...prev, [attribute.id]: [] }));
        
        // Fetch attribute values if not already loaded
        if (!availableAttributeValues[attribute.id]) {
          console.log('Fetching attribute values for:', attribute.id);
          fetchAttributeValues(attribute.id);
        }
      }
      setNewSpecAttributeId('');
    }
  };

  const handleRemoveAttribute = (attributeId: string) => {
    setSelectedAttributes(prev => prev.filter(attr => attr.id !== attributeId));
      setAttributeValues(prev => {
        const newValues = { ...prev };
        delete newValues[attributeId];
        return newValues;
      });
  };

  const handleAddValue = (attributeId: string) => {
    const valueId = newValueIds[attributeId];
    console.log('Adding value:', { 
      attributeId, 
      valueId, 
      currentValues: attributeValues[attributeId],
      newValueIds,
      availableValues: availableAttributeValues[attributeId]
    });
    
    if (valueId && !attributeValues[attributeId]?.includes(valueId)) {
      setAttributeValues(prev => {
        const newValues = {
          ...prev,
          [attributeId]: [...(prev[attributeId] || []), valueId]
        };
        console.log('Updated attribute values:', newValues);
        return newValues;
      });
      setNewValueIds(prev => ({ ...prev, [attributeId]: '' }));
    } else {
      console.log('Value not added - either no valueId or already exists');
    }
  };

  const handleRemoveValue = (attributeId: string, valueId: string) => {
    setAttributeValues(prev => ({
      ...prev,
      [attributeId]: prev[attributeId]?.filter(id => id !== valueId) || []
    }));
  };

  // Generate all possible attribute combinations
  const generateVariants = () => {
    if (selectedAttributes.length === 0) {
      setGeneratedVariants([]);
      return;
    }

    // Filter to only variant attributes (is_variant_attribute = true)
    const variantAttributes = selectedAttributes.filter(attr => 
      attributes.find(a => a.id === attr.id)?.is_variant_attribute === true
    );

    if (variantAttributes.length === 0) {
      setGeneratedVariants([]);
      setShowVariants(false);
      return;
    }

    console.log('Generating variants with existing variants:', generatedVariants.length);

    // Get all attribute-value combinations for variant attributes only
    const attributeCombinations: Array<{ [key: string]: string }> = [];
    
    // Create cartesian product of all variant attribute values
    const generateCombinations = (index: number, currentCombination: { [key: string]: string }) => {
      if (index === variantAttributes.length) {
        attributeCombinations.push({ ...currentCombination });
        return;
      }

      const attribute = variantAttributes[index];
      const values = attributeValues[attribute.id] || [];
      
      if (values.length === 0) {
        generateCombinations(index + 1, currentCombination);
        return;
      }

      values.forEach(valueId => {
        const value = availableAttributeValues[attribute.id]?.find(v => v.id === valueId);
        if (value) {
          generateCombinations(index + 1, {
            ...currentCombination,
            [attribute.id]: value.value
          });
        }
      });
    };

    generateCombinations(0, {});

    // Create variant objects, preserving existing data when possible
    const variants = attributeCombinations.map((combination, index) => {
      const variantName = Object.entries(combination)
        .map(([attrId, value]) => {
          const attr = variantAttributes.find(a => a.id === attrId);
          return `${attr?.name}: ${value}`;
        })
        .join(', ');

      // Try to find existing variant with matching attributes
      const existingVariant = generatedVariants.find(existing => {
        // Check if all attributes match
        const existingAttrs = existing.attributes || {};
        const combinationAttrs = combination;
        
        // Compare attribute values - only check attributes that exist in both
        const existingKeys = Object.keys(existingAttrs).sort();
        const combinationKeys = Object.keys(combinationAttrs).sort();
        
        // Find common attributes between existing and new combination
        const commonKeys = existingKeys.filter(key => combinationKeys.includes(key));
        
        // If there are no common attributes, this is a completely new variant
        if (commonKeys.length === 0) {
          return false;
        }
        
        // Check if all common attributes have matching values
        return commonKeys.every(key => existingAttrs[key] === combinationAttrs[key]);
      });

      // If we found an existing variant, preserve its data
      if (existingVariant) {
        console.log('Preserving existing variant:', existingVariant.name, 'with price:', existingVariant.price, 'stock:', existingVariant.stock_quantity);
        return {
          id: existingVariant.id,
          name: variantName,
          attributes: combination,
          price: existingVariant.price,
          stock_quantity: existingVariant.stock_quantity,
          sku: existingVariant.sku
        };
      }

      // Otherwise, create new variant with default values
      console.log('Creating new variant:', variantName);
      return {
        id: generateUniqueVariantId(generatedVariants),
        name: variantName,
        attributes: combination,
        price: formData.price,
        stock_quantity: 0,
        sku: `${formData.sku || 'PROD'}-${index + 1}`
      };
    });

    console.log('Generated', variants.length, 'variants total');
    setGeneratedVariants(variants);
    setShowVariants(true);
  };

  // Generate unique variant ID
  const generateUniqueVariantId = (existingVariants: any[]) => {
    let counter = 1;
    let newId = `variant-${counter}`;
    
    while (existingVariants.some(v => v.id === newId)) {
      counter++;
      newId = `variant-${counter}`;
    }
    
    return newId;
  };

  // Update variant price/stock
  const updateVariant = (variantId: string, field: 'price' | 'stock_quantity' | 'sku', value: string | number) => {
    setGeneratedVariants(prev => 
      prev.map(variant => 
        variant.id === variantId 
          ? { ...variant, [field]: value }
          : variant
      )
    );
  };


  const uploadImages = async (productId: string) => {
    if (selectedFiles.length === 0) return [];

    setUploading(true);
    const uploadedImages = [];

    for (let i = 0; i < selectedFiles.length; i++) {
      const file = selectedFiles[i];
      const fileExt = file.name.split('.').pop();
      const fileName = `${productId}_${Date.now()}_${i}.${fileExt}`;
      const filePath = `products/${fileName}`;

      try {
        const { error: uploadError } = await supabase.storage
          .from('product-images')
          .upload(filePath, file);

        if (uploadError) {
          console.error('Error uploading image:', uploadError);
          continue;
        }

        const { data: { publicUrl } } = supabase.storage
          .from('product-images')
          .getPublicUrl(filePath);

        const { data: imageData, error: insertError } = await supabase
          .from('product_images')
          .insert([{
            product_id: productId,
            image_url: publicUrl,
            alt_text: file.name,
            sort_order: i
          }])
          .select()
          .single();

        if (insertError) {
          console.error('Error inserting image record:', insertError);
          continue;
        }

        uploadedImages.push(imageData);
        setUploadProgress(prev => ({ ...prev, [fileName]: 100 }));
      } catch (error) {
        console.error('Error uploading image:', error);
      }
    }

    setUploading(false);
    return uploadedImages;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Debug: Log current state right before saving
    console.log('=== FORM SUBMIT DEBUG ===');
    console.log('Selected Attributes:', selectedAttributes);
    console.log('Attribute Values:', attributeValues);
    console.log('Available Attribute Values:', availableAttributeValues);
    console.log('New Value IDs:', newValueIds);
    console.log('========================');

    try {
      // Map toggle states to predefined policy IDs
      let returnPolicyId = null;
      let codPolicyId = null;
      let cancellationPolicyId = null;

      // Handle return policy - map to predefined policies
      if (formData.is_returnable) {
        // Map return days to predefined policies
        if (formData.return_days <= 7) {
          returnPolicyId = '550e8400-e29b-41d4-a716-446655440003'; // 7 Day Return
        } else if (formData.return_days <= 14) {
          returnPolicyId = '550e8400-e29b-41d4-a716-446655440001'; // 14 Day Return
        } else if (formData.return_days <= 30) {
          returnPolicyId = '550e8400-e29b-41d4-a716-446655440002'; // 30 Day Return
        } else {
          // For more than 30 days, default to 30 day return
          returnPolicyId = '550e8400-e29b-41d4-a716-446655440002'; // 30 Day Return
        }
      } else {
        returnPolicyId = '550e8400-e29b-41d4-a716-446655440004'; // No Returns
      }

      // Handle COD policy - map to predefined policies
      if (formData.is_cod_allowed) {
        codPolicyId = '550e8400-e29b-41d4-a716-446655440101'; // COD Allowed
      } else {
        codPolicyId = '550e8400-e29b-41d4-a716-446655440102'; // Prepaid Only
      }

      // Handle cancellation policy - map to predefined policies
      if (formData.is_cancelable) {
        // Map cancel_until_status to predefined policies
        if (formData.cancel_until_status === 'pending') {
          cancellationPolicyId = '550e8400-e29b-41d4-a716-446655440203'; // Cancelable until Confirmed
        } else if (formData.cancel_until_status === 'processing') {
          cancellationPolicyId = '550e8400-e29b-41d4-a716-446655440202'; // Cancelable until Processing
        } else {
          cancellationPolicyId = '550e8400-e29b-41d4-a716-446655440201'; // Cancelable until Shipped
        }
      } else {
        cancellationPolicyId = '550e8400-e29b-41d4-a716-446655440204'; // Non-cancelable
      }

      const productData = {
        name: formData.name,
        slug: formData.slug,
        description: formData.description,
        short_description: formData.short_description,
        sku: formData.sku,
        category_id: formData.category_id,
        brand_id: formData.brand_id,
        vendor_id: formData.vendor_id || null,
        price: parseFloat(formData.price.toString()),
        stock_quantity: parseInt(formData.stock_quantity.toString()),
        min_stock_level: parseInt(formData.min_stock_level.toString()),
        weight: parseFloat(formData.weight.toString()),
        is_active: formData.is_active,
        is_featured: formData.is_featured,
        meta_title: formData.meta_title,
        meta_description: formData.meta_description,
        return_policy_id: returnPolicyId,
        cod_policy_id: codPolicyId,
        cancellation_policy_id: cancellationPolicyId
      };

      let productId: string;

      if (product) {
        // Update existing product
        const { data: updatedProduct, error } = await supabase
          .from('products')
          .update(productData)
          .eq('id', product.id)
          .select()
          .single();

        if (error) {
          console.error('Error updating product:', error);
          throw new Error(`Failed to update product: ${error.message}`);
        }
        productId = product.id;
      } else {
        // Create new product
        const { data: newProduct, error } = await supabase
          .from('products')
          .insert([productData])
          .select()
          .single();

        if (error) {
          console.error('Error creating product:', error);
          throw new Error(`Failed to create product: ${error.message}`);
        }
        productId = newProduct.id;
      }

      // Delete images that were marked for removal
      if (imagesToDelete.length > 0) {
        const { error: deleteError } = await supabase
          .from('product_images')
          .delete()
          .in('id', imagesToDelete);

        if (deleteError) {
          console.error('Error deleting images:', deleteError);
        }
      }

      // Upload new images
      await uploadImages(productId);

      // Test if we can access the assignment table
      console.log('Testing assignment table access...');
      const { data: testData, error: testError } = await supabase
        .from('product_attribute_assignments')
        .select('*')
        .limit(1);
      
      if (testError) {
        console.error('Error accessing assignment table:', testError);
      } else {
        console.log('Assignment table accessible, current records:', testData);
      }

      // Save attributes using the new assignment table structure
      console.log('Saving attributes:', { selectedAttributes, attributeValues });
      
      if (selectedAttributes.length > 0) {
        // Delete existing attribute assignments first
        console.log('Deleting existing assignments for product:', productId);
        const { error: deleteError } = await supabase
          .from('product_attribute_assignments')
          .delete()
          .eq('product_id', productId);

        if (deleteError) {
          console.error('Error deleting existing assignments:', deleteError);
        }

        // Insert new attribute assignments
        const assignmentInserts = [];
        for (const selectedAttr of selectedAttributes) {
          const valueIds = attributeValues[selectedAttr.id] || [];
          console.log(`Processing attribute ${selectedAttr.name} with values:`, valueIds);
          
          for (const valueId of valueIds) {
            assignmentInserts.push({
              product_id: productId,
              attribute_value_id: valueId
            });
          }
        }

        console.log('Assignment inserts to be made:', assignmentInserts);

        if (assignmentInserts.length > 0) {
          const { data: insertData, error: attrError } = await supabase
            .from('product_attribute_assignments')
            .insert(assignmentInserts)
            .select();

          if (attrError) {
            console.error('Error saving attribute assignments:', attrError);
          } else {
            console.log('Successfully inserted assignments:', insertData);
          }
        } else {
          console.log('No assignments to insert');
        }
      } else {
        console.log('No attributes selected');
      }

      // Save generated variants
      if (generatedVariants.length > 0) {
        console.log('Saving variants:', generatedVariants);
        
        // Get existing variant IDs first
        const { data: existingVariants, error: fetchVariantsError } = await supabase
          .from('product_variants')
          .select('id')
          .eq('product_id', productId);

        if (fetchVariantsError) {
          console.error('Error fetching existing variants:', fetchVariantsError);
        }

        // Delete existing variant attribute assignments
        if (existingVariants && existingVariants.length > 0) {
          const variantIds = existingVariants.map(v => v.id);
          const { error: deleteVariantAssignmentsError } = await supabase
            .from('variant_attribute_assignments')
            .delete()
            .in('variant_id', variantIds);

          if (deleteVariantAssignmentsError) {
            console.error('Error deleting existing variant attribute assignments:', deleteVariantAssignmentsError);
          }
        }

        // Delete existing variants
        const { error: deleteVariantsError } = await supabase
          .from('product_variants')
          .delete()
          .eq('product_id', productId);

        if (deleteVariantsError) {
          console.error('Error deleting existing variants:', deleteVariantsError);
        }

        // Insert new variants
        const variantInserts = generatedVariants.map(variant => ({
          product_id: productId,
          name: variant.name,
          sku: variant.sku,
          price: variant.price,
          stock_quantity: variant.stock_quantity,
          attributes: variant.attributes,
          is_active: true
        }));

        const { data: variantData, error: variantError } = await supabase
          .from('product_variants')
          .insert(variantInserts)
          .select();

        if (variantError) {
          console.error('Error saving variants:', variantError);
        } else {
          console.log('Successfully inserted variants:', variantData);
          
          // Insert variant attribute assignments
          if (variantData && variantData.length > 0) {
            const variantAssignmentInserts = [];
            
            for (let i = 0; i < variantData.length; i++) {
              const variant = variantData[i];
              const originalVariant = generatedVariants[i];
              
              // Get attribute value IDs for this variant's attributes
              // Only include attributes that are marked as variant attributes
              for (const [attrId, attrValue] of Object.entries(originalVariant.attributes)) {
                // Check if this attribute is a variant attribute
                const isVariantAttribute = attributes.find(a => a.id === attrId)?.is_variant_attribute === true;
                
                if (isVariantAttribute) {
                  // Find the attribute value ID that matches this attribute and value
                  const attributeValue = availableAttributeValues[attrId]?.find(
                    av => av.value === attrValue
                  );
                  
                  if (attributeValue) {
                    variantAssignmentInserts.push({
                      variant_id: variant.id,
                      attribute_value_id: attributeValue.id
                    });
                  }
                }
              }
            }
            
            if (variantAssignmentInserts.length > 0) {
              console.log('Inserting variant attribute assignments:', variantAssignmentInserts);
              
              const { data: assignmentData, error: assignmentError } = await supabase
                .from('variant_attribute_assignments')
                .insert(variantAssignmentInserts)
                .select();
                
              if (assignmentError) {
                console.error('Error saving variant attribute assignments:', assignmentError);
              } else {
                console.log('Successfully inserted variant attribute assignments:', assignmentData);
              }
            }
          }
        }
      }

      // Fetch the complete product with relations
      const { data: completeProduct, error: fetchError } = await supabase
        .from('products')
        .select(`
          *,
          category:categories(name),
          brand:brands(name),
          images:product_images(*),
          return_policy:return_policies(*),
          cod_policy:cod_policies(*),
          cancellation_policy:cancellation_policies(*),
          attribute_assignments:product_attribute_assignments(
            *,
            attribute_value:attribute_values(
            *,
            attribute:product_attributes(*)
            )
          )
        `)
        .eq('id', productId)
        .single();

      if (fetchError) {
        console.error('Error fetching complete product:', fetchError);
      }

      // Save delivery options
      if (deliveryOptions.pickupLocationId && deliveryOptions.deliveryMethodIds.length > 0) {
        try {
          // Delete existing delivery options for this product
          await supabase
            .from('product_delivery_options')
            .delete()
            .eq('product_id', productId);

          // Delete existing delivery zones for this product
          await supabase
            .from('product_delivery_zones')
            .delete()
            .eq('product_id', productId);

          // Get pickup location details to find matching delivery rates
          const { data: pickupLocation, error: pickupError } = await supabase
            .from('pickup_locations')
            .select('city')
            .eq('id', deliveryOptions.pickupLocationId)
            .single();

          if (pickupError) {
            console.error('Error fetching pickup location:', pickupError);
            return;
          }

          // Find delivery rates that match the pickup location and selected delivery methods
          const { data: deliveryRates, error: ratesError } = await supabase
            .from('delivery_rates')
            .select('id, delivery_method_id')
            .eq('pickup_city', pickupLocation.city)
            .in('delivery_method_id', deliveryOptions.deliveryMethodIds)
            .eq('is_active', true);

          if (ratesError) {
            console.error('Error fetching delivery rates:', ratesError);
            return;
          }

          // Insert new delivery options using delivery_rate_id
          if (deliveryRates && deliveryRates.length > 0) {
            const deliveryOptionInserts = deliveryRates.map(rate => ({
              product_id: productId,
              delivery_rate_id: rate.id,
              is_free_delivery: deliveryOptions.isFreeDelivery
            }));

            const { error: deliveryError } = await supabase
              .from('product_delivery_options')
              .insert(deliveryOptionInserts);

            if (deliveryError) {
              console.error('Error saving delivery options:', deliveryError);
            } else {
              console.log(`Successfully created ${deliveryOptionInserts.length} product delivery options`);
            }
          } else {
            console.warn('No matching delivery rates found for the selected pickup location and delivery methods');
          }

          // Insert delivery zones (allowed cities with countries)
          if (deliveryOptions.allowedDeliveryZones.length > 0) {
            const zoneInserts = deliveryOptions.allowedDeliveryZones.map(zone => ({
              product_id: productId,
              city: zone.city,
              country: zone.country,
              is_allowed: true
            }));

            const { error: zoneError } = await supabase
              .from('product_delivery_zones')
              .insert(zoneInserts);

            if (zoneError) {
              console.error('Error saving delivery zones:', zoneError);
            } else {
              console.log(`Successfully created ${zoneInserts.length} delivery zones`);
            }
          }
        } catch (error) {
          console.error('Error saving delivery options:', error);
        }
      }

      onSave(completeProduct);
    } catch (error) {
      console.error('Error saving product:', error);
      alert('Error saving product. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-3 border-b border-gray-200">
          <h1 className="text-xl font-semibold text-gray-900">
            {product ? 'Edit Product' : 'Add New Product'}
          </h1>
        </div>
        
        <form onSubmit={handleSubmit} className="p-4 space-y-5">
          {/* Basic Information */}
          <div className="space-y-3">
            <h3 className="text-lg font-medium text-gray-900">Basic Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Slug *</label>
                <input
                  type="text"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  className="block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Short Description</label>
              <textarea
                value={formData.short_description}
                onChange={(e) => setFormData({ ...formData, short_description: e.target.value })}
                rows={2}
                className="block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={4}
                className="block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500"
              />
            </div>
          </div>

          {/* Product Details */}
          <div className="space-y-3">
            <h3 className="text-lg font-medium text-gray-900">Product Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">SKU</label>
                <input
                  type="text"
                  value={formData.sku}
                  onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                  className="block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Category *</label>
                <select
                  value={formData.category_id}
                  onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                  className="block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                  required
                >
                  <option value="">Select Category</option>
                  {(categories || []).map(category => (
                    <option key={category.id} value={category.id}>{category.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Brand</label>
                <select
                  value={formData.brand_id}
                  onChange={(e) => setFormData({ ...formData, brand_id: e.target.value })}
                  className="block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                >
                  <option value="">Select Brand</option>
                  {(brands || []).map(brand => (
                    <option key={brand.id} value={brand.id}>{brand.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Vendor</label>
                <select
                  value={formData.vendor_id}
                  onChange={(e) => setFormData({ ...formData, vendor_id: e.target.value })}
                  className="block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                  disabled={loadingVendors}
                >
                  <option value="">Select Vendor</option>
                  {vendors.map(vendor => (
                    <option key={vendor.id} value={vendor.id}>
                      {vendor.business_name} - {vendor.city}, {vendor.country}
                    </option>
                  ))}
                </select>
                {loadingVendors && (
                  <p className="text-xs text-gray-500 mt-1">Loading vendors...</p>
                )}
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Weight (kg)</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.weight}
                  onChange={(e) => setFormData({ ...formData, weight: parseFloat(e.target.value) || 0 })}
                  className="block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                />
              </div>
            </div>
          </div>

          {/* Pricing */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Pricing</h3>
            <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Price *</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                  className="block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                  required
                />
              </div>
            </div>
          </div>

          {/* Inventory */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Inventory</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Stock Quantity</label>
                <input
                  type="number"
                  value={formData.stock_quantity}
                  onChange={(e) => setFormData({ ...formData, stock_quantity: parseInt(e.target.value) || 0 })}
                  className="block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Min Stock Level</label>
                <input
                  type="number"
                  value={formData.min_stock_level}
                  onChange={(e) => setFormData({ ...formData, min_stock_level: parseInt(e.target.value) || 5 })}
                  className="block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                />
              </div>
            </div>
          </div>

          {/* Images */}
          <div className="space-y-3">
            <h3 className="text-lg font-medium text-gray-900">Images</h3>
            
            {/* Existing Images */}
            {existingImages.length > 0 && (
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Current Images</label>
                <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                  {(existingImages || []).map((image) => (
                    <div key={image.id} className="relative">
                      <img
                        src={image.image_url}
                        alt={image.alt_text}
                        className="w-full h-16 object-cover rounded border"
                      />
                      <button
                        type="button"
                        onClick={() => removeExistingImage(image.id)}
                        className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 hover:bg-red-600"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* New Images */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Add New Images</label>
              <div className="border-2 border-dashed border-gray-300 rounded-md p-4">
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="image-upload"
                />
                <label
                  htmlFor="image-upload"
                  className="cursor-pointer flex flex-col items-center justify-center space-y-2"
                >
                  <Upload className="h-8 w-8 text-gray-400" />
                  <span className="text-sm text-gray-600">Click to upload images</span>
                </label>
              </div>
              
              {/* Image Previews */}
              {imagePreviews.length > 0 && (
                <div className="mt-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {(imagePreviews || []).map((preview, index) => (
                      <div key={index} className="relative">
                        <img
                          src={preview}
                          alt={`Preview ${index + 1}`}
                          className="w-full h-16 object-cover rounded border"
                        />
                        <button
                          type="button"
                          onClick={() => removeFile(index)}
                          className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 hover:bg-red-600"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Product Variants Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">Product Variants</h3>
              <div className="flex items-center space-x-2">
                <select
                  value={newVariantAttributeId}
                  onChange={(e) => setNewVariantAttributeId(e.target.value)}
                  className="px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                >
                  <option value="">Select variant attribute to add</option>
                  {(attributes || [])
                    .filter(attr => 
                      attr.is_variant_attribute === true && 
                      !selectedAttributes.find(selected => selected.id === attr.id)
                    )
                    .map(attribute => (
                      <option key={attribute.id} value={attribute.id}>
                        {attribute.name} ({attribute.type})
                      </option>
                    ))}
                </select>
                <button
                  type="button"
                  onClick={handleAddVariantAttribute}
                  disabled={!newVariantAttributeId}
                  className="px-3 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Add
                </button>
              </div>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-md p-3">
              <p className="text-sm text-green-800">
                <strong>Variant Attributes:</strong> These attributes create different product variants (e.g., Color, Size). 
                The system will auto-generate all possible combinations as variants.
              </p>
            </div>

            {/* Variant Attributes Table */}
            {selectedAttributes.filter(attr => 
              attributes.find(a => a.id === attr.id)?.is_variant_attribute === true
            ).length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Variant Attribute
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Add Value
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Selected Values
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {selectedAttributes
                      .filter(attr => attributes.find(a => a.id === attr.id)?.is_variant_attribute === true)
                      .map((selectedAttr) => (
                      <tr key={selectedAttr.id} className="hover:bg-gray-50">
                        {/* Attribute Name */}
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex items-center space-x-2">
                            <div className="text-sm font-medium text-gray-900">
                              {selectedAttr.name}
                            </div>
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              Variant
                            </span>
                          </div>
                        </td>

                        {/* Attribute Type */}
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {selectedAttr.type}
                          </span>
                        </td>

                        {/* Add Value Dropdown */}
                        <td className="px-4 py-3">
                          {loadingAttributeValues[selectedAttr.id] ? (
                            <div className="flex items-center space-x-2">
                              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-orange-600"></div>
                              <span className="text-xs text-gray-500">Loading...</span>
                            </div>
                          ) : availableAttributeValues[selectedAttr.id]?.length > 0 ? (
                            <div className="flex items-center space-x-2">
                              <select
                                value={newValueIds[selectedAttr.id] || ''}
                                onChange={(e) => setNewValueIds(prev => ({ ...prev, [selectedAttr.id]: e.target.value }))}
                                className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                              >
                                <option value="">Select value</option>
                                {availableAttributeValues[selectedAttr.id]
                                  .filter(value => !attributeValues[selectedAttr.id]?.includes(value.id))
                                  .map((value) => (
                                    <option key={value.id} value={value.id}>
                                      {value.display_value || value.value}
                                    </option>
                                  ))}
                              </select>
                              <button
                                type="button"
                                onClick={() => handleAddValue(selectedAttr.id)}
                                disabled={!newValueIds[selectedAttr.id]}
                                className="px-2 py-1 bg-orange-600 text-white rounded-md hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                <Plus className="h-3 w-3" />
                              </button>
                            </div>
                          ) : (
                            <span className="text-xs text-gray-500">No values available</span>
                          )}
                        </td>

                        {/* Selected Values */}
                        <td className="px-4 py-3">
                          {attributeValues[selectedAttr.id]?.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {attributeValues[selectedAttr.id].map((valueId) => {
                                const value = availableAttributeValues[selectedAttr.id]?.find(v => v.id === valueId);
                                return value ? (
                                  <span
                                    key={valueId}
                                    className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800 border border-orange-200"
                                  >
                                    {value.display_value || value.value}
                                    <button
                                      type="button"
                                      onClick={() => handleRemoveValue(selectedAttr.id, valueId)}
                                      className="ml-1 text-orange-600 hover:text-orange-800"
                                    >
                                      <X className="h-2 w-2" />
                                    </button>
                                  </span>
                                ) : null;
                              })}
                            </div>
                          ) : (
                            <span className="text-xs text-gray-500">No values selected</span>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="px-4 py-3 whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => handleRemoveAttribute(selectedAttr.id)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500 text-sm bg-gray-50 rounded-md border">
                <p>No variant attributes selected. Use the dropdown above to add variant attributes (Color, Size, etc.).</p>
              </div>
            )}
          </div>

          {/* Product Specifications Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">Product Specifications / Descriptions</h3>
              <div className="flex items-center space-x-2">
                <select
                  value={newSpecAttributeId}
                  onChange={(e) => setNewSpecAttributeId(e.target.value)}
                  className="px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                >
                  <option value="">Select specification attribute to add</option>
                  {(attributes || [])
                    .filter(attr => 
                      attr.is_variant_attribute === false && 
                      !selectedAttributes.find(selected => selected.id === attr.id)
                    )
                    .map(attribute => (
                      <option key={attribute.id} value={attribute.id}>
                        {attribute.name} ({attribute.type})
                      </option>
                    ))}
                </select>
                <button
                  type="button"
                  onClick={handleAddSpecAttribute}
                  disabled={!newSpecAttributeId}
                  className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Add
                </button>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
              <p className="text-sm text-blue-800">
                <strong>Specification Attributes:</strong> These attributes describe the product (e.g., Material, Weight, Brand). 
                Enter values directly for the product - they apply to all variants.
              </p>
            </div>

            {/* Specification Attributes */}
            {selectedAttributes.filter(attr => 
              attributes.find(a => a.id === attr.id)?.is_variant_attribute === false
            ).length > 0 ? (
              <div className="space-y-3">
                {selectedAttributes
                  .filter(attr => attributes.find(a => a.id === attr.id)?.is_variant_attribute === false)
                  .map((selectedAttr) => (
                  <div key={selectedAttr.id} className="border rounded-md p-4 bg-gray-50">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <div className="text-sm font-medium text-gray-900">
                          {selectedAttr.name}
                        </div>
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          Specification
                        </span>
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          {selectedAttr.type}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveAttribute(selectedAttr.id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                    
                    <div className="space-y-2">
                      {loadingAttributeValues[selectedAttr.id] ? (
                        <div className="flex items-center space-x-2">
                          <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-orange-600"></div>
                          <span className="text-xs text-gray-500">Loading values...</span>
                        </div>
                      ) : (
                        <div>
                          {availableAttributeValues[selectedAttr.id]?.length > 0 ? (
                            <div className="space-y-2">
                              {/* Add Value Dropdown */}
                              <div className="flex items-center space-x-2">
                                <div className="flex-1">
                                  <select
                                    value={newValueIds[selectedAttr.id] || ''}
                                    onChange={(e) => setNewValueIds(prev => ({ ...prev, [selectedAttr.id]: e.target.value }))}
                                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                                  >
                                    <option value="">Select a value to add</option>
                                    {availableAttributeValues[selectedAttr.id]
                                      .filter(value => !attributeValues[selectedAttr.id]?.includes(value.id))
                                      .map((value) => (
                                        <option key={value.id} value={value.id}>
                                          {value.display_value || value.value}
                                        </option>
                                      ))}
                                  </select>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleAddValue(selectedAttr.id)}
                                  disabled={!newValueIds[selectedAttr.id]}
                                  className="px-2 py-1 bg-orange-600 text-white rounded-md hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  <Plus className="h-3 w-3" />
                                </button>
                              </div>
                              
                              {/* Selected Values Display */}
                              {attributeValues[selectedAttr.id]?.length > 0 && (
                                <div className="flex flex-wrap gap-1">
                                  {attributeValues[selectedAttr.id].map((valueId) => {
                                    const value = availableAttributeValues[selectedAttr.id]?.find(v => v.id === valueId);
                                    return value ? (
                                      <span
                                        key={valueId}
                                        className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800 border border-orange-200"
                                      >
                                        {value.display_value || value.value}
                                        <button
                                          type="button"
                                          onClick={() => handleRemoveValue(selectedAttr.id, valueId)}
                                          className="ml-1 text-orange-600 hover:text-orange-800"
                                        >
                                          <X className="h-2 w-2" />
                                        </button>
                                      </span>
                                    ) : null;
                                  })}
                                </div>
                              )}
                              
                              {attributeValues[selectedAttr.id]?.length === 0 && (
                                <div className="text-xs text-gray-500 p-2 bg-white rounded border">
                                  No values selected. Use the dropdown above to add values.
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="text-xs text-gray-500 p-2 bg-white rounded border">
                              No values available for this attribute. Please add values in the Attribute Values management section.
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500 text-sm bg-gray-50 rounded-md border">
                <p>No specification attributes selected. Use the dropdown above to add specification attributes (Material, Weight, etc.).</p>
              </div>
            )}
          </div>

          {/* Generated Variants */}
          {showVariants && generatedVariants.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">
                  Product Variants ({generatedVariants.length})
                </h3>
                <button
                  type="button"
                  onClick={() => setShowVariants(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  <strong>Auto-generated variants:</strong> These variants were automatically created based on your selected <strong>variant attributes</strong> and their values. 
                  Only attributes marked as "Variant" in the attributes table are used for variant generation.
                  You can customize the price and stock quantity for each variant.
                </p>
              </div>

              <div className="overflow-x-auto max-h-96 overflow-y-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Variant Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Attributes
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        SKU
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Price ($)
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Stock
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {generatedVariants.map((variant) => (
                      <tr key={variant.id} className="hover:bg-gray-50">
                        {/* Variant Name */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900 max-w-xs truncate">
                            {variant.name}
                          </div>
                        </td>

                        {/* Attributes */}
                        <td className="px-6 py-4">
                          <div className="flex flex-wrap gap-1">
                            {Object.entries(variant.attributes).map(([attrId, value]) => {
                              const attr = selectedAttributes.find(a => a.id === attrId);
                              return (
                                <span
                                  key={attrId}
                                  className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800"
                                >
                                  {attr?.name}: {value}
                                </span>
                              );
                            })}
                          </div>
                        </td>

                        {/* SKU */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <input
                            type="text"
                            value={variant.sku}
                            onChange={(e) => updateVariant(variant.id, 'sku', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-orange-500 focus:border-orange-500 text-sm"
                            placeholder="Enter SKU"
                          />
                        </td>

                        {/* Price */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={variant.price}
                            onChange={(e) => updateVariant(variant.id, 'price', parseFloat(e.target.value) || 0)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-orange-500 focus:border-orange-500 text-sm"
                            placeholder="0.00"
                          />
                        </td>

                        {/* Stock Quantity */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <input
                            type="number"
                            min="0"
                            value={variant.stock_quantity}
                            onChange={(e) => updateVariant(variant.id, 'stock_quantity', parseInt(e.target.value) || 0)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-orange-500 focus:border-orange-500 text-sm"
                            placeholder="0"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}


          {/* Product Policies */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Product Policies</h3>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* COD Policy */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex-1">
                    <h4 className="text-sm font-medium text-gray-900">Cash on Delivery</h4>
                    <p className="text-xs text-gray-500 mt-1">
                      Allow COD payment
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.is_cod_allowed}
                      onChange={(e) => setFormData({ ...formData, is_cod_allowed: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-600"></div>
                  </label>
                </div>
                <div>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    formData.is_cod_allowed 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {formData.is_cod_allowed ? 'COD Allowed' : 'Prepaid Only'}
                  </span>
                </div>
              </div>

              {/* Return Policy */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex-1">
                    <h4 className="text-sm font-medium text-gray-900">Return Policy</h4>
                    <p className="text-xs text-gray-500 mt-1">
                      Allow product returns
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.is_returnable}
                      onChange={(e) => setFormData({ ...formData, is_returnable: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-600"></div>
                  </label>
                </div>
                
                {formData.is_returnable && (
                  <div className="mb-2">
                    <label className="block text-xs font-medium text-gray-700 mb-1">Return Days</label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="number"
                        min="1"
                        max="30"
                        value={formData.return_days}
                        onChange={(e) => setFormData({ ...formData, return_days: parseInt(e.target.value) || 14 })}
                        className="w-16 px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                      />
                      <span className="text-xs text-gray-500">
                        {formData.return_days <= 7 ? '(7 Day Policy)' : 
                         formData.return_days <= 14 ? '(14 Day Policy)' : 
                         '(30 Day Policy)'}
                      </span>
                    </div>
                  </div>
                )}
                
                <div>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    formData.is_returnable 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {formData.is_returnable ? `${formData.return_days} Days` : 'No Returns'}
                  </span>
                </div>
              </div>

              {/* Cancellation Policy */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex-1">
                    <h4 className="text-sm font-medium text-gray-900">Order Cancellation</h4>
                    <p className="text-xs text-gray-500 mt-1">
                      Allow order cancellation
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.is_cancelable}
                      onChange={(e) => setFormData({ ...formData, is_cancelable: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-600"></div>
                  </label>
                </div>
                
                {formData.is_cancelable && (
                  <div className="mb-2">
                    <label className="block text-xs font-medium text-gray-700 mb-1">Until Status</label>
                    <select
                      value={formData.cancel_until_status}
                      onChange={(e) => setFormData({ ...formData, cancel_until_status: e.target.value as 'pending' | 'processing' | 'shipped' })}
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                    >
                      <option value="pending">Confirmed</option>
                      <option value="processing">Processing</option>
                      <option value="shipped">Shipped</option>
                    </select>
                  </div>
                )}
                
                <div>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    formData.is_cancelable 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {formData.is_cancelable ? `Until ${formData.cancel_until_status}` : 'Non-cancelable'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Delivery Options */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Delivery Options</h3>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                <strong>Delivery Configuration:</strong> Select pickup location, delivery methods, and allowed cities for this product. 
                This determines delivery options and costs shown to customers during checkout.
              </p>
            </div>
            <DeliveryOptionsSelector 
              productId={product?.id}
              onDeliveryOptionsChange={setDeliveryOptions}
              initialData={deliveryOptions}
            />
          </div>

          {/* Status */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Status</h3>
            <div className="flex items-center space-x-6">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-700">Active</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.is_featured}
                  onChange={(e) => setFormData({ ...formData, is_featured: e.target.checked })}
                  className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-700">Featured</span>
              </label>
            </div>
          </div>

          {/* SEO */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">SEO</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Meta Title</label>
                <input
                  type="text"
                  value={formData.meta_title}
                  onChange={(e) => setFormData({ ...formData, meta_title: e.target.value })}
                  className="block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                  placeholder="Enter meta title for SEO"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Meta Description</label>
                <textarea
                  value={formData.meta_description}
                  onChange={(e) => setFormData({ ...formData, meta_description: e.target.value })}
                  rows={3}
                  className="block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                  placeholder="Enter meta description for SEO"
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onCancel}
              className="px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || uploading || loading}
              className="px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700 disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : uploading ? 'Uploading...' : (product ? 'Update Product' : 'Create Product')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
