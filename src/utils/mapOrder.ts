import type { ApiAdminOrder } from '@/api/admins';
import type { Order, OrderItem, OrderStatus } from '@/types';

const VALID: OrderStatus[] = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];

function normalizeStatus(s: string): OrderStatus {
  return VALID.includes(s as OrderStatus) ? (s as OrderStatus) : 'pending';
}

/** Map orders list item to UI `Order`. */
export function apiAdminOrderToOrder(o: ApiAdminOrder): Order {
  const id = typeof o.id === 'string' ? o.id : String(o.id);
  const items: OrderItem[] = (o.items ?? []).map((it, idx) => {
    const pid = it.product?._id;
    const productId = pid != null ? String(pid) : '';
    const productName = it.product?.name ?? 'Product';
    const rawImg = it.product?.images?.[0];
    const image = typeof rawImg === 'string' ? rawImg : undefined;
    return {
      id: it._id != null ? String(it._id) : `${id}-item-${idx}`,
      productId,
      productName,
      quantity: it.quantity,
      price: it.price,
      image,
    };
  });
  const addr = o.shippingAddress ?? {};
  return {
    id,
    orderNumber: o.orderNumber,
    userId: '',
    userName: o.userName,
    userEmail: o.userEmail,
    items,
    subtotal: o.myTotal ?? 0,
    tax: 0,
    shipping: 0,
    total: o.orderTotal ?? o.myTotal ?? 0,
    status: normalizeStatus(o.status),
    shippingAddress: {
      street: addr.street ?? '',
      city: addr.city ?? '',
      state: addr.state ?? '',
      zipCode: addr.zipCode ?? '',
      country: addr.country ?? '',
      phoneNumber: addr.phoneNumber ?? '',
      alternatePhoneNumber: addr.alternatePhoneNumber ?? '',
    },
    paymentMethod: '—',
    createdAt:
      typeof o.createdAt === 'string' ? o.createdAt : new Date(o.createdAt as string).toISOString(),
    updatedAt:
      typeof o.updatedAt === 'string' ? o.updatedAt : new Date(o.updatedAt as string).toISOString(),
  };
}
