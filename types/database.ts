export type UserRole = 'customer' | 'staff' | 'admin' | 'super_admin' | 'vendor';
export type OrderStatus = 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'returned';
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';
export type DeliveryStatus = 'pending' | 'in_transit' | 'delivered' | 'failed';
export type ReturnStatus = 'pending' | 'approved' | 'rejected' | 'completed';
export type PromotionalMediaType = 'slider' | 'banner' | 'popup' | 'video' | 'custom';
export type PromotionalMediaPosition = 'homepage_top' | 'homepage_middle' | 'homepage_bottom' | 'homepage_middle_slider' | 'category_page' | 'product_page' | 'sidebar' | 'footer' | 'popup' | 'header' | 'checkout_page' | 'cart_page' | 'limited_time_deals';
export type PromotionalMediaTarget = '_self' | '_blank' | '_parent' | '_top';
export type HomepageSectionType = 'category' | 'popular' | 'trending' | 'new_arrivals' | 'brand' | 'tag' | 'best_selling' | 'recommended' | 'flash_deals';
export type DiscountType = 'percentage' | 'fixed_amount' | 'free_shipping';
export type DiscountStatus = 'active' | 'inactive' | 'expired';
export type CouponStatus = 'active' | 'inactive' | 'expired' | 'used_up';
export type SupportTicketStatus = 'open' | 'in_progress' | 'waiting_customer' | 'waiting_staff' | 'resolved' | 'closed';
export type SupportTicketPriority = 'low' | 'medium' | 'high' | 'urgent';
export type SupportNotificationType = 'ticket_update' | 'new_message' | 'status_change' | 'assignment';
export type SettingType = 'text' | 'number' | 'boolean' | 'json' | 'url' | 'email';
export type SystemImageType = 'logo' | 'favicon' | 'icon' | 'banner' | 'background';

