export type AccountType = 'Asset' | 'Liability' | 'Equity' | 'Revenue' | 'Expense';

export type TaxRateCode = 'vat_12' | 'zero_rated' | 'vat_exempt';

export interface TaxRateOption {
  code: TaxRateCode;
  label: string;
  rate: number; // e.g. 0.12 or 0.00
  description: string;
}

export const TAX_RATES: Record<TaxRateCode, TaxRateOption> = {
  vat_12: {
    code: 'vat_12',
    label: 'VAT 12%',
    rate: 0.12,
    description: 'Standard Philippine Value Added Tax (12%)'
  },
  zero_rated: {
    code: 'zero_rated',
    label: 'Zero-rated 0%',
    rate: 0.0,
    description: 'Export sales & zero-rated transactions'
  },
  vat_exempt: {
    code: 'vat_exempt',
    label: 'VAT Exempt 0%',
    rate: 0.0,
    description: 'Exempt agricultural, educational or medical transactions'
  }
};

export interface ChartAccount {
  code: string;
  name: string;
  type: AccountType;
  category: 'Asset' | 'Liability' | 'Equity' | 'Revenue' | 'Expense';
  systemKey?: string;
  description?: string;
}

// Chart of accounts according to CerosL1 Ledger SOP CL1-SOP-001 Appendix A
export const DEFAULT_CHART_OF_ACCOUNTS: ChartAccount[] = [
  { code: '1000', name: 'Business Bank Account', type: 'Asset', category: 'Asset', systemKey: 'BANK' },
  { code: '1100', name: 'Accounts Receivable', type: 'Asset', category: 'Asset', systemKey: 'AR' },
  { code: '1200', name: 'Inventory', type: 'Asset', category: 'Asset' },
  { code: '1300', name: 'Prepayments', type: 'Asset', category: 'Asset' },
  { code: '1500', name: 'Equipment', type: 'Asset', category: 'Asset' },
  { code: '2000', name: 'Accounts Payable', type: 'Liability', category: 'Liability', systemKey: 'AP' },
  { code: '2100', name: 'VAT Payable', type: 'Liability', category: 'Liability', systemKey: 'VAT' },
  { code: '2500', name: 'Loans Payable', type: 'Liability', category: 'Liability' },
  { code: '3000', name: 'Owner Equity', type: 'Equity', category: 'Equity' },
  { code: '3100', name: 'Opening Balance Equity', type: 'Equity', category: 'Equity', systemKey: 'OPENING' },
  { code: '3200', name: 'Retained Earnings', type: 'Equity', category: 'Equity' },
  { code: '4000', name: 'Sales Revenue', type: 'Revenue', category: 'Revenue', systemKey: 'SALES' },
  { code: '4100', name: 'Service Revenue', type: 'Revenue', category: 'Revenue' },
  { code: '4900', name: 'Other Income', type: 'Revenue', category: 'Revenue' },
  { code: '5000', name: 'Cost of Goods Sold', type: 'Expense', category: 'Expense' },
  { code: '6000', name: 'Operating Expenses', type: 'Expense', category: 'Expense', systemKey: 'EXPENSES' },
  { code: '6100', name: 'Rent', type: 'Expense', category: 'Expense' },
  { code: '6200', name: 'Utilities', type: 'Expense', category: 'Expense' },
  { code: '6300', name: 'Salaries & Wages', type: 'Expense', category: 'Expense' },
  { code: '6400', name: 'Travel & Meals', type: 'Expense', category: 'Expense' },
  { code: '6500', name: 'Office Supplies', type: 'Expense', category: 'Expense' },
  { code: '6800', name: 'Bank Fees', type: 'Expense', category: 'Expense' }
];

export const INVOICE_ACCOUNTS = [
  { code: '4000', name: 'Sales Revenue', label: '4000 Sales Revenue (Default)' },
  { code: '4100', name: 'Service Revenue', label: '4100 Service Revenue' },
  { code: '4900', name: 'Other Income', label: '4900 Other Income' }
];

export const BILL_ACCOUNTS = [
  { code: '6000', name: 'Operating Expenses', label: '6000 Operating Expenses (Default)' },
  { code: '1200', name: 'Inventory', label: '1200 Inventory' },
  { code: '1300', name: 'Prepayments', label: '1300 Prepayments' },
  { code: '1500', name: 'Equipment', label: '1500 Equipment' },
  { code: '5000', name: 'Cost of Goods Sold', label: '5000 Cost of Goods Sold' },
  { code: '6100', name: 'Rent', label: '6100 Rent' },
  { code: '6200', name: 'Utilities', label: '6200 Utilities' },
  { code: '6300', name: 'Salaries & Wages', label: '6300 Salaries & Wages' },
  { code: '6400', name: 'Travel & Meals', label: '6400 Travel & Meals' },
  { code: '6500', name: 'Office Supplies', label: '6500 Office Supplies' },
  { code: '6800', name: 'Bank Fees', label: '6800 Bank Fees' }
];

export interface JournalLineItem {
  id: string;
  date: string;
  reference: string;
  description: string;
  account: string;
  type: AccountType;
  debitCentavos: number;
  creditCentavos: number;
}
