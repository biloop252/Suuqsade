'use client';

import { useState, useEffect } from 'react';
import { 
  Settings as SettingsIcon,
  Upload,
  Image as ImageIcon,
  Save,
  X,
  Eye,
  EyeOff,
  Trash2,
  Edit,
  Check,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { SystemSetting, SystemImage, SettingType, SystemImageType } from '@/types/database';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface SettingsManagementProps {
  onClose?: () => void;
}

export default function SettingsManagement({ onClose }: SettingsManagementProps) {
  const [activeTab, setActiveTab] = useState<'settings' | 'images'>('settings');
  const [settings, setSettings] = useState<SystemSetting[]>([]);
  const [images, setImages] = useState<SystemImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [savingImages, setSavingImages] = useState(false);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [selectedFiles, setSelectedFiles] = useState<Record<string, File>>({});
  const [imagePreview, setImagePreview] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  const settingsCategories = [
    { id: 'general', name: 'General', icon: SettingsIcon },
    { id: 'localization', name: 'Localization', icon: SettingsIcon },
    { id: 'contact', name: 'Contact', icon: SettingsIcon },
    { id: 'social', name: 'Social Media', icon: SettingsIcon },
    { id: 'legal', name: 'Legal', icon: SettingsIcon },
    { id: 'seo', name: 'SEO', icon: SettingsIcon },
    { id: 'analytics', name: 'Analytics', icon: SettingsIcon },
    { id: 'security', name: 'Security', icon: SettingsIcon },
    { id: 'email', name: 'Email', icon: SettingsIcon },
    { id: 'payment', name: 'Payment', icon: SettingsIcon },
    { id: 'system', name: 'System', icon: SettingsIcon }
  ];

  const imageTypes: { value: SystemImageType; label: string; description: string }[] = [
    { value: 'logo', label: 'Logo', description: 'Main application logo' },
    { value: 'favicon', label: 'Favicon', description: 'Browser tab icon' },
    { value: 'icon', label: 'Icon', description: 'Application icon' },
    { value: 'banner', label: 'Banner', description: 'Header banner image' },
    { value: 'background', label: 'Background', description: 'Background image' }
  ];

  useEffect(() => {
    fetchSettings();
    fetchImages();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/admin/settings');
      const data = await response.json();
      if (data.settings) {
        setSettings(data.settings);
        // Initialize form data
        const initialFormData: Record<string, any> = {};
        data.settings.forEach((setting: SystemSetting) => {
          initialFormData[setting.setting_key] = setting.setting_value;
        });
        setFormData(initialFormData);
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchImages = async () => {
    try {
      const response = await fetch('/api/admin/settings/images');
      const data = await response.json();
      if (data.images) {
        setImages(data.images);
      }
    } catch (error) {
      console.error('Error fetching images:', error);
    }
  };

  const handleSettingChange = (key: string, value: any) => {
    setFormData(prev => ({ ...prev, [key]: value }));
    // Clear error for this field
    if (errors[key]) {
      setErrors(prev => ({ ...prev, [key]: '' }));
    }
  };

  const handleFileChange = (imageType: SystemImageType, file: File) => {
    if (file) {
      setSelectedFiles(prev => ({ ...prev, [imageType]: file }));
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(prev => ({ ...prev, [imageType]: e.target?.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const saveSettings = async () => {
    setSaving(true);
    setErrors({});

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        alert('You must be logged in to save settings');
        return;
      }

      const settingsToUpdate = Object.entries(formData).map(([key, value]) => {
        const setting = settings.find(s => s.setting_key === key);
        return {
          setting_key: key,
          setting_value: String(value),
          setting_type: setting?.setting_type || 'text',
          category: setting?.category || 'general',
          description: setting?.description,
          is_public: setting?.is_public || false
        };
      });

      const response = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ settings: settingsToUpdate }),
      });

      const data = await response.json();

      if (data.success) {
        await fetchSettings(); // Refresh settings
        alert('Settings saved successfully!');
      } else {
        console.error('Error saving settings:', data.errors);
        // Handle individual field errors
        const fieldErrors: Record<string, string> = {};
        data.errors?.forEach((error: any) => {
          fieldErrors[error.setting_key] = error.error;
        });
        setErrors(fieldErrors);
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const uploadImage = async (imageType: SystemImageType, file: File) => {
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('image_type', imageType);
      formData.append('alt_text', `${imageType} image`);
      formData.append('is_active', 'true');

      console.log('Uploading image:', {
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        imageType
      });

      const response = await fetch('/api/admin/settings/images', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      console.log('Upload response:', data);

      if (data.image) {
        await fetchImages(); // Refresh images
        // Clear the selected file and preview
        setSelectedFiles(prev => {
          const newFiles = { ...prev };
          delete newFiles[imageType];
          return newFiles;
        });
        setImagePreview(prev => {
          const newPreview = { ...prev };
          delete newPreview[imageType];
          return newPreview;
        });
        alert(`${imageType} uploaded successfully!`);
      } else {
        console.error('Upload failed:', data);
        alert(`Failed to upload ${imageType}: ${data.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      alert(`Failed to upload image: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setUploading(false);
    }
  };

  const saveSelectedImages = async () => {
    const entries = Object.entries(selectedFiles) as [SystemImageType, File][];
    if (entries.length === 0) return;
    setSavingImages(true);
    try {
      const failed: string[] = [];
      for (const [imageType, file] of entries) {
        try {
          const formData = new FormData();
          formData.append('file', file);
          formData.append('image_type', imageType);
          formData.append('alt_text', `${imageType} image`);
          formData.append('is_active', 'true');
          const response = await fetch('/api/admin/settings/images', {
            method: 'POST',
            body: formData,
          });
          if (!response.ok) {
            failed.push(imageType);
          }
        } catch (_) {
          failed.push(imageType);
        }
      }
      await fetchImages();
      // Clear all selections and previews
      setSelectedFiles({});
      setImagePreview({});
      if (failed.length > 0) {
        alert(`Some images failed to upload: ${failed.join(', ')}`);
      } else {
        alert('Images saved successfully!');
      }
    } finally {
      setSavingImages(false);
    }
  };

  const deleteImage = async (imageId: string) => {
    if (!confirm('Are you sure you want to delete this image?')) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        alert('You must be logged in to delete images');
        return;
      }

      const response = await fetch(`/api/admin/settings/images?id=${imageId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      if (response.ok) {
        await fetchImages(); // Refresh images
        alert('Image deleted successfully!');
      } else {
        const data = await response.json();
        alert(`Failed to delete image: ${data.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error deleting image:', error);
      alert('Failed to delete image');
    }
  };

  const toggleImageActive = async (imageId: string, isActive: boolean) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        alert('You must be logged in to update images');
        return;
      }

      const response = await fetch('/api/admin/settings/images', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ id: imageId, is_active: !isActive }),
      });

      if (response.ok) {
        await fetchImages(); // Refresh images
      } else {
        const data = await response.json();
        alert(`Failed to update image status: ${data.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error updating image:', error);
      alert('Failed to update image status');
    }
  };

  const renderSettingField = (setting: SystemSetting) => {
    const value = formData[setting.setting_key] || setting.setting_value || '';
    const error = errors[setting.setting_key];

    switch (setting.setting_type) {
      case 'boolean':
        return (
          <div className="flex items-center space-x-3">
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={value === 'true' || value === true}
                onChange={(e) => handleSettingChange(setting.setting_key, e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-600"></div>
            </label>
            <span className="text-sm text-gray-600">
              {value === 'true' || value === true ? 'Enabled' : 'Disabled'}
            </span>
          </div>
        );

      case 'number':
        return (
          <input
            type="number"
            value={value}
            onChange={(e) => handleSettingChange(setting.setting_key, e.target.value)}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-orange-500 focus:border-orange-500 ${
              error ? 'border-red-500' : 'border-gray-300'
            }`}
          />
        );

      case 'email':
        return (
          <input
            type="email"
            value={value}
            onChange={(e) => handleSettingChange(setting.setting_key, e.target.value)}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-orange-500 focus:border-orange-500 ${
              error ? 'border-red-500' : 'border-gray-300'
            }`}
          />
        );

      case 'url':
        return (
          <input
            type="url"
            value={value}
            onChange={(e) => handleSettingChange(setting.setting_key, e.target.value)}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-orange-500 focus:border-orange-500 ${
              error ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="https://example.com"
          />
        );

      case 'json':
        return (
          <textarea
            value={value}
            onChange={(e) => handleSettingChange(setting.setting_key, e.target.value)}
            rows={3}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-orange-500 focus:border-orange-500 ${
              error ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="JSON format"
          />
        );

      default:
        return (
          <input
            type="text"
            value={value}
            onChange={(e) => handleSettingChange(setting.setting_key, e.target.value)}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-orange-500 focus:border-orange-500 ${
              error ? 'border-red-500' : 'border-gray-300'
            }`}
          />
        );
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-orange-600" />
        <span className="ml-2 text-gray-600">Loading settings...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">System Settings</h1>
          <p className="text-gray-600 mt-1">Manage your application settings and branding</p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-md"
          >
            <X className="h-6 w-6" />
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('settings')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'settings'
                ? 'border-orange-500 text-orange-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <SettingsIcon className="h-4 w-4 inline mr-2" />
            Settings
          </button>
          <button
            onClick={() => setActiveTab('images')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'images'
                ? 'border-orange-500 text-orange-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <ImageIcon className="h-4 w-4 inline mr-2" />
            Images & Branding
          </button>
        </nav>
      </div>

      {/* Settings Tab */}
      {activeTab === 'settings' && (
        <div className="space-y-6">
          {settingsCategories.map((category) => {
            const categorySettings = settings.filter(s => s.category === category.id);
            if (categorySettings.length === 0) return null;

            return (
              <div key={category.id} className="bg-white shadow rounded-lg">
                <div className="px-4 py-3 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                    <category.icon className="h-5 w-5 mr-2 text-orange-600" />
                    {category.name}
                  </h3>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {categorySettings.map((setting) => (
                      <div key={setting.setting_key} className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">
                          {setting.setting_key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          {setting.is_public && (
                            <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                              Public
                            </span>
                          )}
                        </label>
                        {setting.description && (
                          <p className="text-xs text-gray-500">{setting.description}</p>
                        )}
                        {renderSettingField(setting)}
                        {errors[setting.setting_key] && (
                          <p className="text-xs text-red-600 flex items-center">
                            <AlertCircle className="h-3 w-3 mr-1" />
                            {errors[setting.setting_key]}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}

          {/* Save Button */}
          <div className="flex justify-end">
            <button
              onClick={saveSettings}
              disabled={saving}
              className="px-6 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              {saving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </div>
      )}

      {/* Images Tab */}
      {activeTab === 'images' && (
        <div className="space-y-6">
          {imageTypes.map((imageType) => {
            const existingImages = images.filter(img => img.image_type === imageType.value);
            const selectedFile = selectedFiles[imageType.value];
            const preview = imagePreview[imageType.value];

            return (
              <div key={imageType.value} className="bg-white shadow rounded-lg">
                <div className="px-4 py-3 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900">{imageType.label}</h3>
                  <p className="text-sm text-gray-600">{imageType.description}</p>
                </div>
                <div className="p-6">
                  <div className="space-y-4">
                    {/* Upload Section */}
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                      <div className="text-center">
                        <Upload className="mx-auto h-12 w-12 text-gray-400" />
                        <div className="mt-4">
                          <label htmlFor={`file-${imageType.value}`} className="cursor-pointer">
                            <span className="mt-2 block text-sm font-medium text-gray-900">
                              Upload {imageType.label}
                            </span>
                            <span className="mt-1 block text-sm text-gray-500">
                              PNG, JPG, GIF, WebP, SVG up to 5MB
                            </span>
                          </label>
                          <input
                            id={`file-${imageType.value}`}
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                handleFileChange(imageType.value, file);
                              }
                            }}
                            className="hidden"
                          />
                        </div>
                      </div>

                      {/* Preview */}
                      {preview && (
                        <div className="mt-4">
                          <img
                            src={preview}
                            alt="Preview"
                            className="mx-auto h-32 w-32 object-contain rounded-lg border"
                          />
                          <div className="mt-4 flex justify-center space-x-2">
                            <button
                              onClick={() => {
                                setSelectedFiles(prev => {
                                  const newFiles = { ...prev };
                                  delete newFiles[imageType.value];
                                  return newFiles;
                                });
                                setImagePreview(prev => {
                                  const newPreview = { ...prev };
                                  delete newPreview[imageType.value];
                                  return newPreview;
                                });
                              }}
                              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 flex items-center"
                            >
                              <X className="h-4 w-4 mr-2" />
                              Cancel
                            </button>
                          </div>
                          <p className="mt-2 text-xs text-gray-500 text-center">This image will be uploaded when you click Save Images below.</p>
                        </div>
                      )}
                    </div>

                    {/* Existing Images */}
                    {existingImages.length > 0 && (
                      <div className="space-y-3">
                        <h4 className="text-sm font-medium text-gray-900">Current {imageType.label}s</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {existingImages.map((image) => (
                            <div key={image.id} className="border rounded-lg p-4">
                              <div className="aspect-square mb-3">
                                <img
                                  src={image.image_url}
                                  alt={image.alt_text || imageType.label}
                                  className="w-full h-full object-contain rounded-lg"
                                />
                              </div>
                              <div className="space-y-2">
                                <p className="text-xs text-gray-500">
                                  {image.file_size && `${Math.round(image.file_size / 1024)}KB`}
                                  {image.width && image.height && ` • ${image.width}×${image.height}`}
                                </p>
                                <div className="flex items-center justify-between">
                                  <button
                                    onClick={() => toggleImageActive(image.id, image.is_active)}
                                    className={`flex items-center text-xs ${
                                      image.is_active ? 'text-green-600' : 'text-gray-400'
                                    }`}
                                  >
                                    {image.is_active ? (
                                      <Eye className="h-3 w-3 mr-1" />
                                    ) : (
                                      <EyeOff className="h-3 w-3 mr-1" />
                                    )}
                                    {image.is_active ? 'Active' : 'Inactive'}
                                  </button>
                                  <button
                                    onClick={() => deleteImage(image.id)}
                                    className="text-red-600 hover:text-red-800"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
          {/* Save Images Button */}
          <div className="flex justify-end">
            <button
              onClick={saveSelectedImages}
              disabled={savingImages || Object.keys(selectedFiles).length === 0}
              className="px-6 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {savingImages ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              {savingImages ? 'Saving...' : 'Save Images'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}


