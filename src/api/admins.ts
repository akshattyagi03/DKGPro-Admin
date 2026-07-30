import { apiFetch, ApiError, API_BASE } from "@/lib/api";

const A = "/admins";

export type ApiAdminSession = {
  _id?: string;
  id?: string;
  fullName?: string;
  email?: string;
};

export async function adminLogin(body: { email: string; password: string }) {
  return apiFetch<{ admin: { id?: string; fullName: string; email: string } }>(
    `${A}/login`,
    { method: "POST", body: JSON.stringify(body) }
  );
}

export async function adminHome() {
  return apiFetch<{ admin: ApiAdminSession }>(`${A}/home`, { method: "GET" });
}

export async function adminLogout() {
  return apiFetch<{ message: string }>(`${A}/logout`, { method: "GET" });
}

/** Registration step 1 — requires EMAIL_USER/EMAIL_PASS on backend to send real OTP. */
export async function sendAdminSignupOtp(body: { email: string }) {
  return apiFetch<{ message: string }>(`${A}/send-otp`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

/** Registration step 2 — creates admin; super admin must approve before login works. */
export async function verifyAdminSignup(body: {
  fullName: string;
  email: string;
  password: string;
  otp: string;
}) {
  return apiFetch<{ message: string }>(`${A}/verify-otp`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function adminForgotPassword(body: { email: string }) {
  return apiFetch<{ message: string }>(`${A}/forgot-password`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function adminResetPassword(body: {
  email: string;
  otp: string;
  newPassword: string;
}) {
  return apiFetch<{ message: string }>(`${A}/reset-password`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export type ApiCategoryMain = {
  _id: string;
  name: string;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
  subCategories?: ApiCategorySub[];
};

export type ApiCategorySub = {
  _id: string;
  name: string;
  description?: string;
  mainCategory?: string;
  createdAt?: string;
  updatedAt?: string;
  thirdCategories?: ApiCategoryThird[];
};

export type ApiCategoryThird = {
  _id: string;
  name: string;
  description?: string;
  subCategory?: string;
  createdAt?: string;
  updatedAt?: string;
};

/** Nested additional categories under a third category. */
export type ApiAdditionalCategoryNode = {
  _id: string;
  name: string;
  description?: string;
  parentCategory?: string;
  parentModel?: "ThirdCategory" | "AdditionalCategory";
  level?: number;
  createdAt?: string;
  updatedAt?: string;
  children?: ApiAdditionalCategoryNode[];
};

export type ApiCategoryTreeThird = ApiCategoryThird & {
  additionalCategories?: ApiAdditionalCategoryNode[];
};

export type ApiCategoryTreeSub = ApiCategorySub & {
  thirdCategories?: ApiCategoryTreeThird[];
};

export type ApiCategoryTreeMain = ApiCategoryMain & {
  subCategories?: ApiCategoryTreeSub[];
};

export async function getCategories() {
  return apiFetch<{ categories: ApiCategoryMain[] }>(`${A}/categories`, {
    method: "GET",
  });
}

export async function addMainCategory(body: { name: string }) {
  return apiFetch<{ category: ApiCategoryMain }>(`${A}/addcategory`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function addSubCategory(body: {
  name: string;
  mainCategory: string;
  bannerImage?: File | null;
}) {
  const fd = new FormData();
  fd.append("name", body.name);
  fd.append("mainCategory", body.mainCategory);
  if (body.bannerImage) fd.append("bannerImage", body.bannerImage);
  return apiFetch<{ subCategory: ApiCategorySub }>(`${A}/addsubcategory`, {
    method: "POST",
    body: fd,
  });
}

export async function addThirdCategory(body: {
  name: string;
  subCategory: string;
  bannerImage?: File | null;
}) {
  const fd = new FormData();
  fd.append("name", body.name);
  fd.append("subCategory", body.subCategory);
  if (body.bannerImage) fd.append("bannerImage", body.bannerImage);
  return apiFetch<{ thirdCategory: ApiCategoryThird }>(`${A}/addthirdcategory`, {
    method: "POST",
    body: fd,
  });
}

/** Full tree including nested additional categories */
export async function getCategoryTree() {
  return apiFetch<{ categoryTree: ApiCategoryTreeMain[] }>(`${A}/category-tree`, {
    method: "GET",
  });
}

export async function createAdditionalCategory(body: {
  name: string;
  parentName: string;
  parentModel: "ThirdCategory" | "AdditionalCategory";
  bannerImage?: File | null;
}) {
  const fd = new FormData();
  fd.append("name", body.name);
  fd.append("parentName", body.parentName);
  fd.append("parentModel", body.parentModel);
  if (body.bannerImage) fd.append("bannerImage", body.bannerImage);
  return apiFetch<{ success: boolean; message?: string }>(
    `${A}/create-additional-category`,
    {
      method: "POST",
      body: fd,
    }
  );
}

export async function addHeroBanner(body: {
  image: File;
  subCategory?: string;
  thirdCategory?: string;
  /** Where the banner appears on the guest home page. */
  placement?:
    | "hero"
    | "festival"
    | "festival_hub"
    | "wedding"
    | "wedding_extra"
    | "romantic_couple"
    | "kids"
    | "occasion"
    | "birthday_level_up"
    | "birthday_extra_special";
  sortOrder?: number;
  /** Optional label on festival / wedding hub cards (guest falls back to category name). */
  title?: string;
}) {
  const fd = new FormData();
  fd.append("image", body.image);
  if (body.subCategory) fd.append("subCategory", body.subCategory);
  if (body.thirdCategory) fd.append("thirdCategory", body.thirdCategory);
  if (body.placement) fd.append("placement", body.placement);
  if (body.sortOrder != null) fd.append("sortOrder", String(body.sortOrder));
  if (body.title != null && String(body.title).trim() !== "") {
    fd.append("title", String(body.title).trim());
  }
  return apiFetch<{ message: string; banner: unknown }>(`${A}/add-hero-section-banner`, {
    method: "POST",
    body: fd,
  });
}

export type ApiProductDoc = Record<string, unknown> & {
  _id: string;
  name: string;
  description?: string;
  price: number;
  discountedPrice?: number | null;
  images?: string[];
  isFeatured?: boolean;
  tier?: string;
  mainCategory?: unknown;
  subCategory?: unknown;
  thirdCategory?: unknown;
};

export async function getAdminProducts() {
  return apiFetch<{ products: ApiProductDoc[] }>(`${A}/products`, {
    method: "GET",
  });
}

export type ApiAdminOrderItem = {
  _id?: string;
  product?: { _id?: string; name?: string; price?: number; images?: string[] };
  quantity: number;
  price: number;
  bookingAddonLines?: Array<{
    sectionName?: string;
    addonName?: string;
    quantity?: number;
    lineTotal?: number;
  }>;
  bookingDetails?: {
    pincode?: string;
    district?: string;
    bookingDate?: string;
    startTime?: string;
    endTime?: string;
    balloonColorChoice?: {
      mode?: string;
      label?: string;
      colors?: string[];
    };
  };
};

export type ApiAdminOrder = {
  id: string;
  orderNumber: string;
  userName: string;
  userEmail: string;
  userPhone?: string;
  items: ApiAdminOrderItem[];
  myTotal: number;
  orderTotal: number;
  status: string;
  shippingAddress?: {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
  };
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  createdAt: string;
  updatedAt: string;
};

export type AdminOrdersResponse = {
  orders: ApiAdminOrder[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalOrders: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
};

export async function getAdminOrders(params?: { page?: number; limit?: number }) {
  const search = new URLSearchParams();
  if (params?.page != null) search.set("page", String(params.page));
  if (params?.limit != null) search.set("limit", String(params.limit));
  const q = search.toString();
  return apiFetch<AdminOrdersResponse>(`${A}/orders${q ? `?${q}` : ""}`, { method: "GET" });
}

export async function getAdminOrder(orderId: string) {
  return apiFetch<{ order: ApiAdminOrder }>(`${A}/orders/${encodeURIComponent(orderId)}`, {
    method: "GET",
  });
}

export type ApiAllUsersPagination = {
  currentPage: number;
  totalPages: number;
  total: number;
  hasNext: boolean;
  hasPrev: boolean;
};

export type ApiAllUsersDoc = {
  _id: string;
  fullName?: string;
  email?: string;
  phoneNumber?: string;
  role?: string;
  createdAt?: string;
  isApproved?: boolean;
};

export type ApiAllUsersBucket = {
  data: ApiAllUsersDoc[];
  pagination: ApiAllUsersPagination;
};

export type ApiAllUsersResponse = {
  superAdmins: ApiAllUsersBucket;
  admins: ApiAllUsersBucket;
  users: ApiAllUsersBucket;
};

export async function getAllUsers(params?: { page?: number; limit?: number }) {
  const search = new URLSearchParams();
  if (params?.page != null) search.set("page", String(params.page));
  if (params?.limit != null) search.set("limit", String(params.limit));
  const q = search.toString();
  return apiFetch<ApiAllUsersResponse>(`${A}/all-users${q ? `?${q}` : ""}`, { method: "GET" });
}

export async function updateAdminOrderStatus(orderId: string, status: string) {
  return apiFetch<{ message: string; order: unknown }>(`${A}/orders/${orderId}/status`, {
    method: "PUT",
    body: JSON.stringify({ status }),
  });
}

/** Opens invoice PDF in a new tab */
export function openAdminInvoiceInBrowser(orderId: string) {
  const path = `${A}/orders/${encodeURIComponent(orderId)}/invoice`;
  window.open(`${API_BASE}${path}`, "_blank", "noopener,noreferrer");
}

export async function downloadAdminInvoicePdf(orderId: string) {
  const path = `${A}/orders/${encodeURIComponent(orderId)}/invoice/download`;
  const res = await fetch(`${API_BASE}${path}`, { method: "GET", credentials: "include" });
  if (!res.ok) {
    const text = await res.text();
    let message = text.slice(0, 300) || "Download failed";
    try {
      const j = JSON.parse(text) as { message?: string };
      if (j.message) message = j.message;
    } catch {
      /* use text */
    }
    throw new ApiError(res.status, message);
  }
  const cd = res.headers.get("Content-Disposition");
  let filename: string | undefined;
  if (cd) {
    const m = /filename\*?=(?:UTF-8'')?([^;\n]+)/i.exec(cd);
    if (m) {
      filename = decodeURIComponent(m[1].trim().replace(/^["']|["']$/g, ""));
    }
  }
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename || `invoice-${orderId.slice(-6)}.pdf`;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export type SendInvoiceResponse = {
  orderNumber: string;
  results: { email: string | null; whatsapp: string | null };
};

export async function sendAdminInvoiceToCustomer(orderId: string) {
  return apiFetch<SendInvoiceResponse>(
    `${A}/orders/${encodeURIComponent(orderId)}/invoice/send`,
    { method: "POST", body: JSON.stringify({}) }
  );
}

export type AdminAnalyticsResponse = {
  totalRevenue: number;
  revenueGrowth: number;
  totalOrders: number;
  ordersGrowth: number;
  totalUsers: number;
  salesTrend: { date: string; revenue: number }[];
  ordersByStatus: { status: string; count: number }[];
  userGrowth: { date: string; users: number }[];
  topProducts: { name: string; revenue: number; sales: number }[];
};

export async function getAdminAnalytics() {
  return apiFetch<AdminAnalyticsResponse>(`${A}/analytics`, { method: "GET" });
}

/** One image slot for product create (URL or uploaded file). */
export type ProductImageSlot = { kind: "url"; url: string } | { kind: "file"; file: File };

export type AddProductBody = {
  name: string;
  description: string;
  price: number;
  discountedPrice?: number;
  mainCategory: string;
  subCategory: string;
  thirdCategory: string;
  /** URL-only legacy; prefer `imageSlots`. */
  images?: string[];
  imageSlots?: ProductImageSlot[];
  /** Sent as `tags` in JSON; backend also accepts legacy `keywords`. */
  tags?: string[];
  keywords?: string[];
  isFeatured?: boolean;
  tier?: string;
  additionalCategories?: string[];
  /** Matches Product model: each section has `name`, `priority`, and catalog add-ons by `name`. */
  customizationSections?: Array<{
    name: string;
    priority?: number;
    addons?: { name: string }[];
  }>;
  serviceableAreas?: { city: string; districts?: string[] }[];
  inclusions?: string[];
  experiences?: string[];
  keyHighlights?: string[];
  location?: string;
  setupDuration?: string;
  teamSize?: string;
  advanceBooking?: string;
  cancellationPolicy?: string;
  youtubeVideoLink?: string;
  balloonColorSelection?: {
    enabled?: boolean;
    defaultOptionLabel?: string;
    defaultOptionDescription?: string;
    allowCustom?: boolean;
    customOptionLabel?: string;
    inheritFromCategory?: boolean;
    presets?: { label: string }[];
  };
};

const MAX_PRODUCT_IMAGES = 10;

export async function addProduct(body: AddProductBody) {
  const slots: ProductImageSlot[] =
    body.imageSlots ??
    (body.images?.map((url) => ({ kind: "url" as const, url })) ?? []);

  if (slots.length > MAX_PRODUCT_IMAGES) {
    return Promise.reject(new ApiError(400, `At most ${MAX_PRODUCT_IMAGES} images`));
  }

  const hasFile = slots.some((s) => s.kind === "file");
  const { imageSlots: _omitSlots, images: _omitImages, ...fields } = body;

  if (!hasFile) {
    const urlsOrdered = slots
      .filter((s): s is { kind: "url"; url: string } => s.kind === "url")
      .map((s) => s.url);
    return apiFetch<{ product: ApiProductDoc }>(`${A}/addproducts`, {
      method: "POST",
      body: JSON.stringify({ ...fields, images: urlsOrdered }),
    });
  }

  const fd = new FormData();
  const files: File[] = [];
  const urls: string[] = [];
  const order: string[] = [];
  for (const s of slots) {
    if (s.kind === "file") {
      order.push(`f${files.length}`);
      files.push(s.file);
    } else {
      order.push(`u${urls.length}`);
      urls.push(s.url);
    }
  }
  for (const f of files) {
    fd.append("images", f);
  }
  fd.append("imagesUrls", JSON.stringify(urls));
  fd.append("imagesOrder", JSON.stringify(order));

  fd.append("name", fields.name);
  fd.append("description", fields.description);
  fd.append("price", String(fields.price));
  if (fields.discountedPrice != null) fd.append("discountedPrice", String(fields.discountedPrice));
  fd.append("mainCategory", fields.mainCategory);
  fd.append("subCategory", fields.subCategory);
  fd.append("thirdCategory", fields.thirdCategory);
  fd.append("isFeatured", fields.isFeatured ? "true" : "false");
  if (fields.tier) fd.append("tier", fields.tier);
  if (fields.tags != null) fd.append("tags", JSON.stringify(fields.tags));
  if (fields.keywords != null) fd.append("keywords", JSON.stringify(fields.keywords));
  if (fields.additionalCategories != null)
    fd.append("additionalCategories", JSON.stringify(fields.additionalCategories));
  if (fields.customizationSections != null)
    fd.append("customizationSections", JSON.stringify(fields.customizationSections));
  if (fields.serviceableAreas != null) fd.append("serviceableAreas", JSON.stringify(fields.serviceableAreas));
  if (fields.inclusions != null) fd.append("inclusions", JSON.stringify(fields.inclusions));
  if (fields.experiences != null) fd.append("experiences", JSON.stringify(fields.experiences));
  if (fields.keyHighlights != null) fd.append("keyHighlights", JSON.stringify(fields.keyHighlights));
  if (fields.location) fd.append("location", fields.location);
  if (fields.setupDuration) fd.append("setupDuration", fields.setupDuration);
  if (fields.teamSize) fd.append("teamSize", fields.teamSize);
  if (fields.advanceBooking) fd.append("advanceBooking", fields.advanceBooking);
  if (fields.cancellationPolicy) fd.append("cancellationPolicy", fields.cancellationPolicy);
  if (fields.youtubeVideoLink) fd.append("youtubeVideoLink", fields.youtubeVideoLink);
  if (fields.balloonColorSelection != null) {
    fd.append("balloonColorSelection", JSON.stringify(fields.balloonColorSelection));
  }

  return apiFetch<{ product: ApiProductDoc }>(`${A}/addproducts`, {
    method: "POST",
    body: fd,
  });
}

/** Addon catalog*/
export type ApiAddonSearchItem = {
  _id: string;
  name: string;
  description?: string;
  price?: number;
  image?: string;
  category?: string;
  tags?: string[];
};

export async function searchAddons(q: string) {
  const query = q.trim();
  if (!query) {
    return Promise.resolve({ addons: [] as ApiAddonSearchItem[] });
  }
  const params = new URLSearchParams({ q: query });
  return apiFetch<{ addons: ApiAddonSearchItem[] }>(`${A}/search-addons?${params.toString()}`, {
    method: "GET",
  });
}

/** Create addon*/
export type AddonCustomFieldPayload = {
  label: string;
  key: string;
  type: "text" | "textarea" | "number" | "dropdown" | "file";
  required?: boolean;
  maxLength?: number;
  options?: string[];
};

export async function createAddon(body: {
  name: string;
  description: string;
  price: number;
  category: string;
  image: File;
  tags?: string[];
  customFields?: AddonCustomFieldPayload[];
}) {
  const fd = new FormData();
  fd.append("name", body.name.trim());
  fd.append("description", body.description.trim());
  fd.append("price", String(body.price));
  fd.append("category", body.category.trim());
  fd.append("image", body.image);
  if (body.tags?.length) {
    fd.append("tags", JSON.stringify(body.tags));
  }
  if (body.customFields?.length) {
    fd.append("customFields", JSON.stringify(body.customFields));
  }
  return apiFetch<{ message: string; addon: ApiAddonSearchItem }>(`${A}/add-addon`, {
    method: "POST",
    body: fd,
  });
}

export async function toggleProductFeatured(productId: string, isFeatured: boolean) {
  return apiFetch<{ product: ApiProductDoc }>(
    `${A}/toggle-featured/${productId}`,
    { method: "PUT", body: JSON.stringify({ isFeatured }) }
  );
}

export async function toggleProductTier(productId: string, tier: "standard" | "premium") {
  return apiFetch<{ product: ApiProductDoc }>(`${A}/toggle-tier/${productId}`, {
    method: "PUT",
    body: JSON.stringify({ tier }),
  });
}

export type ApiBlogDoc = {
  _id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  featuredImage: string;
  category: string;
  tags?: string[];
  cities?: string[];
  published?: boolean;
  author?: { fullName?: string; email?: string };
  createdAt?: string;
  updatedAt?: string;
  publishedAt?: string;
};

export async function getAdminBlogs() {
  return apiFetch<{ blogs: ApiBlogDoc[] }>(`${A}/blogs`, { method: "GET" });
}

export type CreateBlogBody = {
  title: string;
  content: string;
  excerpt: string;
  category: string;
  tags?: string[];
  cities?: string[];
  published?: boolean;
  metaTitle?: string;
  metaDescription?: string;
  featuredImage: File;
};

export async function createBlog(body: CreateBlogBody) {
  const fd = new FormData();
  fd.append("title", body.title);
  fd.append("content", body.content);
  fd.append("excerpt", body.excerpt);
  fd.append("category", body.category);
  fd.append("tags", JSON.stringify(body.tags ?? []));
  if (body.cities?.length) fd.append("cities", JSON.stringify(body.cities));
  fd.append("published", body.published ? "true" : "false");
  if (body.metaTitle) fd.append("metaTitle", body.metaTitle);
  if (body.metaDescription) fd.append("metaDescription", body.metaDescription);
  fd.append("featuredImage", body.featuredImage);
  return apiFetch<{ blog: ApiBlogDoc; message?: string }>(`${A}/create-blog`, {
    method: "POST",
    body: fd,
  });
}

export type UpdateBlogBody = Partial<{
  title: string;
  content: string;
  excerpt: string;
  category: string;
  tags: string[];
  cities: string[];
  published: boolean;
  metaTitle: string;
  metaDescription: string;
  featuredImage: File;
}>;

export async function updateBlog(blogId: string, body: UpdateBlogBody) {
  const fd = new FormData();
  if (body.title != null) fd.append("title", body.title);
  if (body.content != null) fd.append("content", body.content);
  if (body.excerpt != null) fd.append("excerpt", body.excerpt);
  if (body.category != null) fd.append("category", body.category);
  if (body.tags != null) fd.append("tags", JSON.stringify(body.tags));
  if (body.cities != null) fd.append("cities", JSON.stringify(body.cities));
  if (body.published != null) fd.append("published", body.published ? "true" : "false");
  if (body.metaTitle != null) fd.append("metaTitle", body.metaTitle);
  if (body.metaDescription != null) fd.append("metaDescription", body.metaDescription);
  if (body.featuredImage instanceof File) fd.append("featuredImage", body.featuredImage);
  return apiFetch<{ blog: ApiBlogDoc; message?: string }>(`${A}/edit-blog/${blogId}`, {
    method: "PUT",
    body: fd,
  });
}

export async function deleteBlog(blogId: string) {
  return apiFetch<{ message: string }>(`${A}/delete-blog/${blogId}`, {
    method: "DELETE",
  });
}

export type ApiVenueDoc = {
  _id: string;
  name: string;
  description?: string;
  location?: { address?: string; city?: string; lat?: number; lng?: number };
  images?: string[];
  startingPrice?: number;
  typesOfVenues?: string[];
  facilities?: string[];
  accessibilityFeatures?: string[];
  restrictions?: string[];
  capacity?: { min?: number; max?: number };
  otherInformation?: { inHouseDecor?: boolean; advanceBookingWeeks?: number };
  createdAt?: string;
  updatedAt?: string;
};

export async function getAdminVenues() {
  return apiFetch<{ venues: ApiVenueDoc[] }>(`${A}/venues`, { method: "GET" });
}

export type CreateVenueBody = {
  name: string;
  description: string;
  startingPrice: number;
  location: { address: string; lat?: number; lng?: number };
  typesOfVenues: string[];
  facilities: string[];
  accessibilityFeatures?: string[];
  restrictions?: string[];
  otherInformation?: { inHouseDecor?: boolean; advanceBookingWeeks?: number };
  capacity?: { min?: number; max?: number };
  imageFiles: File[];
};

export async function createVenue(body: CreateVenueBody) {
  const fd = new FormData();
  fd.append("name", body.name.trim());
  fd.append("description", body.description.trim());
  fd.append("startingPrice", String(body.startingPrice));
  fd.append("location", JSON.stringify(body.location));
  fd.append("typesOfVenues", JSON.stringify(body.typesOfVenues ?? []));
  fd.append("facilities", JSON.stringify(body.facilities ?? []));
  fd.append("accessibilityFeatures", JSON.stringify(body.accessibilityFeatures ?? []));
  fd.append("restrictions", JSON.stringify(body.restrictions ?? []));
  if (body.otherInformation != null) {
    fd.append("otherInformation", JSON.stringify(body.otherInformation));
  }
  if (body.capacity != null) {
    fd.append("capacity", JSON.stringify(body.capacity));
  }
  for (const f of body.imageFiles.slice(0, 10)) {
    fd.append("images", f);
  }
  return apiFetch<{ message?: string; venue: ApiVenueDoc }>(`${A}/add-venue`, {
    method: "POST",
    body: fd,
  });
}

export type {
  CorporateBookingStatus,
  ApiCorporateBooking,
} from "@/api/superadmins";

import type { ApiCorporateBooking, CorporateBookingStatus } from "@/api/superadmins";

export async function getAdminCorporateBookings() {
  return apiFetch<{ bookings: ApiCorporateBooking[] }>(`${A}/corporate-bookings`, {
    method: "GET",
  });
}

export async function updateAdminCorporateBookingStatus(
  contactId: string,
  status: CorporateBookingStatus
) {
  return apiFetch<{ message: string; booking: ApiCorporateBooking }>(
    `${A}/corporate-bookings/${encodeURIComponent(contactId)}/status`,
    {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }
  );
}

/** Product-detail service pages (Photography / Catering / Games / Special Effects). */
export type ServicePageKey = "photography" | "catering" | "games" | "effects";

export type ApiServicePageItem = {
  id: string;
  title: string;
  description: string;
  image: string | null;
  sortOrder: number;
};

export type ApiServicePage = {
  serviceKey: ServicePageKey;
  slug: string;
  label: string;
  hero: {
    title: string;
    subtitle: string;
    image: string | null;
  };
  items: ApiServicePageItem[];
  isActive: boolean;
  updatedAt?: string;
};

export async function getAdminServicePages() {
  return apiFetch<{ pages: ApiServicePage[] }>(`${A}/service-pages`, { method: "GET" });
}

export async function getAdminServicePage(serviceKey: ServicePageKey | string) {
  return apiFetch<{ page: ApiServicePage }>(
    `${A}/service-pages/${encodeURIComponent(serviceKey)}`,
    { method: "GET" }
  );
}

export async function updateAdminServicePage(
  serviceKey: ServicePageKey | string,
  body: {
    title?: string;
    subtitle?: string;
    isActive?: boolean;
    heroImage?: File | null;
  }
) {
  const fd = new FormData();
  if (body.title !== undefined) fd.append("title", body.title);
  if (body.subtitle !== undefined) fd.append("subtitle", body.subtitle);
  if (body.isActive !== undefined) fd.append("isActive", String(body.isActive));
  if (body.heroImage) fd.append("heroImage", body.heroImage);
  return apiFetch<{ message: string; page: ApiServicePage }>(
    `${A}/service-pages/${encodeURIComponent(serviceKey)}`,
    { method: "PUT", body: fd }
  );
}

export async function addAdminServicePageItem(
  serviceKey: ServicePageKey | string,
  body: {
    title: string;
    description?: string;
    sortOrder?: number;
    image: File;
  }
) {
  const fd = new FormData();
  fd.append("title", body.title);
  if (body.description !== undefined) fd.append("description", body.description);
  if (body.sortOrder !== undefined) fd.append("sortOrder", String(body.sortOrder));
  fd.append("image", body.image);
  return apiFetch<{ message: string; page: ApiServicePage }>(
    `${A}/service-pages/${encodeURIComponent(serviceKey)}/items`,
    { method: "POST", body: fd }
  );
}

export async function updateAdminServicePageItem(
  serviceKey: ServicePageKey | string,
  itemId: string,
  body: {
    title?: string;
    description?: string;
    sortOrder?: number;
    image?: File | null;
  }
) {
  const fd = new FormData();
  if (body.title !== undefined) fd.append("title", body.title);
  if (body.description !== undefined) fd.append("description", body.description);
  if (body.sortOrder !== undefined) fd.append("sortOrder", String(body.sortOrder));
  if (body.image) fd.append("image", body.image);
  return apiFetch<{ message: string; page: ApiServicePage }>(
    `${A}/service-pages/${encodeURIComponent(serviceKey)}/items/${encodeURIComponent(itemId)}`,
    { method: "PUT", body: fd }
  );
}

export async function deleteAdminServicePageItem(
  serviceKey: ServicePageKey | string,
  itemId: string
) {
  return apiFetch<{ message: string; page: ApiServicePage }>(
    `${A}/service-pages/${encodeURIComponent(serviceKey)}/items/${encodeURIComponent(itemId)}`,
    { method: "DELETE" }
  );
}
