import React, { useState } from 'react';
import {
  AccountType,
  JournalLineItem,
  DEFAULT_CHART_OF_ACCOUNTS
} from '../../types/accounting';
import {
  parseToCentavos,
  formatPHP,
  formatPlainAmount
} from '../../utils/money';
import { JournalPreviewTable } from '../JournalPreviewTable';
import { Plus, Trash2, RotateCcw, Scale, CheckCircle2, AlertCircle } from 'lucide-react';

interface BalancerRow {
  id: string;
  account: string;
  description: string;
  type: AccountType;
  debitStr: string;
  creditStr: string;
}

const ACCOUNT_TYPES: AccountType[] = ['Asset', 'Liability', 'Equity', 'Revenue', 'Expense'];

function inferAccountType(accountInput: string): AccountType | null {
  const clean = accountInput.trim().toLowerCase();
  // 1. Direct match with standard chart of accounts
  for (const acc of DEFAULT_CHART_OF_ACCOUNTS) {
    if (
      acc.code.toLowerCase() === clean ||
      acc.name.toLowerCase() === clean ||
      clean.startsWith(acc.code.toLowerCase()) ||
      clean.includes(acc.name.toLowerCase())
    ) {
      return acc.type;
    }
  }

  // 2. Code prefix heuristics standard in CerosL1 (Appendix A)
  const codeMatch = clean.match(/^(\d{4})/);
  if (codeMatch) {
    const prefix = codeMatch[1][0];
    if (prefix === '1') return 'Asset';
    if (prefix === '2') return 'Liability';
    if (prefix === '3') return 'Equity';
    if (prefix === '4') return 'Revenue';
    if (['5', '6', '7', '8'].includes(prefix)) return 'Expense';
  }

  return null;
}

