# Promotional Media Management System

A complete promotional media management system for your e-commerce admin panel that allows you to manage banners, sliders, popups, videos, and custom promotional content.

## Features

### 🎯 Core Functionality
- **Create, Edit, Delete** promotional media items
- **Activate/Deactivate** media with toggle controls
- **Schedule promotions** with start and end dates
- **Position management** for different page locations
- **File upload** support for images and videos
- **Category linking** for targeted promotions

### 📱 Media Types Supported
- **Banner** - Static promotional banners
- **Slider** - Image carousels and sliders
- **Popup** - Modal and overlay promotions
- **Video** - Video promotional content
- **Custom** - Custom HTML/content blocks

### 🎨 Display Positions
- Homepage Top, Middle, Bottom
- Category Page
- Product Page
- Sidebar
- Footer
- Header
- Checkout Page
- Cart Page
- Popup overlays

### 🔧 Advanced Features
- **Search and Filter** by type, position, status, and date
- **Pagination** with customizable items per page
- **Sorting** by creation date and display order
- **Multi-language** support
- **Store-specific** promotions (multi-store support)
- **Category targeting** for relevant promotions
- **Color customization** for backgrounds and text
- **Link targeting** (same window, new window, etc.)

## Database Schema

### Tables Created

#### `promotional_media`
```sql
- id (UUID, Primary Key)
- title (TEXT, Required)
- subtitle (TEXT)
- description (TEXT)
- media_type (ENUM: slider, banner, popup, video, custom)
- image_url (TEXT)
- mobile_image_url (TEXT)
- video_url (TEXT)
- link_url (TEXT)
- button_text (TEXT)
- target (ENUM: _self, _blank, _parent, _top)
- banner_position (ENUM: homepage_top, category_page, etc.)
- display_order (INTEGER)
- background_color (TEXT, Default: #ffffff)
- text_color (TEXT, Default: #000000)
- is_active (BOOLEAN, Default: true)
- start_date (TIMESTAMP)
- end_date (TIMESTAMP)
- language_code (TEXT, Default: en)
- store_id (UUID, Optional)
- created_by (UUID, References profiles)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

#### `promotional_media_categories`
```sql
- id (UUID, Primary Key)
- promotional_media_id (UUID, References promotional_media)
- category_id (UUID, References categories)
- created_at (TIMESTAMP)
```

### Storage Bucket
- **Bucket Name**: `promotional-media`
- **Public Access**: Yes
- **File Size Limit**: 10MB
- **Allowed MIME Types**: image/jpeg, image/png, image/gif, image/webp, video/mp4, video/webm, video/ogg

### Database Functions

#### `get_active_promotional_media(position_param, language_param)`
Returns active promotional media for a specific position and language.

#### `get_promotional_media_by_category(category_id_param, position_param, language_param)`
Returns promotional media associated with a specific category.

## Installation & Setup

### 1. Run Database Migrations
```bash
# Apply the promotional media migrations
supabase db push
```

### 2. Verify Setup
```bash
# Run the test script
node scripts/test-promotional-media-system.js
```

### 3. Access Admin Panel
1. Start your development server: `npm run dev`
2. Navigate to `/admin/promotional-media`
3. Create your first promotional media item

## Usage Guide

### Creating Promotional Media

1. **Click "Add Promotional Media"** button
2. **Fill in Basic Information**:
   - Title (required)
   - Subtitle
   - Description
   - Media Type
   - Position

3. **Upload Media Files**:
   - Desktop image
   - Mobile image (optional)
   - Video URL (optional)

4. **Configure Display Settings**:
   - Display order
   - Background color
   - Text color
   - Link target

5. **Set Schedule**:
   - Start date (optional)
   - End date (optional)
   - Language code
   - Store ID (for multi-store)

6. **Link Categories** (optional):
   - Select relevant categories for targeted display

7. **Save** your promotional media

### Managing Promotional Media

- **Search**: Use the search bar to find media by title, subtitle, or description
- **Filter**: Filter by type, position, or status
- **Edit**: Click the edit icon to modify existing media
- **Toggle Active**: Use the toggle button to activate/deactivate media
- **Delete**: Click the delete icon to remove media (with confirmation)

### Status Indicators

- 🟢 **Active**: Currently displayed and within date range
- 🟡 **Scheduled**: Will be active in the future
- 🔴 **Expired**: Past end date
- ⚫ **Inactive**: Manually disabled

## API Integration

### Frontend Usage

To display promotional media on your frontend:

```typescript
// Get active promotional media for homepage top
const { data } = await supabase
  .rpc('get_active_promotional_media', {
    position_param: 'homepage_top',
    language_param: 'en'
  });

// Get promotional media for a specific category
const { data } = await supabase
  .rpc('get_promotional_media_by_category', {
    category_id_param: 'category-uuid',
    position_param: 'category_page',
    language_param: 'en'
  });
```

### React Component Example

```tsx
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function PromotionalBanner({ position = 'homepage_top' }) {
  const [media, setMedia] = useState([]);

  useEffect(() => {
    async function fetchPromotionalMedia() {
      const { data } = await supabase
        .rpc('get_active_promotional_media', {
          position_param: position,
          language_param: 'en'
        });
      setMedia(data || []);
    }

    fetchPromotionalMedia();
  }, [position]);

  return (
    <div className="promotional-banner">
      {media.map(item => (
        <div
          key={item.id}
          className="banner-item"
          style={{
            backgroundColor: item.background_color,
            color: item.text_color
          }}
        >
          {item.image_url && (
            <img src={item.image_url} alt={item.title} />
          )}
          <h3>{item.title}</h3>
          {item.subtitle && <p>{item.subtitle}</p>}
          {item.button_text && item.link_url && (
            <a href={item.link_url} target={item.target}>
              {item.button_text}
            </a>
          )}
        </div>
      ))}
    </div>
  );
}
```

## Security & Permissions

### Row Level Security (RLS)
- **Public Read Access**: Active promotional media is publicly readable
- **Admin Write Access**: Only admins and super_admins can create/edit/delete
- **Storage Policies**: Public read, admin write for file uploads

### User Roles Required
- **Admin**: Full access to promotional media management
- **Super Admin**: Full access plus system configuration

## Troubleshooting

### Common Issues

1. **Migration Errors**
   - Ensure Supabase CLI is installed and configured
   - Check database connection
   - Verify migration order

2. **File Upload Issues**
   - Check storage bucket permissions
   - Verify file size limits
   - Ensure correct MIME types

3. **Display Issues**
   - Check if media is active
   - Verify date ranges
   - Confirm position settings

### Debug Commands

```bash
# Check database tables
supabase db inspect

# Test storage bucket
supabase storage ls promotional-media

# Run test script
node scripts/test-promotional-media-system.js
```

## Future Enhancements

- **A/B Testing** for promotional media
- **Analytics Integration** for performance tracking
- **Template System** for common promotional layouts
- **Bulk Import/Export** functionality
- **Advanced Scheduling** with recurring promotions
- **Multi-language** content management
- **Responsive Design** previews

## Support

For issues or questions:
1. Check the troubleshooting section
2. Review the database migrations
3. Test with the provided test script
4. Check browser console for errors

---

**Built with**: Next.js, Supabase, TypeScript, Tailwind CSS
**Version**: 1.0.0
**Last Updated**: December 2024



