'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import { useCart } from '@/lib/cart-context';
import { ProductWithDetails } from '@/types/database';
import AddressForm from '@/components/profile/AddressForm';
import { 
  ArrowLeftIcon,
  CreditCardIcon,
  MapPinIcon,
  TruckIcon,
  CheckIcon,
  LoaderIcon
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

interface CartItem {
  id: string;
  product_id: string;
  variant_id?: string;
  quantity: number;
  product: ProductWithDetails;
}

interface Address {
  id: string;
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
  created_at?: string;
  updated_at?: string;
}

export default function CheckoutPage() {
  const { user } = useAuth();
  const { cartItems: contextCartItems, clearCart } = useCart();
  const router = useRouter();
  
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [addressProcessing, setAddressProcessing] = useState(false);
  const [step, setStep] = useState<'address' | 'payment' | 'confirmation'>('address');
  
  // Form states
  const [shippingAddress, setShippingAddress] = useState<Partial<Address>>({});
  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [orderNotes, setOrderNotes] = useState('');
  
  // Address selection states
  const [selectedShippingAddressId, setSelectedShippingAddressId] = useState<string>('');
  const [useNewShippingAddress, setUseNewShippingAddress] = useState(false);
  
  // AddressForm modal states
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [editingAddress, setEditingAddress] = useState<any>(null);

  useEffect(() => {
    if (user) {
      fetchCartItems();
      fetchAddresses();
    } else {
      router.push('/auth/signin');
    }
  }, [user, router]);

  // Calculate shipping when shipping address or cart items change
  useEffect(() => {
    if (shippingAddress.city && shippingAddress.country && cartItems.length > 0) {
      console.log('Address changed, recalculating shipping:', {
        city: shippingAddress.city,
        country: shippingAddress.country,
        productCount: cartItems.length
      });
      calculateShippingCost();
    } else if (shippingAddress.city && shippingAddress.country) {
      console.log('Address provided but no cart items:', {
        city: shippingAddress.city,
        country: shippingAddress.country,
        cartItems: cartItems.length
      });
    } else {
      console.log('Incomplete address information:', {
        city: shippingAddress.city,
        country: shippingAddress.country
      });
    }
  }, [shippingAddress.city, shippingAddress.country, cartItems]);

  const fetchCartItems = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('cart_items')
        .select(`
          *,
          product:products(
            *,
            category:categories(*),
            brand:brands(*),
            images:product_images(*),
            variants:product_variants(*)
          )
        `)
        .eq('user_id', user?.id);

      if (error) {
        console.error('Error fetching cart items:', error);
      } else {
        setCartItems(data || []);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAddresses = async () => {
    try {
      const { data, error } = await supabase
        .from('addresses')
        .select('*')
        .eq('user_id', user?.id)
        .order('is_default', { ascending: false });

      if (error) {
        console.error('Error fetching addresses:', error);
      } else {
        setAddresses(data || []);
        // Set default shipping address
        const defaultShipping = data?.find(addr => addr.type === 'shipping' && addr.is_default);
        
        if (defaultShipping) {
          setShippingAddress(defaultShipping);
          setSelectedShippingAddressId(defaultShipping.id);
        } else if (data && data.length > 0) {
          // If no default shipping address, select the first shipping address
          const firstShipping = data.find(addr => addr.type === 'shipping');
          if (firstShipping) {
            setShippingAddress(firstShipping);
            setSelectedShippingAddressId(firstShipping.id);
          }
        } else {
          // No addresses exist, set up for new address creation
          setUseNewShippingAddress(true);
          setSelectedShippingAddressId('new');
        }
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleShippingAddressSelect = async (addressId: string) => {
    setSelectedShippingAddressId(addressId);
    if (addressId === 'new') {
      setUseNewShippingAddress(true);
      setShippingAddress({});
      // Clear shipping costs when creating new address
      setShippingCost(0);
      setProductDeliveryCosts({});
      // Open the AddressForm modal
      handleAddNewAddress();
    } else {
      setUseNewShippingAddress(false);
      const selectedAddress = addresses.find(addr => addr.id === addressId);
      if (selectedAddress) {
        setShippingAddress(selectedAddress);
        // Calculate shipping for the selected address immediately
        console.log('Address selected, calculating shipping for:', {
          city: selectedAddress.city,
          country: selectedAddress.country
        });
        await calculateShippingCost();
      }
    }
  };

  const getShippingAddresses = () => {
    return addresses.filter(addr => addr.type === 'shipping');
  };

  const calculateSubtotal = () => {
    return cartItems.reduce((total, item) => {
      const price = item.product.sale_price || item.product.price;
      return total + (price * item.quantity);
    }, 0);
  };

  const calculateTax = () => {
    return calculateSubtotal() * 0.08; // 8% tax
  };

  const [shippingCost, setShippingCost] = useState(0);
  const [shippingLoading, setShippingLoading] = useState(false);
  const [productDeliveryCosts, setProductDeliveryCosts] = useState<{[key: string]: {name: string, cost: number, isFree: boolean, method?: string, estimatedDays?: number}}>({});

  const calculateShipping = () => {
    return shippingCost;
  };

  const calculateShippingCost = async () => {
    if (!cartItems.length || !shippingAddress.city || !shippingAddress.country) {
      console.log('Cannot calculate shipping - missing required data:', {
        cartItems: cartItems.length,
        city: shippingAddress.city,
        country: shippingAddress.country
      });
      setShippingCost(0);
      setProductDeliveryCosts({});
      return;
    }

    setShippingLoading(true);
    try {
      let totalShippingCost = 0;
      let hasValidShipping = false;
      const productCosts: {[key: string]: {name: string, cost: number, isFree: boolean, method?: string, estimatedDays?: number}} = {};

      console.log('🚚 Calculating shipping for:', {
        city: shippingAddress.city,
        country: shippingAddress.country,
        productCount: cartItems.length,
        products: cartItems.map(item => item.product.name)
      });

      // Calculate shipping for each product in cart using direct queries like single product page
      for (const cartItem of cartItems) {
        if (cartItem.product) {
          console.log(`Calculating delivery for product: ${cartItem.product.name} (${cartItem.product.id})`);
          
          try {
            // First check if delivery is allowed to this city (like single product page)
            const { data: deliveryZone, error: zoneError } = await supabase
              .from('product_delivery_zones')
              .select('is_allowed')
              .eq('product_id', cartItem.product.id)
              .eq('city', shippingAddress.city)
              .eq('country', shippingAddress.country)
              .eq('is_allowed', true)
              .single();

            if (zoneError || !deliveryZone) {
              console.log(`Delivery not allowed for ${cartItem.product.name} to ${shippingAddress.city}, ${shippingAddress.country}`);
              productCosts[cartItem.product.id] = {
                name: cartItem.product.name,
                cost: 0,
                isFree: true,
                method: 'Not Available',
                estimatedDays: 0
              };
              continue;
            }

            // Get delivery options using direct queries (like single product page)
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
              .eq('product_id', cartItem.product.id)
              .eq('delivery_rate.delivery_city', shippingAddress.city)
              .eq('delivery_rate.is_active', true);

            if (optionsError) {
              console.error('Error fetching delivery options for', cartItem.product.name, ':', optionsError);
              productCosts[cartItem.product.id] = {
                name: cartItem.product.name,
                cost: 0,
                isFree: true,
                method: 'Error',
                estimatedDays: 0
              };
              continue;
            }

            // Get pickup locations for the matching cities
            const pickupCities = [...new Set(options?.map(opt => opt.delivery_rate?.pickup_city).filter(Boolean) || [])];
            
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

            // Transform the data and find the cheapest option
            const transformedOptions = (options || [])
              .filter(opt => opt.delivery_rate)
              .map(opt => {
                const pickupLocation = pickupLocations.find(pl => pl.city === opt.delivery_rate?.pickup_city);
                return {
                  pickup_location_id: pickupLocation?.id || '',
                  pickup_location_name: pickupLocation?.name || 'Unknown Location',
                  pickup_city: opt.delivery_rate?.pickup_city || '',
                  delivery_method_id: opt.delivery_rate?.delivery_method?.id || '',
                  delivery_method_name: opt.delivery_rate?.delivery_method?.name || 'Unknown Method',
                  is_free_delivery: opt.is_free_delivery,
                  delivery_price: opt.delivery_rate?.price || 0,
                  estimated_min_days: opt.delivery_rate?.estimated_min_days || 0,
                  estimated_max_days: opt.delivery_rate?.estimated_max_days || 0
                };
              })
              .filter(opt => opt.pickup_location_id); // Only include options with valid pickup locations

            console.log(`Found ${transformedOptions.length} delivery options for ${cartItem.product.name}`);

            if (transformedOptions.length > 0) {
              // Find the cheapest option
              const cheapestOption = transformedOptions.reduce((cheapest, current) => {
                const currentPrice = current.is_free_delivery ? 0 : current.delivery_price;
                const cheapestPrice = cheapest.is_free_delivery ? 0 : cheapest.delivery_price;
                return currentPrice < cheapestPrice ? current : cheapest;
              });

              const deliveryCost = cheapestOption.is_free_delivery ? 0 : cheapestOption.delivery_price;
              
              productCosts[cartItem.product.id] = {
                name: cartItem.product.name,
                cost: deliveryCost,
                isFree: cheapestOption.is_free_delivery,
                method: cheapestOption.delivery_method_name,
                estimatedDays: cheapestOption.estimated_min_days
              };
              
              totalShippingCost += deliveryCost;
              hasValidShipping = true;
              
              console.log(`Selected delivery option for ${cartItem.product.name}:`, {
                method: cheapestOption.delivery_method_name,
                cost: deliveryCost,
                isFree: cheapestOption.is_free_delivery,
                estimatedDays: cheapestOption.estimated_min_days
              });
            } else {
              console.log(`No delivery options found for ${cartItem.product.name}`);
              productCosts[cartItem.product.id] = {
                name: cartItem.product.name,
                cost: 0,
                isFree: true,
                method: 'Not Available',
                estimatedDays: 0
              };
            }
          } catch (productError) {
            console.error(`Error calculating delivery for product ${cartItem.product.name}:`, productError);
            productCosts[cartItem.product.id] = {
              name: cartItem.product.name,
              cost: 0,
              isFree: true,
              method: 'Error',
              estimatedDays: 0
            };
          }
        }
      }

      // If no valid shipping options found, use default shipping
      if (!hasValidShipping) {
        console.log('No valid shipping options found, using default shipping');
        const defaultCost = calculateSubtotal() >= 50 ? 0 : 9.99;
        totalShippingCost = defaultCost;
        
        // Set default cost for all products
        cartItems.forEach(cartItem => {
          if (cartItem.product) {
            productCosts[cartItem.product.id] = {
              name: cartItem.product.name,
              cost: defaultCost / cartItems.length, // Distribute default cost
              isFree: defaultCost === 0,
              method: 'Default',
              estimatedDays: 3
            };
          }
        });
      }

      console.log('Final shipping calculation:', {
        totalCost: totalShippingCost,
        hasValidShipping,
        productCosts
      });

      setShippingCost(totalShippingCost);
      setProductDeliveryCosts(productCosts);
    } catch (error) {
      console.error('Error calculating shipping:', error);
      // Fallback to default shipping
      const defaultCost = calculateSubtotal() >= 50 ? 0 : 9.99;
      setShippingCost(defaultCost);
      
      // Set default cost for all products
      const productCosts: {[key: string]: {name: string, cost: number, isFree: boolean, method?: string, estimatedDays?: number}} = {};
      cartItems.forEach(cartItem => {
        if (cartItem.product) {
          productCosts[cartItem.product.id] = {
            name: cartItem.product.name,
            cost: defaultCost / cartItems.length,
            isFree: defaultCost === 0,
            method: 'Default',
            estimatedDays: 3
          };
        }
      });
      setProductDeliveryCosts(productCosts);
    } finally {
      setShippingLoading(false);
    }
  };

  const calculateTotal = () => {
    return calculateSubtotal() + calculateTax() + calculateShipping();
  };

  // AddressForm handlers
  const handleAddNewAddress = () => {
    setEditingAddress(null);
    setShowAddressForm(true);
  };

  const handleEditAddress = (address: Address) => {
    setEditingAddress(address);
    setShowAddressForm(true);
  };

  const handleAddressFormSuccess = async () => {
    await fetchAddresses(); // Refresh addresses list
    
    // If we were creating a new address, select the most recently created one
    if (useNewShippingAddress) {
      const updatedAddresses = await supabase
        .from('addresses')
        .select('*')
        .eq('user_id', user?.id)
        .eq('type', 'shipping')
        .order('created_at', { ascending: false })
        .limit(1);
      
      if (updatedAddresses.data && updatedAddresses.data.length > 0) {
        const newAddress = updatedAddresses.data[0];
        setSelectedShippingAddressId(newAddress.id);
        setShippingAddress(newAddress);
        setUseNewShippingAddress(false);
        
        // Calculate shipping for the new address
        if (newAddress.city && newAddress.country && cartItems.length > 0) {
          await calculateShippingCost();
        }
      }
    }
    
    setShowAddressForm(false);
    setEditingAddress(null);
  };

  const handleAddressFormClose = () => {
    setShowAddressForm(false);
    setEditingAddress(null);
  };

  const handleAddressSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddressProcessing(true);
    
    try {
      // Validate shipping address selection
      if (!selectedShippingAddressId) {
        alert('Please select a shipping address');
        setAddressProcessing(false);
        return;
      }

      // If a new address was created through the modal, it should now be in the addresses list
      // Find the selected address
      const selectedAddress = addresses.find(addr => addr.id === selectedShippingAddressId);
      
      if (!selectedAddress) {
        alert('Selected address not found. Please try again.');
        setAddressProcessing(false);
        return;
      }

      // Set the shipping address for order creation
      setShippingAddress(selectedAddress);
      setStep('payment');
    } catch (error) {
      console.error('Error:', error);
      alert('An error occurred. Please try again.');
    } finally {
      setAddressProcessing(false);
    }
  };

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProcessing(true);

    try {
      // Validate required data
      if (!user?.id) {
        alert('Please log in to place an order.');
        return;
      }

      if (cartItems.length === 0) {
        alert('Your cart is empty.');
        return;
      }

      if (!selectedShippingAddressId) {
        alert('Please select a shipping address.');
        return;
      }

      // Generate order number
      const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

      // Use shipping address for both billing and shipping
      let finalShippingAddressId = selectedShippingAddressId;

      // If creating a new address, we need to create it first
      if (finalShippingAddressId === 'new') {
        // Check if we have the address data
        if (!shippingAddress.first_name || !shippingAddress.last_name || !shippingAddress.address_line_1 || !shippingAddress.city || !shippingAddress.district || !shippingAddress.neighborhood || !shippingAddress.country) {
          alert('Please fill in all required address fields.');
          return;
        }

        console.log('Creating new shipping address...');
        const { data: newAddress, error: addressError } = await supabase
          .from('addresses')
          .insert({
            user_id: user.id,
            type: 'shipping',
            ...shippingAddress,
            is_default: true
          })
          .select()
          .single();

        if (addressError) {
          console.error('Error creating address:', addressError);
          alert(`Error creating address: ${addressError.message}`);
          return;
        }

        finalShippingAddressId = newAddress.id;
        console.log('Address created successfully:', finalShippingAddressId);
      }

      console.log('Creating order with:', {
        orderNumber,
        userId: user.id,
        totalAmount: calculateTotal(),
        shippingAddressId: finalShippingAddressId,
        cartItemsCount: cartItems.length
      });

      // Create order
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          order_number: orderNumber,
          user_id: user?.id,
          status: 'pending',
          total_amount: calculateTotal(),
          subtotal: calculateSubtotal(),
          tax_amount: calculateTax(),
          shipping_amount: calculateShipping(),
          discount_amount: 0,
          billing_address_id: finalShippingAddressId !== 'new' ? finalShippingAddressId : null,
          shipping_address_id: finalShippingAddressId !== 'new' ? finalShippingAddressId : null,
          notes: orderNotes
        })
        .select()
        .single();

      if (orderError) {
        console.error('Error creating order:', orderError);
        alert(`Error creating order: ${orderError.message}`);
        return;
      }

      console.log('Order created successfully:', order.id);

      // Create order items
      const orderItems = cartItems.map(item => ({
        order_id: order.id,
        product_id: item.product_id,
        variant_id: item.variant_id,
        product_name: item.product.name,
        product_sku: item.product.sku,
        quantity: item.quantity,
        unit_price: item.product.sale_price || item.product.price,
        total_price: (item.product.sale_price || item.product.price) * item.quantity
      }));

      console.log('Creating order items:', orderItems);

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) {
        console.error('Error creating order items:', itemsError);
        alert(`Error creating order items: ${itemsError.message}`);
        return;
      }

      console.log('Order items created successfully');

      // Create payment record for Cash on Delivery
      const paymentData = {
        order_id: order.id,
        amount: calculateTotal(),
        currency: 'USD',
        payment_method: 'cash_on_delivery',
        status: 'pending',
        transaction_id: `COD-${orderNumber}`,
        gateway_response: {
          method: 'cash_on_delivery',
          status: 'pending',
          message: 'Payment will be collected upon delivery'
        }
      };

      console.log('Creating payment record:', paymentData);

      const { error: paymentError } = await supabase
        .from('payments')
        .insert(paymentData);

      if (paymentError) {
        console.error('Error creating payment record:', paymentError);
        // Don't return here as the order was created successfully
        console.warn('Payment record creation failed, but order was created successfully');
      } else {
        console.log('Payment record created successfully');
      }

      // Create delivery record
      const deliveryData = {
        order_id: order.id,
        tracking_number: `TRK-${orderNumber}`,
        carrier: 'Standard Delivery',
        status: 'pending',
        estimated_delivery_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] // 7 days from now
      };

      console.log('Creating delivery record:', deliveryData);
      console.log('Order ID for delivery:', order.id);
      console.log('User ID:', user?.id);

      const { data: deliveryResult, error: deliveryError } = await supabase
        .from('deliveries')
        .insert(deliveryData)
        .select();

      if (deliveryError) {
        console.error('Error creating delivery record:', deliveryError);
        console.error('Delivery error details:', JSON.stringify(deliveryError, null, 2));
        // Don't return here as the order was created successfully
        console.warn('Delivery record creation failed, but order was created successfully');
      } else {
        console.log('Delivery record created successfully:', deliveryResult);
      }

      // Clear cart
      console.log('Clearing cart...');
      await clearCart();
      console.log('Cart cleared successfully');

      // Show success message
      alert(`Order placed successfully! Order number: ${orderNumber}`);
      
      // Redirect to confirmation
      setStep('confirmation');
      console.log('Order placement completed successfully!');
    } catch (error) {
      console.error('Error in handlePaymentSubmit:', error);
      alert(`An error occurred while placing your order: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Your cart is empty</h1>
          <Link href="/products" className="btn-primary">
            Continue Shopping
          </Link>
        </div>
      </div>
    );
  }

  if (step === 'confirmation') {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckIcon className="h-8 w-8 text-green-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Order Placed Successfully!</h1>
            <p className="text-gray-600 mb-4">
              Thank you for your order. Your order has been placed with Cash on Delivery payment.
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-8">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 font-bold text-sm">$</span>
                  </div>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-blue-800">Cash on Delivery</h3>
                  <p className="text-sm text-blue-700 mt-1">
                    You will pay when your order arrives. Please have the exact amount ready.
                  </p>
                </div>
              </div>
            </div>
            <div className="flex space-x-4 justify-center">
              <Link 
                href="/orders" 
                className="bg-primary-600 text-white px-6 py-3 rounded-md font-medium hover:bg-primary-700"
              >
                View Orders
              </Link>
              <Link 
                href="/products" 
                className="bg-gray-100 text-gray-700 px-6 py-3 rounded-md font-medium hover:bg-gray-200"
              >
                Continue Shopping
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Link 
            href="/cart" 
            className="inline-flex items-center text-gray-600 hover:text-primary-600 mb-4"
          >
            <ArrowLeftIcon className="h-5 w-5 mr-2" />
            Back to Cart
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Checkout</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {step === 'address' && (
              <form onSubmit={handleAddressSubmit} className="space-y-8">
                {/* Shipping Address */}
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                    <TruckIcon className="h-6 w-6 mr-2 text-primary-600" />
                    Shipping Address
                  </h2>
                  
                  {/* Address Selection */}
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Select Shipping Address</label>
                    <div className="space-y-2">
                      <select
                        value={selectedShippingAddressId}
                        onChange={(e) => handleShippingAddressSelect(e.target.value)}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                      >
                        <option value="">Choose an address...</option>
                        {getShippingAddresses().map((address) => (
                          <option key={address.id} value={address.id}>
                            {address.first_name} {address.last_name} - {address.address_line_1}, {address.city}, {address.district}
                          </option>
                        ))}
                        <option value="new">+ Add New Address</option>
                      </select>
                    </div>
                    
                    {/* Show selected address details */}
                    {selectedShippingAddressId && selectedShippingAddressId !== 'new' && !useNewShippingAddress && (
                      <div className="mt-3 p-3 bg-gray-50 rounded-md border">
                        <h4 className="text-sm font-medium text-gray-900 mb-1">Selected Address:</h4>
                        <p className="text-sm text-gray-600">
                          {shippingAddress.first_name} {shippingAddress.last_name}<br />
                          {shippingAddress.address_line_1}<br />
                          {shippingAddress.address_line_2 && <>{shippingAddress.address_line_2}<br /></>}
                          {shippingAddress.city}, {shippingAddress.district}, {shippingAddress.neighborhood}<br />
                          {shippingAddress.country}
                          {shippingAddress.phone && <><br />{shippingAddress.phone}</>}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Address Form - Show only if new address is selected or no addresses exist */}
                  {(useNewShippingAddress || getShippingAddresses().length === 0) && (
                    <div className="text-center py-8">
                      <button
                        type="button"
                        onClick={handleAddNewAddress}
                        className="bg-primary-600 text-white px-6 py-3 rounded-md font-medium hover:bg-primary-700 flex items-center justify-center mx-auto"
                      >
                        <MapPinIcon className="h-5 w-5 mr-2" />
                        Add New Address
                      </button>
                      <p className="text-sm text-gray-500 mt-2">
                        Click to open the address form
                      </p>
                    </div>
                  )}
                  
                  {/* Real-time Shipping Preview */}
                  {shippingAddress.city && shippingAddress.country && cartItems.length > 0 && (
                    <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
                      <h3 className="text-sm font-medium text-blue-900 mb-2 flex items-center">
                        <TruckIcon className="h-4 w-4 mr-2" />
                        Delivery Options for {shippingAddress.city}, {shippingAddress.country}
                      </h3>
                      <div className="text-sm text-blue-700">
                        {shippingLoading ? (
                          <div className="flex items-center">
                            <LoaderIcon className="animate-spin h-4 w-4 mr-2" />
                            <span>Calculating delivery options...</span>
                          </div>
                        ) : Object.keys(productDeliveryCosts).length > 0 ? (
                          <div className="mt-2">
                            <div className="grid grid-cols-1 gap-2">
                              {Object.values(productDeliveryCosts).map((product: any, index) => (
                                <div key={index} className="bg-white rounded-md p-3 border border-blue-100">
                                  <div className="flex justify-between items-start">
                                    <div className="flex-1 min-w-0">
                                      <div className="font-medium text-gray-900 truncate">{product.name}</div>
                                      {product.method && (
                                        <div className="text-xs text-gray-500 mt-1">
                                          {product.method}
                                          {product.estimatedDays && product.estimatedDays > 0 && (
                                            <span className="ml-2">
                                              • {product.estimatedDays} day{product.estimatedDays !== 1 ? 's' : ''}
                                            </span>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                    <div className="ml-3 flex-shrink-0">
                                      <span className={`font-medium ${
                                        product.isFree ? 'text-green-600' : 'text-gray-900'
                                      }`}>
                                        {product.isFree ? 'Free' : `$${product.cost.toFixed(2)}`}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                            <div className="mt-3 pt-3 border-t border-blue-200">
                              <div className="flex justify-between items-center">
                                <span className="font-medium text-blue-900">Total Delivery Cost:</span>
                                <span className="font-bold text-lg text-blue-900">
                                  {shippingCost === 0 ? 'Free' : `$${shippingCost.toFixed(2)}`}
                                </span>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="bg-orange-50 border border-orange-200 rounded-md p-3">
                            <div className="flex items-center">
                              <svg className="h-5 w-5 text-orange-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                              </svg>
                              <div>
                                <p className="font-medium text-orange-800">No delivery options found</p>
                                <p className="text-orange-700 text-xs mt-1">
                                  We don't currently deliver to {shippingAddress.city}, {shippingAddress.country}. 
                                  Please try a different address or contact support.
                                </p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={addressProcessing || !selectedShippingAddressId}
                  className="w-full bg-primary-600 text-white py-3 px-4 rounded-md font-medium hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {addressProcessing ? (
                    <>
                      <LoaderIcon className="animate-spin h-5 w-5 mr-2" />
                      Processing...
                    </>
                  ) : (
                    'Continue to Payment'
                  )}
                </button>
                
                {/* Help text for disabled button */}
                {!addressProcessing && !selectedShippingAddressId && (
                  <p className="text-sm text-gray-500 text-center mt-2">
                    Please select a shipping address to continue
                  </p>
                )}
              </form>
            )}

            {step === 'payment' && (
              <form onSubmit={handlePaymentSubmit} className="space-y-8">
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                    <CreditCardIcon className="h-6 w-6 mr-2 text-primary-600" />
                    Payment Information
                  </h2>

                  {/* Development Notice */}
                  <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-yellow-800">Development Mode</h3>
                        <p className="text-sm text-yellow-700 mt-1">
                          Currently in development. Orders will be placed with Cash on Delivery for testing purposes.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Payment Method</label>
                      <div className="space-y-2">
                        <label className="flex items-center p-3 border border-green-300 rounded-md cursor-pointer hover:bg-green-50 bg-green-50">
                          <input
                            type="radio"
                            name="paymentMethod"
                            value="cod"
                            checked={paymentMethod === 'cod'}
                            onChange={(e) => setPaymentMethod(e.target.value)}
                            className="mr-3"
                          />
                          <div className="flex items-center">
                            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-3">
                              <span className="text-green-600 font-bold text-sm">$</span>
                            </div>
                            <div>
                              <div className="font-medium text-gray-900">Cash on Delivery</div>
                              <div className="text-sm text-gray-500">Pay when your order arrives</div>
                            </div>
                          </div>
                        </label>
                        <label className="flex items-center p-3 border border-gray-300 rounded-md cursor-pointer hover:bg-gray-50 opacity-50">
                          <input
                            type="radio"
                            name="paymentMethod"
                            value="card"
                            checked={paymentMethod === 'card'}
                            onChange={(e) => setPaymentMethod(e.target.value)}
                            className="mr-3"
                            disabled
                          />
                          <CreditCardIcon className="h-5 w-5 mr-2 text-gray-400" />
                          <div>
                            <div className="font-medium text-gray-500">Credit/Debit Card</div>
                            <div className="text-sm text-gray-400">Coming soon</div>
                          </div>
                        </label>
                        <label className="flex items-center p-3 border border-gray-300 rounded-md cursor-pointer hover:bg-gray-50 opacity-50">
                          <input
                            type="radio"
                            name="paymentMethod"
                            value="paypal"
                            checked={paymentMethod === 'paypal'}
                            onChange={(e) => setPaymentMethod(e.target.value)}
                            className="mr-3"
                            disabled
                          />
                          <div>
                            <div className="font-medium text-gray-500">PayPal</div>
                            <div className="text-sm text-gray-400">Coming soon</div>
                          </div>
                        </label>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Order Notes (Optional)</label>
                      <textarea
                        value={orderNotes}
                        onChange={(e) => setOrderNotes(e.target.value)}
                        rows={3}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                        placeholder="Any special instructions for your order..."
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  {!selectedShippingAddressId && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
                      <p className="text-sm text-yellow-700">
                        Please select a shipping address to continue with your order.
                      </p>
                    </div>
                  )}
                  
                  <div className="flex space-x-4">
                    <button
                      type="button"
                      onClick={() => setStep('address')}
                      className="flex-1 bg-gray-100 text-gray-700 py-3 px-4 rounded-md font-medium hover:bg-gray-200"
                    >
                      Back to Address
                    </button>
                    <button
                      type="submit"
                      disabled={processing || !selectedShippingAddressId}
                      className="flex-1 bg-primary-600 text-white py-3 px-4 rounded-md font-medium hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                    >
                      {processing ? (
                        <>
                          <LoaderIcon className="animate-spin h-5 w-5 mr-2" />
                          Placing Order...
                        </>
                      ) : (
                        'Place Order'
                      )}
                    </button>
                  </div>
                </div>
              </form>
            )}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-6 sticky top-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Summary</h2>
              
              {/* Cart Items */}
              <div className="space-y-4 mb-6">
                {cartItems.map((item) => {
                  const primaryImage = item.product.images?.find(img => img.is_primary) || item.product.images?.[0];
                  const price = item.product.sale_price || item.product.price;
                  
                  return (
                    <div key={item.id} className="flex items-center space-x-3">
                      <div className="w-16 h-16 bg-gray-100 rounded-md overflow-hidden flex-shrink-0">
                        {primaryImage ? (
                          <Image
                            src={primaryImage.image_url}
                            alt={item.product.name}
                            width={64}
                            height={64}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <span className="text-gray-400 text-xs">No Image</span>
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-medium text-gray-900 truncate">{item.product.name}</h3>
                        <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                        <p className="text-sm font-medium text-gray-900">${(price * item.quantity).toFixed(2)}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Totals */}
              <div className="space-y-3 mb-6">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-medium">${calculateSubtotal().toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Tax</span>
                  <span className="font-medium">${calculateTax().toFixed(2)}</span>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Shipping</span>
                    <span className="font-medium">
                      {shippingLoading ? (
                        <span className="text-gray-500">Calculating...</span>
                      ) : (
                        calculateShipping() === 0 ? 'Free' : `$${calculateShipping().toFixed(2)}`
                      )}
                    </span>
                  </div>
                  
                  {/* Shipping status message */}
                  {!shippingLoading && shippingAddress.city && shippingAddress.country && (
                    <div className="text-xs text-gray-500 ml-4">
                      {Object.values(productDeliveryCosts).some((p: any) => p.method === 'Not Available') ? (
                        <div className="flex items-center text-orange-600">
                          <svg className="h-4 w-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                          Some products may not be available for delivery to this location
                        </div>
                      ) : Object.values(productDeliveryCosts).some((p: any) => p.method === 'Default') ? (
                        <div className="flex items-center text-blue-600">
                          <svg className="h-4 w-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                          </svg>
                          Using default shipping rates
                        </div>
                      ) : (
                        <div className="flex items-center text-green-600">
                          <svg className="h-4 w-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          Delivery options available for all products
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* Product delivery breakdown */}
                  {!shippingLoading && Object.keys(productDeliveryCosts).length > 0 && (
                    <div className="ml-4 space-y-2 text-sm">
                      {Object.values(productDeliveryCosts).map((product: any, index) => (
                        <div key={index} className="bg-gray-50 rounded-md p-3">
                          <div className="flex justify-between items-start">
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-gray-900 truncate">{product.name}</div>
                              {product.method && (
                                <div className="text-xs text-gray-500 mt-1">
                                  {product.method}
                                  {product.estimatedDays && product.estimatedDays > 0 && (
                                    <span className="ml-2">
                                      • {product.estimatedDays} day{product.estimatedDays !== 1 ? 's' : ''}
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                            <div className="ml-3 flex-shrink-0">
                              <span className={`font-medium ${
                                product.isFree ? 'text-green-600' : 'text-gray-900'
                              }`}>
                                {product.isFree ? 'Free' : `$${product.cost.toFixed(2)}`}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="border-t pt-3">
                  <div className="flex justify-between">
                    <span className="text-lg font-semibold text-gray-900">Total</span>
                    <span className="text-lg font-semibold text-gray-900">${calculateTotal().toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Address Summary */}
              {step === 'payment' && (
                <div className="border-t pt-4 space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-900 mb-2">Shipping to:</h3>
                    <p className="text-sm text-gray-600">
                      {shippingAddress.first_name} {shippingAddress.last_name}<br />
                      {shippingAddress.address_line_1}<br />
                      {shippingAddress.address_line_2 && <>{shippingAddress.address_line_2}<br /></>}
                      {shippingAddress.city}, {shippingAddress.district}, {shippingAddress.neighborhood}<br />
                      {shippingAddress.country}
                    </p>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-gray-900 mb-2">Payment Method:</h3>
                    <div className="flex items-center">
                      <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center mr-2">
                        <span className="text-green-600 font-bold text-xs">$</span>
                      </div>
                      <span className="text-sm text-gray-600">Cash on Delivery</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* AddressForm Modal */}
      {showAddressForm && (
        <AddressForm
          address={editingAddress}
          onClose={handleAddressFormClose}
          onSuccess={handleAddressFormSuccess}
        />
      )}
    </div>
  );
}