export const JournalBalancer: React.FC = () => {
  const [journalDate, setJournalDate] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [reference, setReference] = useState<string>('');

  const [rows, setRows] = useState<BalancerRow[]>([
    {
      id: '1',
      account: '',
      description: '',
      type: 'Asset',
      debitStr: '',
      creditStr: ''
    },
    {
      id: '2',
      account: '',
      description: '',
      type: 'Liability',
      debitStr: '',
      creditStr: ''
    }
  ]);

  const handleAccountChange = (id: string, newAccount: string) => {
    const inferred = inferAccountType(newAccount);
    setRows(prev =>
      prev.map(row => {
        if (row.id !== id) return row;
        return {
          ...row,
          account: newAccount,
          type: inferred ? inferred : row.type
        };
      })
    );
  };

  const handleDebitChange = (id: string, val: string) => {
    // Typing in debit column clears credit on that row
    setRows(prev =>
      prev.map(row => {
        if (row.id !== id) return row;
        return {
          ...row,
          debitStr: val,
          creditStr: val ? '' : row.creditStr
        };
      })
    );
  };

  const handleCreditChange = (id: string, val: string) => {
    // Typing in credit column clears debit on that row
    setRows(prev =>
      prev.map(row => {
        if (row.id !== id) return row;
        return {
          ...row,
          creditStr: val,
          debitStr: val ? '' : row.debitStr
        };
      })
    );
  };

  const handleAddRow = () => {
    const newRow: BalancerRow = {
      id: Math.random().toString(36).substring(2, 9),
      account: '',
      description: '',
      type: 'Expense',
      debitStr: '',
      creditStr: ''
    };
    setRows([...rows, newRow]);
  };

  const handleRemoveRow = (id: string) => {
    if (rows.length <= 1) return;
    setRows(rows.filter(r => r.id !== id));
  };

  const handleClear = () => {
    setJournalDate(new Date().toISOString().slice(0, 10));
    setReference('');
    setRows([
      {
        id: '1',
        account: '',
        description: '',
        type: 'Asset',
        debitStr: '',
        creditStr: ''
      },
      {
        id: '2',
        account: '',
        description: '',
        type: 'Liability',
        debitStr: '',
        creditStr: ''
      }
    ]);
  };

  // Calculations
  let totalDebitsCentavos = 0;
  let totalCreditsCentavos = 0;
  let linesWithAmountsCount = 0;
  let hasNegativeAmount = false;

  const parsedRows = rows.map(row => {
    const parsedDebit = parseToCentavos(row.debitStr);
    const parsedCredit = parseToCentavos(row.creditStr);

    if (parsedDebit.error || parsedCredit.error) {
      hasNegativeAmount = true;
    }

    const debCents = parsedDebit.centavos ?? 0;
    const credCents = parsedCredit.centavos ?? 0;

    if (debCents > 0 || credCents > 0) {
      linesWithAmountsCount += 1;
    }

    totalDebitsCentavos += debCents;
    totalCreditsCentavos += credCents;

    return {
      ...row,
      debitCentavos: debCents,
      creditCentavos: credCents
    };
  });

  const diffCentavos = Math.abs(totalDebitsCentavos - totalCreditsCentavos);
  const isBalanced =
    !hasNegativeAmount &&
    linesWithAmountsCount >= 2 &&
    totalDebitsCentavos === totalCreditsCentavos &&
    totalDebitsCentavos > 0;

  // Exact balance status message:
  // When balanced: "Balanced"
  // Otherwise: "Journal does not balance: debits X vs credits Y."
  const unbalanceMessage = `Journal does not balance: debits ${formatPlainAmount(totalDebitsCentavos)} vs credits ${formatPlainAmount(totalCreditsCentavos)}.`;

  // Convert to JournalLineItem for preview and CSV
  const previewLines: JournalLineItem[] = parsedRows
    .filter(r => r.debitCentavos > 0 || r.creditCentavos > 0)
    .map(r => ({
      id: r.id,
      date: journalDate,
      reference,
      description: r.description || 'Manual journal adjustment',
      account: r.account || 'Unassigned Account',
      type: r.type,
      debitCentavos: r.debitCentavos,
      creditCentavos: r.creditCentavos
    }));

  return (
    <div className="space-y-6">
      {/* Top Banner & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#E2E8F0] dark:border-[#1E293B]">
        <div>
          <h2 className="text-[22px] font-bold tracking-[-0.02em] text-[#0F172A] dark:text-[#E2E8F0]">
            General Journal Balancer
          </h2>
          <p className="text-[14px] text-[#475569] dark:text-[#94A3B8] mt-1">
            Construct and verify double-entry journal postings with automatic debit/credit mutual exclusion.
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

      {/* Main Journal Editor Card */}
      <div className="bg-[#FFFFFF] dark:bg-[#111B2E] border border-[#E2E8F0] dark:border-[#1E293B] rounded-[12px] p-6 shadow-[0_8px_24px_rgba(15,23,42,0.06)] space-y-5">
        {/* Journal Meta */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pb-3 border-b border-[#E2E8F0] dark:border-[#1E293B]">
          <div>
            <label className="block text-[12px] font-semibold text-[#475569] dark:text-[#94A3B8] mb-1.5 uppercase tracking-wider">
              Posting Date
            </label>
            <input
              type="date"
              value={journalDate}
              onChange={(e) => setJournalDate(e.target.value)}
              className="w-full px-3 py-2 bg-[#FFFFFF] dark:bg-[#111B2E] border border-[#CBD5E1] dark:border-[#334155] rounded-[8px] text-[13px] text-[#0F172A] dark:text-[#E2E8F0] font-medium font-mono focus:outline-none focus:border-[#059669] focus:ring-3 focus:ring-[#059669]/12"
            />
          </div>
          <div>
            <label className="block text-[12px] font-semibold text-[#475569] dark:text-[#94A3B8] mb-1.5 uppercase tracking-wider">
              Reference
            </label>
            <input
              type="text"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder="JRN-1001"
              className="w-full px-3 py-2 bg-[#FFFFFF] dark:bg-[#111B2E] border border-[#CBD5E1] dark:border-[#334155] rounded-[8px] text-[13px] text-[#0F172A] dark:text-[#E2E8F0] font-medium focus:outline-none focus:border-[#059669] focus:ring-3 focus:ring-[#059669]/12"
            />
          </div>
          <div className="flex flex-col justify-end">
            <div className="text-[12px] text-[#475569] dark:text-[#94A3B8]">
              Standard double-entry control C1 requires at least 2 lines with positive amounts.
            </div>
          </div>
        </div>

        {/* Rows Table */}
        <div className="overflow-x-auto custom-scrollbar border border-[#E2E8F0] dark:border-[#1E293B] rounded-[8px]">
          <table className="w-full text-left border-collapse text-[13px]">
            <thead>
              <tr className="bg-[#0F172A] text-[#F8FAFC]">
                <th className="py-2.5 px-3 font-semibold text-[11px] uppercase tracking-[0.06em] min-w-[220px]">
                  Account
                </th>
                <th className="py-2.5 px-3 font-semibold text-[11px] uppercase tracking-[0.06em] min-w-[130px]">
                  Type
                </th>
                <th className="py-2.5 px-3 font-semibold text-[11px] uppercase tracking-[0.06em] min-w-[200px]">
                  Description / Narration
                </th>
                <th className="py-2.5 px-3 font-semibold text-[11px] uppercase tracking-[0.06em] min-w-[140px] text-right">
                  Debit (PHP)
                </th>
                <th className="py-2.5 px-3 font-semibold text-[11px] uppercase tracking-[0.06em] min-w-[140px] text-right">
                  Credit (PHP)
                </th>
                <th className="py-2.5 px-2 font-semibold text-[11px] uppercase tracking-[0.06em] w-[40px] text-center">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0] dark:divide-[#1E293B]">
              {rows.map((row, idx) => (
                <tr
                  key={row.id}
                  className={idx % 2 === 1 ? 'bg-[#F8FAFC] dark:bg-[#16233A]/50' : 'bg-transparent'}
                >
                  {/* Account Input with standard datalist */}
                  <td className="py-2.5 px-3">
                    <input
                      type="text"
                      list="default-accounts"
                      value={row.account}
                      onChange={(e) => handleAccountChange(row.id, e.target.value)}
                      placeholder="Code or account name"
                      className="w-full px-2.5 py-1.5 bg-[#FFFFFF] dark:bg-[#111B2E] border border-[#CBD5E1] dark:border-[#334155] rounded-[6px] text-[13px] text-[#0F172A] dark:text-[#E2E8F0] focus:outline-none focus:border-[#059669]"
                    />
                  </td>

                  {/* Account Type dropdown */}
                  <td className="py-2.5 px-3">
                    <select
                      value={row.type}
                      onChange={(e) => {
                        const newType = e.target.value as AccountType;
                        setRows(prev =>
                          prev.map(r => (r.id === row.id ? { ...r, type: newType } : r))
                        );
                      }}
                      className="w-full px-2 py-1.5 bg-[#FFFFFF] dark:bg-[#111B2E] border border-[#CBD5E1] dark:border-[#334155] rounded-[6px] text-[12px] text-[#0F172A] dark:text-[#E2E8F0] focus:outline-none focus:border-[#059669]"
                    >
                      {ACCOUNT_TYPES.map(t => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </td>

                  {/* Description */}
                  <td className="py-2.5 px-3">
                    <input
                      type="text"
                      value={row.description}
                      onChange={(e) => {
                        const val = e.target.value;
                        setRows(prev =>
                          prev.map(r => (r.id === row.id ? { ...r, description: val } : r))
                        );
                      }}
                      placeholder="Narration"
                      className="w-full px-2.5 py-1.5 bg-[#FFFFFF] dark:bg-[#111B2E] border border-[#CBD5E1] dark:border-[#334155] rounded-[6px] text-[13px] text-[#0F172A] dark:text-[#E2E8F0] focus:outline-none focus:border-[#059669]"
                    />
                  </td>

                  {/* Debit Input */}
                  <td className="py-2.5 px-3">
                    <input
                      type="text"
                      value={row.debitStr}
                      onChange={(e) => handleDebitChange(row.id, e.target.value)}
                      placeholder="0.00"
                      className="w-full px-2.5 py-1.5 bg-[#FFFFFF] dark:bg-[#111B2E] border border-[#CBD5E1] dark:border-[#334155] rounded-[6px] text-[13px] font-mono num-tabular text-right text-[#0F172A] dark:text-[#E2E8F0] focus:outline-none focus:border-[#059669]"
                    />
                  </td>

                  {/* Credit Input */}
                  <td className="py-2.5 px-3">
                    <input
                      type="text"
                      value={row.creditStr}
                      onChange={(e) => handleCreditChange(row.id, e.target.value)}
                      placeholder="0.00"
                      className="w-full px-2.5 py-1.5 bg-[#FFFFFF] dark:bg-[#111B2E] border border-[#CBD5E1] dark:border-[#334155] rounded-[6px] text-[13px] font-mono num-tabular text-right text-[#0F172A] dark:text-[#E2E8F0] focus:outline-none focus:border-[#059669]"
                    />
                  </td>

                  {/* Remove Action */}
                  <td className="py-2.5 px-2 text-center">
                    <button
                      type="button"
                      onClick={() => handleRemoveRow(row.id)}
                      disabled={rows.length <= 1}
                      className="p-1.5 text-[#94A3B8] hover:text-[#DC2626] disabled:opacity-30 disabled:hover:text-[#94A3B8] transition-colors rounded-[4px]"
                      title="Remove row"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-[#F1F5F9] dark:bg-[#16233A] font-bold text-[#0F172A] dark:text-[#E2E8F0] border-t-2 border-[#CBD5E1] dark:border-[#334155]">
                <td colSpan={3} className="py-3 px-3 text-right text-[12px] uppercase tracking-wider font-semibold text-[#475569] dark:text-[#94A3B8]">
                  Totals
                </td>
                <td className="py-3 px-3 text-right font-mono num-tabular whitespace-nowrap text-[14px]">
                  {formatPHP(totalDebitsCentavos)}
                </td>
                <td className="py-3 px-3 text-right font-mono num-tabular whitespace-nowrap text-[14px]">
                  {formatPHP(totalCreditsCentavos)}
                </td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Datalist for fast account lookup */}
        <datalist id="default-accounts">
          {DEFAULT_CHART_OF_ACCOUNTS.map(a => (
            <option key={a.code} value={`${a.code} ${a.name}`} />
          ))}
        </datalist>

        {/* Add Row Button & Status Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
          <button
            type="button"
            onClick={handleAddRow}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-semibold text-[#0F172A] dark:text-[#E2E8F0] bg-[#F1F5F9] dark:bg-[#1E293B] hover:bg-[#E2E8F0] dark:hover:bg-[#334155] border border-[#CBD5E1] dark:border-[#334155] rounded-[8px] transition-colors self-start"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Row</span>
          </button>

          {/* Balance Indicator Status Callout */}
          <div className="flex items-center gap-3">
            <div className="text-right text-[13px]">
              <span className="text-[#475569] dark:text-[#94A3B8] mr-2">Net Difference:</span>
              <span className="font-mono num-tabular font-bold text-[#0F172A] dark:text-[#E2E8F0]">
                {formatPHP(diffCentavos)}
              </span>
            </div>

            <div
              className={`px-4 py-2 rounded-[8px] border flex items-center gap-2 text-[13px] font-semibold ${
                isBalanced
                  ? 'bg-[#059669]/10 text-[#047857] dark:text-[#34D399] border-[#059669]/30'
                  : 'bg-[#DC2626]/10 text-[#DC2626] dark:text-[#F87171] border-[#DC2626]/30'
              }`}
            >
              {isBalanced ? (
                <>
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>Balanced</span>
                </>
              ) : (
                <>
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{unbalanceMessage}</span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* CSV Export & Journal Preview Table */}
      <JournalPreviewTable
        title="Balanced Journal Posting Specification"
        subtitle={`Standard CerosL1 general ledger format ready for export · Reference ${reference}`}
        lines={previewLines}
        emptyMessage="Enter journal rows with amounts to preview posting and enable CSV copy."
      />
    </div>
  );
};
