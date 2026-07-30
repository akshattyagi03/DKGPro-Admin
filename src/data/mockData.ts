import { User, Category, SubCategory, ThirdSubCategory, Product, Order, Invoice, AnalyticsData, Blog } from '@/types';

export const mockUsers: User[] = [
  { id: '1', name: 'John Super Admin', email: 'superadmin@company.com', role: 'super-admin', createdAt: '2024-01-15', lastLogin: '2024-12-16', status: 'active' },
  { id: '2', name: 'Jane Admin', email: 'admin@company.com', role: 'admin', createdAt: '2024-03-20', lastLogin: '2024-12-16', status: 'active' },
  { id: '3', name: 'Mike Johnson', email: 'mike@example.com', role: 'guest', createdAt: '2024-05-10', lastLogin: '2024-12-15', status: 'active' },
  { id: '4', name: 'Sarah Williams', email: 'sarah@example.com', role: 'guest', createdAt: '2024-06-22', lastLogin: '2024-12-14', status: 'active' },
  { id: '5', name: 'Robert Brown', email: 'robert@example.com', role: 'guest', createdAt: '2024-07-05', lastLogin: '2024-12-10', status: 'inactive' },
  { id: '6', name: 'Emily Davis', email: 'emily@example.com', role: 'guest', createdAt: '2024-08-18', lastLogin: '2024-12-13', status: 'active' },
  { id: '7', name: 'David Wilson', email: 'david@example.com', role: 'guest', createdAt: '2024-09-02', lastLogin: '2024-12-12', status: 'suspended' },
  { id: '8', name: 'Lisa Anderson', email: 'lisa@example.com', role: 'admin', createdAt: '2024-10-11', lastLogin: '2024-12-16', status: 'active' },
];

export const mockCategories: Category[] = [
  { id: '1', name: 'Electronics', slug: 'electronics', description: 'Electronic devices and gadgets', createdAt: '2024-01-10', updatedAt: '2024-12-01' },
  { id: '2', name: 'Clothing', slug: 'clothing', description: 'Fashion and apparel', createdAt: '2024-01-15', updatedAt: '2024-12-05' },
  { id: '3', name: 'Home & Garden', slug: 'home-garden', description: 'Home improvement and garden supplies', createdAt: '2024-02-01', updatedAt: '2024-11-20' },
  { id: '4', name: 'Sports & Outdoors', slug: 'sports-outdoors', description: 'Sports equipment and outdoor gear', createdAt: '2024-02-20', updatedAt: '2024-11-25' },
  { id: '5', name: 'Books & Media', slug: 'books-media', description: 'Books, music, and entertainment', createdAt: '2024-03-05', updatedAt: '2024-12-10' },
];

export const mockSubCategories: SubCategory[] = [
  { id: '1', name: 'Smartphones', slug: 'smartphones', categoryId: '1', categoryName: 'Electronics', createdAt: '2024-01-12', updatedAt: '2024-12-01' },
  { id: '2', name: 'Laptops', slug: 'laptops', categoryId: '1', categoryName: 'Electronics', createdAt: '2024-01-14', updatedAt: '2024-12-02' },
  { id: '3', name: 'Audio', slug: 'audio', categoryId: '1', categoryName: 'Electronics', createdAt: '2024-01-16', updatedAt: '2024-12-03' },
  { id: '4', name: "Men's Wear", slug: 'mens-wear', categoryId: '2', categoryName: 'Clothing', createdAt: '2024-01-18', updatedAt: '2024-12-04' },
  { id: '5', name: "Women's Wear", slug: 'womens-wear', categoryId: '2', categoryName: 'Clothing', createdAt: '2024-01-20', updatedAt: '2024-12-05' },
  { id: '6', name: 'Furniture', slug: 'furniture', categoryId: '3', categoryName: 'Home & Garden', createdAt: '2024-02-02', updatedAt: '2024-11-20' },
  { id: '7', name: 'Fitness', slug: 'fitness', categoryId: '4', categoryName: 'Sports & Outdoors', createdAt: '2024-02-22', updatedAt: '2024-11-25' },
  { id: '8', name: 'Fiction', slug: 'fiction', categoryId: '5', categoryName: 'Books & Media', createdAt: '2024-03-07', updatedAt: '2024-12-10' },
];

