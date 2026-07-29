const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

function getToken(): string | null {
  return localStorage.getItem('token');
}

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_URL}${path}`, { ...options, headers });
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.error || `Request failed (${res.status})`);
  }
  return data as T;
}

export const api = {
  login: (email: string, password: string) =>
    request<{ token: string; user: import('../types').User }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  getCustomers: (params?: { search?: string; page?: number; limit?: number }) => {
    const q = new URLSearchParams();
    if (params?.search) q.set('search', params.search);
    if (params?.page) q.set('page', String(params.page));
    if (params?.limit) q.set('limit', String(params.limit));
    return request<import('../types').PaginatedResponse<import('../types').Customer>>(
      `/customers?${q}`
    );
  },

  getCustomer: (id: string) =>
    request<import('../types').Customer>(`/customers/${id}`),

  createCustomer: (data: Record<string, unknown>) =>
    request<import('../types').Customer>('/customers', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateCustomer: (id: string, data: Record<string, unknown>) =>
    request<import('../types').Customer>(`/customers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  addCustomerNote: (id: string, content: string) =>
    request<import('../types').FollowUpNote>(`/customers/${id}/notes`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    }),

  getProducts: (params?: { search?: string; lowStock?: boolean; page?: number; limit?: number }) => {
    const q = new URLSearchParams();
    if (params?.search) q.set('search', params.search);
    if (params?.lowStock) q.set('lowStock', 'true');
    if (params?.page) q.set('page', String(params.page));
    if (params?.limit) q.set('limit', String(params.limit));
    return request<import('../types').PaginatedResponse<import('../types').Product>>(
      `/products?${q}`
    );
  },

  getProduct: (id: string) =>
    request<import('../types').Product>(`/products/${id}`),

  createProduct: (data: Record<string, unknown>) =>
    request<import('../types').Product>('/products', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateProduct: (id: string, data: Record<string, unknown>) =>
    request<import('../types').Product>(`/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  addStockMovement: (id: string, data: Record<string, unknown>) =>
    request<{ movement: import('../types').StockMovement; product: import('../types').Product }>(
      `/products/${id}/stock-movement`,
      { method: 'POST', body: JSON.stringify(data) }
    ),

  getStockMovements: (id: string, page = 1) =>
    request<import('../types').PaginatedResponse<import('../types').StockMovement>>(
      `/products/${id}/stock-movements?page=${page}&limit=20`
    ),

  getChallans: (params?: { status?: string; page?: number; limit?: number }) => {
    const q = new URLSearchParams();
    if (params?.status) q.set('status', params.status);
    if (params?.page) q.set('page', String(params.page));
    if (params?.limit) q.set('limit', String(params.limit));
    return request<import('../types').PaginatedResponse<import('../types').Challan>>(
      `/challans?${q}`
    );
  },

  getChallan: (id: string) =>
    request<import('../types').Challan>(`/challans/${id}`),

  createChallan: (data: Record<string, unknown>) =>
    request<import('../types').Challan>('/challans', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateChallan: (id: string, data: Record<string, unknown>) =>
    request<import('../types').Challan>(`/challans/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  confirmChallan: (id: string) =>
    request<import('../types').Challan>(`/challans/${id}/confirm`, { method: 'POST' }),

  cancelChallan: (id: string) =>
    request<import('../types').Challan>(`/challans/${id}/cancel`, { method: 'POST' }),
};
