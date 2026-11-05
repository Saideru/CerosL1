// Mirrors the CHECK lists on public.activity_log_tb in supabase/ceros_db.sql
export type ActivityAction =
  | 'sign_in'
  | 'sign_out'
  | 'sign_up'
  | 'open_calculator'
  | 'export_csv'
  | 'copy_csv'
  | 'run_acceptance_tests'
  | 'client_activated'
  | 'client_deactivated'
  | 'user_type_changed';

export type CalculatorKey = 'vat' | 'invoice_bill' | 'payment' | 'balancer' | 'statement' | 'aging';

export const ACTIVITY_LABELS: Record<ActivityAction, string> = {
  sign_in: 'Signed in',
  sign_out: 'Signed out',
  sign_up: 'Registered',
  open_calculator: 'Opened calculator',
  export_csv: 'Downloaded journal CSV',
  copy_csv: 'Copied journal CSV',
  run_acceptance_tests: 'Opened acceptance tests',
  client_activated: 'Activated an account',
  client_deactivated: 'Deactivated an account',
  user_type_changed: 'Changed a user type'
};

export const CALCULATOR_LABELS: Record<CalculatorKey, string> = {
  vat: 'VAT',
  invoice_bill: 'Invoice & Bill',
  payment: 'Payment',
  balancer: 'Journal Balancer',
  statement: 'Statement Check',
  aging: 'Aging'
};

/** Row shape of public.activity_log_tb */
export interface ActivityLogRow {
  id: number;
  user_id: string;
  action: ActivityAction;
  calculator: CalculatorKey | null;
  details: Record<string, unknown>;
  user_agent: string | null;
  created_at: string;
}
