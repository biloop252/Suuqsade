# Delivery System Documentation

This document describes the comprehensive delivery system implemented for the e-commerce platform.

## Overview

The delivery system allows vendors to:
- Set up multiple pickup locations
- Configure delivery methods (Standard, Express, Cargo Company, etc.)
- Define delivery rates between cities
- Set delivery zones for products
- Enable free delivery options

## Database Schema

### Core Tables

#### 1. `pickup_locations`
Stores vendor pickup locations with address information.

```sql
CREATE TABLE pickup_locations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  vendor_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  country TEXT NOT NULL,
  city TEXT NOT NULL,
  address_line TEXT,
  contact_phone TEXT,
  contact_email TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### 2. `delivery_methods`
Available delivery methods (Standard, Express, etc.).

```sql
CREATE TABLE delivery_methods (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### 3. `delivery_rates`
Pricing and timing for delivery between cities using specific methods.

```sql
CREATE TABLE delivery_rates (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  pickup_city TEXT NOT NULL,
  delivery_city TEXT NOT NULL,
  delivery_method_id UUID REFERENCES delivery_methods(id) ON DELETE CASCADE,
  price DECIMAL(10,2) NOT NULL,
  estimated_min_days INTEGER NOT NULL,
  estimated_max_days INTEGER NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(pickup_city, delivery_city, delivery_method_id)
);
```

#### 4. `product_delivery_options`
Links products to pickup locations and delivery methods with free delivery flags.

```sql
CREATE TABLE product_delivery_options (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  pickup_location_id UUID REFERENCES pickup_locations(id) ON DELETE CASCADE,
  delivery_method_id UUID REFERENCES delivery_methods(id) ON DELETE CASCADE,
  is_free_delivery BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(product_id, pickup_location_id, delivery_method_id)
);
```

#### 5. `product_delivery_zones`
Defines which cities products can be delivered to.

```sql
CREATE TABLE product_delivery_zones (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  city TEXT NOT NULL,
  country TEXT NOT NULL,
  is_allowed BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(product_id, city, country)
);
```

## Database Functions

### 1. `get_product_delivery_options(product_uuid, delivery_city, delivery_country)`
Returns all available delivery options for a product to a specific city.

**Returns:**
- `pickup_location_id`: ID of the pickup location
- `pickup_location_name`: Name of the pickup location
- `pickup_city`: City where pickup occurs
- `delivery_method_id`: ID of the delivery method
- `delivery_method_name`: Name of the delivery method
- `is_free_delivery`: Whether this option has free delivery
- `delivery_price`: Cost for this delivery option
- `estimated_min_days`: Minimum estimated delivery days
- `estimated_max_days`: Maximum estimated delivery days

### 2. `can_deliver_to_city(product_uuid, delivery_city, delivery_country)`
Checks if a product can be delivered to a specific city.

**Returns:** `BOOLEAN`

### 3. `get_cheapest_delivery_option(product_uuid, delivery_city, delivery_country)`
Returns the cheapest delivery option for a product to a specific city.

### 4. `calculate_delivery_cost(product_uuid, pickup_location_uuid, delivery_method_uuid, delivery_city, delivery_country)`
Calculates delivery cost and time for a specific combination.

**Returns:**
- `is_available`: Whether the option is available
- `is_free_delivery`: Whether delivery is free
- `delivery_price`: Cost of delivery
- `estimated_min_days`: Minimum delivery days
- `estimated_max_days`: Maximum delivery days
- `error_message`: Error message if not available

### 5. `get_delivery_summary(product_uuid, delivery_city, delivery_country)`
Returns a summary of delivery options for checkout display.

**Returns:**
- `can_deliver`: Whether product can be delivered
- `has_free_delivery`: Whether free delivery is available
- `cheapest_price`: Lowest delivery price
- `fastest_days`: Fastest delivery time
- `total_options`: Number of delivery options
- `error_message`: Error message if not available

## React Components

### 1. `DeliveryOptionsManagement`
Admin component for managing delivery options for a product.

**Location:** `components/admin/DeliveryOptionsManagement.tsx`

**Features:**
- Manage product delivery options
- Configure delivery zones
- View delivery rates
- Add/remove pickup locations and delivery methods

### 2. `DeliveryCalculator`
Customer-facing component for calculating delivery options.

**Location:** `components/products/DeliveryCalculator.tsx`

**Features:**
- Calculate delivery options for a product
- Display delivery costs and times
- Handle free delivery options
- Show delivery restrictions

### 3. `ProductDeliverySection`
Product page component that integrates delivery options.

**Location:** `components/products/ProductDeliverySection.tsx`

**Features:**
- Address input for delivery calculation
- Integration with DeliveryCalculator
- Display selected delivery option
- Summary of delivery details

## Usage Examples

### 1. Setting up Delivery for a Product

```typescript
// In admin panel, after creating a product
<DeliveryOptionsManagement 
  productId={product.id} 
  productName={product.name}
/>
```

### 2. Calculating Delivery Options

```typescript
// In product page
<DeliveryCalculator
  productId={product.id}
  deliveryCity="New York"
  deliveryCountry="USA"
  onDeliveryOptionSelect={(option) => {
    console.log('Selected option:', option);
  }}
/>
```

### 3. Using Database Functions

```typescript
// Get delivery options
const { data: options } = await supabase
  .rpc('get_product_delivery_options', {
    product_uuid: productId,
    delivery_city: 'New York',
    delivery_country: 'USA'
  });

// Check if delivery is available
const { data: canDeliver } = await supabase
  .rpc('can_deliver_to_city', {
    product_uuid: productId,
    delivery_city: 'New York',
    delivery_country: 'USA'
  });
```

## Checkout Flow

1. **Customer selects address** - Customer enters delivery city and country
2. **System checks delivery zones** - Verify if product can be delivered to that city
3. **Calculate delivery options** - Get available pickup locations and delivery methods
4. **Apply free delivery** - Check if any options have free delivery enabled
5. **Lookup delivery rates** - Get pricing and timing for each option
6. **Display options** - Show customer all available delivery options with costs and times
7. **Customer selects option** - Customer chooses preferred delivery option
8. **Add to order** - Include delivery cost and details in order

## Admin Management

### Pickup Locations
- Add/edit pickup locations with address details
- Set contact information
- Enable/disable locations

### Delivery Methods
- Create delivery methods (Standard, Express, etc.)
- Add descriptions
- Enable/disable methods

### Delivery Rates
- Set pricing between cities
- Define delivery time ranges
- Configure rates per delivery method

### Product Delivery Options
- Link products to pickup locations
- Assign delivery methods
- Enable free delivery flags

### Delivery Zones
- Define which cities products can be delivered to
- Set restrictions for specific products

## Security

All tables have Row Level Security (RLS) policies:
- Public read access for active items
- Staff/admin write access for management
- Vendor access to their own pickup locations

## Performance

- Indexes on frequently queried columns
- Optimized database functions
- Efficient delivery option calculation
- Caching of delivery rates

## Future Enhancements

1. **Real-time tracking** - Integration with shipping providers
2. **Dynamic pricing** - Time-based or demand-based pricing
3. **Bulk delivery** - Support for multiple products in one delivery
4. **Delivery scheduling** - Allow customers to schedule delivery times
5. **International shipping** - Support for cross-border delivery
6. **Delivery insurance** - Optional insurance for valuable items
7. **Delivery notifications** - SMS/email updates for delivery status