export interface Profile {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  avatar_url?: string;
  role: UserRole;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  image_url?: string;
  parent_id?: string;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface Brand {
  id: string;
  name: string;
  slug: string;
  description?: string;
  logo_url?: string;
  website_url?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Vendor {
  id: string;
  business_name: string;
  business_description: string;
  logo_url?: string;
  address: string;
  city: string;
  district: string;
  neighborhood: string;
  country: string;
  tax_id: string;
  business_license_url?: string;
  national_id_url?: string;
  commission_rate: number;
  status: 'active' | 'inactive' | 'pending' | 'suspended';
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description?: string;
  short_description?: string;
  sku?: string;
  category_id?: string;
  brand_id?: string;
  vendor_id?: string;
  price: number;
  stock_quantity: number;
  min_stock_level: number;
  weight?: number;
  dimensions?: Record<string, any>;
  is_active: boolean;
  is_featured: boolean;
  meta_title?: string;
  meta_description?: string;
  return_policy_id?: string;
  cod_policy_id?: string;
  cancellation_policy_id?: string;
  created_at: string;
  updated_at: string;
}

export interface ProductImage {
  id: string;
  product_id: string;
  image_url: string;
  alt_text?: string;
  is_primary: boolean;
  sort_order: number;
  created_at: string;
}

export interface ProductWithImages extends Product {
  images?: ProductImage[];
}

export interface ProductVariant {
  id: string;
  product_id: string;
  name: string;
  sku?: string;
  price?: number;
  stock_quantity: number;
  attributes?: Record<string, any>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProductAttribute {
  id: string;
  name: string;
  slug: string;
  type: 'text' | 'number' | 'select' | 'multiselect' | 'boolean' | 'color' | 'size';
  description?: string;
  is_required: boolean;
  is_filterable: boolean;
  is_variant_attribute: boolean;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProductAttributeValue {
  id: string;
  product_id: string;
  attribute_id: string;
  value: string;
  display_value?: string;
  sort_order: number;
  created_at: string;
}

export interface ProductVariantAttribute {
  id: string;
  variant_id: string;
  attribute_id: string;
  value: string;
  display_value?: string;
  created_at: string;
}

// New interfaces for the improved attribute structure
export interface AttributeValue {
  id: string;
  attribute_id: string;
  value: string;
  display_value?: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProductAttributeAssignment {
  id: string;
  product_id: string;
  attribute_value_id: string;
  created_at: string;
}

export interface VariantAttributeAssignment {
  id: string;
  variant_id: string;
  attribute_value_id: string;
  created_at: string;
}

export interface Address {
  id: string;
  user_id: string;
  type: 'billing' | 'shipping';
  first_name: string;
  last_name: string;
  company?: string;
  address_line_1: string;
  address_line_2?: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  phone?: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface CartItem {
  id: string;
  user_id: string;
  product_id: string;
  variant_id?: string;
  quantity: number;
  created_at: string;
  updated_at: string;
}

export interface Order {
  id: string;
  order_number: string;
  user_id: string;
  status: OrderStatus;
  total_amount: number;
  subtotal: number;
  tax_amount: number;
  shipping_amount: number;
  discount_amount: number;
  billing_address_id?: string;
  shipping_address_id?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id?: string;
  variant_id?: string;
  product_name: string;
  product_sku?: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  created_at: string;
}

export interface Payment {
  id: string;
  order_id: string;
  amount: number;
  currency: string;
  payment_method: string;
  status: PaymentStatus;
  transaction_id?: string;
  gateway_response?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface Delivery {
  id: string;
  order_id: string;
  tracking_number?: string;
  carrier?: string;
  status: DeliveryStatus;
  estimated_delivery_date?: string;
  actual_delivery_date?: string;
  shipping_label_url?: string;
  created_at: string;
  updated_at: string;
}

export interface Return {
  id: string;
  order_id: string;
  user_id: string;
  status: ReturnStatus;
  reason: string;
  description?: string;
  return_label_url?: string;
  tracking_number?: string;
  refund_amount?: number;
  created_at: string;
  updated_at: string;
}

export interface ReturnItem {
  id: string;
  return_id: string;
  order_item_id?: string;
  product_id?: string;
  variant_id?: string;
  quantity: number;
  reason?: string;
  condition?: string;
  created_at: string;
}

export interface Review {
  id: string;
  product_id: string;
  user_id: string;
  order_id?: string;
  rating: number;
  title?: string;
  comment?: string;
  is_verified_purchase: boolean;
  is_approved: boolean;
  created_at: string;
  updated_at: string;
}

export interface WishlistItem {
  id: string;
  user_id: string;
  product_id: string;
  created_at: string;
}

export interface ReturnPolicy {
  id: string;
  name: string;
  is_returnable: boolean;
  return_days?: number;
  description?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CodPolicy {
  id: string;
  name: string;
  is_cod_allowed: boolean;
  description?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CancellationPolicy {
  id: string;
  name: string;
  is_cancelable: boolean;
  cancel_until_status?: 'pending' | 'processing' | 'shipped';
  description?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface StaffPermission {
  id: string;
  name: string;
  description?: string;
  created_at: string;
}

export interface StaffRolePermission {
  id: string;
  role: UserRole;
  permission_id: string;
  created_at: string;
}

export interface PromotionalMedia {
  id: string;
  title: string;
  subtitle?: string;
  description?: string;
  media_type: PromotionalMediaType;
  image_url?: string;
  mobile_image_url?: string;
  video_url?: string;
  link_url?: string;
  button_text?: string;
  target: PromotionalMediaTarget;
  banner_position: PromotionalMediaPosition;
  display_order: number;
  background_color: string;
  text_color: string;
  is_active: boolean;
  start_date?: string;
  end_date?: string;
  language_code: string;
  store_id?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface PromotionalMediaCategory {
  id: string;
  promotional_media_id: string;
  category_id: string;
  created_at: string;
}

export interface HomepageSection {
  id: string;
  title: string;
  subtitle?: string;
  description?: string;
  section_type: HomepageSectionType;
  background_image_url?: string;
  background_color: string;
  text_color: string;
  category_id?: string;
  brand_id?: string;
  tag_id?: string;
  product_limit?: number;
  display_order: number;
  is_active: boolean;
  start_date?: string;
  end_date?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

// Extended types with relationships
export interface AttributeValueWithDetails extends AttributeValue {
  attribute?: ProductAttribute;
}

export interface ProductAttributeAssignmentWithDetails extends ProductAttributeAssignment {
  product?: Product;
  attribute_value?: AttributeValueWithDetails;
}

export interface VariantAttributeAssignmentWithDetails extends VariantAttributeAssignment {
  variant?: ProductVariant;
  attribute_value?: AttributeValueWithDetails;
}

export interface ProductWithDetails extends Product {
  category?: Category;
  brand?: Brand;
  vendor?: Vendor;
  images?: ProductImage[];
  variants?: ProductVariant[];
  reviews?: Review[];
  attribute_assignments?: ProductAttributeAssignmentWithDetails[];
  return_policy?: ReturnPolicy;
  cod_policy?: CodPolicy;
  cancellation_policy?: CancellationPolicy;
  // Keep old interface for backward compatibility
  attribute_values?: ProductAttributeValue[];
  // Product tags
  tags?: ProductTag[];
  tag_assignments?: ProductTagAssignmentWithDetails[];
}

export interface ProductVariantWithDetails extends ProductVariant {
  product?: Product;
  attribute_assignments?: VariantAttributeAssignmentWithDetails[];
  // Keep old interface for backward compatibility
  variant_attributes?: ProductVariantAttribute[];
}

export interface ProductAttributeWithValues extends ProductAttribute {
  attribute_values?: AttributeValue[];
  // Keep old interface for backward compatibility
  old_attribute_values?: ProductAttributeValue[];
}

export interface OrderWithDetails extends Order {
  user?: Profile;
  items?: OrderItem[];
  billing_address?: Address;
  shipping_address?: Address;
  payments?: Payment[];
  delivery?: Delivery;
  returns?: Return[];
}

export interface CartItemWithProduct extends CartItem {
  product?: Product;
  variant?: ProductVariant;
}

export interface PromotionalMediaWithDetails extends PromotionalMedia {
  categories?: Category[];
  created_by_profile?: Profile;
}

export interface PromotionalMediaCategoryWithDetails extends PromotionalMediaCategory {
  promotional_media?: PromotionalMedia;
  category?: Category;
}

// Discount and Coupon System Interfaces
export interface Discount {
  id: string;
  name: string;
  description?: string;
  code: string;
  type: DiscountType;
  value: number;
  minimum_order_amount: number;
  maximum_discount_amount?: number;
  usage_limit?: number;
  usage_limit_per_user: number;
  used_count: number;
  status: DiscountStatus;
  start_date: string;
  end_date?: string;
  is_active: boolean;
  vendor_id?: string; // Vendor who created this discount
  is_global: boolean; // Global discounts vs vendor-specific
  created_at: string;
  updated_at: string;
}

export interface Coupon {
  id: string;
  code: string;
  name: string;
  description?: string;
  type: DiscountType;
  value: number;
  minimum_order_amount: number;
  maximum_discount_amount?: number;
  usage_limit?: number;
  usage_limit_per_user: number;
  used_count: number;
  status: CouponStatus;
  start_date: string;
  end_date?: string;
  is_active: boolean;
  vendor_id?: string; // Vendor who created this coupon
  is_global: boolean; // Global coupons vs vendor-specific
  created_at: string;
  updated_at: string;
}

export interface DiscountUsage {
  id: string;
  user_id: string;
  discount_id?: string;
  coupon_id?: string;
  order_id: string;
  discount_amount: number;
  used_at: string;
}

export interface ProductDiscount {
  id: string;
  discount_id?: string;
  coupon_id?: string;
  product_id: string;
  created_at: string;
}

export interface CategoryDiscount {
  id: string;
  discount_id?: string;
  coupon_id?: string;
  category_id: string;
  created_at: string;
}

export interface BrandDiscount {
  id: string;
  discount_id?: string;
  coupon_id?: string;
  brand_id: string;
  created_at: string;
}

export interface UserCoupon {
  id: string;
  user_id: string;
  coupon_id: string;
  is_used: boolean;
  used_at?: string;
  created_at: string;
}

export interface DiscountWithDetails extends Discount {
  products?: Product[];
  categories?: Category[];
  brands?: Brand[];
  vendor?: Profile; // Vendor who created this discount
}

export interface CouponWithDetails extends Coupon {
  products?: Product[];
  categories?: Category[];
  brands?: Brand[];
  vendor?: Profile; // Vendor who created this coupon
}

// Vendor-specific discount associations
export interface VendorProductDiscount {
  id: string;
  discount_id?: string;
  coupon_id?: string;
  vendor_id: string;
  product_id: string;
  created_at: string;
}

export interface VendorCategoryDiscount {
  id: string;
  discount_id?: string;
  coupon_id?: string;
  vendor_id: string;
  category_id: string;
  created_at: string;
}

export interface VendorBrandDiscount {
  id: string;
  discount_id?: string;
  coupon_id?: string;
  vendor_id: string;
  brand_id: string;
  created_at: string;
}

// Finance Management System Interfaces
export interface FinanceTransaction {
  id: string;
  transaction_type: 'sale_commission' | 'vendor_payout' | 'admin_revenue' | 'subscription_fee' | 'advertising_revenue' | 'refund' | 'chargeback' | 'penalty' | 'bonus';
  order_id?: string;
  vendor_id?: string;
  user_id?: string;
  amount: number;
  currency: string;
  description?: string;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  reference_id?: string;
  metadata?: Record<string, any>;
  processed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface VendorCommission {
  id: string;
  order_id: string;
  vendor_id: string;
  order_item_id: string;
  product_id?: string;
  commission_rate: number;
  order_amount: number;
  commission_amount: number;
  admin_amount: number;
  status: 'pending' | 'paid' | 'cancelled' | 'refunded';
  paid_at?: string;
  payout_transaction_id?: string;
  created_at: string;
  updated_at: string;
}

export interface VendorPayout {
  id: string;
  vendor_id: string;
  payout_period_start: string;
  payout_period_end: string;
  total_commission: number;
  total_orders: number;
  payout_method: 'bank_transfer' | 'paypal' | 'stripe' | 'check';
  payout_details: Record<string, any>;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  transaction_id?: string;
  processed_at?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface AdminRevenue {
  id: string;
  revenue_type: 'commission' | 'subscription' | 'advertising' | 'listing_fee' | 'premium_features' | 'other';
  source_id?: string;
  source_type?: string;
  amount: number;
  currency: string;
  description?: string;
  period_start?: string;
  period_end?: string;
  status: 'pending' | 'confirmed' | 'cancelled';
  transaction_id?: string;
  created_at: string;
  updated_at: string;
}

export interface FinancialReport {
  id: string;
  report_type: 'daily_sales' | 'monthly_commissions' | 'vendor_payouts' | 'admin_revenue' | 'tax_summary';
  report_period_start: string;
  report_period_end: string;
  generated_by?: string;
  data: Record<string, any>;
  file_url?: string;
  status: 'generating' | 'generated' | 'failed';
  created_at: string;
}

// Extended interfaces with relationships
export interface FinanceTransactionWithDetails extends FinanceTransaction {
  order?: Order;
  vendor?: Profile;
  user?: Profile;
}

export interface VendorCommissionWithDetails extends VendorCommission {
  order?: Order;
  vendor?: Profile;
  order_item?: OrderItem;
  product?: Product;
}

export interface VendorPayoutWithDetails extends VendorPayout {
  vendor?: Profile;
  transaction?: FinanceTransaction;
}

export interface AdminRevenueWithDetails extends AdminRevenue {
  transaction?: FinanceTransaction;
}

// Support System Interfaces
export interface SupportCategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface SupportTicket {
  id: string;
  ticket_number: string;
  user_id: string;
  assigned_to?: string;
  category_id?: string;
  subject: string;
  description: string;
  status: SupportTicketStatus;
  priority: SupportTicketPriority;
  order_id?: string;
  product_id?: string;
  is_urgent: boolean;
  customer_satisfaction?: number;
  resolution_notes?: string;
  resolved_at?: string;
  closed_at?: string;
  created_at: string;
  updated_at: string;
  user?: Profile;
  assigned_user?: Profile;
  category?: SupportCategory;
  order?: Order;
  product?: Product;
}

export interface SupportMessage {
  id: string;
  ticket_id: string;
  user_id: string;
  message: string;
  is_internal: boolean;
  attachments?: string[];
  created_at: string;
  user?: Profile;
}

export interface SupportAttachment {
  id: string;
  ticket_id: string;
  message_id?: string;
  file_name: string;
  file_url: string;
  file_size?: number;
  file_type?: string;
  uploaded_by: string;
  created_at: string;
  uploaded_user?: Profile;
}

export interface SupportTag {
  id: string;
  name: string;
  color: string;
  description?: string;
  created_at: string;
}

export interface SupportTicketTag {
  ticket_id: string;
  tag_id: string;
  ticket?: SupportTicket;
  tag?: SupportTag;
}

export interface SupportNotification {
  id: string;
  user_id: string;
  type: SupportNotificationType;
  title: string;
  message: string;
  ticket_id?: string;
  ticket_number?: string;
  is_read: boolean;
  created_at: string;
  user?: Profile;
  ticket?: SupportTicket;
}

export interface SupportSlaLog {
  id: string;
  ticket_id: string;
  sla_type: string;
  target_time: string;
  actual_time?: string;
  is_breached: boolean;
  created_at: string;
  ticket?: SupportTicket;
}

export interface SystemSetting {
  id: string;
  setting_key: string;
  setting_value?: string;
  setting_type: SettingType;
  category: string;
  description?: string;
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

export interface SystemImage {
  id: string;
  image_type: SystemImageType;
  image_url: string;
  alt_text?: string;
  width?: number;
  height?: number;
  file_size?: number;
  mime_type?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface SettingsFormData {
  [key: string]: string | number | boolean;
}

export interface ImageUploadData {
  file: File;
  image_type: SystemImageType;
  alt_text?: string;
  is_active?: boolean;
}


// Product Tags
export interface ProductTag {
  id: string;
  name: string;
  slug: string;
  color?: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface ProductTagAssignment {
  product_id: string;
  tag_id: string;
  assigned_at: string;
}

export interface ProductTagAssignmentWithDetails extends ProductTagAssignment {
  tag?: ProductTag;
}

