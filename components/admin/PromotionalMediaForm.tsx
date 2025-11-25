'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { PromotionalMedia, Category, PromotionalMediaType, PromotionalMediaPosition, Brand, BannerActionType, ProductWithDetails } from '@/types/database';
import { Upload, X, Image as ImageIcon, Monitor, Smartphone } from 'lucide-react';

interface VendorFilter {
  id: string;
  business_name: string;
  status?: string;
}

interface PromotionalMediaFormProps {
  media?: PromotionalMedia | null;
  categories: Category[];
  onClose: () => void;
  onSuccess: () => void;
}

interface SliderItem {
  id?: string;
  image_url: string;
  mobile_image_url: string;
  link_url: string;
  button_text: string;
  target: '_self' | '_blank' | '_parent' | '_top';
  display_order: number;
  is_active: boolean;
  action_type?: BannerActionType;
  action_params?: Record<string, any>;
}

interface FormData {
  title: string;
  subtitle: string;
  description: string;
  media_type: PromotionalMediaType;
  image_url: string;
  mobile_image_url: string;
  video_url: string;
  link_url: string;
  button_text: string;
  target: '_self' | '_blank' | '_parent' | '_top';
  banner_position: PromotionalMediaPosition;
  display_order: number;
  background_color: string;
  text_color: string;
  is_active: boolean;
  start_date: string;
  end_date: string;
  language_code: string;
  store_id: string;
  categories: string[];
  slider_items: SliderItem[]; // New field for slider items
  action_type?: BannerActionType;
  action_params?: Record<string, any>;
}

interface SelectedFiles {
  image: File | null;
  mobile_image: File | null;
  slider_files: File[];
  slider_item_files: { [key: number]: { image: File | null; mobile_image: File | null } };
}

