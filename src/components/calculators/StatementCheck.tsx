import React, { useState, useId } from 'react';
import {
  parseToCentavos,
  formatPHP
} from '../../utils/money';
import { RotateCcw, CheckCircle2, AlertCircle, ArrowDownRight, Scale, TrendingUp } from 'lucide-react';

export const StatementCheck: React.FC = () => {
  // P&L State
  const [rawRevenue, setRawRevenue] = useState<string>('');
  const [rawExpenses, setRawExpenses] = useState<string>('');

  // Balance Sheet State
  const [rawAssets, setRawAssets] = useState<string>('');
  const [rawLiabilities, setRawLiabilities] = useState<string>('');
  const [rawEquityBase, setRawEquityBase] = useState<string>('');
  const [linkProfitToEquity, setLinkProfitToEquity] = useState<boolean>(true);
  const [manualProfitInput, setManualProfitInput] = useState<string>('');

  const revId = useId();
  const expId = useId();
  const assetId = useId();
  const liabId = useId();
  const equityId = useId();

  // Parsing P&L
  const parsedRev = parseToCentavos(rawRevenue);
  const parsedExp = parseToCentavos(rawExpenses);

  const revCents = parsedRev.centavos ?? 0;
  const expCents = parsedExp.centavos ?? 0;

  // Net Profit = Revenue - Expenses
  const netProfitCents = revCents - expCents;
  const isNetProfit = netProfitCents >= 0;

  // Parsing Balance Sheet
  const parsedAssets = parseToCentavos(rawAssets);
  const parsedLiab = parseToCentavos(rawLiabilities);
  const parsedEquity = parseToCentavos(rawEquityBase);
  const parsedManualProfit = parseToCentavos(manualProfitInput);

  const assetsCents = parsedAssets.centavos ?? 0;
  const liabCents = parsedLiab.centavos ?? 0;
  const equityBaseCents = parsedEquity.centavos ?? 0;

  // Current year profit in Equity
  const currentProfitInEquity = linkProfitToEquity
    ? netProfitCents
    : (parsedManualProfit.centavos ?? 0);

  const totalEquityCents = equityBaseCents + currentProfitInEquity;
  const totalLiabPlusEquityCents = liabCents + totalEquityCents;

  const diffCents = Math.abs(assetsCents - totalLiabPlusEquityCents);
  const isBalanceSheetEqual = diffCents === 0 && assetsCents > 0;

  // Validation
  const hasError =
    parsedRev.error ||
    parsedExp.error ||
    parsedAssets.error ||
    parsedLiab.error ||
    parsedEquity.error ||
    (!linkProfitToEquity && parsedManualProfit.error);

  const handleClear = () => {
    setRawRevenue('');
    setRawExpenses('');
    setRawAssets('');
    setRawLiabilities('');
    setRawEquityBase('');
    setManualProfitInput('');
  };

  // Statement message required by spec:
  // If equal: "Assets equal liabilities plus equity"
  // Otherwise: "Assets differ from liabilities plus equity by PHP X."
  const statementMessage = isBalanceSheetEqual
    ? 'Assets equal liabilities plus equity'
    : `Assets differ from liabilities plus equity by ${formatPHP(diffCents)}.`;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#E2E8F0] dark:border-[#1E293B]">
        <div>
          <h2 className="text-[22px] font-bold tracking-[-0.02em] text-[#0F172A] dark:text-[#E2E8F0]">
            Financial Statement Verification
          </h2>
          <p className="text-[14px] text-[#475569] dark:text-[#94A3B8] mt-1">
            Audit profit & loss metrics and verify the fundamental balance sheet equation (A = L + E).
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

      {/* Section 1: Profit & Loss Check */}
      <div className="bg-[#FFFFFF] dark:bg-[#111B2E] border border-[#E2E8F0] dark:border-[#1E293B] rounded-[12px] p-6 shadow-[0_8px_24px_rgba(15,23,42,0.06)] space-y-5">
        <div className="flex items-center gap-2 pb-2 border-b border-[#E2E8F0] dark:border-[#1E293B]">
          <TrendingUp className="w-4 h-4 text-[#059669] dark:text-[#34D399]" />
          <h3 className="text-[17px] font-bold text-[#0F172A] dark:text-[#E2E8F0]">
            1. Profit &amp; Loss Check
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
          {/* Revenue */}
          <div>
            <label
              htmlFor={revId}
              className="block text-[12px] font-semibold text-[#475569] dark:text-[#94A3B8] mb-1.5 uppercase tracking-wider"
            >
              Total Revenue (PHP)
            </label>
            <input
              id={revId}
              type="text"
              value={rawRevenue}
              onChange={(e) => setRawRevenue(e.target.value)}
              placeholder="0.00"
              className="w-full px-3 py-2 bg-[#FFFFFF] dark:bg-[#111B2E] border border-[#CBD5E1] dark:border-[#334155] rounded-[8px] text-[15px] font-mono num-tabular font-medium text-right text-[#0F172A] dark:text-[#E2E8F0] focus:outline-none focus:border-[#059669] focus:ring-3 focus:ring-[#059669]/12"
            />
          </div>

          {/* Expenses */}
          <div>
            <label
              htmlFor={expId}
              className="block text-[12px] font-semibold text-[#475569] dark:text-[#94A3B8] mb-1.5 uppercase tracking-wider"
            >
              Total Expenses (PHP)
            </label>
            <input
              id={expId}
              type="text"
              value={rawExpenses}
              onChange={(e) => setRawExpenses(e.target.value)}
              placeholder="0.00"
              className="w-full px-3 py-2 bg-[#FFFFFF] dark:bg-[#111B2E] border border-[#CBD5E1] dark:border-[#334155] rounded-[8px] text-[15px] font-mono num-tabular font-medium text-right text-[#0F172A] dark:text-[#E2E8F0] focus:outline-none focus:border-[#059669] focus:ring-3 focus:ring-[#059669]/12"
            />
          </div>

          {/* Profit Output Tile */}
          <div className="bg-[#F8FAFC] dark:bg-[#16233A] p-4 rounded-[8px] border border-[#E2E8F0] dark:border-[#1E293B]">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#475569] dark:text-[#94A3B8] block mb-1">
              {isNetProfit ? 'Net Profit' : 'Net Loss'}
            </span>
            <div
              className={`text-[22px] font-bold font-mono num-tabular ${
                isNetProfit ? 'text-[#047857] dark:text-[#34D399]' : 'text-[#DC2626] dark:text-[#F87171]'
              }`}
            >
              {formatPHP(Math.abs(netProfitCents))}
            </div>
            <span className="text-[12px] text-[#475569] dark:text-[#94A3B8] mt-1 block">
              {isNetProfit ? 'Operating surplus for period' : 'Operating deficit for period'}
            </span>
          </div>
        </div>
      </div>

      {/* Section 2: Balance Sheet Check */}
      <div className="bg-[#FFFFFF] dark:bg-[#111B2E] border border-[#E2E8F0] dark:border-[#1E293B] rounded-[12px] p-6 shadow-[0_8px_24px_rgba(15,23,42,0.06)] space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-[#E2E8F0] dark:border-[#1E293B]">
          <div className="flex items-center gap-2">
            <Scale className="w-4 h-4 text-[#059669] dark:text-[#34D399]" />
            <h3 className="text-[17px] font-bold text-[#0F172A] dark:text-[#E2E8F0]">
              2. Balance Sheet Check (Assets = Liabilities + Equity)
            </h3>
          </div>

          <label className="flex items-center gap-2 text-[12px] font-semibold text-[#475569] dark:text-[#94A3B8] cursor-pointer">
            <input
              type="checkbox"
              checked={linkProfitToEquity}
              onChange={(e) => setLinkProfitToEquity(e.target.checked)}
              className="w-4 h-4 text-[#059669] focus:ring-[#059669] rounded"
            />
            <span>Include P&amp;L Net Profit ({formatPHP(netProfitCents)}) in Equity</span>
          </label>
        </div>

        {/* Balance Sheet Inputs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Assets */}
          <div>
            <label
              htmlFor={assetId}
              className="block text-[12px] font-semibold text-[#475569] dark:text-[#94A3B8] mb-1.5 uppercase tracking-wider"
            >
              Assets (PHP)
            </label>
            <input
              id={assetId}
              type="text"
              value={rawAssets}
              onChange={(e) => setRawAssets(e.target.value)}
              placeholder="0.00"
              className="w-full px-3 py-2 bg-[#FFFFFF] dark:bg-[#111B2E] border border-[#CBD5E1] dark:border-[#334155] rounded-[8px] text-[15px] font-mono num-tabular font-medium text-right text-[#0F172A] dark:text-[#E2E8F0] focus:outline-none focus:border-[#059669] focus:ring-3 focus:ring-[#059669]/12"
            />
          </div>

          {/* Liabilities */}
          <div>
            <label
              htmlFor={liabId}
              className="block text-[12px] font-semibold text-[#475569] dark:text-[#94A3B8] mb-1.5 uppercase tracking-wider"
            >
              Liabilities (PHP)
            </label>
            <input
              id={liabId}
              type="text"
              value={rawLiabilities}
              onChange={(e) => setRawLiabilities(e.target.value)}
              placeholder="0.00"
              className="w-full px-3 py-2 bg-[#FFFFFF] dark:bg-[#111B2E] border border-[#CBD5E1] dark:border-[#334155] rounded-[8px] text-[15px] font-mono num-tabular font-medium text-right text-[#0F172A] dark:text-[#E2E8F0] focus:outline-none focus:border-[#059669] focus:ring-3 focus:ring-[#059669]/12"
            />
          </div>

          {/* Equity Base */}
          <div>
            <label
              htmlFor={equityId}
              className="block text-[12px] font-semibold text-[#475569] dark:text-[#94A3B8] mb-1.5 uppercase tracking-wider"
            >
              Equity Base (Capital + Retained)
            </label>
            <input
              id={equityId}
              type="text"
              value={rawEquityBase}
              onChange={(e) => setRawEquityBase(e.target.value)}
              placeholder="0.00"
              className="w-full px-3 py-2 bg-[#FFFFFF] dark:bg-[#111B2E] border border-[#CBD5E1] dark:border-[#334155] rounded-[8px] text-[15px] font-mono num-tabular font-medium text-right text-[#0F172A] dark:text-[#E2E8F0] focus:outline-none focus:border-[#059669] focus:ring-3 focus:ring-[#059669]/12"
            />
          </div>

          {/* Current Year Profit in Equity */}
          <div>
            <label className="block text-[12px] font-semibold text-[#475569] dark:text-[#94A3B8] mb-1.5 uppercase tracking-wider">
              Current Year Profit / Loss
            </label>
            {linkProfitToEquity ? (
              <div className="w-full px-3 py-2 bg-[#F1F5F9] dark:bg-[#16233A] border border-[#CBD5E1] dark:border-[#334155] rounded-[8px] text-[15px] font-mono num-tabular font-medium text-right text-[#047857] dark:text-[#34D399]">
                {formatPHP(netProfitCents, false)}
              </div>
            ) : (
              <input
                type="text"
                value={manualProfitInput}
                onChange={(e) => setManualProfitInput(e.target.value)}
                placeholder="0.00"
                className="w-full px-3 py-2 bg-[#FFFFFF] dark:bg-[#111B2E] border border-[#CBD5E1] dark:border-[#334155] rounded-[8px] text-[15px] font-mono num-tabular font-medium text-right text-[#0F172A] dark:text-[#E2E8F0] focus:outline-none focus:border-[#059669] focus:ring-3 focus:ring-[#059669]/12"
              />
            )}
          </div>
        </div>

        {/* Verification Status Card */}
        <div
          className={`p-5 rounded-[12px] border ${
            isBalanceSheetEqual
              ? 'bg-[#059669]/10 border-[#059669]/30 text-[#047857] dark:text-[#34D399]'
              : 'bg-[#DC2626]/10 border-[#DC2626]/30 text-[#DC2626] dark:text-[#F87171]'
          }`}
        >
          <div className="flex items-center gap-3">
            {isBalanceSheetEqual ? (
              <CheckCircle2 className="w-5 h-5 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 shrink-0" />
            )}
            <div className="text-[17px] font-bold">
              {statementMessage}
            </div>
          </div>
        </div>

        {/* Comparison Summary Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-[13px]">
          <div className="bg-[#F8FAFC] dark:bg-[#16233A] p-4 rounded-[8px] border border-[#E2E8F0] dark:border-[#1E293B]">
            <span className="text-[#475569] dark:text-[#94A3B8] text-[11px] uppercase tracking-wider font-semibold block mb-1">
              Total Assets
            </span>
            <span className="text-[20px] font-bold font-mono num-tabular text-[#0F172A] dark:text-[#E2E8F0]">
              {formatPHP(assetsCents)}
            </span>
          </div>

          <div className="bg-[#F8FAFC] dark:bg-[#16233A] p-4 rounded-[8px] border border-[#E2E8F0] dark:border-[#1E293B]">
            <span className="text-[#475569] dark:text-[#94A3B8] text-[11px] uppercase tracking-wider font-semibold block mb-1">
              Total Liabilities + Equity
            </span>
            <span className="text-[20px] font-bold font-mono num-tabular text-[#0F172A] dark:text-[#E2E8F0]">
              {formatPHP(totalLiabPlusEquityCents)}
            </span>
            <div className="text-[11px] text-[#475569] dark:text-[#94A3B8] mt-1">
              Liabilities {formatPHP(liabCents)} + Equity {formatPHP(totalEquityCents)}
            </div>
          </div>

          <div className="bg-[#F8FAFC] dark:bg-[#16233A] p-4 rounded-[8px] border border-[#E2E8F0] dark:border-[#1E293B]">
            <span className="text-[#475569] dark:text-[#94A3B8] text-[11px] uppercase tracking-wider font-semibold block mb-1">
              Variance / Discrepancy
            </span>
            <span
              className={`text-[20px] font-bold font-mono num-tabular ${
                diffCents === 0 ? 'text-[#047857] dark:text-[#34D399]' : 'text-[#DC2626] dark:text-[#F87171]'
              }`}
            >
              {formatPHP(diffCents)}
            </span>
            <div className="text-[11px] text-[#475569] dark:text-[#94A3B8] mt-1">
              {diffCents === 0 ? 'Perfect balance achieved' : 'Adjustment required to reconcile'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
