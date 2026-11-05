import React, { useState } from 'react';
import { JournalLineItem } from '../types/accounting';
import { formatPHP, formatPlainAmount } from '../utils/money';
import { Copy, Check, Download, BookOpen } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { CalculatorKey } from '../types/activity';

interface JournalPreviewTableProps {
  /** Which calculator this preview belongs to (recorded in the trace log). */
  calculator?: CalculatorKey;
  title?: string;
  subtitle?: string;
  lines: JournalLineItem[];
  emptyMessage?: string;
  showDateAndRef?: boolean;
}

export function buildCsvString(lines: JournalLineItem[]): string {
  const header = 'Date,Reference,Description,Account,Type,Debit,Credit';
  const rows = lines.map(line => {
    const debit = formatPlainAmount(line.debitCentavos);
    const credit = formatPlainAmount(line.creditCentavos);
    // Sanitize any commas in text fields
    const ref = `"${line.reference.replace(/"/g, '""')}"`;
    const desc = `"${line.description.replace(/"/g, '""')}"`;
    const acc = `"${line.account.replace(/"/g, '""')}"`;
    return `${line.date},${ref},${desc},${acc},${line.type},${debit},${credit}`;
  });
  return [header, ...rows].join('\n');
}

export const JournalPreviewTable: React.FC<JournalPreviewTableProps> = ({
  calculator,
  title = 'General Ledger Posting Preview',
  subtitle = 'Double-entry journal representation generated for CerosL1 Ledger',
  lines,
  emptyMessage = 'No journal lines to display.',
  showDateAndRef = true
}) => {
  const [copied, setCopied] = useState(false);
  const { logActivity } = useAuth();

  const totalDebits = lines.reduce((acc, l) => acc + l.debitCentavos, 0);
  const totalCredits = lines.reduce((acc, l) => acc + l.creditCentavos, 0);
  const isBalanced = totalDebits === totalCredits && lines.length > 0;

  const handleCopyCsv = async () => {
    if (lines.length === 0) return;
    const csv = buildCsvString(lines);
    logActivity('copy_csv', { calculator, details: { lines: lines.length } });
    try {
      await navigator.clipboard.writeText(csv);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch {
      // Fallback
      const textarea = document.createElement('textarea');
      textarea.value = csv;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    }
  };

  const handleDownloadCsv = () => {
    if (lines.length === 0) return;
    const csv = buildCsvString(lines);
    logActivity('export_csv', { calculator, details: { lines: lines.length } });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `cerosl1_journal_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-[#FFFFFF] dark:bg-[#111B2E] border border-[#E2E8F0] dark:border-[#1E293B] rounded-[12px] p-5 shadow-[0_8px_24px_rgba(15,23,42,0.06)]">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#E2E8F0] dark:border-[#1E293B]">
        <div>
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-[#059669] dark:text-[#34D399]" />
            <h3 className="text-[17px] font-bold text-[#0F172A] dark:text-[#E2E8F0] tracking-tight">
              {title}
            </h3>
          </div>
          <p className="text-[13px] text-[#475569] dark:text-[#94A3B8] mt-0.5">
            {subtitle}
          </p>
        </div>

        {lines.length > 0 && (
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              type="button"
              onClick={handleCopyCsv}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-semibold text-[#0F172A] dark:text-[#E2E8F0] bg-[#F1F5F9] dark:bg-[#1E293B] hover:bg-[#E2E8F0] dark:hover:bg-[#334155] border border-[#CBD5E1] dark:border-[#334155] rounded-[8px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#059669]"
              title="Copy CSV representation to clipboard"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-[#047857] dark:text-[#34D399]" />
                  <span className="text-[#047857] dark:text-[#34D399]">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy as CSV</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleDownloadCsv}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-semibold text-[#475569] dark:text-[#94A3B8] hover:text-[#0F172A] dark:hover:text-[#E2E8F0] bg-[#FFFFFF] dark:bg-[#111B2E] border border-[#CBD5E1] dark:border-[#334155] rounded-[8px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#059669]"
              title="Download as CSV file"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download CSV</span>
            </button>
          </div>
        )}
      </div>

      {/* Table Container */}
      <div className="mt-4 overflow-x-auto custom-scrollbar border border-[#E2E8F0] dark:border-[#1E293B] rounded-[8px]">
        <table className="w-full text-left border-collapse text-[13px]">
          <thead>
            <tr className="bg-[#0F172A] text-[#F8FAFC]">
              {showDateAndRef && (
                <>
                  <th className="py-2.5 px-3 font-semibold text-[11px] uppercase tracking-[0.06em] whitespace-nowrap">
                    Date
                  </th>
                  <th className="py-2.5 px-3 font-semibold text-[11px] uppercase tracking-[0.06em] whitespace-nowrap">
                    Reference
                  </th>
                </>
              )}
              <th className="py-2.5 px-3 font-semibold text-[11px] uppercase tracking-[0.06em]">
                Account & Narration
              </th>
              <th className="py-2.5 px-3 font-semibold text-[11px] uppercase tracking-[0.06em] whitespace-nowrap">
                Type
              </th>
              <th className="py-2.5 px-3 font-semibold text-[11px] uppercase tracking-[0.06em] text-right whitespace-nowrap">
                Debit (PHP)
              </th>
              <th className="py-2.5 px-3 font-semibold text-[11px] uppercase tracking-[0.06em] text-right whitespace-nowrap">
                Credit (PHP)
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E2E8F0] dark:divide-[#1E293B]">
            {lines.length === 0 ? (
              <tr>
                <td
                  colSpan={showDateAndRef ? 6 : 4}
                  className="py-8 text-center text-[#94A3B8] dark:text-[#64748B] text-[13px]"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              lines.map((line, idx) => (
                <tr
                  key={line.id || idx}
                  className={idx % 2 === 1 ? 'bg-[#F8FAFC] dark:bg-[#16233A]/50' : 'bg-transparent'}
                >
                  {showDateAndRef && (
                    <>
                      <td className="py-2.5 px-3 whitespace-nowrap text-[#475569] dark:text-[#94A3B8] text-[12px] font-mono">
                        {line.date || '—'}
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap text-[#0F172A] dark:text-[#E2E8F0] font-medium text-[12px]">
                        {line.reference || '—'}
                      </td>
                    </>
                  )}
                  <td className="py-2.5 px-3">
                    <div className="font-semibold text-[#0F172A] dark:text-[#E2E8F0]">
                      {line.account}
                    </div>
                    {line.description && (
                      <div className="text-[12px] text-[#475569] dark:text-[#94A3B8] mt-0.5">
                        {line.description}
                      </div>
                    )}
                  </td>
                  <td className="py-2.5 px-3 whitespace-nowrap">
                    <span className="text-[11px] font-medium text-[#475569] dark:text-[#94A3B8]">
                      {line.type}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-right font-medium text-[#0F172A] dark:text-[#E2E8F0] font-mono num-tabular whitespace-nowrap">
                    {line.debitCentavos > 0 ? formatPHP(line.debitCentavos, false) : '—'}
                  </td>
                  <td className="py-2.5 px-3 text-right font-medium text-[#0F172A] dark:text-[#E2E8F0] font-mono num-tabular whitespace-nowrap">
                    {line.creditCentavos > 0 ? formatPHP(line.creditCentavos, false) : '—'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
          {lines.length > 0 && (
            <tfoot>
              <tr className="bg-[#F1F5F9] dark:bg-[#16233A] font-bold text-[#0F172A] dark:text-[#E2E8F0] border-t-2 border-[#CBD5E1] dark:border-[#334155]">
                <td
                  colSpan={showDateAndRef ? 4 : 2}
                  className="py-3 px-3 text-right text-[12px] uppercase tracking-wider font-semibold text-[#475569] dark:text-[#94A3B8]"
                >
                  Totals
                </td>
                <td className="py-3 px-3 text-right font-mono num-tabular whitespace-nowrap text-[14px]">
                  {formatPHP(totalDebits)}
                </td>
                <td className="py-3 px-3 text-right font-mono num-tabular whitespace-nowrap text-[14px]">
                  {formatPHP(totalCredits)}
                </td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      {/* Balance Verification Footer */}
      {lines.length > 0 && (
        <div className="mt-3 flex items-center justify-between text-[12px]">
          <div className="flex items-center gap-2">
            <span
              className={`inline-block w-2 h-2 rounded-full ${
                isBalanced ? 'bg-[#059669]' : 'bg-[#DC2626]'
              }`}
            />
            <span
              className={
                isBalanced
                  ? 'font-semibold text-[#047857] dark:text-[#34D399]'
                  : 'font-semibold text-[#DC2626] dark:text-[#F87171]'
              }
            >
              {isBalanced
                ? 'Balanced (Debits equal Credits)'
                : `Difference: ${formatPHP(Math.abs(totalDebits - totalCredits))}`}
            </span>
          </div>
          <span className="text-[#94A3B8] dark:text-[#64748B] text-[11px]">
            {lines.length} {lines.length === 1 ? 'posting line' : 'posting lines'}
          </span>
        </div>
      )}
    </div>
  );
};