export const mockThirdSubCategories: ThirdSubCategory[] = [
  { id: '1', name: 'iPhone', slug: 'iphone', subCategoryId: '1', subCategoryName: 'Smartphones', categoryId: '1', categoryName: 'Electronics', createdAt: '2024-01-13', updatedAt: '2024-12-01' },
  { id: '2', name: 'Android Phones', slug: 'android-phones', subCategoryId: '1', subCategoryName: 'Smartphones', categoryId: '1', categoryName: 'Electronics', createdAt: '2024-01-14', updatedAt: '2024-12-02' },
  { id: '3', name: 'Gaming Laptops', slug: 'gaming-laptops', subCategoryId: '2', subCategoryName: 'Laptops', categoryId: '1', categoryName: 'Electronics', createdAt: '2024-01-15', updatedAt: '2024-12-03' },
  { id: '4', name: 'Ultrabooks', slug: 'ultrabooks', subCategoryId: '2', subCategoryName: 'Laptops', categoryId: '1', categoryName: 'Electronics', createdAt: '2024-01-16', updatedAt: '2024-12-04' },
  { id: '5', name: 'Headphones', slug: 'headphones', subCategoryId: '3', subCategoryName: 'Audio', categoryId: '1', categoryName: 'Electronics', createdAt: '2024-01-17', updatedAt: '2024-12-05' },
  { id: '6', name: 'T-Shirts', slug: 't-shirts', subCategoryId: '4', subCategoryName: "Men's Wear", categoryId: '2', categoryName: 'Clothing', createdAt: '2024-01-19', updatedAt: '2024-12-06' },
  { id: '7', name: 'Dresses', slug: 'dresses', subCategoryId: '5', subCategoryName: "Women's Wear", categoryId: '2', categoryName: 'Clothing', createdAt: '2024-01-21', updatedAt: '2024-12-07' },
];

