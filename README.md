# Suuqsade Marketplace

A modern, full-featured e-commerce marketplace built with Next.js, TypeScript, Tailwind CSS, and Supabase.

## Features

### Customer Features
- **User Authentication**: Secure sign-up/sign-in with Supabase Auth
- **Product Browsing**: Browse products by category, brand, and search
- **Shopping Cart**: Add/remove items, manage quantities
- **Order Management**: Place orders, track delivery status
- **Returns & Refunds**: Initiate returns and generate return labels
- **Reviews & Ratings**: Leave product reviews and ratings
- **Wishlist**: Save favorite products for later

### Staff & Admin Features
- **Role-Based Access Control**: Customer, Staff, Admin, Super Admin roles
- **Product Management**: Create, edit, and manage product catalog
- **Order Management**: Process orders, update status, manage deliveries
- **Customer Management**: View and manage customer accounts
- **Inventory Management**: Track stock levels and set alerts
- **Analytics Dashboard**: Sales reports and business insights
- **Returns Processing**: Approve/reject returns and process refunds

## Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript
- **Styling**: Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Auth, Storage)
- **State Management**: React Context + Zustand
- **Forms**: React Hook Form + Zod validation
- **Icons**: Lucide React
- **UI Components**: Headless UI

## Database Schema

The application includes a comprehensive database schema with the following main tables:

- **profiles**: User profiles and authentication
- **products**: Product catalog with variants and images
- **categories**: Product categorization
- **brands**: Product brands
- **orders**: Customer orders and order items
- **cart_items**: Shopping cart functionality
- **payments**: Payment processing and tracking
- **deliveries**: Shipping and delivery management
- **returns**: Return processing and refunds
- **reviews**: Product reviews and ratings
- **addresses**: Customer billing and shipping addresses

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Supabase account

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd suuqsade-marketplace
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up Supabase**
   - Create a new Supabase project
   - Get your project URL and anon key
   - Copy `env.example` to `.env.local` and fill in your Supabase credentials

4. **Set up the database**
   - Run the SQL migration in `supabase/migrations/001_initial_schema.sql` in your Supabase SQL editor
   - This will create all necessary tables, types, and policies

5. **Start the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## Environment Variables

Create a `.env.local` file with the following variables:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Database Setup

1. **Run the initial migration**:
   ```bash
   # Copy the SQL from supabase/migrations/001_initial_schema.sql
   # Run it in your Supabase SQL editor
   ```

2. **Enable Row Level Security (RLS)**:
   - All tables have RLS enabled with appropriate policies
   - Users can only access their own data
   - Staff members have access based on their role permissions

3. **Set up authentication**:
   - Configure your Supabase project settings
   - Set up OAuth providers if needed (Google, Facebook)
   - Configure email templates

## Project Structure

```
suuqsade-marketplace/
├── app/                    # Next.js app directory
│   ├── auth/              # Authentication pages
│   ├── admin/             # Admin panel pages
│   ├── profile/           # User profile pages
│   └── globals.css        # Global styles
├── components/            # React components
│   ├── auth/             # Authentication components
│   ├── layout/           # Layout components
│   ├── profile/          # Profile components
│   └── admin/            # Admin components
├── lib/                  # Utility libraries
│   ├── supabase.ts       # Supabase client
│   └── auth-context.tsx  # Authentication context
├── types/                # TypeScript type definitions
│   └── database.ts       # Database types
├── supabase/             # Database migrations
│   └── migrations/       # SQL migration files
└── public/               # Static assets
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run db:generate` - Generate TypeScript types from Supabase
- `npm run db:push` - Push database changes to Supabase

## Authentication Flow

1. **Sign Up**: Users create accounts with email/password or OAuth
2. **Profile Creation**: User profiles are automatically created upon first sign-in
3. **Role Assignment**: Users start with 'customer' role by default
4. **Staff Management**: Admins can promote users to staff roles with specific permissions

## Role Hierarchy

- **Customer**: Basic user with shopping capabilities
- **Staff**: Can view orders and basic analytics
- **Admin**: Full access to products, orders, customers, and inventory
- **Super Admin**: Complete system access including settings and user management

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support and questions, please open an issue in the GitHub repository.












































