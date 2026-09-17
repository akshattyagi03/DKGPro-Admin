import { apiFetch } from "@/lib/api";
import type {
  AdminOrdersResponse,
  ApiAdminOrder,
  ApiBlogDoc,
  ApiCategoryTreeMain,
  ApiServicePage,
  ApiVenueDoc,
  ServicePageKey,
  UpdateBlogBody,
} from "@/api/admins";
import type { ProductModalSavePayload, VenueSavePayload } from "@/components/modals/FormModals";

export type { ApiServicePage, ServicePageKey };

const S = "/superadmins";

export type ApiSuperAdminSession = {
  id?: string;
  _id?: string;
  fullName?: string;
  email?: string;
};

export async function superAdminLogin(body: { email: string; password: string }) {
  return apiFetch<{ superAdmin: ApiSuperAdminSession }>(`${S}/login`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

/** Session restore probe — 200 means super-admin cookies are valid. */
export async function superAdminSessionProbe() {
  return apiFetch<{ pendingAdmins: unknown[] }>(`${S}/pending-admins`, { method: "GET" });
}

export async function superAdminLogout() {
  return apiFetch<{ message: string }>(`${S}/logout`, { method: "GET" });
}

/** Registration step 1 — blocked in production on backend (403). */
export async function sendSuperAdminSignupOtp(body: { email: string }) {
  return apiFetch<{ message: string }>(`${S}/send-otp`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

/** Registration step 2 — creates super admin and sets session cookies (201). */
export async function verifySuperAdminSignup(body: {
  fullName: string;
  email: string;
  password: string;
  otp: string;
}) {
  return apiFetch<{ superAdmin: ApiSuperAdminSession; message?: string }>(`${S}/verify-otp`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function superAdminForgotPassword(body: { email: string }) {
  return apiFetch<{ message: string }>(`${S}/forgot-password`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function superAdminResetPassword(body: {
  email: string;
  otp: string;
  newPassword: string;
}) {
  return apiFetch<{ message: string }>(`${S}/reset-password`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function getSuperAdminProducts() {
  return apiFetch<{ products: Record<string, unknown>[] }>(`${S}/products?limit=50`, {
    method: "GET",
  });
}

export async function getSuperAdminVenues() {
  return apiFetch<{ venues: Record<string, unknown>[] }>(`${S}/venues`, { method: "GET" });
}

export async function superAdminUpdateProduct(productId: string, data: ProductModalSavePayload) {
  const urls: string[] = [];
  const files: File[] = [];
  for (const s of data.imageSlots) {
    if (s.kind === "url") urls.push(s.url);
    else files.push(s.file);
  }

  const jsonBody: Record<string, unknown> = {
    name: data.name,
    description: data.description,
    price: data.price,
    mainCategory: data.mainCategoryName,
    subCategory: data.subCategoryName,
    thirdCategory: data.thirdSubCategoryName,
    images: urls,
    isFeatured: data.featured,
    tier: data.tier,
    tags: data.tags,
    inclusions: data.inclusions,
    exclusions: data.exclusions,
    experiences: data.experiences,
    keyHighlights: data.keyHighlights,
    additionalCategories: data.additionalCategories,
    customizationSections: data.customizationSections,
    serviceableAreas: data.serviceableAreas,
    location: data.location || undefined,
    setupDuration: data.setupDuration || undefined,
    teamSize: data.teamSize || undefined,
    advanceBooking: data.advanceBooking || undefined,
    cancellationPolicy: data.cancellationPolicy || undefined,
    youtubeVideoLink: data.youtubeVideoLink || undefined,
  };
  if (data.discountedPrice != null) jsonBody.discountedPrice = data.discountedPrice;
  if (data.balloonColorSelection) {
    jsonBody.balloonColorSelection = data.balloonColorSelection;
  }
  if (data.giftCardSelection) {
    jsonBody.giftCardSelection = data.giftCardSelection;
  }

  if (files.length === 0) {
    return apiFetch<{ message: string; product: unknown }>(
      `${S}/edit-product/${encodeURIComponent(productId)}`,
      { method: "PUT", body: JSON.stringify(jsonBody) }
    );
  }

  const fd = new FormData();
  fd.append("images", JSON.stringify(urls));
  for (const f of files) {
    fd.append("images", f);
  }
  fd.append("name", data.name);
  fd.append("description", data.description);
  fd.append("price", String(data.price));
  if (data.discountedPrice != null) fd.append("discountedPrice", String(data.discountedPrice));
  fd.append("mainCategory", data.mainCategoryName);
  fd.append("subCategory", data.subCategoryName);
  fd.append("thirdCategory", data.thirdSubCategoryName);
  fd.append("isFeatured", data.featured ? "true" : "false");
  fd.append("tier", data.tier);
  fd.append("tags", JSON.stringify(data.tags));
  fd.append("inclusions", JSON.stringify(data.inclusions));
  fd.append("exclusions", JSON.stringify(data.exclusions));
  fd.append("experiences", JSON.stringify(data.experiences));
  fd.append("keyHighlights", JSON.stringify(data.keyHighlights));
  fd.append("additionalCategories", JSON.stringify(data.additionalCategories));
  fd.append("customizationSections", JSON.stringify(data.customizationSections));
  fd.append("serviceableAreas", JSON.stringify(data.serviceableAreas));
  if (data.location) fd.append("location", data.location);
  if (data.setupDuration) fd.append("setupDuration", data.setupDuration);
  if (data.teamSize) fd.append("teamSize", data.teamSize);
  if (data.advanceBooking) fd.append("advanceBooking", data.advanceBooking);
  if (data.cancellationPolicy) fd.append("cancellationPolicy", data.cancellationPolicy);
  if (data.youtubeVideoLink) fd.append("youtubeVideoLink", data.youtubeVideoLink);
  if (data.balloonColorSelection) {
    fd.append("balloonColorSelection", JSON.stringify(data.balloonColorSelection));
  }
  if (data.giftCardSelection) {
    fd.append("giftCardSelection", JSON.stringify(data.giftCardSelection));
  }

  return apiFetch<{ message: string; product: unknown }>(
    `${S}/edit-product/${encodeURIComponent(productId)}`,
    { method: "PUT", body: fd }
  );
}

export async function superAdminDeleteProduct(productId: string) {
  return apiFetch<{ message: string }>(`${S}/delete-product/${encodeURIComponent(productId)}`, {
    method: "DELETE",
  });
}

export async function superAdminUpdateVenue(
  venueId: string,
  data: VenueSavePayload & { existingImageUrls?: string[] }
) {
  const typesOfVenues = (data.typesOfVenues ?? "")
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
  const facilities = (data.facilities ?? "")
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
  const accessibilityFeatures = (data.accessibilityFeatures ?? "")
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
  const restrictions = (data.restrictions ?? "")
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
  const weeksRaw =
    data.advanceBookingWeeks != null && String(data.advanceBookingWeeks).trim() !== ""
      ? Number(data.advanceBookingWeeks)
      : undefined;
  const advanceBookingWeeks =
    weeksRaw != null && Number.isFinite(weeksRaw) && weeksRaw >= 0 ? weeksRaw : undefined;
  const inHouseDecor = Boolean(data.inHouseDecor);
  const otherInformation =
    inHouseDecor || advanceBookingWeeks != null
      ? {
          ...(inHouseDecor ? { inHouseDecor: true } : {}),
          ...(advanceBookingWeeks != null ? { advanceBookingWeeks } : {}),
        }
      : undefined;
  const startingPrice = Number(data.startingPrice);
  const cMin =
    data.capacityMin != null && String(data.capacityMin).trim() !== ""
      ? Number(data.capacityMin)
      : undefined;
  const cMax =
    data.capacityMax != null && String(data.capacityMax).trim() !== ""
      ? Number(data.capacityMax)
      : undefined;
  const capacity =
    cMin != null && cMax != null && Number.isFinite(cMin) && Number.isFinite(cMax)
      ? { min: cMin, max: cMax }
      : undefined;

  const location = {
    address: data.address.trim(),
    ...(data.city?.trim() ? { city: data.city.trim() } : {}),
    ...(data.mapsUrl?.trim() ? { mapsUrl: data.mapsUrl.trim() } : {}),
    lat:
      data.lat != null && String(data.lat).trim() !== "" ? Number(data.lat) : undefined,
    lng:
      data.lng != null && String(data.lng).trim() !== "" ? Number(data.lng) : undefined,
  };

  const existing = data.existingImageUrls ?? [];
  const newFiles = data.imageFiles ?? [];

  if (newFiles.length === 0) {
    return apiFetch<{ message: string; venue: ApiVenueDoc }>(
      `${S}/edit-venue/${encodeURIComponent(venueId)}`,
      {
        method: "PUT",
        body: JSON.stringify({
          name: data.name.trim(),
          description: data.description.trim(),
          startingPrice,
          location,
          typesOfVenues,
          facilities,
          accessibilityFeatures,
          restrictions,
          ...(otherInformation != null ? { otherInformation } : {}),
          ...(capacity != null ? { capacity } : {}),
          images: existing,
        }),
      }
    );
  }

  const fd = new FormData();
  fd.append("images", JSON.stringify(existing));
  for (const f of newFiles.slice(0, 10)) {
    fd.append("images", f);
  }
  fd.append("name", data.name.trim());
  fd.append("description", data.description.trim());
  fd.append("startingPrice", String(startingPrice));
  fd.append("location", JSON.stringify(location));
  fd.append("typesOfVenues", JSON.stringify(typesOfVenues));
  fd.append("facilities", JSON.stringify(facilities));
  fd.append("accessibilityFeatures", JSON.stringify(accessibilityFeatures));
  fd.append("restrictions", JSON.stringify(restrictions));
  if (otherInformation != null) fd.append("otherInformation", JSON.stringify(otherInformation));
  if (capacity != null) fd.append("capacity", JSON.stringify(capacity));

  return apiFetch<{ message: string; venue: ApiVenueDoc }>(
    `${S}/edit-venue/${encodeURIComponent(venueId)}`,
    { method: "PUT", body: fd }
  );
}

export async function superAdminDeleteVenue(venueId: string) {
  return apiFetch<{ message: string }>(`${S}/delete-venue/${encodeURIComponent(venueId)}`, {
    method: "DELETE",
  });
}

export async function getSuperAdminPendingAdmins() {
  return apiFetch<{ pendingAdmins: Record<string, unknown>[] }>(`${S}/pending-admins`, {
    method: "GET",
  });
}

export async function getSuperAdminAdminsList() {
  return apiFetch<{ admins: Record<string, unknown>[] }>(`${S}/admins`, { method: "GET" });
}

export async function approveSuperAdminVendor(adminId: string) {
  return apiFetch<{ message: string; admin: unknown }>(
    `${S}/approve-admin/${encodeURIComponent(adminId)}`,
    { method: "POST", body: JSON.stringify({}) }
  );
}

export async function rejectSuperAdminVendor(adminId: string) {
  return apiFetch<{ message: string }>(
    `${S}/reject-admin/${encodeURIComponent(adminId)}`,
    { method: "POST", body: JSON.stringify({}) }
  );
}

export async function getSuperAdminCategoryTree() {
  return apiFetch<{ categoryTree: ApiCategoryTreeMain[] }>(`${S}/category-tree`, {
    method: "GET",
  });
}

export async function updateSuperAdminMainCategory(id: string, body: { name: string }) {
  return apiFetch<{ message: string; category: unknown }>(
    `${S}/main-category/${encodeURIComponent(id)}`,
    { method: "PUT", body: JSON.stringify(body) }
  );
}

export async function deleteSuperAdminMainCategory(id: string) {
  return apiFetch<{ message: string }>(`${S}/main-category/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}

export async function updateSuperAdminSubCategory(
  id: string,
  body: { name?: string; mainCategory?: string; description?: string },
  bannerImage?: File | null
) {
  if (bannerImage) {
    const fd = new FormData();
    if (body.name != null) fd.append("name", body.name);
    if (body.mainCategory != null) fd.append("mainCategory", body.mainCategory);
    if (body.description != null) fd.append("description", body.description);
    fd.append("bannerImage", bannerImage);
    return apiFetch<{ message: string; category: unknown }>(
      `${S}/sub-category/${encodeURIComponent(id)}`,
      { method: "PUT", body: fd }
    );
  }
  return apiFetch<{ message: string; category: unknown }>(
    `${S}/sub-category/${encodeURIComponent(id)}`,
    { method: "PUT", body: JSON.stringify(body) }
  );
}

export async function deleteSuperAdminSubCategory(id: string) {
  return apiFetch<{ message: string }>(`${S}/sub-category/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}

export async function updateSuperAdminThirdCategory(
  id: string,
  body: { name?: string; subCategory?: string; description?: string },
  bannerImage?: File | null
) {
  if (bannerImage) {
    const fd = new FormData();
    if (body.name != null) fd.append("name", body.name);
    if (body.subCategory != null) fd.append("subCategory", body.subCategory);
    if (body.description != null) fd.append("description", body.description);
    fd.append("bannerImage", bannerImage);
    return apiFetch<{ message: string; category: unknown }>(
      `${S}/third-category/${encodeURIComponent(id)}`,
      { method: "PUT", body: fd }
    );
  }
  return apiFetch<{ message: string; category: unknown }>(
    `${S}/third-category/${encodeURIComponent(id)}`,
    { method: "PUT", body: JSON.stringify(body) }
  );
}

export async function deleteSuperAdminThirdCategory(id: string) {
  return apiFetch<{ message: string }>(`${S}/third-category/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}

export async function updateSuperAdminAdditionalCategory(
  id: string,
  body: {
    name?: string;
    parentCategory?: string;
    parentModel?: string;
    description?: string;
    level?: number;
  },
  bannerImage?: File | null
) {
  if (bannerImage) {
    const fd = new FormData();
    if (body.name != null) fd.append("name", body.name);
    if (body.parentCategory != null) fd.append("parentCategory", body.parentCategory);
    if (body.parentModel != null) fd.append("parentModel", body.parentModel);
    if (body.description != null) fd.append("description", body.description);
    if (body.level != null) fd.append("level", String(body.level));
    fd.append("bannerImage", bannerImage);
    return apiFetch<{ message: string; category: unknown }>(
      `${S}/additional-category/${encodeURIComponent(id)}`,
      { method: "PUT", body: fd }
    );
  }
  return apiFetch<{ message: string; category: unknown }>(
    `${S}/additional-category/${encodeURIComponent(id)}`,
    { method: "PUT", body: JSON.stringify(body) }
  );
}

export async function deleteSuperAdminAdditionalCategory(id: string) {
  return apiFetch<{ message: string }>(`${S}/additional-category/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}

export async function superAdminAddHeroBanner(body: {
  image: File;
  subCategory?: string;
  thirdCategory?: string;
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
  title?: string;
  description?: string;
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
  if (body.description != null && String(body.description).trim() !== "") {
    fd.append("description", String(body.description).trim());
  }
  return apiFetch<{ message: string; banner: unknown }>(`${S}/add-hero-section-banner`, {
    method: "POST",
    body: fd,
  });
}

export async function getSuperAdminBlogs(params?: { page?: number; limit?: number }) {
  const search = new URLSearchParams();
  if (params?.page != null) search.set("page", String(params.page));
  if (params?.limit != null) search.set("limit", String(params.limit));
  const q = search.toString();
  return apiFetch<{
    blogs: ApiBlogDoc[];
    pagination: {
      currentPage: number;
      totalPages: number;
      totalBlogs: number;
      hasNext: boolean;
      hasPrev: boolean;
    };
  }>(`${S}/blogs${q ? `?${q}` : ""}`, { method: "GET" });
}

export async function getSuperAdminBlog(blogId: string) {
  return apiFetch<{ blog: ApiBlogDoc }>(`${S}/blogs/${encodeURIComponent(blogId)}`, {
    method: "GET",
  });
}

export async function superAdminUpdateBlog(blogId: string, body: UpdateBlogBody) {
  const fd = new FormData();
  if (body.title != null) fd.append("title", body.title);
  if (body.content != null) fd.append("content", body.content);
  if (body.excerpt != null) fd.append("excerpt", body.excerpt);
  if (body.category != null) fd.append("category", body.category);
  if (body.tags != null) fd.append("tags", JSON.stringify(body.tags));
  if (body.published != null) fd.append("published", body.published ? "true" : "false");
  if (body.metaTitle != null) fd.append("metaTitle", body.metaTitle);
  if (body.metaDescription != null) fd.append("metaDescription", body.metaDescription);
  if (body.featuredImage instanceof File) fd.append("featuredImage", body.featuredImage);
  return apiFetch<{ blog: ApiBlogDoc; message?: string }>(
    `${S}/blogs/${encodeURIComponent(blogId)}`,
    { method: "PUT", body: fd }
  );
}

export async function superAdminDeleteBlog(blogId: string) {
  return apiFetch<{ message: string }>(`${S}/blogs/${encodeURIComponent(blogId)}`, {
    method: "DELETE",
  });
}

export async function getSuperAdminOrders(params?: { page?: number; limit?: number }) {
  const search = new URLSearchParams();
  if (params?.page != null) search.set("page", String(params.page));
  if (params?.limit != null) search.set("limit", String(params.limit));
  const q = search.toString();
  return apiFetch<AdminOrdersResponse>(`${S}/orders${q ? `?${q}` : ""}`, { method: "GET" });
}

export async function getSuperAdminOrder(orderId: string) {
  return apiFetch<{ order: ApiAdminOrder }>(
    `${S}/orders/${encodeURIComponent(orderId)}`,
    { method: "GET" }
  );
}

export type CorporateBookingStatus = "new" | "contacted" | "closed";

export type ApiCorporateBooking = {
  _id: string;
  name: string;
  email: string;
  phone: string;
  serviceType: string;
  message?: string;
  status: CorporateBookingStatus;
  createdAt: string;
  updatedAt?: string;
};

export async function getSuperAdminCorporateBookings() {
  return apiFetch<{ bookings: ApiCorporateBooking[] }>(`${S}/corporate-bookings`, {
    method: "GET",
  });
}

export async function updateSuperAdminCorporateBookingStatus(
  contactId: string,
  status: CorporateBookingStatus
) {
  return apiFetch<{ message: string; booking: ApiCorporateBooking }>(
    `${S}/corporate-bookings/${encodeURIComponent(contactId)}/status`,
    {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }
  );
}

export async function getSuperAdminServicePages() {
  return apiFetch<{ pages: ApiServicePage[] }>(`${S}/service-pages`, { method: "GET" });
}

export async function updateSuperAdminServicePage(
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
    `${S}/service-pages/${encodeURIComponent(serviceKey)}`,
    { method: "PUT", body: fd }
  );
}

export async function addSuperAdminServicePageItem(
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
    `${S}/service-pages/${encodeURIComponent(serviceKey)}/items`,
    { method: "POST", body: fd }
  );
}

export async function updateSuperAdminServicePageItem(
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
    `${S}/service-pages/${encodeURIComponent(serviceKey)}/items/${encodeURIComponent(itemId)}`,
    { method: "PUT", body: fd }
  );
}

export async function deleteSuperAdminServicePageItem(
  serviceKey: ServicePageKey | string,
  itemId: string
) {
  return apiFetch<{ message: string; page: ApiServicePage }>(
    `${S}/service-pages/${encodeURIComponent(serviceKey)}/items/${encodeURIComponent(itemId)}`,
    { method: "DELETE" }
  );
}
