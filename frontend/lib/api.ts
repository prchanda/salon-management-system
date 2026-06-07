import type {
  Appointment,
  AssignSpecialistPayload,
  AttachCustomerPayload,
  CreateAppointmentPayload,
  CreatePostPayload,
  CreateProductOrderPayload,
  CreateProductPayload,
  CreateReviewPayload,
  Customer,
  CustomerHistory,
  DaySummary,
  DormantCustomersResponse,
  MarkDonePayload,
  MergeCustomersResult,
  AdminPostSummary,
  Post,
  PostSummary,
  Product,
  ProductOrder,
  Review,
  Service,
  Staff,
  StaffAccount,
  TodayAppointments,
  UpdatePostPayload,
  UpdateProductPayload,
} from "./types";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:7071/api";

// Same-origin proxy that the browser uses to reach privileged endpoints. The
// proxy verifies the reception session cookie and injects the backend API key
// server-side, so the secret is never shipped to the client. (Kept off the
// "/api" path, which Azure Static Web Apps reserves for its managed backend.)
const SECURE_PROXY_BASE = "/bff";

/**
 * Endpoints anonymous visitors may call without the shared API key. Everything
 * else is privileged (reception/owner only). Default-deny: an unlisted path is
 * treated as privileged. Keep in sync with backend/Helpers/PublicEndpoints.cs.
 */
function isPublicEndpoint(method: string, rawPath: string): boolean {
  const path = rawPath.split("?")[0].replace(/^\/+|\/+$/g, "");
  const segments = path.split("/").filter(Boolean);
  const m = (method ?? "GET").toUpperCase();

  if (m === "GET") {
    const publicGet = new Set([
      "services",
      "staff",
      "reviews",
      "posts",
      "products",
      "staff/registration/available",
    ]);
    if (publicGet.has(path)) return true;
    // Single-segment slug reads: posts/{slug}, products/{slug}. The admin
    // variants have an extra segment and stay privileged.
    if (
      segments.length === 2 &&
      (segments[0] === "posts" || segments[0] === "products") &&
      segments[1] !== "admin"
    ) {
      return true;
    }
    return false;
  }

  if (m === "POST") {
    const publicPost = new Set([
      "reviews",
      "appointments",
      "product-orders",
      "staff/login",
      "staff/registration/register",
      "staff/password-reset/request",
      "staff/password-reset/complete",
    ]);
    return publicPost.has(path);
  }

  return false;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  // Callers may opt into ISR-friendly caching by passing `cache` or
  // `next: { revalidate, tags }`. If neither is provided we keep the
  // historical no-store behaviour so mutating / admin endpoints never
  // serve stale data.
  const hasCacheOverride =
    !!init?.cache || (init as RequestInit & { next?: unknown })?.next != null;

  const method = init?.method ?? "GET";
  const isPublic = isPublicEndpoint(method, path);
  const onServer = typeof window === "undefined";

  // Resolve the target URL + auth header based on visibility and runtime:
  //   public            -> backend directly, no key
  //   privileged/server -> backend directly + X-Api-Key (server-only secret)
  //   privileged/client -> same-origin proxy (it injects the key after a cookie check)
  let url: string;
  const authHeaders: Record<string, string> = {};
  if (isPublic) {
    url = `${API_BASE_URL}${path}`;
  } else if (onServer) {
    url = `${API_BASE_URL}${path}`;
    const apiKey = process.env.BACKEND_API_KEY;
    if (apiKey) authHeaders["X-Api-Key"] = apiKey;
  } else {
    url = `${SECURE_PROXY_BASE}${path}`;
  }

  const res = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...authHeaders,
      ...(init?.headers ?? {}),
    },
    ...(hasCacheOverride ? {} : { cache: "no-store" as RequestCache }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(
      `Request failed: ${res.status} ${res.statusText}${text ? ` - ${text}` : ""}`
    );
  }

  if (res.status === 204) {
    return undefined as T;
  }

  return (await res.json()) as T;
}

// Default revalidate window (in seconds) for public read endpoints. Chosen
// to balance freshness (catalogue / reviews edits show up within minutes)
// against backend load and CDN hit-rate.
const PUBLIC_REVALIDATE = 300;

