export type EnvelopeKind = 'main' | 'safety' | 'bill' | 'limit' | 'goal';
export type RecurringPeriod = 'weekly' | 'monthly' | 'yearly';
export type IncomeKind = 'recurring' | 'oneoff';
export type BillCadence = 'month' | 'quarter' | 'year';

export type Category = {
  id: string;
  name: string;
  icon: string;
  color: string;
  is_default: boolean;
  created_at: string;
};

export type Envelope = {
  id: string;
  name: string;
  emoji: string;
  color: string;
  kind: EnvelopeKind;
  balance: number;
  allocated: number | null;
  monthly_limit: number | null;
  target: number | null;
  deadline: string | null;
  cadence: BillCadence | null;
  sort_order: number;
  created_at: string;
};

export type Expense = {
  id: string;
  amount: number;
  category_id: string | null;
  envelope_id: string | null;
  note: string | null;
  date: string;
  created_at: string;
};

export type ExpenseWithRefs = Expense & {
  category: Category | null;
  envelope: Envelope | null;
};

export type RecurringPayment = {
  id: string;
  name: string;
  amount: number;
  period: RecurringPeriod;
  next_date: string;
  is_active: boolean;
  category_id: string | null;
  created_at: string;
};

export type PlannedExpense = {
  id: string;
  name: string;
  amount: number;
  target_date: string | null;
  is_done: boolean;
  category_id: string | null;
  created_at: string;
};

export type Income = {
  id: string;
  name: string;
  amount: number;
  kind: IncomeKind;
  next_date: string;
  is_active: boolean;
  envelope_id: string | null;
  created_at: string;
};

// We use an untyped supabase client; service modules enforce shapes manually.
