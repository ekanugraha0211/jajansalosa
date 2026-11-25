export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'processing'
  | 'completed'
  | 'cancelled';

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: string;
  category_id: string | null;
  name: string;
  slug: string;
  description: string;
  price: number;
  stock: number;
  image_url: string | null;
  is_active: boolean;
  is_featured: boolean;
  created_at: string;
  updated_at: string;
  categories?: Pick<Category, 'id' | 'name' | 'slug'> | null;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string | null;
  product_name: string;
  unit_price: number;
  quantity: number;
  subtotal: number;
  created_at: string;
}

export interface Order {
  id: string;
  order_code: string;
  customer_name: string;
  customer_whatsapp: string;
  customer_address: string;
  notes: string;
  total_amount: number;
  status: OrderStatus;
  created_at: string;
  updated_at: string;
  order_items?: OrderItem[];
}

export interface CreateOrderItemInput {
  product_id: string;
  quantity: number;
}

export interface CreateOrderInput {
  customer_name: string;
  customer_whatsapp: string;
  customer_address: string;
  notes?: string;
  items: CreateOrderItemInput[];
}

export interface ValidatedOrderItem {
  product_id: string;
  product_name: string;
  unit_price: number;
  quantity: number;
  subtotal: number;
}

export interface CreateOrderResponse {
  order_id: string;
  order_code: string;
  created_at: string;
  customer_name: string;
  customer_whatsapp: string;
  customer_address: string;
  notes: string;
  total_amount: number;
  status: OrderStatus;
  items: ValidatedOrderItem[];
}

export interface AdminProfile {
  id: string;
  user_id: string;
  email: string;
  full_name: string;
  created_at: string;
}

export interface ProductFormValues {
  name: string;
  slug: string;
  category_id: string;
  description: string;
  price: number;
  stock: number;
  image_url: string | null;
  is_active: boolean;
  is_featured: boolean;
}

export interface CategoryFormValues {
  name: string;
  slug: string;
  description: string;
  sort_order: number;
}
