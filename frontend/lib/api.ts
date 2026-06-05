import type {
  Appointment,
  AssignSpecialistPayload,
  AttachCustomerPayload,
  CreateAppointmentPayload,
  CreatePostPayload,
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
  Review,
  Service,
  Staff,
  StaffAccount,
  TodayAppointments,
  UpdatePostPayload,
} from "./types";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:7071/api";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
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

export const api = {
  // Public
  getServices: () => request<Service[]>("/services"),
  getStaff: () => request<Staff[]>("/staff"),
  getReviews: (limit?: number) =>
    request<Review[]>(`/reviews${limit ? `?limit=${limit}` : ""}`),
  submitReview: (payload: CreateReviewPayload) =>
    request<Review>("/reviews", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  // Public — blog
  getPosts: (limit?: number, tag?: string) => {
    const params = new URLSearchParams();
    if (limit) params.set("limit", String(limit));
    if (tag) params.set("tag", tag);
    const qs = params.toString();
    return request<PostSummary[]>(`/posts${qs ? `?${qs}` : ""}`);
  },
  getPostBySlug: (slug: string) =>
    request<Post>(`/posts/${encodeURIComponent(slug)}`),

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
  getDormantCustomers: (days = 60) =>
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