export const mockProducts: Product[] = [
  {
    id: '1', name: 'iPhone 15 Pro Max', slug: 'iphone-15-pro-max', description: 'Latest iPhone with titanium design',
    price: 1199, comparePrice: 1299, sku: 'IPH-15-PM-256', stock: 45,
    categoryId: '1', categoryName: 'Electronics', subCategoryId: '1', subCategoryName: 'Smartphones',
    thirdSubCategoryId: '1', thirdSubCategoryName: 'iPhone',
    images: ['https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=400'],
    status: 'active', featured: true, createdAt: '2024-09-15', updatedAt: '2024-12-10'
  },
  {
    id: '2', name: 'MacBook Pro 16"', slug: 'macbook-pro-16', description: 'Powerful laptop for professionals',
    price: 2499, comparePrice: 2699, sku: 'MBP-16-M3-512', stock: 28,
    categoryId: '1', categoryName: 'Electronics', subCategoryId: '2', subCategoryName: 'Laptops',
    thirdSubCategoryId: '4', thirdSubCategoryName: 'Ultrabooks',
    images: ['https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400'],
    status: 'active', featured: true, createdAt: '2024-10-01', updatedAt: '2024-12-12'
  },
  {
    id: '3', name: 'Sony WH-1000XM5', slug: 'sony-wh-1000xm5', description: 'Premium noise-canceling headphones',
    price: 349, comparePrice: 399, sku: 'SNY-WH-XM5', stock: 120,
    categoryId: '1', categoryName: 'Electronics', subCategoryId: '3', subCategoryName: 'Audio',
    thirdSubCategoryId: '5', thirdSubCategoryName: 'Headphones',
    images: ['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400'],
    status: 'active', featured: false, createdAt: '2024-08-20', updatedAt: '2024-12-08'
  },
  {
    id: '4', name: 'Samsung Galaxy S24 Ultra', slug: 'samsung-galaxy-s24-ultra', description: 'Android flagship with AI features',
    price: 1299, sku: 'SAM-S24-U-256', stock: 35,
    categoryId: '1', categoryName: 'Electronics', subCategoryId: '1', subCategoryName: 'Smartphones',
    thirdSubCategoryId: '2', thirdSubCategoryName: 'Android Phones',
    images: ['https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=400'],
    status: 'active', featured: true, createdAt: '2024-11-05', updatedAt: '2024-12-14'
  },
  {
    id: '5', name: 'Classic Cotton T-Shirt', slug: 'classic-cotton-tshirt', description: 'Comfortable everyday t-shirt',
    price: 29, comparePrice: 39, sku: 'CLO-TS-001', stock: 250,
    categoryId: '2', categoryName: 'Clothing', subCategoryId: '4', subCategoryName: "Men's Wear",
    thirdSubCategoryId: '6', thirdSubCategoryName: 'T-Shirts',
    images: ['https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400'],
    status: 'active', featured: false, createdAt: '2024-07-10', updatedAt: '2024-12-01'
  },
  {
    id: '6', name: 'Elegant Summer Dress', slug: 'elegant-summer-dress', description: 'Beautiful floral print dress',
    price: 89, sku: 'CLO-DR-001', stock: 85,
    categoryId: '2', categoryName: 'Clothing', subCategoryId: '5', subCategoryName: "Women's Wear",
    thirdSubCategoryId: '7', thirdSubCategoryName: 'Dresses',
    images: ['https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=400'],
    status: 'active', featured: true, createdAt: '2024-06-15', updatedAt: '2024-11-28'
  },
  {
    id: '7', name: 'ROG Gaming Laptop', slug: 'rog-gaming-laptop', description: 'High-performance gaming machine',
    price: 1899, comparePrice: 2199, sku: 'ROG-GL-001', stock: 15,
    categoryId: '1', categoryName: 'Electronics', subCategoryId: '2', subCategoryName: 'Laptops',
    thirdSubCategoryId: '3', thirdSubCategoryName: 'Gaming Laptops',
    images: ['https://images.unsplash.com/photo-1593642702821-c8da6771f0c6?w=400'],
    status: 'active', featured: false, createdAt: '2024-10-20', updatedAt: '2024-12-11'
  },
  {
    id: '8', name: 'AirPods Pro 2', slug: 'airpods-pro-2', description: 'Premium wireless earbuds',
    price: 249, sku: 'APL-APP-002', stock: 200,
    categoryId: '1', categoryName: 'Electronics', subCategoryId: '3', subCategoryName: 'Audio',
    thirdSubCategoryId: '5', thirdSubCategoryName: 'Headphones',
    images: ['https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?w=400'],
    status: 'draft', featured: false, createdAt: '2024-11-01', updatedAt: '2024-12-09'
  },
];

