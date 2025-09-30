'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import { toast } from 'react-hot-toast';
import { 
  PlusIcon, 
  EditIcon, 
  TrashIcon, 
  MapPinIcon, 
  HomeIcon,
  BuildingIcon,
  StarIcon
} from 'lucide-react';
import AddressForm from './AddressForm';

interface Address {
  id: string;
  user_id: string;
  type: 'billing' | 'shipping';
  first_name: string;
  last_name: string;
  company?: string;
  address_line_1: string;
  address_line_2?: string;
  city: string;
  district: string;
  neighborhood: string;
  country: string;
  country_id?: string;
  state_id?: string;
  city_id?: string;
  district_id?: string;
  neighborhood_id?: string;
  phone?: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export default function AddressList() {
  const { user, loading: authLoading } = useAuth();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);

  useEffect(() => {
    if (user) {
      fetchAddresses();
    }
  }, [user]);

  const fetchAddresses = async () => {
    if (!user) return;

    try {

      const { data, error } = await supabase
        .from('addresses')
        .select('*')
        .eq('user_id', user.id)
        .order('is_default', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAddresses(data || []);
    } catch (error: any) {
      console.error('Error fetching addresses:', error);
      toast.error('Failed to load addresses');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (addressId: string) => {
    if (!confirm('Are you sure you want to delete this address?')) return;

    try {
      const { error } = await supabase
        .from('addresses')
        .delete()
        .eq('id', addressId);

      if (error) throw error;
      
      toast.success('Address deleted successfully');
      fetchAddresses();
    } catch (error: any) {
      console.error('Error deleting address:', error);
      toast.error('Failed to delete address');
    }
  };

  const handleSetDefault = async (addressId: string) => {
    if (!user) return;

    try {
      // First, remove default from all addresses
      await supabase
        .from('addresses')
        .update({ is_default: false })
        .eq('user_id', user.id);

      // Then set the selected address as default
      const { error } = await supabase
        .from('addresses')
        .update({ is_default: true })
        .eq('id', addressId);

      if (error) throw error;
      
      toast.success('Default address updated');
      fetchAddresses();
    } catch (error: any) {
      console.error('Error setting default address:', error);
      toast.error('Failed to update default address');
    }
  };

  const openEditForm = (address: Address) => {
    setEditingAddress(address);
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingAddress(null);
  };

  const handleFormSuccess = () => {
    fetchAddresses();
  };

  if (authLoading || !user) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="animate-pulse">
            <div className="bg-gray-200 h-32 rounded-lg"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium text-gray-900">My Addresses</h3>
          <p className="text-sm text-gray-600 mt-1">
            Manage your shipping and billing addresses
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
        >
          <PlusIcon className="h-4 w-4 mr-2" />
          Add New Address
        </button>
      </div>

      {addresses.length === 0 ? (
        <div className="text-center py-12">
          <MapPinIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No addresses yet</h3>
          <p className="text-gray-600 mb-4">Add your first address to get started</p>
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            Add Address
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {addresses.map((address) => (
            <div
              key={address.id}
              className={`relative bg-white border rounded-lg p-6 ${
                address.is_default ? 'border-primary-500 bg-primary-50' : 'border-gray-200'
              }`}
            >
              {address.is_default && (
                <div className="absolute top-4 right-4">
                  <StarIcon className="h-5 w-5 text-primary-500 fill-current" />
                </div>
              )}

              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center">
                  {address.type === 'shipping' ? (
                    <HomeIcon className="h-5 w-5 text-gray-400 mr-2" />
                  ) : (
                    <BuildingIcon className="h-5 w-5 text-gray-400 mr-2" />
                  )}
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 capitalize">
                      {address.type} Address
                    </h4>
                    {address.is_default && (
                      <span className="text-xs text-primary-600 font-medium">Default</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-1 text-sm text-gray-600">
                <p className="font-medium text-gray-900">
                  {address.first_name} {address.last_name}
                </p>
                {address.company && (
                  <p>{address.company}</p>
                )}
                <p>{address.address_line_1}</p>
                {address.address_line_2 && (
                  <p>{address.address_line_2}</p>
                )}
                <p>
                  {address.city}, {address.district} {address.neighborhood}
                </p>
                <p>{address.country}</p>
                {address.phone && (
                  <p>{address.phone}</p>
                )}
              </div>

              <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
                <div className="flex space-x-2">
                  <button
                    onClick={() => openEditForm(address)}
                    className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                  >
                    <EditIcon className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(address.id)}
                    className="text-red-600 hover:text-red-700 text-sm font-medium"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
                
                {!address.is_default && (
                  <button
                    onClick={() => handleSetDefault(address.id)}
                    className="text-xs text-gray-600 hover:text-gray-900 font-medium"
                  >
                    Set as default
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <AddressForm
          address={editingAddress}
          onClose={closeForm}
          onSuccess={handleFormSuccess}
        />
      )}
    </div>
  );
}
