import type { Transaction, AdminTransaction, User } from './types';

function getToken(): string {
  return localStorage.getItem('cc_token') ?? '';
}

function authHeaders() {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${getToken()}`,
  };
}

export async function fetchCustomerTransactions(params: {
  status?: string;
  from?: string;
  to?: string;
}): Promise<Transaction[]> {
  const query = new URLSearchParams();
  if (params.status) query.set('status', params.status);
  if (params.from) query.set('from', params.from);
  if (params.to) query.set('to', params.to);

  const res = await fetch(`/api/transactions?${query}`, { headers: authHeaders() });
  if (!res.ok) throw new Error('Failed to fetch transactions');
  return res.json();
}

export async function createTransaction(data: {
  merchant: string;
  amount: number;
}): Promise<Transaction> {
  const res = await fetch('/api/transactions', {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error ?? 'Failed to create transaction');
  }
  return res.json();
}

export async function fetchAdminTransactions(params: {
  status?: string;
  customer_id?: string;
  from?: string;
  to?: string;
}): Promise<AdminTransaction[]> {
  const query = new URLSearchParams();
  if (params.status) query.set('status', params.status);
  if (params.customer_id) query.set('customer_id', params.customer_id);
  if (params.from) query.set('from', params.from);
  if (params.to) query.set('to', params.to);

  const res = await fetch(`/api/admin/transactions?${query}`, { headers: authHeaders() });
  if (!res.ok) throw new Error('Failed to fetch transactions');
  return res.json();
}

export async function reverseTransaction(id: string): Promise<AdminTransaction> {
  const res = await fetch(`/api/admin/transactions/${id}/reverse`, {
    method: 'PATCH',
    headers: authHeaders(),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error ?? 'Failed to reverse transaction');
  }
  return res.json();
}

export async function fetchAdminUsers(): Promise<Pick<User, 'id' | 'full_name' | 'email'>[]> {
  const res = await fetch('/api/admin/users', { headers: authHeaders() });
  if (!res.ok) throw new Error('Failed to fetch users');
  return res.json();
}
