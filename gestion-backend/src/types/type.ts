export type UserRole =
  | "Admin"
  | "Professeur"
  | "Secretaire"
  | "Directeur"
  | "Doyen";
export type UserStatus = "Actif" | "Inactif";

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: UserRole;
  status: UserStatus;
  avatar?: string;
  lastLogin?: string;
  createdAt: string;
  updatedAt: string;
}

// types/expense.ts
export interface Expense {
  id: string;
  category: string;
  amount: number;
  description?: string;
  date: Date;
  paymentMethod: string;
  status: "Pending" | "Approved" | "Rejected";
  createdBy: string;
  approvedBy?: string;
  createdAt: Date;
  updatedAt: Date;
  creator?: User;
  approver?: User;
}

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

export interface CreateExpenseInput {
  category: string;
  amount: number;
  description?: string;
  date: Date;
  paymentMethod: string;
  createdBy: string;
}

export interface UpdateExpenseInput {
  category?: string;
  amount?: number;
  description?: string;
  date?: Date;
  paymentMethod?: string;
  status?: "Pending" | "Approved" | "Rejected";
  approvedBy?: string;
}

export interface ExpenseFilters {
  category?: string;
  status?: string;
  startDate?: Date;
  endDate?: Date;
  minAmount?: number;
  maxAmount?: number;
  page?: number;
  limit?: number;
}
