export interface User {
  id: string;
  email: string;
  full_name: string;
  role: 'customer' | 'admin';
}

export interface Transaction {
  id: string;
  customer_id: string;
  merchant: string;
  amount: number;
  status: 'PENDING' | 'POSTED' | 'REVERSED';
  transaction_date: string;
  created_at: string;
  updated_at: string;
}

export interface AdminTransaction extends Transaction {
  customer_name: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
}
