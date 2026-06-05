// Mirrors backend/Entities and backend/DTOs.

export interface Service {
  id: number;
  serviceName: string;
  description?: string | null;
  durationMinutes: number;
  price: number;
  isActive: boolean;
  createdAt: string;
}

export interface Staff {
  id: number;
  fullName: string;
  role: string;
  roles: string[];
  phoneNumber?: string | null;
  isActive: boolean;
  createdAt: string;
}

export interface Customer {
  id: number;
  fullName: string;
  phoneNumber?: string | null;
  email?: string | null;
  gender?: string | null;
  dateOfBirth?: string | null;
  notes?: string | null;
  createdAt: string;
}

export type AppointmentStatus = "Booked" | "Done" | "NoShow" | "Cancelled";

export interface Appointment {
  id: number;
  customerId?: number | null;
  guestName?: string | null;
  staffId?: number | null;
  serviceId: number;
  appointmentDate: string;
  appointmentTime: string;
  status: AppointmentStatus | string;
  remarks?: string | null;
  amountPaid?: number | null;
  paymentMethod?: string | null;
  completedAt?: string | null;
  createdAt: string;
  customer?: Customer | null;
  staff?: Staff | null;
  service?: Service | null;
}

export interface CreateAppointmentPayload {
  customerId?: number;
  phoneNumber?: string;
  fullName?: string;
  serviceId: number;
  staffId?: number | null;
  appointmentDate: string;
  appointmentTime: string;
  remarks?: string;
  /** Honeypot anti-spam field — left empty by real users. */
  website?: string;
}

export interface AttachCustomerPayload {
  phoneNumber: string;
  fullName?: string;
}

export interface AssignSpecialistPayload {
  staffId: number | null;
}

export interface MarkDonePayload {
  status?: "Done" | "NoShow" | "Cancelled";
  amountPaid?: number;
  paymentMethod?: string;
}

export interface TodayAppointments {
  date: string;
  appointments: Appointment[];
}

export interface CustomerHistory {
  customer: Customer;
  stats: {
    visitCount: number;
    lifetimeValue: number;
    lastVisitDate?: string | null;
  };
  appointments: Appointment[];
}

export interface MergeCustomersResult {
  customer: Customer;
  mergedAppointmentCount: number;
  removedCustomerId: number;
}

export interface DormantCustomer {
  customer: Customer;
  lastVisit: string;
}

export interface DormantCustomersResponse {
  daysThreshold: number;
  customers: DormantCustomer[];
}

export interface StaffAccount {
  id: number;
  fullName: string;
  role: string;
  roles: string[];
  username: string;
  email?: string | null;
  phoneNumber?: string | null;
  isActive: boolean;
  isApproved: boolean;
  registeredAt?: string | null;
  approvedAt?: string | null;
}

export interface Review {
  id: number;
  authorName: string;
  quote: string;
  rating: number;
  guestSince?: string | null;
  isApproved: boolean;
  createdAt: string;
}

export interface CreateReviewPayload {
  authorName: string;
  quote: string;
  rating?: number;
  guestSince?: string;
}

export interface PostSummary {
  id: number;
  slug: string;
  title: string;
  excerpt: string;
  coverImageUrl?: string | null;
  tags?: string | null;
  publishedAt?: string | null;
  createdAt: string;
}

export interface AdminPostSummary extends PostSummary {
  isPublished: boolean;
  updatedAt: string;
}

export interface Post extends PostSummary {
  body: string;
  isPublished: boolean;
  updatedAt: string;
}

export interface CreatePostPayload {
  title: string;
  excerpt: string;
  body: string;
  coverImageUrl?: string | null;
  tags?: string | null;
  publish?: boolean;
}

export interface UpdatePostPayload {
  title?: string;
  excerpt?: string;
  body?: string;
  coverImageUrl?: string | null;
  tags?: string | null;
  isPublished?: boolean;
}

export interface DaySummary {
  date: string;
  totals: {
    appointments: number;
    booked: number;
    done: number;
    noShow: number;
    cancelled: number;
    revenue: number;
    avgTicket: number;
    newCustomers: number;
  };
  byStaff: {
    staffId: number | null;
    staffName: string;
    total: number;
    done: number;
    revenue: number;
  }[];
  byService: {
    serviceId: number | null;
    serviceName: string;
    total: number;
    done: number;
    revenue: number;
  }[];
  byPaymentMethod: {
    method: string;
    count: number;
    revenue: number;
  }[];
}