export const mockOrders: Order[] = [
  {
    id: '1', orderNumber: 'ORD-2024-001', userId: '3', userName: 'Mike Johnson', userEmail: 'mike@example.com',
    items: [{ id: '1', productId: '1', productName: 'iPhone 15 Pro Max', quantity: 1, price: 1199 }],
    subtotal: 1199, tax: 96, shipping: 0, total: 1295, status: 'delivered',
    shippingAddress: { street: '123 Main St', city: 'New York', state: 'NY', zipCode: '10001', country: 'USA' },
    paymentMethod: 'Credit Card', createdAt: '2024-12-01', updatedAt: '2024-12-05'
  },
  {
    id: '2', orderNumber: 'ORD-2024-002', userId: '4', userName: 'Sarah Williams', userEmail: 'sarah@example.com',
    items: [
      { id: '2', productId: '2', productName: 'MacBook Pro 16"', quantity: 1, price: 2499 },
      { id: '3', productId: '3', productName: 'Sony WH-1000XM5', quantity: 1, price: 349 }
    ],
    subtotal: 2848, tax: 228, shipping: 0, total: 3076, status: 'shipped',
    shippingAddress: { street: '456 Oak Ave', city: 'Los Angeles', state: 'CA', zipCode: '90001', country: 'USA' },
    paymentMethod: 'PayPal', createdAt: '2024-12-10', updatedAt: '2024-12-14'
  },
  {
    id: '3', orderNumber: 'ORD-2024-003', userId: '6', userName: 'Emily Davis', userEmail: 'emily@example.com',
    items: [{ id: '4', productId: '6', productName: 'Elegant Summer Dress', quantity: 2, price: 89 }],
    subtotal: 178, tax: 14, shipping: 5, total: 197, status: 'confirmed',
    shippingAddress: { street: '789 Pine Rd', city: 'Chicago', state: 'IL', zipCode: '60601', country: 'USA' },
    paymentMethod: 'Credit Card', createdAt: '2024-12-14', updatedAt: '2024-12-15'
  },
  {
    id: '4', orderNumber: 'ORD-2024-004', userId: '3', userName: 'Mike Johnson', userEmail: 'mike@example.com',
    items: [{ id: '5', productId: '5', productName: 'Classic Cotton T-Shirt', quantity: 3, price: 29 }],
    subtotal: 87, tax: 7, shipping: 5, total: 99, status: 'pending',
    shippingAddress: { street: '123 Main St', city: 'New York', state: 'NY', zipCode: '10001', country: 'USA' },
    paymentMethod: 'Debit Card', createdAt: '2024-12-15', updatedAt: '2024-12-15'
  },
  {
    id: '5', orderNumber: 'ORD-2024-005', userId: '4', userName: 'Sarah Williams', userEmail: 'sarah@example.com',
    items: [{ id: '6', productId: '4', productName: 'Samsung Galaxy S24 Ultra', quantity: 1, price: 1299 }],
    subtotal: 1299, tax: 104, shipping: 0, total: 1403, status: 'cancelled',
    shippingAddress: { street: '456 Oak Ave', city: 'Los Angeles', state: 'CA', zipCode: '90001', country: 'USA' },
    paymentMethod: 'Credit Card', createdAt: '2024-12-08', updatedAt: '2024-12-09'
  },
  {
    id: '6', orderNumber: 'ORD-2024-006', userId: '6', userName: 'Emily Davis', userEmail: 'emily@example.com',
    items: [
      { id: '7', productId: '8', productName: 'AirPods Pro 2', quantity: 1, price: 249 },
      { id: '8', productId: '5', productName: 'Classic Cotton T-Shirt', quantity: 2, price: 29 }
    ],
    subtotal: 307, tax: 25, shipping: 0, total: 332, status: 'pending',
    shippingAddress: { street: '789 Pine Rd', city: 'Chicago', state: 'IL', zipCode: '60601', country: 'USA' },
    paymentMethod: 'PayPal', createdAt: '2024-12-16', updatedAt: '2024-12-16'
  },
];

