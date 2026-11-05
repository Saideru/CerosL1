import React, { useState, useId } from 'react';
import { TaxRateCode, TAX_RATES } from '../../types/accounting';
import {
  parseToCentavos,
  formatPHP,
  calculateAddVat,
  calculateExtractVat
} from '../../utils/money';
import { RotateCcw, ArrowRightLeft } from 'lucide-react';

export const VatCalculator: React.FC = () => {
  const [mode, setMode] = useState<'add' | 'extract'>('add');
  const [rawInput, setRawInput] = useState<string>('');
  const [taxRateCode, setTaxRateCode] = useState<TaxRateCode>('vat_12');
  const [inputError, setInputError] = useState<string | null>(null);

  const inputId = useId();

  const handleInputChange = (val: string) => {
    setRawInput(val);
    const parsed = parseToCentavos(val);
    if (parsed.error) {
      setInputError(parsed.error);
    } else {
      setInputError(null);
    }
  };

  const handleClear = () => {
    setRawInput('');
    setInputError(null);
  };

  // Perform calculation
  const parsed = parseToCentavos(rawInput);
  const activeRate = TAX_RATES[taxRateCode].rate;

  let netCentavos = 0;
  let vatCentavos = 0;
  let grossCentavos = 0;

  if (parsed.centavos !== null && !parsed.error) {
    if (mode === 'add') {
      const result = calculateAddVat(parsed.centavos, activeRate);
      netCentavos = result.netCentavos;
      vatCentavos = result.vatCentavos;
      grossCentavos = result.grossCentavos;
    } else {
      const result = calculateExtractVat(parsed.centavos, activeRate);
      netCentavos = result.netCentavos;
      vatCentavos = result.vatCentavos;
      grossCentavos = result.grossCentavos;
    }
  }

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#E2E8F0] dark:border-[#1E293B]">
        <div>
          <h2 className="text-[22px] font-bold tracking-[-0.02em] text-[#0F172A] dark:text-[#E2E8F0]">
            Value Added Tax Calculator
          </h2>
          <p className="text-[14px] text-[#475569] dark:text-[#94A3B8] mt-1">
            Determine exact net, VAT, and gross figures with integer-centavo accuracy.
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

      {/* Main Form Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Inputs Card */}
        <div className="lg:col-span-5 bg-[#FFFFFF] dark:bg-[#111B2E] border border-[#E2E8F0] dark:border-[#1E293B] rounded-[12px] p-6 shadow-[0_8px_24px_rgba(15,23,42,0.06)] space-y-6">
          <h3 className="text-[17px] font-bold text-[#0F172A] dark:text-[#E2E8F0] tracking-tight">
            Parameters
          </h3>

          {/* Mode Switcher */}
          <div>
            <label className="block text-[12px] font-semibold text-[#475569] dark:text-[#94A3B8] mb-2 uppercase tracking-wider">
              Calculation Mode
            </label>
            <div className="grid grid-cols-2 gap-2 p-1 bg-[#F1F5F9] dark:bg-[#1E293B] rounded-[8px]">
              <button
                type="button"
                onClick={() => setMode('add')}
                className={`py-2 px-3 text-[13px] font-semibold rounded-[6px] transition-all text-center ${
                  mode === 'add'
                    ? 'bg-[#FFFFFF] dark:bg-[#111B2E] text-[#0F172A] dark:text-[#E2E8F0] shadow-sm'
                    : 'text-[#475569] dark:text-[#94A3B8] hover:text-[#0F172A] dark:hover:text-[#E2E8F0]'
                }`}
              >
                Add VAT (Net → Gross)
              </button>
              <button
                type="button"
                onClick={() => setMode('extract')}
                className={`py-2 px-3 text-[13px] font-semibold rounded-[6px] transition-all text-center ${
                  mode === 'extract'
                    ? 'bg-[#FFFFFF] dark:bg-[#111B2E] text-[#0F172A] dark:text-[#E2E8F0] shadow-sm'
                    : 'text-[#475569] dark:text-[#94A3B8] hover:text-[#0F172A] dark:hover:text-[#E2E8F0]'
                }`}
              >
                Extract VAT (Gross → Net)
              </button>
            </div>
          </div>

          {/* Amount Input */}
          <div>
            <label
              htmlFor={inputId}
              className="block text-[12px] font-semibold text-[#475569] dark:text-[#94A3B8] mb-1.5 uppercase tracking-wider"
            >
              {mode === 'add' ? 'Net Amount (PHP)' : 'Gross Amount (PHP)'}
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[13px] font-semibold text-[#94A3B8] dark:text-[#64748B] pointer-events-none font-mono">
                PHP
              </span>
              <input
                id={inputId}
                type="text"
                value={rawInput}
                onChange={(e) => handleInputChange(e.target.value)}
                placeholder="0.00"
                aria-invalid={!!inputError}
                aria-describedby={inputError ? `${inputId}-error` : undefined}
                className={`w-full pl-13 pr-4 py-2.5 bg-[#FFFFFF] dark:bg-[#111B2E] border rounded-[8px] text-[15px] font-mono num-tabular font-medium text-[#0F172A] dark:text-[#E2E8F0] text-right focus:outline-none focus:border-[#059669] focus:ring-3 focus:ring-[#059669]/12 transition-all ${
                  inputError
                    ? 'border-[#DC2626] dark:border-[#F87171]'
                    : 'border-[#CBD5E1] dark:border-[#334155]'
                }`}
              />
            </div>
            {inputError && (
              <p
                id={`${inputId}-error`}
                className="mt-1.5 text-[12px] font-medium text-[#DC2626] dark:text-[#F87171]"
              >
                {inputError}
              </p>
            )}
          </div>

          {/* Tax Rate Options (All three separate labelled options) */}
          <div>
            <label className="block text-[12px] font-semibold text-[#475569] dark:text-[#94A3B8] mb-2 uppercase tracking-wider">
              Tax Classification
            </label>
            <div className="space-y-2">
              {(Object.keys(TAX_RATES) as TaxRateCode[]).map((key) => {
                const opt = TAX_RATES[key];
                const isSelected = taxRateCode === key;
                return (
                  <label
                    key={key}
                    className={`flex items-start justify-between p-3 border rounded-[8px] cursor-pointer transition-colors ${
                      isSelected
                        ? 'border-[#059669] bg-[#059669]/5 dark:bg-[#059669]/10'
                        : 'border-[#E2E8F0] dark:border-[#1E293B] hover:border-[#CBD5E1] dark:hover:border-[#334155]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="taxRate"
                        value={key}
                        checked={isSelected}
                        onChange={() => setTaxRateCode(key)}
                        className="w-4 h-4 text-[#059669] focus:ring-[#059669] border-[#CBD5E1]"
                      />
                      <div>
                        <div className="font-semibold text-[13px] text-[#0F172A] dark:text-[#E2E8F0]">
                          {opt.label}
                        </div>
                        <div className="text-[12px] text-[#475569] dark:text-[#94A3B8]">
                          {opt.description}
                        </div>
                      </div>
                    </div>
                    <span className="text-[12px] font-mono font-medium text-[#475569] dark:text-[#94A3B8]">
                      {(opt.rate * 100).toFixed(0)}%
                    </span>
                  </label>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Output KPI & Breakdown */}
        <div className="lg:col-span-7 space-y-6">
          {/* KPI Tiles */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Net Tile */}
            <div className="bg-[#FFFFFF] dark:bg-[#111B2E] border border-[#E2E8F0] dark:border-[#1E293B] rounded-[12px] p-5 shadow-[0_8px_24px_rgba(15,23,42,0.06)]">
              <span className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[#475569] dark:text-[#94A3B8] block mb-2">
                Net Amount
              </span>
              <div className="text-[24px] font-bold tracking-[-0.02em] font-mono num-tabular text-[#0F172A] dark:text-[#E2E8F0]">
                {formatPHP(netCentavos)}
              </div>
              <span className="text-[12px] text-[#475569] dark:text-[#94A3B8] mt-1 block">
                Excludes Value Added Tax
              </span>
            </div>

            {/* VAT Tile */}
            <div className="bg-[#FFFFFF] dark:bg-[#111B2E] border border-[#E2E8F0] dark:border-[#1E293B] rounded-[12px] p-5 shadow-[0_8px_24px_rgba(15,23,42,0.06)]">
              <span className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[#475569] dark:text-[#94A3B8] block mb-2">
                VAT Amount ({TAX_RATES[taxRateCode].label})
              </span>
              <div className="text-[24px] font-bold tracking-[-0.02em] font-mono num-tabular text-[#047857] dark:text-[#34D399]">
                {formatPHP(vatCentavos)}
              </div>
              <span className="text-[12px] text-[#475569] dark:text-[#94A3B8] mt-1 block">
                Assessed at {(activeRate * 100).toFixed(0)}%
              </span>
            </div>

            {/* Gross Tile */}
            <div className="bg-[#FFFFFF] dark:bg-[#111B2E] border border-[#E2E8F0] dark:border-[#1E293B] rounded-[12px] p-5 shadow-[0_8px_24px_rgba(15,23,42,0.06)]">
              <span className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[#475569] dark:text-[#94A3B8] block mb-2">
                Gross Total
              </span>
              <div className="text-[24px] font-bold tracking-[-0.02em] font-mono num-tabular text-[#0F172A] dark:text-[#E2E8F0]">
                {formatPHP(grossCentavos)}
              </div>
              <span className="text-[12px] text-[#475569] dark:text-[#94A3B8] mt-1 block">
                Total payable or invoiced
              </span>
            </div>
          </div>

          {/* Ledger Calculation Breakdown Card */}
          <div className="bg-[#FFFFFF] dark:bg-[#111B2E] border border-[#E2E8F0] dark:border-[#1E293B] rounded-[12px] p-6 shadow-[0_8px_24px_rgba(15,23,42,0.06)]">
            <h4 className="text-[15px] font-bold text-[#0F172A] dark:text-[#E2E8F0] mb-4">
              Calculation Breakdown & Formula
            </h4>

            <div className="space-y-3 text-[13px]">
              <div className="flex justify-between py-2 border-b border-[#E2E8F0] dark:border-[#1E293B]">
                <span className="text-[#475569] dark:text-[#94A3B8]">Applied Method:</span>
                <span className="font-semibold text-[#0F172A] dark:text-[#E2E8F0]">
                  {mode === 'add'
                    ? 'Net to Gross: Gross = Net + round(Net × Rate)'
                    : 'Gross to Net: Net = round(Gross / (1 + Rate)), VAT = Gross - Net'}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-[#E2E8F0] dark:border-[#1E293B]">
                <span className="text-[#475569] dark:text-[#94A3B8]">Integer Arithmetic Base:</span>
                <span className="font-mono text-[#0F172A] dark:text-[#E2E8F0]">
                  {parsed.centavos ?? 0} centavos
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-[#E2E8F0] dark:border-[#1E293B]">
                <span className="text-[#475569] dark:text-[#94A3B8]">Rounding Specification:</span>
                <span className="text-[#0F172A] dark:text-[#E2E8F0]">
                  Round half-up to exact centavo (no floating error)
                </span>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};
