# Products API Documentation

## Overview
The Products API (`/api/customers/products`) provides paginated access to products with filtering, sorting, and search capabilities.

## Endpoint
```
GET /api/customers/products
```

## Query Parameters

### Pagination Parameters
- **`page`** (optional, default: `1`): Page number (minimum: 1)
- **`page_size`** (optional, default: `20`): Number of items per page (minimum: 1, maximum: `1000`)
- **`all`** (optional, default: `false`): Set to `true` to fetch all products without pagination

### Filter Parameters
- **`q`** (optional): Search query - searches in product name and short_description
- **`category`** (optional): Filter by category ID
- **`brand`** (optional): Filter by brand ID
- **`vendor`** (optional): Filter by vendor ID
- **`min_price`** (optional): Minimum price filter
- **`max_price`** (optional): Maximum price filter

### Sort Parameters
- **`sort`** (optional, default: `newest`): Sort option
  - `newest`: Sort by creation date (newest first)
  - `price_asc`: Sort by price (lowest first)
  - `price_desc`: Sort by price (highest first)

## Response Format

```json
{
  "items": [
    {
      "id": "product-id",
      "name": "Product Name",
      "price": 99.99,
      "category": { ... },
      "brand": { ... },
      "vendor": { ... },
      "images": [ ... ],
      "variants": [ ... ],
      "reviews": [ ... ]
    }
  ],
  "pagination": {
    "page": 1,
    "page_size": 20,
    "total": 150,
    "total_pages": 8
  }
}
```

## Usage Examples

### 1. Get First 20 Products (Default)
```javascript
fetch('/api/customers/products')
```

### 2. Get Specific Page
```javascript
fetch('/api/customers/products?page=2')
```

### 3. Increase Page Size
```javascript
// Get 50 products per page
fetch('/api/customers/products?page_size=50')

// Get 100 products per page
fetch('/api/customers/products?page_size=100')
```

### 4. Fetch All Products (No Pagination)
```javascript
fetch('/api/customers/products?all=true')
```
⚠️ **Warning**: Use this carefully as it may return a large dataset and impact performance.

### 5. Search Products
```javascript
fetch('/api/customers/products?q=laptop')
```

### 6. Filter by Category
```javascript
fetch('/api/customers/products?category=category-id-123')
```

### 7. Filter by Brand
```javascript
fetch('/api/customers/products?brand=brand-id-456')
```

### 8. Filter by Price Range
```javascript
fetch('/api/customers/products?min_price=50&max_price=200')
```

### 9. Sort by Price (Low to High)
```javascript
fetch('/api/customers/products?sort=price_asc')
```

### 10. Combined Filters with Pagination
```javascript
fetch('/api/customers/products?category=cat-123&brand=brand-456&min_price=100&max_price=500&sort=price_asc&page=2&page_size=50')
```

## Pagination Strategy

### Option 1: Use Higher Page Size
If you need more products per request, increase the `page_size` parameter:
```javascript
// Get 100 products at once
const response = await fetch('/api/customers/products?page_size=100')
const { items, pagination } = await response.json()
```

### Option 2: Fetch All Products
If you need all products at once:
```javascript
const response = await fetch('/api/customers/products?all=true')
const { items, pagination } = await response.json()
// items will contain all products
```

### Option 3: Paginate Through All Pages
Fetch all products by iterating through pages:
```javascript
async function fetchAllProducts() {
  let allProducts = []
  let page = 1
  let hasMore = true
  
  while (hasMore) {
    const response = await fetch(`/api/customers/products?page=${page}&page_size=100`)
    const { items, pagination } = await response.json()
    
    allProducts = [...allProducts, ...items]
    
    hasMore = page < pagination.total_pages
    page++
  }
  
  return allProducts
}
```

## Changes Made

### Before
- Default page size: 20
- Maximum page size: 50
- No option to fetch all products

### After
- Default page size: 20 (unchanged)
- Maximum page size: **1000** (increased from 50)
- New `all=true` parameter to fetch all products without pagination

## Performance Considerations

1. **Default Behavior**: The API defaults to 20 items per page for optimal performance
2. **Large Page Sizes**: Using `page_size=1000` or `all=true` may impact response time and memory usage
3. **Recommended Approach**: Use pagination with reasonable page sizes (50-100) for better performance
4. **Fetch All**: Only use `all=true` when absolutely necessary, as it loads all products into memory

## Error Handling

The API returns errors in the following format:
```json
{
  "error": "Error message here"
}
```

Common HTTP status codes:
- `200`: Success
- `500`: Server error






