export type UserRole = 'guest' | 'admin' | 'super-admin';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  createdAt: string;
  lastLogin?: string;
  status: 'active' | 'inactive' | 'suspended';
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SubCategory {
  id: string;
  name: string;
  slug: string;
  categoryId: string;
  categoryName?: string;
  description?: string;
  image?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ThirdSubCategory {
  id: string;
  name: string;
  slug: string;
  subCategoryId: string;
  subCategoryName?: string;
  categoryId: string;
  categoryName?: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

/** Additional category (level 4+), parent is a third category or another additional category. */
export interface AdditionalCategory {
  id: string;
  name: string;
  slug: string;
  /** Immediate parent document id (third or additional), when the API sends it. */
  parentCategoryId?: string;
  parentName: string;
  parentModel: 'ThirdCategory' | 'AdditionalCategory';
  level: number;
  description?: string;
  mainCategoryName?: string;
  subCategoryName?: string;
  thirdCategoryName?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  comparePrice?: number;
  sku: string;
  stock: number;
  categoryId: string;
  categoryName?: string;
  subCategoryId: string;
  subCategoryName?: string;
  thirdSubCategoryId?: string;
  thirdSubCategoryName?: string;
  images: string[];
  status: 'active' | 'draft' | 'archived';
  featured: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Blog {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  category: string;
  coverImage?: string;
  author: string;
  status: 'published' | 'draft';
  tags: string[];
  cities?: string[];
  createdAt: string;
  updatedAt: string;
}

/** Aligns with backend order model: pending | confirmed | shipped | delivered | cancelled */
export type OrderStatus = 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';

export interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  price: number;
  image?: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  userId: string;
  userName: string;
  userEmail: string;
  items: OrderItem[];
  subtotal: number;
  tax: number;
  shipping: number;
  total: number;
  status: OrderStatus;
  shippingAddress: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  paymentMethod: string;
  createdAt: string;
  updatedAt: string;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  orderId: string;
  orderNumber: string;
  userId: string;
  userName: string;
  userEmail: string;
  items: OrderItem[];
  subtotal: number;
  tax: number;
  shipping: number;
  total: number;
  status: 'pending' | 'paid' | 'overdue';
  dueDate: string;
  createdAt: string;
}

export interface AnalyticsData {
  totalRevenue: number;
  totalOrders: number;
  totalProducts: number;
  totalUsers: number;
  revenueGrowth: number;
  ordersGrowth: number;
  salesTrend: { date: string; revenue: number; orders: number }[];
  topProducts: { name: string; sales: number; revenue: number }[];
  ordersByStatus: { status: string; count: number }[];
  userGrowth: { date: string; users: number }[];
}
