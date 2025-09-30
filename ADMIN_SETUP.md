# Admin Panel Setup Guide

## Quick Setup

### 1. Create Admin User

You have several options to create the admin user:

#### Option A: Using the Script (Recommended)
```bash
# Make sure you have the environment variables set
node scripts/create-admin-user.js
```

#### Option B: Manual Setup via Supabase Dashboard
1. Go to your Supabase Dashboard
2. Navigate to Authentication > Users
3. Click "Add user"
4. Set email: `admin@suuqsade.com`
5. Set password: `Admin123!`
6. Click "Create user"
7. Note the user ID that gets created
8. Run the SQL migration to create the profile:
```sql
-- Replace 'USER_ID_FROM_AUTH' with the actual user ID from step 7
UPDATE profiles 
SET id = 'USER_ID_FROM_AUTH' 
WHERE email = 'admin@suuqsade.com';
```

#### Option C: Using SQL Migration
Run the migration file:
```bash
# Apply the migration
supabase db push
```

Then manually create the auth user through the Supabase Dashboard as described in Option B.

### 2. Access the Admin Panel

1. Navigate to `/admin/login`
2. Use the credentials:
   - **Email**: `admin@suuqsade.com`
   - **Password**: `Admin123!`
3. You'll be redirected to the admin dashboard

### 3. Admin Panel Features

The admin panel includes:

- **Dashboard**: Overview with statistics and recent activity
- **Products**: Full CRUD for product management
- **Categories**: Hierarchical category management
- **Attributes**: Product attribute configuration
- **Variants**: Product variant management
- **Orders**: Order management and status updates
- **Users**: User management and role assignment
- **Analytics**: Analytics dashboard (placeholder)
- **Settings**: System settings (placeholder)

### 4. Security Features

- Role-based access control
- Protected routes with middleware
- Admin-only login page
- Automatic redirects for unauthorized users
- Secure session management

### 5. Admin Layout

The admin panel has its own layout that:
- Removes the main website's header and footer
- Includes a dedicated sidebar navigation
- Has a clean, professional design
- Is fully responsive
- Includes user profile and logout functionality

### 6. Environment Variables Required

Make sure these are set in your `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### 7. Troubleshooting

If you can't access the admin panel:

1. Check that the admin user was created successfully
2. Verify the user has the correct role (`super_admin`, `admin`, or `staff`)
3. Check the browser console for any errors
4. Ensure all environment variables are set correctly
5. Check that the Supabase connection is working

### 8. Customization

You can customize the admin panel by:
- Modifying the navigation items in `AdminLayout.tsx`
- Adding new pages in the `/app/admin/` directory
- Updating the dashboard statistics in `Dashboard.tsx`
- Customizing the styling with Tailwind CSS classes

## Support

If you encounter any issues, check the browser console and Supabase logs for error messages.