export default function PromotionalMediaForm({ media, categories, onClose, onSuccess }: PromotionalMediaFormProps) {
  const [sliderCount, setSliderCount] = useState(1);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [products, setProducts] = useState<ProductWithDetails[]>([]);
  const [vendors, setVendors] = useState<VendorFilter[]>([]);
  
  const [formData, setFormData] = useState<FormData>({
    title: media?.title || '',
    subtitle: media?.subtitle || '',
    description: media?.description || '',
    media_type: media?.media_type || 'banner',
    image_url: media?.image_url || '',
    mobile_image_url: media?.mobile_image_url || '',
    video_url: media?.video_url || '',
    link_url: media?.link_url || '',
    button_text: media?.button_text || '',
    target: media?.target || '_self',
    banner_position: media?.banner_position || 'homepage_top',
    display_order: media?.display_order || 0,
    background_color: media?.background_color || '#ffffff',
    text_color: media?.text_color || '#000000',
    is_active: media?.is_active ?? true,
    start_date: media?.start_date ? new Date(media.start_date).toISOString().split('T')[0] : '',
    end_date: media?.end_date ? new Date(media.end_date).toISOString().split('T')[0] : '',
    language_code: media?.language_code || 'en',
    store_id: media?.store_id || '',
    categories: [],
    slider_items: [],
    action_type: media?.action_type,
    action_params: media?.action_params || {}
  });

  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<SelectedFiles>({
    image: null,
    mobile_image: null,
    slider_files: [],
    slider_item_files: {}
  });

  // Fetch brands, products, and vendors for action params
  useEffect(() => {
    fetchBrands();
    fetchProducts();
    fetchVendors();
  }, []);

  // Update form data when media prop changes (for editing)
  useEffect(() => {
    if (media) {
      setFormData({
        title: media.title || '',
        subtitle: media.subtitle || '',
        description: media.description || '',
        media_type: media.media_type || 'banner',
        image_url: media.image_url || '',
        mobile_image_url: media.mobile_image_url || '',
        video_url: media.video_url || '',
        link_url: media.link_url || '',
        button_text: media.button_text || '',
        target: media.target || '_self',
        banner_position: media.banner_position || 'homepage_top',
        display_order: media.display_order || 0,
        background_color: media.background_color || '#ffffff',
        text_color: media.text_color || '#000000',
        is_active: media.is_active ?? true,
        start_date: media.start_date ? new Date(media.start_date).toISOString().split('T')[0] : '',
        end_date: media.end_date ? new Date(media.end_date).toISOString().split('T')[0] : '',
        language_code: media.language_code || 'en',
        store_id: media.store_id || '',
        categories: [],
        slider_items: [],
        action_type: media.action_type || undefined,
        action_params: media.action_params || {}
      });
    } else {
      // Reset form when media is null (new item)
      setFormData({
        title: '',
        subtitle: '',
        description: '',
        media_type: 'banner',
        image_url: '',
        mobile_image_url: '',
        video_url: '',
        link_url: '',
        button_text: '',
        target: '_self',
        banner_position: 'homepage_top',
        display_order: 0,
        background_color: '#ffffff',
        text_color: '#000000',
        is_active: true,
        start_date: '',
        end_date: '',
        language_code: 'en',
        store_id: '',
        categories: [],
        slider_items: [],
        action_type: undefined,
        action_params: {}
      });
    }
  }, [media]);

  const fetchBrands = async () => {
    try {
      const { data, error } = await supabase
        .from('brands')
        .select('*')
        .eq('is_active', true)
        .order('name');
      
      if (error) {
        console.error('Error fetching brands:', error);
      } else {
        setBrands(data || []);
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          category:categories(*),
          brand:brands(*)
        `)
        .eq('is_active', true)
        .order('name')
        .limit(100); // Limit to first 100 for performance
      
      if (error) {
        console.error('Error fetching products:', error);
      } else {
        setProducts(data || []);
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const fetchVendors = async () => {
    try {
      const { data, error } = await supabase
        .from('vendor_profiles')
        .select(`
          id,
          business_name,
          status
        `)
        .eq('status', 'active')
        .order('business_name');
      
      if (error) {
        console.error('Error fetching vendors:', error);
      } else {
        setVendors(data || []);
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  // Handle media type changes
  useEffect(() => {
    if (formData.media_type === 'slider') {
      // Initialize slider items if empty
      if (formData.slider_items.length === 0) {
        setFormData(prev => ({
          ...prev,
          slider_items: Array.from({ length: sliderCount }, (_, index) => ({
            image_url: '',
            mobile_image_url: '',
            link_url: '',
            button_text: '',
            target: '_self' as const,
            display_order: index,
            is_active: true,
            action_type: undefined,
            action_params: {}
          }))
        }));
      }
    } else {
      // If switching away from slider, clear slider items
      setFormData(prev => ({
        ...prev,
        slider_items: []
      }));
      setSliderCount(1);
    }
  }, [formData.media_type, sliderCount]);

  // Load existing slider items when editing
  useEffect(() => {
    if (media && media.media_type === 'slider') {
      loadSliderItems();
    }
  }, [media]);

  const loadSliderItems = async () => {
    if (!media?.id) return;

    try {
      const { data, error } = await supabase
        .from('slider_items')
        .select('*')
        .eq('promotional_media_id', media.id)
        .order('display_order', { ascending: true });

      if (error) {
        console.warn('Error loading slider items:', error);
        return;
      }

      if (data && data.length > 0) {
        setSliderCount(data.length);
        setFormData(prev => ({
          ...prev,
          slider_items: data.map(item => ({
            id: item.id,
            image_url: item.image_url,
            mobile_image_url: item.mobile_image_url,
            link_url: item.link_url,
            button_text: item.button_text,
            target: item.target,
            display_order: item.display_order,
            is_active: item.is_active,
            action_type: item.action_type || undefined,
            action_params: item.action_params || {}
          }))
        }));
      }
    } catch (error) {
      console.warn('Error loading slider items:', error);
    }
  };

  const mediaTypes: { value: PromotionalMediaType; label: string }[] = [
    { value: 'banner', label: 'Banner' },
    { value: 'slider', label: 'Slider' },
    { value: 'popup', label: 'Popup' },
    { value: 'video', label: 'Video' },
    { value: 'custom', label: 'Custom' }
  ];

  const positions: { value: PromotionalMediaPosition; label: string }[] = [
    { value: 'homepage_top', label: 'Homepage Top' },
    { value: 'homepage_middle', label: 'Homepage Middle' },
    { value: 'homepage_bottom', label: 'Homepage Bottom' },
    { value: 'homepage_middle_slider', label: 'Homepage Middle Slider' },
    { value: 'category_page', label: 'Category Page' },
    { value: 'product_page', label: 'Product Page' },
    { value: 'sidebar', label: 'Sidebar' },
    { value: 'footer', label: 'Footer' },
    { value: 'popup', label: 'Popup' },
    { value: 'header', label: 'Header' },
    { value: 'checkout_page', label: 'Checkout Page' },
    { value: 'cart_page', label: 'Cart Page' },
    { value: 'limited_time_deals', label: 'Limited Time Deals' }
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const handleActionParamsChange = (key: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      action_params: {
        ...prev.action_params,
        [key]: value
      }
    }));
  };

  const handleActionTypeChange = (actionType: BannerActionType | '') => {
    setFormData(prev => ({
      ...prev,
      action_type: actionType || undefined,
      action_params: {} // Reset action params when action type changes
    }));
  };

  const handleCategoryChange = (categoryId: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      categories: checked 
        ? [...prev.categories, categoryId]
        : prev.categories.filter(id => id !== categoryId)
    }));
  };

  const handleSliderCountChange = (count: number) => {
    setSliderCount(count);
    setFormData(prev => {
      const newSliderItems = Array.from({ length: count }, (_, index) => {
        // Keep existing items or create new ones
        if (prev.slider_items[index]) {
          return prev.slider_items[index];
        }
        return {
          image_url: '',
          mobile_image_url: '',
          link_url: '',
          button_text: '',
          target: '_self' as const,
          display_order: index,
          is_active: true,
          action_type: undefined,
          action_params: {}
        };
      });
      
      return {
        ...prev,
        slider_items: newSliderItems
      };
    });
  };

  const handleSliderItemChange = (index: number, field: keyof SliderItem, value: any) => {
    setFormData(prev => ({
      ...prev,
      slider_items: prev.slider_items.map((item, i) => 
        i === index ? { ...item, [field]: value } : item
      )
    }));
  };

  const handleSliderItemActionTypeChange = (index: number, actionType: BannerActionType | '') => {
    setFormData(prev => ({
      ...prev,
      slider_items: prev.slider_items.map((item, i) => 
        i === index ? { 
          ...item, 
          action_type: actionType || undefined,
          action_params: {} // Reset action params when action type changes
        } : item
      )
    }));
  };

  const handleSliderItemActionParamsChange = (index: number, key: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      slider_items: prev.slider_items.map((item, i) => 
        i === index ? { 
          ...item, 
          action_params: {
            ...item.action_params,
            [key]: value
          }
        } : item
      )
    }));
  };

  const handleSliderItemFileSelection = (index: number, file: File, type: 'image' | 'mobile_image') => {
    setSelectedFiles(prev => ({
      ...prev,
      slider_item_files: {
        ...prev.slider_item_files,
        [index]: {
          ...prev.slider_item_files[index],
      [type]: file
        }
      }
    }));
  };

  const removeSliderItemFile = (index: number, type: 'image' | 'mobile_image') => {
    setSelectedFiles(prev => ({
      ...prev,
      slider_item_files: {
        ...prev.slider_item_files,
        [index]: {
          ...prev.slider_item_files[index],
          [type]: null
        }
      }
    }));
  };

  const handleFileSelection = (file: File, type: 'image' | 'mobile_image') => {
    // Create preview URL for immediate display
    const previewUrl = URL.createObjectURL(file);
    setPreviewUrl(previewUrl);
    
    // Store the file for later upload
    setSelectedFiles(prev => ({
      ...prev,
      [type]: file
    }));
  };


  const removeSelectedFile = (type: 'image' | 'mobile_image') => {
    setSelectedFiles(prev => ({
      ...prev,
      [type]: null
    }));
    setPreviewUrl(null);
  };

  const uploadFile = async (file: File, type: 'image' | 'mobile_image') => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}.${fileExt}`;
    const filePath = `${type}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('promotional-media')
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    const { data } = supabase.storage
      .from('promotional-media')
      .getPublicUrl(filePath);

    return data.publicUrl;
  };

  const uploadSliderItemFile = async (file: File, index: number, type: 'image' | 'mobile_image') => {
      const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}_slider_${index}_${type}.${fileExt}`;
    const filePath = `slider-items/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('promotional-media')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('promotional-media')
        .getPublicUrl(filePath);

    return data.publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setUploading(true);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        alert('You must be logged in to create promotional media');
        return;
      }

      // Upload files first
      let imageUrl = formData.image_url;
      let mobileImageUrl = formData.mobile_image_url;

      // Upload single images if files are selected
      if (selectedFiles.image) {
        imageUrl = await uploadFile(selectedFiles.image, 'image');
      }
      if (selectedFiles.mobile_image) {
        mobileImageUrl = await uploadFile(selectedFiles.mobile_image, 'mobile_image');
      }

      // Upload slider item files
      const updatedSliderItems = [...formData.slider_items];
      for (let i = 0; i < updatedSliderItems.length; i++) {
        const item = updatedSliderItems[i];
        const itemFiles = selectedFiles.slider_item_files[i];
        
        if (itemFiles?.image) {
          item.image_url = await uploadSliderItemFile(itemFiles.image, i, 'image');
        }
        if (itemFiles?.mobile_image) {
          item.mobile_image_url = await uploadSliderItemFile(itemFiles.mobile_image, i, 'mobile_image');
        }
      }

      // Remove categories and slider_items from the data being sent to the database
      const { categories, slider_items, ...mediaDataWithoutCategories } = formData;
      
      // Prepare action_params - clean empty values
      const actionParams = formData.action_params || {};
      const cleanedActionParams: Record<string, any> = {};
      Object.keys(actionParams).forEach(key => {
        const value = actionParams[key];
        if (value !== '' && value !== null && value !== undefined) {
          cleanedActionParams[key] = value;
        }
      });
      
      // For sliders, use the first image as the main image_url
      const mediaData = {
        ...mediaDataWithoutCategories,
        image_url: formData.media_type === 'slider' && updatedSliderItems.length > 0 
          ? updatedSliderItems[0].image_url 
          : imageUrl,
        mobile_image_url: mobileImageUrl,
        created_by: user.id,
        display_order: parseInt(formData.display_order.toString()),
        start_date: formData.start_date ? new Date(formData.start_date).toISOString() : null,
        end_date: formData.end_date ? new Date(formData.end_date).toISOString() : null,
        store_id: formData.store_id || null,
        action_type: formData.action_type || null,
        action_params: Object.keys(cleanedActionParams).length > 0 ? cleanedActionParams : null
      };

      let result;
      if (media) {
        const { data, error } = await supabase
          .from('promotional_media')
          .update(mediaData)
          .eq('id', media.id)
          .select()
          .single();

        if (error) throw error;
        result = data;
      } else {
        const { data, error } = await supabase
          .from('promotional_media')
          .insert(mediaData)
          .select()
          .single();

        if (error) throw error;
        result = data;
      }

      // Handle slider items (only for slider type)
      if (formData.media_type === 'slider' && updatedSliderItems.length > 0) {
        try {
          // Delete existing slider items
          await supabase
            .from('slider_items')
            .delete()
            .eq('promotional_media_id', result.id);

          // Insert new slider items
          const sliderItemInserts = updatedSliderItems.map(item => {
            // Clean action_params - remove empty values
            const actionParams = item.action_params || {};
            const cleanedActionParams: Record<string, any> = {};
            Object.keys(actionParams).forEach(key => {
              const value = actionParams[key];
              if (value !== '' && value !== null && value !== undefined) {
                cleanedActionParams[key] = value;
              }
            });

            return {
              promotional_media_id: result.id,
              image_url: item.image_url,
              mobile_image_url: item.mobile_image_url,
              link_url: item.link_url,
              button_text: item.button_text,
              target: item.target,
              display_order: item.display_order,
              is_active: item.is_active,
              action_type: item.action_type || null,
              action_params: Object.keys(cleanedActionParams).length > 0 ? cleanedActionParams : null
            };
          });

          const { error: sliderError } = await supabase
            .from('slider_items')
            .insert(sliderItemInserts);

          if (sliderError) {
            console.warn('Slider items failed:', sliderError);
            // Don't fail the entire operation for slider items
          }
        } catch (sliderError) {
          console.warn('Slider items not available:', sliderError);
          // Don't fail the entire operation for slider items
        }
      }

      // Handle category associations (only if table exists)
      if (formData.categories.length > 0) {
        try {
          // Delete existing associations
          await supabase
            .from('promotional_media_categories')
            .delete()
            .eq('promotional_media_id', result.id);

          // Insert new associations
          const categoryInserts = formData.categories.map(categoryId => ({
            promotional_media_id: result.id,
            category_id: categoryId
          }));

          const { error: categoryError } = await supabase
            .from('promotional_media_categories')
            .insert(categoryInserts);

          if (categoryError) {
            console.warn('Category associations failed:', categoryError);
            // Don't fail the entire operation for category associations
          }
        } catch (categoryError) {
          console.warn('Category associations not available:', categoryError);
          // Don't fail the entire operation for category associations
        }
      }

      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Error saving promotional media:', error);
      
      // Provide more specific error messages
      let errorMessage = 'Error saving promotional media. Please try again.';
      
      if (error?.message) {
        if (error.message.includes('relation "promotional_media" does not exist')) {
          errorMessage = 'Database tables not found. Please run the migrations first.';
        } else if (error.message.includes('permission denied')) {
          errorMessage = 'Permission denied. Please check your admin role.';
        } else if (error.message.includes('duplicate key')) {
          errorMessage = 'A promotional media item with this title already exists.';
        } else if (error.message.includes('violates check constraint')) {
          errorMessage = 'Invalid data provided. Please check your input.';
        } else {
          errorMessage = `Error: ${error.message}`;
        }
      }
      
      alert(errorMessage);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-gray-900">
              {media ? 'Edit Promotional Media' : 'Add New Promotional Media'}
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <span className="sr-only">Close</span>
              <X className="h-6 w-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Basic Information */}
              <div className="space-y-4">
                <h4 className="text-md font-medium text-gray-900">Basic Information</h4>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Subtitle</label>
                  <input
                    type="text"
                    name="subtitle"
                    value={formData.subtitle}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Media Type *</label>
                  <select
                    name="media_type"
                    value={formData.media_type}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  >
                    {mediaTypes.map(type => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Position *</label>
                  <select
                    name="banner_position"
                    value={formData.banner_position}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  >
                    {positions.map(position => (
                      <option key={position.value} value={position.value}>{position.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Media URLs */}
              <div className="space-y-4">
                <h4 className="text-md font-medium text-gray-900">Media URLs</h4>
                
                {formData.media_type === 'slider' ? (
                  /* Slider Configuration */
                  <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Number of Sliders
                    </label>
                      <select
                        value={sliderCount}
                        onChange={(e) => handleSliderCountChange(parseInt(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      >
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
                          <option key={num} value={num}>{num} Slider{num > 1 ? 's' : ''}</option>
                        ))}
                      </select>
                    </div>

                    {/* Slider Items Configuration */}
                    <div className="space-y-4">
                      <h5 className="text-sm font-medium text-gray-700">Configure Each Slider</h5>
                      {formData.slider_items.map((item, index) => (
                        <div key={index} className="border border-gray-200 rounded-lg p-4 space-y-3">
                          <div className="flex items-center justify-between">
                            <h6 className="text-sm font-medium text-gray-600">Slider {index + 1}</h6>
                            <div className="flex items-center">
                              <input
                                type="checkbox"
                                checked={item.is_active}
                                onChange={(e) => handleSliderItemChange(index, 'is_active', e.target.checked)}
                                className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                              />
                              <label className="ml-2 text-sm text-gray-600">Active</label>
                            </div>
                          </div>

                          {/* Image Upload */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Desktop Image *
                            </label>
                            <div className="flex gap-2">
                              <input
                                type="url"
                                value={item.image_url}
                                onChange={(e) => handleSliderItemChange(index, 'image_url', e.target.value)}
                                placeholder="Image URL or upload file"
                                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                              />
                              <label className="px-3 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 cursor-pointer flex items-center gap-1">
                        <Upload className="h-4 w-4" />
                                Upload
                        <input
                          type="file"
                          accept="image/*"
                                  onChange={(e) => e.target.files?.[0] && handleSliderItemFileSelection(index, e.target.files[0], 'image')}
                          className="hidden"
                          disabled={uploading}
                        />
                      </label>
                          </div>
                            
                            {/* Image Preview */}
                            {(item.image_url || selectedFiles.slider_item_files[index]?.image) && (
                              <div className="mt-2 flex items-center gap-2">
                                <img
                                  src={selectedFiles.slider_item_files[index]?.image 
                                    ? URL.createObjectURL(selectedFiles.slider_item_files[index].image) 
                                    : item.image_url}
                                  alt={`Slider ${index + 1}`}
                                  className="h-20 w-32 object-cover rounded border"
                                />
                                {selectedFiles.slider_item_files[index]?.image && (
                                  <button
                                    type="button"
                                    onClick={() => removeSliderItemFile(index, 'image')}
                                    className="px-2 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600"
                                  >
                                    Remove
                                  </button>
                                )}
                        </div>
                      )}
                          </div>

                          {/* Mobile Image Upload */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Mobile Image
                            </label>
                            <div className="flex gap-2">
                              <input
                                type="url"
                                value={item.mobile_image_url}
                                onChange={(e) => handleSliderItemChange(index, 'mobile_image_url', e.target.value)}
                                placeholder="Mobile Image URL or upload file"
                                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                              />
                              <label className="px-3 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 cursor-pointer flex items-center gap-1">
                                <Smartphone className="h-4 w-4" />
                                Upload
                                <input
                                  type="file"
                                  accept="image/*"
                                  onChange={(e) => e.target.files?.[0] && handleSliderItemFileSelection(index, e.target.files[0], 'mobile_image')}
                                  className="hidden"
                                  disabled={uploading}
                                />
                              </label>
                          </div>
                            
                            {/* Mobile Image Preview */}
                            {(item.mobile_image_url || selectedFiles.slider_item_files[index]?.mobile_image) && (
                              <div className="mt-2 flex items-center gap-2">
                                <img
                                  src={selectedFiles.slider_item_files[index]?.mobile_image 
                                    ? URL.createObjectURL(selectedFiles.slider_item_files[index].mobile_image) 
                                    : item.mobile_image_url}
                                  alt={`Slider ${index + 1} Mobile`}
                                  className="h-20 w-16 object-cover rounded border"
                                />
                                {selectedFiles.slider_item_files[index]?.mobile_image && (
                                <button
                                  type="button"
                                    onClick={() => removeSliderItemFile(index, 'mobile_image')}
                                    className="px-2 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600"
                                >
                                    Remove
                                </button>
                                )}
                                </div>
                            )}
                              </div>

                          {/* Link Configuration */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Link URL
                              </label>
                              <input
                                type="url"
                                value={item.link_url}
                                onChange={(e) => handleSliderItemChange(index, 'link_url', e.target.value)}
                                placeholder="https://example.com"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                              />
                          </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Button Text
                              </label>
                              <input
                                type="text"
                                value={item.button_text}
                                onChange={(e) => handleSliderItemChange(index, 'button_text', e.target.value)}
                                placeholder="Shop Now"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                              />
                        </div>
                          </div>

                          {/* Target */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Link Target
                            </label>
                            <select
                              value={item.target}
                              onChange={(e) => handleSliderItemChange(index, 'target', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                            >
                              <option value="_self">Same Window</option>
                              <option value="_blank">New Window</option>
                              <option value="_parent">Parent Window</option>
                              <option value="_top">Top Window</option>
                            </select>
                          </div>

                          {/* Action Type and Parameters for Slider Item */}
                          <div className="space-y-4 border-t pt-4 mt-4">
                            <h5 className="text-sm font-medium text-gray-900">Slider Item Action</h5>
                            
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Action Type</label>
                              <select
                                value={item.action_type || ''}
                                onChange={(e) => handleSliderItemActionTypeChange(index, e.target.value as BannerActionType | '')}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                              >
                                <option value="">None (Use Link URL)</option>
                                <option value="open_category">Open Category</option>
                                <option value="open_product">Open Product</option>
                                <option value="open_brand">Open Brand</option>
                                <option value="open_flash_sale">Open Flash Sale</option>
                                <option value="open_filtered_products">Open Filtered Products</option>
                                <option value="open_url">Open Custom URL</option>
                              </select>
                            </div>

                            {/* Dynamic Fields Based on Action Type */}
                            {item.action_type === 'open_category' && (
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
                                <select
                                  value={item.action_params?.categoryId || ''}
                                  onChange={(e) => handleSliderItemActionParamsChange(index, 'categoryId', e.target.value)}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                  required
                                >
                                  <option value="">Select a category</option>
                                  {categories.map(category => (
                                    <option key={category.id} value={category.id}>{category.name}</option>
                                  ))}
                                </select>
                              </div>
                            )}

                            {item.action_type === 'open_product' && (
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Product *</label>
                                <select
                                  value={item.action_params?.productId || ''}
                                  onChange={(e) => handleSliderItemActionParamsChange(index, 'productId', e.target.value)}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                  required
                                >
                                  <option value="">Select a product</option>
                                  {products.map(product => (
                                    <option key={product.id} value={product.id}>{product.name}</option>
                                  ))}
                                </select>
                              </div>
                            )}

                            {item.action_type === 'open_brand' && (
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Brand *</label>
                                <select
                                  value={item.action_params?.brand || ''}
                                  onChange={(e) => handleSliderItemActionParamsChange(index, 'brand', e.target.value)}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                  required
                                >
                                  <option value="">Select a brand</option>
                                  {brands.map(brand => (
                                    <option key={brand.id} value={brand.slug || brand.id}>{brand.name}</option>
                                  ))}
                                </select>
                              </div>
                            )}

                            {item.action_type === 'open_flash_sale' && (
                              <div className="space-y-2">
                                <p className="text-sm text-gray-600">Flash sale will open the flash sale products page</p>
                              </div>
                            )}

                            {item.action_type === 'open_filtered_products' && (
                              <div className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                  <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                                    <select
                                      value={item.action_params?.categoryId || ''}
                                      onChange={(e) => handleSliderItemActionParamsChange(index, 'categoryId', e.target.value)}
                                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                    >
                                      <option value="">Any category</option>
                                      {categories.map(category => (
                                        <option key={category.id} value={category.id}>{category.name}</option>
                                      ))}
                                    </select>
                                  </div>

                                  <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Brand</label>
                                    <select
                                      value={item.action_params?.brand || ''}
                                      onChange={(e) => handleSliderItemActionParamsChange(index, 'brand', e.target.value)}
                                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                    >
                                      <option value="">Any brand</option>
                                      {brands.map(brand => (
                                        <option key={brand.id} value={brand.slug || brand.id}>{brand.name}</option>
                                      ))}
                                    </select>
                                  </div>

                                  <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Vendor</label>
                                    <select
                                      value={item.action_params?.vendorId || ''}
                                      onChange={(e) => handleSliderItemActionParamsChange(index, 'vendorId', e.target.value)}
                                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                    >
                                      <option value="">Any vendor</option>
                                      {vendors.map(vendor => (
                                        <option key={vendor.id} value={vendor.id}>{vendor.business_name}</option>
                                      ))}
                                    </select>
                                  </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Min Price</label>
                                    <input
                                      type="number"
                                      value={item.action_params?.minPrice || ''}
                                      onChange={(e) => handleSliderItemActionParamsChange(index, 'minPrice', e.target.value)}
                                      placeholder="0"
                                      min="0"
                                      step="0.01"
                                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                    />
                                  </div>

                                  <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Max Price</label>
                                    <input
                                      type="number"
                                      value={item.action_params?.maxPrice || ''}
                                      onChange={(e) => handleSliderItemActionParamsChange(index, 'maxPrice', e.target.value)}
                                      placeholder="1000"
                                      min="0"
                                      step="0.01"
                                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                    />
                                  </div>
                                </div>

                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">Min Discount (%)</label>
                                  <input
                                    type="number"
                                    value={item.action_params?.discountMin || ''}
                                    onChange={(e) => handleSliderItemActionParamsChange(index, 'discountMin', e.target.value)}
                                    placeholder="0"
                                    min="0"
                                    max="100"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                  />
                                </div>

                                <div className="flex items-center">
                                  <input
                                    type="checkbox"
                                    checked={item.action_params?.flashSale || false}
                                    onChange={(e) => handleSliderItemActionParamsChange(index, 'flashSale', e.target.checked)}
                                    className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                                  />
                                  <label className="ml-2 block text-sm text-gray-900">Flash Sale Only</label>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Color</label>
                                    <input
                                      type="text"
                                      value={item.action_params?.color || ''}
                                      onChange={(e) => handleSliderItemActionParamsChange(index, 'color', e.target.value)}
                                      placeholder="e.g., Red, Blue"
                                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                    />
                                  </div>

                                  <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Size</label>
                                    <input
                                      type="text"
                                      value={item.action_params?.size || ''}
                                      onChange={(e) => handleSliderItemActionParamsChange(index, 'size', e.target.value)}
                                      placeholder="e.g., Small, Medium, Large"
                                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                    />
                                  </div>
                                </div>
                              </div>
                            )}

                            {item.action_type === 'open_url' && (
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Custom URL *</label>
                                <input
                                  type="url"
                                  value={item.action_params?.url || ''}
                                  onChange={(e) => handleSliderItemActionParamsChange(index, 'url', e.target.value)}
                                  placeholder="https://example.com"
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                  required
                                />
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  /* Regular Single Image Upload */
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Image URL</label>
                      <div className="flex gap-2">
                        <input
                          type="url"
                          name="image_url"
                          value={formData.image_url}
                          onChange={handleInputChange}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        />
                        <label className="px-3 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 cursor-pointer flex items-center gap-1">
                          <Upload className="h-4 w-4" />
                          Select File
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => e.target.files?.[0] && handleFileSelection(e.target.files[0], 'image')}
                            className="hidden"
                            disabled={uploading}
                          />
                        </label>
                      </div>
                      
                      {/* Show existing image or selected file preview */}
                      {(formData.image_url || selectedFiles.image) && (
                        <div className="mt-2 flex items-center gap-2">
                          <img
                            src={selectedFiles.image ? URL.createObjectURL(selectedFiles.image) : formData.image_url}
                            alt="Preview"
                            className="h-20 w-32 object-cover rounded border"
                          />
                          {selectedFiles.image && (
                            <button
                              type="button"
                              onClick={() => removeSelectedFile('image')}
                              className="px-2 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600"
                            >
                              Remove
                            </button>
                          )}
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Mobile Image URL</label>
                      <div className="flex gap-2">
                        <input
                          type="url"
                          name="mobile_image_url"
                          value={formData.mobile_image_url}
                          onChange={handleInputChange}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        />
                        <label className="px-3 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 cursor-pointer flex items-center gap-1">
                          <Smartphone className="h-4 w-4" />
                          Select File
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => e.target.files?.[0] && handleFileSelection(e.target.files[0], 'mobile_image')}
                            className="hidden"
                            disabled={uploading}
                          />
                        </label>
                      </div>
                      
                      {/* Show existing image or selected file preview */}
                      {(formData.mobile_image_url || selectedFiles.mobile_image) && (
                        <div className="mt-2 flex items-center gap-2">
                          <img
                            src={selectedFiles.mobile_image ? URL.createObjectURL(selectedFiles.mobile_image) : formData.mobile_image_url}
                            alt="Mobile Preview"
                            className="h-20 w-16 object-cover rounded border"
                          />
                          {selectedFiles.mobile_image && (
                            <button
                              type="button"
                              onClick={() => removeSelectedFile('mobile_image')}
                              className="px-2 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600"
                            >
                              Remove
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Video URL</label>
                  <input
                    type="url"
                    name="video_url"
                    value={formData.video_url}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Link URL</label>
                  <input
                    type="url"
                    name="link_url"
                    value={formData.link_url}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                  <p className="mt-1 text-xs text-gray-500">Leave empty if using Action Type below</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Button Text</label>
                  <input
                    type="text"
                    name="button_text"
                    value={formData.button_text}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                </div>

                {/* Action Type and Parameters */}
                <div className="space-y-4 border-t pt-4">
                  <h4 className="text-md font-medium text-gray-900">Banner Action</h4>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Action Type</label>
                    <select
                      value={formData.action_type || ''}
                      onChange={(e) => handleActionTypeChange(e.target.value as BannerActionType | '')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    >
                      <option value="">None (Use Link URL)</option>
                      <option value="open_category">Open Category</option>
                      <option value="open_product">Open Product</option>
                      <option value="open_brand">Open Brand</option>
                      <option value="open_flash_sale">Open Flash Sale</option>
                      <option value="open_filtered_products">Open Filtered Products</option>
                      <option value="open_url">Open Custom URL</option>
                    </select>
                  </div>

                  {/* Dynamic Fields Based on Action Type */}
                  {formData.action_type === 'open_category' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
                      <select
                        value={formData.action_params?.categoryId || ''}
                        onChange={(e) => handleActionParamsChange('categoryId', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        required
                      >
                        <option value="">Select a category</option>
                        {categories.map(category => (
                          <option key={category.id} value={category.id}>{category.name}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {formData.action_type === 'open_product' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Product *</label>
                      <select
                        value={formData.action_params?.productId || ''}
                        onChange={(e) => handleActionParamsChange('productId', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        required
                      >
                        <option value="">Select a product</option>
                        {products.map(product => (
                          <option key={product.id} value={product.id}>{product.name}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {formData.action_type === 'open_brand' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Brand *</label>
                      <select
                        value={formData.action_params?.brand || ''}
                        onChange={(e) => handleActionParamsChange('brand', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        required
                      >
                        <option value="">Select a brand</option>
                        {brands.map(brand => (
                          <option key={brand.id} value={brand.slug || brand.id}>{brand.name}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {formData.action_type === 'open_flash_sale' && (
                    <div className="space-y-2">
                      <p className="text-sm text-gray-600">Flash sale will open the flash sale products page</p>
                    </div>
                  )}

                  {formData.action_type === 'open_filtered_products' && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                          <select
                            value={formData.action_params?.categoryId || ''}
                            onChange={(e) => handleActionParamsChange('categoryId', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                          >
                            <option value="">Any category</option>
                            {categories.map(category => (
                              <option key={category.id} value={category.id}>{category.name}</option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Brand</label>
                          <select
                            value={formData.action_params?.brand || ''}
                            onChange={(e) => handleActionParamsChange('brand', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                          >
                            <option value="">Any brand</option>
                            {brands.map(brand => (
                              <option key={brand.id} value={brand.slug || brand.id}>{brand.name}</option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Vendor</label>
                          <select
                            value={formData.action_params?.vendorId || ''}
                            onChange={(e) => handleActionParamsChange('vendorId', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                          >
                            <option value="">Any vendor</option>
                            {vendors.map(vendor => (
                              <option key={vendor.id} value={vendor.id}>{vendor.business_name}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Min Price</label>
                          <input
                            type="number"
                            value={formData.action_params?.minPrice || ''}
                            onChange={(e) => handleActionParamsChange('minPrice', e.target.value)}
                            placeholder="0"
                            min="0"
                            step="0.01"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Max Price</label>
                          <input
                            type="number"
                            value={formData.action_params?.maxPrice || ''}
                            onChange={(e) => handleActionParamsChange('maxPrice', e.target.value)}
                            placeholder="1000"
                            min="0"
                            step="0.01"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Min Discount (%)</label>
                        <input
                          type="number"
                          value={formData.action_params?.discountMin || ''}
                          onChange={(e) => handleActionParamsChange('discountMin', e.target.value)}
                          placeholder="0"
                          min="0"
                          max="100"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        />
                      </div>

                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          checked={formData.action_params?.flashSale || false}
                          onChange={(e) => handleActionParamsChange('flashSale', e.target.checked)}
                          className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                        />
                        <label className="ml-2 block text-sm text-gray-900">Flash Sale Only</label>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Color</label>
                          <input
                            type="text"
                            value={formData.action_params?.color || ''}
                            onChange={(e) => handleActionParamsChange('color', e.target.value)}
                            placeholder="e.g., Red, Blue"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Size</label>
                          <input
                            type="text"
                            value={formData.action_params?.size || ''}
                            onChange={(e) => handleActionParamsChange('size', e.target.value)}
                            placeholder="e.g., Small, Medium, Large"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {formData.action_type === 'open_url' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Custom URL *</label>
                      <input
                        type="url"
                        value={formData.action_params?.url || ''}
                        onChange={(e) => handleActionParamsChange('url', e.target.value)}
                        placeholder="https://example.com"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        required
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Additional Settings */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h4 className="text-md font-medium text-gray-900">Display Settings</h4>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Display Order</label>
                  <input
                    type="number"
                    name="display_order"
                    value={formData.display_order}
                    onChange={handleInputChange}
                    min="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Background Color</label>
                  <input
                    type="color"
                    name="background_color"
                    value={formData.background_color}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Text Color</label>
                  <input
                    type="color"
                    name="text_color"
                    value={formData.text_color}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Target</label>
                  <select
                    name="target"
                    value={formData.target}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  >
                    <option value="_self">Same Window</option>
                    <option value="_blank">New Window</option>
                    <option value="_parent">Parent Window</option>
                    <option value="_top">Top Window</option>
                  </select>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-md font-medium text-gray-900">Schedule & Settings</h4>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                  <input
                    type="date"
                    name="start_date"
                    value={formData.start_date}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                  <input
                    type="date"
                    name="end_date"
                    value={formData.end_date}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Language Code</label>
                  <input
                    type="text"
                    name="language_code"
                    value={formData.language_code}
                    onChange={handleInputChange}
                    placeholder="en"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Store ID</label>
                  <input
                    type="text"
                    name="store_id"
                    value={formData.store_id}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    name="is_active"
                    checked={formData.is_active}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                  />
                  <label className="ml-2 block text-sm text-gray-900">Active</label>
                </div>
              </div>
            </div>

            {/* Categories */}
            <div className="space-y-4">
              <h4 className="text-md font-medium text-gray-900">Categories</h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {categories.map(category => (
                  <label key={category.id} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.categories.includes(category.id)}
                      onChange={(e) => handleCategoryChange(category.id, e.target.checked)}
                      className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-900">{category.name}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex justify-end space-x-3 pt-6 border-t">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={uploading}
                className="px-4 py-2 text-sm font-medium text-white bg-orange-600 rounded-lg hover:bg-orange-700 disabled:opacity-50"
              >
                {uploading ? 'Uploading...' : (media ? 'Update' : 'Create')} Promotional Media
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