export const mockInvoices: Invoice[] = mockOrders.map((order, index) => ({
  id: `inv-${index + 1}`,
  invoiceNumber: `INV-2024-${String(index + 1).padStart(3, '0')}`,
  orderId: order.id,
  orderNumber: order.orderNumber,
  userId: order.userId,
  userName: order.userName,
  userEmail: order.userEmail,
  items: order.items,
  subtotal: order.subtotal,
  tax: order.tax,
  shipping: order.shipping,
  total: order.total,
  status: order.status === 'delivered' ? 'paid' : order.status === 'cancelled' ? 'overdue' : 'pending',
  dueDate: new Date(new Date(order.createdAt).getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  createdAt: order.createdAt,
}));

export const mockBlogs: Blog[] = [
  {
    id: '1', title: 'Top 10 Tech Gadgets for 2024', slug: 'top-10-tech-gadgets-2024',
    content: 'Discover the most innovative technology products of the year...', excerpt: 'A comprehensive guide to the best tech gadgets.',
    category: 'General',
    coverImage: 'https://images.unsplash.com/photo-1468495244123-6c6c332eeece?w=400',
    author: 'John Admin', status: 'published', tags: ['technology', 'gadgets', 'reviews'],
    createdAt: '2024-11-01', updatedAt: '2024-11-15'
  },
  {
    id: '2', title: 'Summer Fashion Trends', slug: 'summer-fashion-trends',
    content: 'Stay stylish this summer with these trending fashion picks...', excerpt: 'Your guide to summer fashion.',
    category: 'General',
    coverImage: 'https://images.unsplash.com/photo-1445205170230-053b83016050?w=400',
    author: 'Jane Admin', status: 'published', tags: ['fashion', 'summer', 'trends'],
    createdAt: '2024-10-20', updatedAt: '2024-11-01'
  },
  {
    id: '3', title: 'How to Choose the Perfect Laptop', slug: 'choose-perfect-laptop',
    content: 'A detailed guide on selecting the right laptop for your needs...', excerpt: 'Find your ideal laptop.',
    category: 'General',
    coverImage: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=400',
    author: 'John Admin', status: 'draft', tags: ['technology', 'laptops', 'guide'],
    createdAt: '2024-12-05', updatedAt: '2024-12-10'
  },
];

export const mockAnalytics: AnalyticsData = {
  totalRevenue: 125680,
  totalOrders: 1247,
  totalProducts: 856,
  totalUsers: 3421,
  revenueGrowth: 12.5,
  ordersGrowth: 8.3,
  salesTrend: [
    { date: 'Jan', revenue: 8500, orders: 85 },
    { date: 'Feb', revenue: 9200, orders: 92 },
    { date: 'Mar', revenue: 10100, orders: 101 },
    { date: 'Apr', revenue: 9800, orders: 98 },
    { date: 'May', revenue: 11500, orders: 115 },
    { date: 'Jun', revenue: 12300, orders: 123 },
    { date: 'Jul', revenue: 11800, orders: 118 },
    { date: 'Aug', revenue: 10500, orders: 105 },
    { date: 'Sep', revenue: 11200, orders: 112 },
    { date: 'Oct', revenue: 12800, orders: 128 },
    { date: 'Nov', revenue: 13500, orders: 135 },
    { date: 'Dec', revenue: 14480, orders: 135 },
  ],
  topProducts: [
    { name: 'iPhone 15 Pro Max', sales: 245, revenue: 293755 },
    { name: 'MacBook Pro 16"', sales: 128, revenue: 319872 },
    { name: 'Samsung Galaxy S24', sales: 189, revenue: 245511 },
    { name: 'Sony WH-1000XM5', sales: 312, revenue: 108888 },
    { name: 'AirPods Pro 2', sales: 425, revenue: 105825 },
  ],
  ordersByStatus: [
    { status: 'Pending', count: 145 },
    { status: 'Processing', count: 234 },
    { status: 'Shipped', count: 412 },
    { status: 'Delivered', count: 398 },
    { status: 'Cancelled', count: 58 },
  ],
  userGrowth: [
    { date: 'Jan', users: 2100 },
    { date: 'Feb', users: 2250 },
    { date: 'Mar', users: 2450 },
    { date: 'Apr', users: 2580 },
    { date: 'May', users: 2750 },
    { date: 'Jun', users: 2890 },
    { date: 'Jul', users: 3020 },
    { date: 'Aug', users: 3150 },
    { date: 'Sep', users: 3230 },
    { date: 'Oct', users: 3310 },
    { date: 'Nov', users: 3370 },
    { date: 'Dec', users: 3421 },
  ],
};