export const api = {
  // Public
  getServices: () =>
    request<Service[]>("/services", {
      next: { revalidate: PUBLIC_REVALIDATE },
    }),
  getStaff: () =>
    request<Staff[]>("/staff", {
      next: { revalidate: PUBLIC_REVALIDATE },
    }),
  getReviews: (limit?: number) =>
    request<Review[]>(`/reviews${limit ? `?limit=${limit}` : ""}`, {
      next: { revalidate: PUBLIC_REVALIDATE },
    }),
  submitReview: (payload: CreateReviewPayload) =>
    request<Review>("/reviews", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  // Reception — review moderation (owner only)
  getAdminReviews: () => request<Review[]>("/reviews/admin/list"),
  approveReview: (id: number) =>
    request<Review>(`/reviews/${id}/approve`, { method: "POST" }),
  deleteReview: (id: number) =>
    request<void>(`/reviews/${id}`, { method: "DELETE" }),

  // Public — blog
  getPosts: (limit?: number, tag?: string) => {
    const params = new URLSearchParams();
    if (limit) params.set("limit", String(limit));
    if (tag) params.set("tag", tag);
    const qs = params.toString();
    return request<PostSummary[]>(`/posts${qs ? `?${qs}` : ""}`, {
      next: { revalidate: PUBLIC_REVALIDATE },
    });
  },
  getPostBySlug: (slug: string) =>
    request<Post>(`/posts/${encodeURIComponent(slug)}`, {
      next: { revalidate: PUBLIC_REVALIDATE },
    }),

  // Reception — blog
  getAdminPosts: () => request<AdminPostSummary[]>("/posts/admin/list"),
  getAdminPostById: (id: number) => request<Post>(`/posts/admin/${id}`),
  createPost: (payload: CreatePostPayload) =>
    request<Post>("/posts", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  updatePost: (id: number, payload: UpdatePostPayload) =>
    request<Post>(`/posts/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),
  deletePost: (id: number) =>
    request<void>(`/posts/${id}`, { method: "DELETE" }),

  // Public — shop / products
  getProducts: (limit?: number, category?: string) => {
    const params = new URLSearchParams();
    if (limit) params.set("limit", String(limit));
    if (category) params.set("category", category);
    const qs = params.toString();
    return request<Product[]>(`/products${qs ? `?${qs}` : ""}`, {
      next: { revalidate: PUBLIC_REVALIDATE },
    });
  },
  getProductBySlug: (slug: string) =>
    request<Product>(`/products/${encodeURIComponent(slug)}`, {
      next: { revalidate: PUBLIC_REVALIDATE },
    }),
  createProductOrder: (payload: CreateProductOrderPayload) =>
    request<ProductOrder>("/product-orders", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  // Reception — products
  getAdminProducts: () => request<Product[]>("/products/admin/list"),
  getAdminProductById: (id: number) =>
    request<Product>(`/products/admin/${id}`),
  createProduct: (payload: CreateProductPayload) =>
    request<Product>("/products", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  updateProduct: (id: number, payload: UpdateProductPayload) =>
    request<Product>(`/products/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),
  deleteProduct: (id: number) =>
    request<void>(`/products/${id}`, { method: "DELETE" }),

  // Reception — product orders
  getProductOrders: (status?: string) =>
    request<ProductOrder[]>(
      `/product-orders${status ? `?status=${encodeURIComponent(status)}` : ""}`
    ),
  /**
   * Advance an order through its lifecycle by sending a lifecycle action.
   * Valid actions depend on the current status:
   *   Pending   → "confirm" | "cancel"
   *   Confirmed → "complete" | "cancel"
   *   Completed → (none — terminal)
   *   Cancelled → (none — terminal)
   * The server rejects illegal transitions with 409 Conflict.
   */
  updateProductOrderStatus: (
    id: number,
    action: "confirm" | "complete" | "cancel"
  ) =>
    request<ProductOrder>(`/product-orders/${id}/status`, {
      method: "PUT",
      body: JSON.stringify({ action }),
    }),

  // Reception — staff accounts (self-registration + login)
  getStaffAvailableForRegistration: () =>
    request<{ id: number; fullName: string; role: string }[]>(
      "/staff/registration/available"
    ),
  registerStaffAccount: (payload: {
    staffId: number;
    username: string;
    password: string;
  }) =>
    request<{
      id: number;
      fullName: string;
      role: string;
      username: string;
    }>("/staff/registration/register", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  staffLogin: (payload: { username: string; password: string }) =>
    request<{
      id: number;
      fullName: string;
      role: string;
      username: string;
      mustChangePassword?: boolean;
    }>("/staff/login", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  // Reception — appointments
  getTodayAppointments: (date?: string, staffId?: number | null) => {
    const params = new URLSearchParams();
    if (date) params.set("date", date);
    if (staffId) params.set("staffId", String(staffId));
    const qs = params.toString();
    return request<TodayAppointments>(
      `/appointments/today${qs ? `?${qs}` : ""}`
    );
  },
  createAppointment: (payload: CreateAppointmentPayload) =>
    request<{ appointment: Appointment; customer: Customer }>("/appointments", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  markAppointmentDone: (id: number, payload: MarkDonePayload) =>
    request<Appointment>(`/appointments/${id}/done`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),
  attachCustomerToAppointment: (id: number, payload: AttachCustomerPayload) =>
    request<{ appointment: Appointment; customer: Customer }>(
      `/appointments/${id}/attach-customer`,
      {
        method: "PUT",
        body: JSON.stringify(payload),
      }
    ),
  assignSpecialistToAppointment: (id: number, payload: AssignSpecialistPayload) =>
    request<Appointment>(`/appointments/${id}/assign-specialist`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),

  // Reception — customers
  getCustomers: () => request<Customer[]>("/customers"),
  getCustomerByPhone: (phone: string) =>
    request<Customer>(`/customers/by-phone/${encodeURIComponent(phone)}`),
  getCustomerHistory: (id: number) =>
    request<CustomerHistory>(`/customers/${id}/history`),
  updateCustomer: (
    id: number,
    payload: { fullName: string; phoneNumber?: string | null; email?: string | null }
  ) =>
    request<Customer>(`/customers/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),
  updateCustomerNotes: (id: number, notes: string | null) =>
    request<Customer>(`/customers/${id}/notes`, {
      method: "PUT",
      body: JSON.stringify({ notes }),
    }),
  mergeCustomers: (targetId: number, sourceCustomerId: number) =>
    request<MergeCustomersResult>(`/customers/${targetId}/merge`, {
      method: "POST",
      body: JSON.stringify({ sourceCustomerId }),
    }),
  getDormantCustomers: (days = 30) =>
    request<DormantCustomersResponse>(`/customers/dormant?days=${days}`),

  // Reception — staff account administration (owner only)
  getStaffAccounts: () => request<StaffAccount[]>("/staff/accounts"),
  getStaffSessionStatus: (id: number) =>
    request<{
      id: number;
      isActive: boolean;
      isApproved: boolean;
      mustChangePassword: boolean;
    }>(`/staff/${id}/session-status`),
  createStaffAccount: (payload: {
    fullName: string;
    roles: string[];
    phoneNumber: string;
    email?: string;
    username: string;
    password: string;
  }) =>
    request<StaffAccount>("/staff/accounts", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  updateStaffAccount: (
    id: number,
    payload: {
      fullName: string;
      roles: string[];
      phoneNumber: string;
      email?: string;
    }
  ) =>
    request<StaffAccount>(`/staff/${id}/profile`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),
  approveStaffAccount: (id: number) =>
    request<{ id: number; isApproved: boolean; approvedAt: string }>(
      `/staff/${id}/approve`,
      { method: "PUT" }
    ),
  rejectStaffAccount: (id: number) =>
    request<void>(`/staff/${id}/account`, { method: "DELETE" }),

  // Reception — reports
  getDaySummary: (date?: string) =>
    request<DaySummary>(`/reports/day-summary${date ? `?date=${date}` : ""}`),
};
