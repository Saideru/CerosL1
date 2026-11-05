import React, { useState, useId } from 'react';
import {
  TaxRateCode,
  TAX_RATES,
  INVOICE_ACCOUNTS,
  BILL_ACCOUNTS,
  JournalLineItem,
  AccountType
} from '../../types/accounting';
import {
  parseToCentavos,
  formatPHP,
  roundHalfUp
} from '../../utils/money';
import { JournalPreviewTable } from '../JournalPreviewTable';
import { Plus, Trash2, RotateCcw, Calendar, FileText } from 'lucide-react';

interface LineItemData {
  id: string;
  description: string;
  quantity: string;
  unitPrice: string;
  accountCode: string;
  taxRateCode: TaxRateCode;
}

export const InvoiceBillCalculator: React.FC = () => {
  const [docType, setDocType] = useState<'invoice' | 'bill'>('invoice');
  const [reference, setReference] = useState<string>('');
  const [contactName, setContactName] = useState<string>('');

  // Dates
  const getTodayStr = () => new Date().toISOString().slice(0, 10);
  const getThirtyDaysAhead = (dateStr: string) => {
    const d = new Date(dateStr);
    d.setDate(d.getDate() + 30);
    return d.toISOString().slice(0, 10);
  };

  const [issueDate, setIssueDate] = useState<string>(getTodayStr());
  const [dueDate, setDueDate] = useState<string>(() => getThirtyDaysAhead(getTodayStr()));

  const [lines, setLines] = useState<LineItemData[]>([
    {
      id: '1',
      description: '',
      quantity: '1',
      unitPrice: '',
      accountCode: INVOICE_ACCOUNTS[0].code,
      taxRateCode: 'vat_12'
    }
  ]);

  const issueDateId = useId();
  const dueDateId = useId();

  // Validate dates
  const isDateInvalid = dueDate < issueDate;
  const dateErrorMessage = isDateInvalid
    ? 'Due date cannot be before the issue date.'
    : null;

  // Handle doc type change
  const handleDocTypeToggle = (type: 'invoice' | 'bill') => {
    setDocType(type);
    if (type === 'invoice') {
      // Set default invoice account
      setLines(prev =>
        prev.map(l => ({
          ...l,
          accountCode: INVOICE_ACCOUNTS[0].code
        }))
      );
    } else {
      // Set default bill account
      setLines(prev =>
        prev.map(l => ({
          ...l,
          accountCode: BILL_ACCOUNTS[0].code
        }))
      );
    }
  };

  const handleIssueDateChange = (newIssue: string) => {
    setIssueDate(newIssue);
    // Auto-update due date to issue date + 30 days
    if (newIssue) {
      setDueDate(getThirtyDaysAhead(newIssue));
    }
  };

  const handleAddLine = () => {
    const defaultAccount = docType === 'invoice' ? INVOICE_ACCOUNTS[0].code : BILL_ACCOUNTS[0].code;
    const newLine: LineItemData = {
      id: Math.random().toString(36).substring(2, 9),
      description: '',
      quantity: '1',
      unitPrice: '0.00',
      accountCode: defaultAccount,
      taxRateCode: 'vat_12'
    };
    setLines([...lines, newLine]);
  };

  const handleRemoveLine = (id: string) => {
    if (lines.length <= 1) return; // Require at least one line
    setLines(lines.filter(l => l.id !== id));
  };

  const handleUpdateLine = (id: string, updates: Partial<LineItemData>) => {
    setLines(lines.map(l => (l.id === id ? { ...l, ...updates } : l)));
  };

  const handleClear = () => {
    const today = getTodayStr();
    setIssueDate(today);
    setDueDate(getThirtyDaysAhead(today));
    setReference('');
    setContactName('');
    const defaultAccount = docType === 'invoice' ? INVOICE_ACCOUNTS[0].code : BILL_ACCOUNTS[0].code;
    setLines([
      {
        id: '1',
        description: '',
        quantity: '1',
        unitPrice: '0.00',
        accountCode: defaultAccount,
        taxRateCode: 'vat_12'
      }
    ]);
  };

  // Perform per-line calculation
  interface ProcessedLine {
    id: string;
    description: string;
    quantity: number;
    unitPriceCentavos: number;
    accountCode: string;
    accountName: string;
    taxRateCode: TaxRateCode;
    lineNetCentavos: number;
    lineTaxCentavos: number;
    lineTotalCentavos: number;
    hasError: boolean;
    errorText?: string;
  }

  const processedLines: ProcessedLine[] = lines.map(line => {
    const qty = parseFloat(line.quantity);
    const parsedPrice = parseToCentavos(line.unitPrice);

    let errorText: string | undefined;
    let hasError = false;

    if (isNaN(qty) || qty <= 0) {
      hasError = true;
      errorText = 'Quantity must be greater than zero.';
    } else if (parsedPrice.error) {
      hasError = true;
      errorText = parsedPrice.error;
    }

    const priceCents = parsedPrice.centavos ?? 0;
    const rate = TAX_RATES[line.taxRateCode].rate;

    // Calculate net and tax per line, rounding each line
    const lineNetCentavos = roundHalfUp(qty * priceCents);
    const lineTaxCentavos = roundHalfUp(lineNetCentavos * rate);
    const lineTotalCentavos = lineNetCentavos + lineTaxCentavos;

    const accountList = docType === 'invoice' ? INVOICE_ACCOUNTS : BILL_ACCOUNTS;
    const matchedAccount = accountList.find(a => a.code === line.accountCode);
    const accountName = matchedAccount ? matchedAccount.name : line.accountCode;

    return {
      id: line.id,
      description: line.description || (docType === 'invoice' ? 'Sales item' : 'Operating purchase'),
      quantity: isNaN(qty) ? 0 : qty,
      unitPriceCentavos: priceCents,
      accountCode: line.accountCode,
      accountName,
      taxRateCode: line.taxRateCode,
      lineNetCentavos,
      lineTaxCentavos,
      lineTotalCentavos,
      hasError,
      errorText
    };
  });

  const subtotalCentavos = processedLines.reduce((acc, l) => acc + l.lineNetCentavos, 0);
  const totalTaxCentavos = processedLines.reduce((acc, l) => acc + l.lineTaxCentavos, 0);
  const grandTotalCentavos = processedLines.reduce((acc, l) => acc + l.lineTotalCentavos, 0);

  const hasLineErrors = processedLines.some(l => l.hasError);
  const canGenerateJournal = !isDateInvalid && !hasLineErrors && lines.length > 0 && grandTotalCentavos > 0;

  // Build Journal Entries grouped by account
  const journalLines: JournalLineItem[] = [];

  if (canGenerateJournal) {
    if (docType === 'invoice') {
      // Invoice:
      // Dr 1100 Accounts Receivable (total)
      // Cr revenue accounts (net)
      // Cr 2100 VAT Payable (tax). Omit the VAT line when tax is zero.
      journalLines.push({
        id: 'dr_ar',
        date: issueDate,
        reference,
        description: `Invoice to ${contactName || 'Customer'}`,
        account: '1100 Accounts Receivable',
        type: 'Asset',
        debitCentavos: grandTotalCentavos,
        creditCentavos: 0
      });

      // Group revenue accounts
      const groupedRevenue: Record<string, { code: string; name: string; netCentavos: number }> = {};
      processedLines.forEach(l => {
        if (!groupedRevenue[l.accountCode]) {
          groupedRevenue[l.accountCode] = {
            code: l.accountCode,
            name: l.accountName,
            netCentavos: 0
          };
        }
        groupedRevenue[l.accountCode].netCentavos += l.lineNetCentavos;
      });

      Object.values(groupedRevenue).forEach(rev => {
        if (rev.netCentavos > 0) {
          journalLines.push({
            id: `cr_rev_${rev.code}`,
            date: issueDate,
            reference,
            description: `${rev.name} - ${reference}`,
            account: `${rev.code} ${rev.name}`,
            type: 'Revenue',
            debitCentavos: 0,
            creditCentavos: rev.netCentavos
          });
        }
      });

      // VAT Payable if tax > 0
      if (totalTaxCentavos > 0) {
        journalLines.push({
          id: 'cr_vat',
          date: issueDate,
          reference,
          description: `Output VAT at 12% - ${reference}`,
          account: '2100 VAT Payable',
          type: 'Liability',
          debitCentavos: 0,
          creditCentavos: totalTaxCentavos
        });
      }
    } else {
      // Bill:
      // Dr expense or asset accounts (net)
      // Dr 2100 VAT Payable (tax)
      // Cr 2000 Accounts Payable (total)
      // Omit VAT line when tax is zero.

      // Group expense / asset accounts
      const groupedExpenses: Record<string, { code: string; name: string; type: AccountType; netCentavos: number }> = {};
      processedLines.forEach(l => {
        // Assets are 1200, 1300, 1500; others are Expense
        const isAsset = ['1200', '1300', '1500'].includes(l.accountCode);
        const accountType: AccountType = isAsset ? 'Asset' : 'Expense';

        if (!groupedExpenses[l.accountCode]) {
          groupedExpenses[l.accountCode] = {
            code: l.accountCode,
            name: l.accountName,
            type: accountType,
            netCentavos: 0
          };
        }
        groupedExpenses[l.accountCode].netCentavos += l.lineNetCentavos;
      });

      Object.values(groupedExpenses).forEach(exp => {
        if (exp.netCentavos > 0) {
          journalLines.push({
            id: `dr_exp_${exp.code}`,
            date: issueDate,
            reference,
            description: `${exp.name} - ${reference}`,
            account: `${exp.code} ${exp.name}`,
            type: exp.type,
            debitCentavos: exp.netCentavos,
            creditCentavos: 0
          });
        }
      });

      // Dr 2100 VAT Payable (tax)
      if (totalTaxCentavos > 0) {
        journalLines.push({
          id: 'dr_vat',
          date: issueDate,
          reference,
          description: `Input VAT claim - ${reference}`,
          account: '2100 VAT Payable',
          type: 'Liability',
          debitCentavos: totalTaxCentavos,
          creditCentavos: 0
        });
      }

      // Cr 2000 Accounts Payable (total)
      journalLines.push({
        id: 'cr_ap',
        date: issueDate,
        reference,
        description: `Bill from ${contactName || 'Supplier'}`,
        account: '2000 Accounts Payable',
        type: 'Liability',
        debitCentavos: 0,
        creditCentavos: grandTotalCentavos
      });
    }
  }

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#E2E8F0] dark:border-[#1E293B]">
        <div>
          <h2 className="text-[22px] font-bold tracking-[-0.02em] text-[#0F172A] dark:text-[#E2E8F0]">
            Invoice & Bill Calculator
          </h2>
          <p className="text-[14px] text-[#475569] dark:text-[#94A3B8] mt-1">
            Calculate line-by-line taxes and preview automatic double-entry journal postings.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleClear}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-[13px] font-semibold text-[#475569] dark:text-[#94A3B8] hover:text-[#0F172A] dark:hover:text-[#E2E8F0] bg-[#FFFFFF] dark:bg-[#111B2E] border border-[#CBD5E1] dark:border-[#334155] rounded-[8px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#059669]"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Clear</span>
          </button>
        </div>
      </div>

      {/* Document Parameters Card */}
      <div className="bg-[#FFFFFF] dark:bg-[#111B2E] border border-[#E2E8F0] dark:border-[#1E293B] rounded-[12px] p-6 shadow-[0_8px_24px_rgba(15,23,42,0.06)] space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          {/* Invoice / Bill Toggle */}
          <div data-tour="inv-type" className="flex items-center gap-2 p-1 bg-[#F1F5F9] dark:bg-[#1E293B] rounded-[8px] w-full sm:w-auto">
            <button
              type="button"
              onClick={() => handleDocTypeToggle('invoice')}
              className={`flex-1 sm:flex-none px-5 py-2 text-[13px] font-semibold rounded-[6px] transition-all ${
                docType === 'invoice'
                  ? 'bg-[#FFFFFF] dark:bg-[#111B2E] text-[#0F172A] dark:text-[#E2E8F0] shadow-sm'
                  : 'text-[#475569] dark:text-[#94A3B8] hover:text-[#0F172A] dark:hover:text-[#E2E8F0]'
              }`}
            >
              Sales Invoice
            </button>
            <button
              type="button"
              onClick={() => handleDocTypeToggle('bill')}
              className={`flex-1 sm:flex-none px-5 py-2 text-[13px] font-semibold rounded-[6px] transition-all ${
                docType === 'bill'
                  ? 'bg-[#FFFFFF] dark:bg-[#111B2E] text-[#0F172A] dark:text-[#E2E8F0] shadow-sm'
                  : 'text-[#475569] dark:text-[#94A3B8] hover:text-[#0F172A] dark:hover:text-[#E2E8F0]'
              }`}
            >
              Supplier Bill
            </button>
          </div>

          <div className="text-[13px] text-[#475569] dark:text-[#94A3B8]">
            {docType === 'invoice'
              ? 'Creates Accounts Receivable and Sales Revenue postings.'
              : 'Creates Accounts Payable and Operating Expense / Asset postings.'}
          </div>
        </div>

        {/* Metadata Inputs (Reference, Contact, Issue Date, Due Date) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label data-tour="inv-number" className="block text-[12px] font-semibold text-[#475569] dark:text-[#94A3B8] mb-1.5 uppercase tracking-wider">
              {docType === 'invoice' ? 'Invoice Number' : 'Bill Number'}
            </label>
            <div className="relative">
              <FileText className="w-4 h-4 text-[#94A3B8] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                placeholder={docType === 'invoice' ? 'INV-1001' : 'BILL-1001'}
                className="w-full pl-9 pr-3 py-2 bg-[#FFFFFF] dark:bg-[#111B2E] border border-[#CBD5E1] dark:border-[#334155] rounded-[8px] text-[13px] text-[#0F172A] dark:text-[#E2E8F0] font-medium focus:outline-none focus:border-[#059669] focus:ring-3 focus:ring-[#059669]/12"
              />
            </div>
          </div>

          <div>
            <label data-tour="inv-contact" className="block text-[12px] font-semibold text-[#475569] dark:text-[#94A3B8] mb-1.5 uppercase tracking-wider">
              {docType === 'invoice' ? 'Customer' : 'Supplier'}
            </label>
            <input
              type="text"
              value={contactName}
              onChange={(e) => setContactName(e.target.value)}
              placeholder={docType === 'invoice' ? 'Customer name' : 'Supplier name'}
              className="w-full px-3 py-2 bg-[#FFFFFF] dark:bg-[#111B2E] border border-[#CBD5E1] dark:border-[#334155] rounded-[8px] text-[13px] text-[#0F172A] dark:text-[#E2E8F0] font-medium focus:outline-none focus:border-[#059669] focus:ring-3 focus:ring-[#059669]/12"
            />
          </div>

          <div>
            <label data-tour="inv-issue"
              htmlFor={issueDateId}
              className="block text-[12px] font-semibold text-[#475569] dark:text-[#94A3B8] mb-1.5 uppercase tracking-wider"
            >
              Issue Date
            </label>
            <div className="relative">
              <Calendar className="w-4 h-4 text-[#94A3B8] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                id={issueDateId}
                type="date"
                value={issueDate}
                onChange={(e) => handleIssueDateChange(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-[#FFFFFF] dark:bg-[#111B2E] border border-[#CBD5E1] dark:border-[#334155] rounded-[8px] text-[13px] text-[#0F172A] dark:text-[#E2E8F0] font-medium focus:outline-none focus:border-[#059669] focus:ring-3 focus:ring-[#059669]/12 font-mono"
              />
            </div>
          </div>

          <div>
            <label data-tour="inv-due"
              htmlFor={dueDateId}
              className="block text-[12px] font-semibold text-[#475569] dark:text-[#94A3B8] mb-1.5 uppercase tracking-wider"
            >
              Due Date (Net 30)
            </label>
            <div className="relative">
              <Calendar className="w-4 h-4 text-[#94A3B8] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                id={dueDateId}
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className={`w-full pl-9 pr-3 py-2 bg-[#FFFFFF] dark:bg-[#111B2E] border rounded-[8px] text-[13px] text-[#0F172A] dark:text-[#E2E8F0] font-medium focus:outline-none focus:border-[#059669] focus:ring-3 focus:ring-[#059669]/12 font-mono ${
                  isDateInvalid
                    ? 'border-[#DC2626] dark:border-[#F87171]'
                    : 'border-[#CBD5E1] dark:border-[#334155]'
                }`}
              />
            </div>
            {dateErrorMessage && (
              <p className="mt-1 text-[11px] font-medium text-[#DC2626] dark:text-[#F87171]">
                {dateErrorMessage}
              </p>
            )}
          </div>
        </div>

        {/* Line Items Table */}
        <div data-tour="inv-lines" className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-[15px] font-bold text-[#0F172A] dark:text-[#E2E8F0]">
              Line Items
            </h3>
            <span className="text-[12px] text-[#475569] dark:text-[#94A3B8]">
              {lines.length} {lines.length === 1 ? 'item' : 'items'} (At least 1 required)
            </span>
          </div>

          <div className="overflow-x-auto custom-scrollbar border border-[#E2E8F0] dark:border-[#1E293B] rounded-[8px]">
            <table className="w-full text-left border-collapse text-[13px]">
              <thead>
                <tr className="bg-[#0F172A] text-[#F8FAFC]">
                  <th className="py-2.5 px-3 font-semibold text-[11px] uppercase tracking-[0.06em] min-w-[200px]">
                    Description
                  </th>
                  <th className="py-2.5 px-3 font-semibold text-[11px] uppercase tracking-[0.06em] min-w-[180px]">
                    Account
                  </th>
                  <th className="py-2.5 px-3 font-semibold text-[11px] uppercase tracking-[0.06em] w-[80px]">
                    Qty
                  </th>
                  <th className="py-2.5 px-3 font-semibold text-[11px] uppercase tracking-[0.06em] min-w-[130px] text-right">
                    Unit Price (PHP)
                  </th>
                  <th className="py-2.5 px-3 font-semibold text-[11px] uppercase tracking-[0.06em] min-w-[140px]">
                    Tax Rate
                  </th>
                  <th className="py-2.5 px-3 font-semibold text-[11px] uppercase tracking-[0.06em] min-w-[120px] text-right">
                    Line Total
                  </th>
                  <th className="py-2.5 px-2 font-semibold text-[11px] uppercase tracking-[0.06em] w-[40px] text-center">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0] dark:divide-[#1E293B]">
                {lines.map((line, idx) => {
                  const processed = processedLines[idx];
                  const accounts = docType === 'invoice' ? INVOICE_ACCOUNTS : BILL_ACCOUNTS;

                  return (
                    <tr
                      key={line.id}
                      className={idx % 2 === 1 ? 'bg-[#F8FAFC] dark:bg-[#16233A]/50' : 'bg-transparent'}
                    >
                      {/* Description */}
                      <td className="py-2.5 px-3">
                        <input
                          type="text"
                          value={line.description}
                          onChange={(e) => handleUpdateLine(line.id, { description: e.target.value })}
                          placeholder="Description of goods or services"
                          className="w-full px-2.5 py-1.5 bg-[#FFFFFF] dark:bg-[#111B2E] border border-[#CBD5E1] dark:border-[#334155] rounded-[6px] text-[13px] text-[#0F172A] dark:text-[#E2E8F0] focus:outline-none focus:border-[#059669]"
                        />
                      </td>

                      {/* Account */}
                      <td className="py-2.5 px-3">
                        <select
                          value={line.accountCode}
                          onChange={(e) => handleUpdateLine(line.id, { accountCode: e.target.value })}
                          className="w-full px-2.5 py-1.5 bg-[#FFFFFF] dark:bg-[#111B2E] border border-[#CBD5E1] dark:border-[#334155] rounded-[6px] text-[13px] text-[#0F172A] dark:text-[#E2E8F0] focus:outline-none focus:border-[#059669]"
                        >
                          {accounts.map(acc => (
                            <option key={acc.code} value={acc.code}>
                              {acc.label}
                            </option>
                          ))}
                        </select>
                      </td>

                      {/* Quantity */}
                      <td className="py-2.5 px-3">
                        <input
                          type="number"
                          min="0.01"
                          step="any"
                          value={line.quantity}
                          onChange={(e) => handleUpdateLine(line.id, { quantity: e.target.value })}
                          className={`w-full px-2 py-1.5 bg-[#FFFFFF] dark:bg-[#111B2E] border rounded-[6px] text-[13px] text-right font-mono num-tabular ${
                            processed?.hasError && processed.errorText?.includes('Quantity')
                              ? 'border-[#DC2626] text-[#DC2626]'
                              : 'border-[#CBD5E1] dark:border-[#334155] text-[#0F172A] dark:text-[#E2E8F0]'
                          } focus:outline-none focus:border-[#059669]`}
                        />
                      </td>

                      {/* Unit Price */}
                      <td className="py-2.5 px-3">
                        <input
                          type="text"
                          value={line.unitPrice}
                          onChange={(e) => handleUpdateLine(line.id, { unitPrice: e.target.value })}
                          placeholder="0.00"
                          className={`w-full px-2 py-1.5 bg-[#FFFFFF] dark:bg-[#111B2E] border rounded-[6px] text-[13px] text-right font-mono num-tabular ${
                            processed?.hasError && !processed.errorText?.includes('Quantity')
                              ? 'border-[#DC2626] text-[#DC2626]'
                              : 'border-[#CBD5E1] dark:border-[#334155] text-[#0F172A] dark:text-[#E2E8F0]'
                          } focus:outline-none focus:border-[#059669]`}
                        />
                        {processed?.errorText && (
                          <div className="text-[11px] text-[#DC2626] text-right mt-1">
                            {processed.errorText}
                          </div>
                        )}
                      </td>

                      {/* Tax Rate */}
                      <td className="py-2.5 px-3">
                        <select
                          value={line.taxRateCode}
                          onChange={(e) =>
                            handleUpdateLine(line.id, { taxRateCode: e.target.value as TaxRateCode })
                          }
                          className="w-full px-2.5 py-1.5 bg-[#FFFFFF] dark:bg-[#111B2E] border border-[#CBD5E1] dark:border-[#334155] rounded-[6px] text-[13px] text-[#0F172A] dark:text-[#E2E8F0] focus:outline-none focus:border-[#059669]"
                        >
                          {(Object.keys(TAX_RATES) as TaxRateCode[]).map(key => (
                            <option key={key} value={key}>
                              {TAX_RATES[key].label}
                            </option>
                          ))}
                        </select>
                      </td>

                      {/* Line Total */}
                      <td className="py-2.5 px-3 text-right font-mono num-tabular font-medium text-[#0F172A] dark:text-[#E2E8F0] whitespace-nowrap">
                        {formatPHP(processed?.lineTotalCentavos ?? 0, false)}
                      </td>

                      {/* Remove Button */}
                      <td className="py-2.5 px-2 text-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveLine(line.id)}
                          disabled={lines.length <= 1}
                          className="p-1.5 text-[#94A3B8] hover:text-[#DC2626] disabled:opacity-30 disabled:hover:text-[#94A3B8] transition-colors rounded-[4px]"
                          title={lines.length <= 1 ? 'At least one line item is required' : 'Remove line'}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="flex justify-between items-center pt-1">
            <button
              type="button"
              onClick={handleAddLine}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-semibold text-[#0F172A] dark:text-[#E2E8F0] bg-[#F1F5F9] dark:bg-[#1E293B] hover:bg-[#E2E8F0] dark:hover:bg-[#334155] border border-[#CBD5E1] dark:border-[#334155] rounded-[8px] transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Line</span>
            </button>

            {/* Subtotals & Grand Total Summary */}
            <div data-tour="inv-totals" className="w-full max-w-sm space-y-1.5 bg-[#F8FAFC] dark:bg-[#16233A]/60 p-3 rounded-[8px] border border-[#E2E8F0] dark:border-[#1E293B]">
              <div className="flex justify-between text-[13px] text-[#475569] dark:text-[#94A3B8]">
                <span>Net Subtotal:</span>
                <span className="font-mono num-tabular font-semibold text-[#0F172A] dark:text-[#E2E8F0]">
                  {formatPHP(subtotalCentavos)}
                </span>
              </div>
              <div className="flex justify-between text-[13px] text-[#475569] dark:text-[#94A3B8]">
                <span>VAT Assessment:</span>
                <span className="font-mono num-tabular font-semibold text-[#047857] dark:text-[#34D399]">
                  {formatPHP(totalTaxCentavos)}
                </span>
              </div>
              <div className="flex justify-between text-[14px] font-bold text-[#0F172A] dark:text-[#E2E8F0] pt-1 border-t border-[#CBD5E1] dark:border-[#334155]">
                <span>Document Total:</span>
                <span className="font-mono num-tabular text-[16px] text-[#059669] dark:text-[#34D399]">
                  {formatPHP(grandTotalCentavos)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Live Journal Preview */}
      <JournalPreviewTable
        calculator="invoice_bill"
        title={docType === 'invoice' ? 'Live Journal Preview: Sales Invoice' : 'Live Journal Preview: Supplier Bill'}
        subtitle={`Automatically grouped journal postings for ${reference} · ${contactName || 'Party'}`}
        lines={journalLines}
        emptyMessage={
          isDateInvalid
            ? 'Journal cannot be generated because the due date precedes the issue date.'
            : hasLineErrors
            ? 'Correct line item validation errors to generate journal preview.'
            : 'Enter at least one line with valid amount to preview journal.'
        }
      />
    </div>
  );
};
