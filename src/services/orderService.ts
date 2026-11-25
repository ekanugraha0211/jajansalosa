import { requireSupabase } from '../lib/supabase';
import type {
  CreateOrderInput,
  CreateOrderResponse,
  Order,
  OrderStatus,
} from '../types';

export async function createOrder(
  input: CreateOrderInput
): Promise<CreateOrderResponse> {
  const client = requireSupabase();

  const { data, error } = await client.rpc('create_order', {
    p_customer_name: input.customer_name,
    p_customer_whatsapp: input.customer_whatsapp,
    p_customer_address: input.customer_address,
    p_notes: input.notes ?? '',
    p_items: input.items,
  });

  if (error) {
    throw new Error(error.message || 'Gagal memproses pesanan.');
  }

  return data as CreateOrderResponse;
}

export async function fetchAdminOrders(
  statusFilter: OrderStatus | 'all' = 'all'
): Promise<Order[]> {
  const client = requireSupabase();

  let query = client
    .from('orders')
    .select('*, order_items(*)')
    .order('created_at', { ascending: false });

  if (statusFilter !== 'all') {
    query = query.eq('status', statusFilter);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data ?? []) as Order[];
}

export async function updateOrderStatus(
  orderId: string,
  status: OrderStatus
): Promise<Order> {
  const client = requireSupabase();

  const { data, error } = await client
    .from('orders')
    .update({ status })
    .eq('id', orderId)
    .select('*, order_items(*)')
    .single();

  if (error) throw new Error(error.message);
  return data as Order;
}
