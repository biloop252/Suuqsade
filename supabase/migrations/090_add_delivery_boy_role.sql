-- Add delivery_boy role to existing user_role enum
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'delivery_boy';

