import React, { useState } from 'react';
import {
  parseToCentavos,
  formatPHP
} from '../../utils/money';
import { Plus, Trash2, RotateCcw, AlertTriangle, Clock, Calendar } from 'lucide-react';

interface AgingRow {
  id: string;
  name: string;
  dueDate: string;
  amountStr: string;
}

export type AgingBucket = 'current' | 'days_1_30' | 'days_31_60' | 'days_61_90' | 'over_90';

export const AgingCalculator: React.FC = () => {
  const getTodayStr = () => new Date().toISOString().slice(0, 10);
  const [asOfDate, setAsOfDate] = useState<string>(getTodayStr());
  const [agingType, setAgingType] = useState<'receivables' | 'payables'>('receivables');

  const [rows, setRows] = useState<AgingRow[]>([
    {
      id: '1',
      name: '',
      dueDate: getTodayStr(),
      amountStr: ''
    }
  ]);

  const handleAddRow = () => {
    const newRow: AgingRow = {
      id: Math.random().toString(36).substring(2, 9),
      name: '',
      dueDate: asOfDate,
      amountStr: '0.00'
    };
    setRows([...rows, newRow]);
  };

  const handleRemoveRow = (id: string) => {
    if (rows.length <= 1) return;
    setRows(rows.filter(r => r.id !== id));
  };

  const handleUpdateRow = (id: string, updates: Partial<AgingRow>) => {
    setRows(rows.map(r => (r.id === id ? { ...r, ...updates } : r)));
  };

  const handleClear = () => {
    setAsOfDate(getTodayStr());
    setRows([
      {
        id: '1',
        name: '',
        dueDate: getTodayStr(),
        amountStr: '0.00'
      }
    ]);
  };

  // Process rows against asOfDate
  interface ProcessedAgingRow {
    id: string;
    name: string;
    dueDate: string;
    amountCentavos: number;
    isOverdue: boolean;
    daysDiff: number;
    bucket: AgingBucket;
    currentCentavos: number;
    days1to30Centavos: number;
    days31to60Centavos: number;
    days61to90Centavos: number;
    over90Centavos: number;
  }

  const asOfTime = new Date(asOfDate + 'T00:00:00').getTime();

  const processedRows: ProcessedAgingRow[] = rows.map(row => {
    const parsed = parseToCentavos(row.amountStr);
    const amountCentavos = parsed.centavos ?? 0;

    const rowDateTime = new Date(row.dueDate + 'T00:00:00').getTime();
    // Rule: "A due date on or after the as-of date counts as Current."
    const isCurrent = rowDateTime >= asOfTime;
    const isOverdue = !isCurrent;

    let daysDiff = 0;
    let bucket: AgingBucket = 'current';

    if (!isCurrent && !isNaN(rowDateTime) && !isNaN(asOfTime)) {
      const msDiff = asOfTime - rowDateTime;
      daysDiff = Math.floor(msDiff / (1000 * 60 * 60 * 24));

      if (daysDiff >= 1 && daysDiff <= 30) {
        bucket = 'days_1_30';
      } else if (daysDiff >= 31 && daysDiff <= 60) {
        bucket = 'days_31_60';
      } else if (daysDiff >= 61 && daysDiff <= 90) {
        bucket = 'days_61_90';
      } else if (daysDiff > 90) {
        bucket = 'over_90';
      }
    }

    return {
      id: row.id,
      name: row.name || 'Unassigned Contact',
      dueDate: row.dueDate,
      amountCentavos,
      isOverdue,
      daysDiff,
      bucket,
      currentCentavos: bucket === 'current' ? amountCentavos : 0,
      days1to30Centavos: bucket === 'days_1_30' ? amountCentavos : 0,
      days31to60Centavos: bucket === 'days_31_60' ? amountCentavos : 0,
      days61to90Centavos: bucket === 'days_61_90' ? amountCentavos : 0,
      over90Centavos: bucket === 'over_90' ? amountCentavos : 0
    };
  });

  // Column totals
  const totalAmount = processedRows.reduce((acc, r) => acc + r.amountCentavos, 0);
  const totalCurrent = processedRows.reduce((acc, r) => acc + r.currentCentavos, 0);
  const total1to30 = processedRows.reduce((acc, r) => acc + r.days1to30Centavos, 0);
  const total31to60 = processedRows.reduce((acc, r) => acc + r.days31to60Centavos, 0);
  const total61to90 = processedRows.reduce((acc, r) => acc + r.days61to90Centavos, 0);
  const totalOver90 = processedRows.reduce((acc, r) => acc + r.over90Centavos, 0);
  const totalOverdue = total1to30 + total31to60 + total61to90 + totalOver90;

  const overduePercent = totalAmount > 0 ? ((totalOverdue / totalAmount) * 100).toFixed(1) : '0.0';

  return (
    <div className="space-y-6">
      {/* Top Banner & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#E2E8F0] dark:border-[#1E293B]">
        <div>
          <h2 className="text-[22px] font-bold tracking-[-0.02em] text-[#0F172A] dark:text-[#E2E8F0]">
            Aging Schedule Calculator
          </h2>
          <p className="text-[14px] text-[#475569] dark:text-[#94A3B8] mt-1">
            Segment outstanding balances into Current, 1-30, 31-60, 61-90, and Over 90 day brackets.
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

      {/* Schedule type */}
      <div data-tour="ag-type" className="flex flex-wrap items-center justify-between gap-3 p-3 bg-[#FFFFFF] dark:bg-[#111B2E] border border-[#E2E8F0] dark:border-[#1E293B] rounded-[12px] text-[13px]">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-[#475569] dark:text-[#94A3B8] text-[12px] uppercase tracking-wider flex items-center gap-1.5 mr-1">
            <Clock className="w-3.5 h-3.5 text-[#059669]" /> Schedule Type:
          </span>
          <div className="inline-flex p-1 bg-[#F1F5F9] dark:bg-[#1E293B] rounded-[8px]">
            <button
              type="button"
              onClick={() => setAgingType('receivables')}
              className={`px-3 py-1 text-[12px] font-semibold rounded-[6px] transition-all ${
                agingType === 'receivables'
                  ? 'bg-[#FFFFFF] dark:bg-[#111B2E] text-[#0F172A] dark:text-[#E2E8F0] shadow-sm'
                  : 'text-[#475569] dark:text-[#94A3B8]'
              }`}
            >
              Aged Receivables (Customers)
            </button>
            <button
              type="button"
              onClick={() => setAgingType('payables')}
              className={`px-3 py-1 text-[12px] font-semibold rounded-[6px] transition-all ${
                agingType === 'payables'
                  ? 'bg-[#FFFFFF] dark:bg-[#111B2E] text-[#0F172A] dark:text-[#E2E8F0] shadow-sm'
                  : 'text-[#475569] dark:text-[#94A3B8]'
              }`}
            >
              Aged Payables (Suppliers)
            </button>
          </div>
        </div>
      </div>

      {/* KPI Tiles */}
      <div data-tour="ag-kpis" className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-[#FFFFFF] dark:bg-[#111B2E] border border-[#E2E8F0] dark:border-[#1E293B] rounded-[12px] p-5 shadow-[0_8px_24px_rgba(15,23,42,0.06)]">
          <span className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[#475569] dark:text-[#94A3B8] block mb-2">
            Total Outstanding
          </span>
          <div className="text-[26px] font-bold tracking-[-0.02em] font-mono num-tabular text-[#0F172A] dark:text-[#E2E8F0]">
            {formatPHP(totalAmount)}
          </div>
          <span className="text-[12px] text-[#475569] dark:text-[#94A3B8] mt-1 block">
            Across {rows.length} ledger balances
          </span>
        </div>

        <div className="bg-[#FFFFFF] dark:bg-[#111B2E] border border-[#E2E8F0] dark:border-[#1E293B] rounded-[12px] p-5 shadow-[0_8px_24px_rgba(15,23,42,0.06)]">
          <span className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[#475569] dark:text-[#94A3B8] block mb-2">
            Current (Not Overdue)
          </span>
          <div className="text-[26px] font-bold tracking-[-0.02em] font-mono num-tabular text-[#047857] dark:text-[#34D399]">
            {formatPHP(totalCurrent)}
          </div>
          <span className="text-[12px] text-[#475569] dark:text-[#94A3B8] mt-1 block">
            Due on or after {asOfDate}
          </span>
        </div>

        <div className="bg-[#FFFFFF] dark:bg-[#111B2E] border border-[#E2E8F0] dark:border-[#1E293B] rounded-[12px] p-5 shadow-[0_8px_24px_rgba(15,23,42,0.06)]">
          <span className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[#475569] dark:text-[#94A3B8] block mb-2">
            Total Overdue ({overduePercent}%)
          </span>
          <div className="text-[26px] font-bold tracking-[-0.02em] font-mono num-tabular text-[#B45309] dark:text-[#FBBF24]">
            {formatPHP(totalOverdue)}
          </div>
          <span className="text-[12px] text-[#475569] dark:text-[#94A3B8] mt-1 block">
            Past due date relative to as-of date
          </span>
        </div>
      </div>

      {/* Main Aging Grid Card */}
      <div className="bg-[#FFFFFF] dark:bg-[#111B2E] border border-[#E2E8F0] dark:border-[#1E293B] rounded-[12px] p-6 shadow-[0_8px_24px_rgba(15,23,42,0.06)] space-y-5">
        {/* As-Of Date Configuration */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E2E8F0] dark:border-[#1E293B]">
          <div className="flex items-center gap-3">
            <label data-tour="ag-asof" className="text-[12px] font-semibold text-[#475569] dark:text-[#94A3B8] uppercase tracking-wider whitespace-nowrap">
              As-Of Evaluation Date:
            </label>
            <div className="relative">
              <Calendar className="w-4 h-4 text-[#94A3B8] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="date"
                value={asOfDate}
                onChange={(e) => setAsOfDate(e.target.value)}
                className="pl-9 pr-3 py-1.5 bg-[#FFFFFF] dark:bg-[#111B2E] border border-[#CBD5E1] dark:border-[#334155] rounded-[8px] text-[13px] font-medium font-mono text-[#0F172A] dark:text-[#E2E8F0] focus:outline-none focus:border-[#059669] focus:ring-3 focus:ring-[#059669]/12"
              />
            </div>
          </div>

          <div className="text-[12px] text-[#475569] dark:text-[#94A3B8]">
            According to SOP-11, aged reports snapshot current balances at the designated cut-off date.
          </div>
        </div>

        {/* Schedule Table */}
        <div data-tour="ag-table" className="overflow-x-auto custom-scrollbar border border-[#E2E8F0] dark:border-[#1E293B] rounded-[8px]">
          <table className="w-full text-left border-collapse text-[13px]">
            <thead>
              <tr className="bg-[#0F172A] text-[#F8FAFC]">
                <th className="py-2.5 px-3 font-semibold text-[11px] uppercase tracking-[0.06em] min-w-[180px]">
                  {agingType === 'receivables' ? 'Customer Name' : 'Supplier Name'}
                </th>
                <th className="py-2.5 px-3 font-semibold text-[11px] uppercase tracking-[0.06em] min-w-[125px]">
                  Due Date
                </th>
                <th className="py-2.5 px-3 font-semibold text-[11px] uppercase tracking-[0.06em] min-w-[95px]">
                  Status
                </th>
                <th className="py-2.5 px-3 font-semibold text-[11px] uppercase tracking-[0.06em] min-w-[125px] text-right">
                  Total (PHP)
                </th>
                <th className="py-2.5 px-3 font-semibold text-[11px] uppercase tracking-[0.06em] min-w-[110px] text-right">
                  Current
                </th>
                <th className="py-2.5 px-3 font-semibold text-[11px] uppercase tracking-[0.06em] min-w-[110px] text-right">
                  1-30 Days
                </th>
                <th className="py-2.5 px-3 font-semibold text-[11px] uppercase tracking-[0.06em] min-w-[110px] text-right">
                  31-60 Days
                </th>
                <th className="py-2.5 px-3 font-semibold text-[11px] uppercase tracking-[0.06em] min-w-[110px] text-right">
                  61-90 Days
                </th>
                <th className="py-2.5 px-3 font-semibold text-[11px] uppercase tracking-[0.06em] min-w-[110px] text-right">
                  Over 90
                </th>
                <th className="py-2.5 px-2 font-semibold text-[11px] uppercase tracking-[0.06em] w-[40px] text-center">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0] dark:divide-[#1E293B]">
              {rows.map((row, idx) => {
                const p = processedRows[idx];
                return (
                  <tr
                    key={row.id}
                    className={idx % 2 === 1 ? 'bg-[#F8FAFC] dark:bg-[#16233A]/50' : 'bg-transparent'}
                  >
                    {/* Name */}
                    <td className="py-2.5 px-3">
                      <input
                        type="text"
                        value={row.name}
                        onChange={(e) => handleUpdateRow(row.id, { name: e.target.value })}
                        placeholder="Party name"
                        className="w-full px-2.5 py-1.5 bg-[#FFFFFF] dark:bg-[#111B2E] border border-[#CBD5E1] dark:border-[#334155] rounded-[6px] text-[13px] text-[#0F172A] dark:text-[#E2E8F0] focus:outline-none focus:border-[#059669]"
                      />
                    </td>

                    {/* Due Date */}
                    <td className="py-2.5 px-3">
                      <input
                        type="date"
                        value={row.dueDate}
                        onChange={(e) => handleUpdateRow(row.id, { dueDate: e.target.value })}
                        className="w-full px-2 py-1.5 bg-[#FFFFFF] dark:bg-[#111B2E] border border-[#CBD5E1] dark:border-[#334155] rounded-[6px] text-[12px] font-mono text-[#0F172A] dark:text-[#E2E8F0] focus:outline-none focus:border-[#059669]"
                      />
                    </td>

                    {/* Overdue Badge */}
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      {p.isOverdue ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#B45309]/10 text-[#B45309] dark:text-[#FBBF24] border border-[#B45309]/30">
                          <AlertTriangle className="w-3 h-3" />
                          Overdue
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#059669]/10 text-[#047857] dark:text-[#34D399] border border-[#059669]/30">
                          Current
                        </span>
                      )}
                    </td>

                    {/* Total Amount Input */}
                    <td className="py-2.5 px-3 text-right">
                      <input
                        type="text"
                        value={row.amountStr}
                        onChange={(e) => handleUpdateRow(row.id, { amountStr: e.target.value })}
                        placeholder="0.00"
                        className="w-full px-2 py-1.5 bg-[#FFFFFF] dark:bg-[#111B2E] border border-[#CBD5E1] dark:border-[#334155] rounded-[6px] text-[13px] font-mono num-tabular text-right text-[#0F172A] dark:text-[#E2E8F0] focus:outline-none focus:border-[#059669]"
                      />
                    </td>

                    {/* Current Column */}
                    <td className="py-2.5 px-3 text-right font-mono num-tabular text-[#0F172A] dark:text-[#E2E8F0] whitespace-nowrap">
                      {p.currentCentavos > 0 ? formatPHP(p.currentCentavos, false) : '—'}
                    </td>

                    {/* 1-30 Days */}
                    <td className="py-2.5 px-3 text-right font-mono num-tabular text-[#0F172A] dark:text-[#E2E8F0] whitespace-nowrap">
                      {p.days1to30Centavos > 0 ? formatPHP(p.days1to30Centavos, false) : '—'}
                    </td>

                    {/* 31-60 Days */}
                    <td className="py-2.5 px-3 text-right font-mono num-tabular text-[#0F172A] dark:text-[#E2E8F0] whitespace-nowrap">
                      {p.days31to60Centavos > 0 ? formatPHP(p.days31to60Centavos, false) : '—'}
                    </td>

                    {/* 61-90 Days */}
                    <td className="py-2.5 px-3 text-right font-mono num-tabular text-[#0F172A] dark:text-[#E2E8F0] whitespace-nowrap">
                      {p.days61to90Centavos > 0 ? formatPHP(p.days61to90Centavos, false) : '—'}
                    </td>

                    {/* Over 90 Days */}
                    <td className="py-2.5 px-3 text-right font-mono num-tabular text-[#DC2626] dark:text-[#F87171] font-semibold whitespace-nowrap">
                      {p.over90Centavos > 0 ? formatPHP(p.over90Centavos, false) : '—'}
                    </td>

                    {/* Actions */}
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
                );
              })}
            </tbody>
            <tfoot>
              {/* Column Totals Row */}
              <tr className="bg-[#F1F5F9] dark:bg-[#16233A] font-bold text-[#0F172A] dark:text-[#E2E8F0] border-t-2 border-[#CBD5E1] dark:border-[#334155]">
                <td colSpan={3} className="py-3 px-3 text-right text-[12px] uppercase tracking-wider font-semibold text-[#475569] dark:text-[#94A3B8]">
                  Totals
                </td>
                <td className="py-3 px-3 text-right font-mono num-tabular whitespace-nowrap text-[14px]">
                  {formatPHP(totalAmount)}
                </td>
                <td className="py-3 px-3 text-right font-mono num-tabular whitespace-nowrap text-[13px] text-[#047857] dark:text-[#34D399]">
                  {formatPHP(totalCurrent, false)}
                </td>
                <td className="py-3 px-3 text-right font-mono num-tabular whitespace-nowrap text-[13px]">
                  {formatPHP(total1to30, false)}
                </td>
                <td className="py-3 px-3 text-right font-mono num-tabular whitespace-nowrap text-[13px]">
                  {formatPHP(total31to60, false)}
                </td>
                <td className="py-3 px-3 text-right font-mono num-tabular whitespace-nowrap text-[13px]">
                  {formatPHP(total61to90, false)}
                </td>
                <td className="py-3 px-3 text-right font-mono num-tabular whitespace-nowrap text-[13px] text-[#DC2626] dark:text-[#F87171]">
                  {formatPHP(totalOver90, false)}
                </td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Add Row Button */}
        <div data-tour="ag-add" className="pt-2">
          <button
            type="button"
            onClick={handleAddRow}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-semibold text-[#0F172A] dark:text-[#E2E8F0] bg-[#F1F5F9] dark:bg-[#1E293B] hover:bg-[#E2E8F0] dark:hover:bg-[#334155] border border-[#CBD5E1] dark:border-[#334155] rounded-[8px] transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Row</span>
          </button>
        </div>
      </div>
    </div>
  );
};
