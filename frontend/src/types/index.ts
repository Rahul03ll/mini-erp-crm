export type Role = 'Admin' | 'Sales' | 'Warehouse' | 'Accounts';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
}

export interface Customer {
  id: string;
  name: string;
  mobileNumber: string;
  email?: string | null;
  businessName?: string | null;
  gstNumber?: string | null;
  customerType: 'Retail' | 'Wholesale' | 'Distributor';
  address?: string | null;
  status: 'Lead' | 'Active' | 'Inactive';
  followUpDate?: string | null;
  createdAt: string;
  updatedAt: string;
  followUpNotes?: FollowUpNote[];
}

export interface FollowUpNote {
  id: string;
  customerId: string;
  content: string;
  createdBy: string;
  createdAt: string;
  author?: { id: string; name: string };
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  category?: string | null;
  unitPrice: string | number;
  currentStock: number;
  minStockAlert: number;
  location?: string | null;
}

export interface StockMovement {
  id: string;
  productId: string;
  quantityChanged: number;
  movementType: 'IN' | 'OUT';
  reason: string;
  createdAt: string;
  user?: { id: string; name: string };
}

export interface ChallanLineItem {
  id: string;
  productId: string;
  productNameSnapshot: string;
  skuSnapshot: string;
  unitPriceSnapshot: string | number;
  quantity: number;
}

export interface Challan {
  id: string;
  challanNumber: string;
  customerId: string;
  totalQuantity: number;
  status: 'Draft' | 'Confirmed' | 'Cancelled';
  createdDate: string;
  customer?: { id: string; name: string; businessName?: string | null };
  creator?: { id: string; name: string };
  lineItems: ChallanLineItem[];
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: Pagination;
}

export type Permission =
  | 'manage_customers'
  | 'manage_products'
  | 'manage_challans'
  | 'view_reports';

export const rolePermissions: Record<Role, Permission[]> = {
  Admin: ['manage_customers', 'manage_products', 'manage_challans', 'view_reports'],
  Sales: ['manage_customers', 'manage_challans'],
  Warehouse: ['manage_products'],
  Accounts: ['view_reports'],
};

export function hasPermission(role: Role, permission: Permission): boolean {
  return rolePermissions[role].includes(permission);
}
