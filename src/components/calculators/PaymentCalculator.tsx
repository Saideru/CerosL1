import React, { useState, useId } from 'react';
import { JournalLineItem } from '../../types/accounting';
import {
  parseToCentavos,
  formatPHP
} from '../../utils/money';
import { JournalPreviewTable } from '../JournalPreviewTable';
import { RotateCcw, CheckCircle2, AlertCircle, CreditCard } from 'lucide-react';

export const PaymentCalculator: React.FC = () => {
  const [docType, setDocType] = useState<'invoice' | 'bill'>('invoice');
  const [reference, setReference] = useState<string>('');
  const [paymentDate, setPaymentDate] = useState<string>(() => new Date().toISOString().slice(0, 10));

  const [rawTotal, setRawTotal] = useState<string>('');
  const [rawPaid, setRawPaid] = useState<string>('0.00');
  const [rawPayment, setRawPayment] = useState<string>('');

  const totalInputId = useId();
  const paidInputId = useId();
  const paymentInputId = useId();

  // Parsing & validation
  const parsedTotal = parseToCentavos(rawTotal);
  const parsedPaid = parseToCentavos(rawPaid);
  const parsedPayment = parseToCentavos(rawPayment);

  const totalCents = parsedTotal.centavos ?? 0;
  const paidCents = parsedPaid.centavos ?? 0;
  const paymentCents = parsedPayment.centavos ?? 0;

  // Amount due before this payment
  const amountDueBeforePayment = Math.max(0, totalCents - paidCents);

  // Validation rules
  let paymentError: string | null = null;
  if (parsedTotal.error) {
    paymentError = parsedTotal.error;
  } else if (parsedPaid.error) {
    paymentError = parsedPaid.error;
  } else if (parsedPayment.error) {
    paymentError = parsedPayment.error;
  } else if (paidCents > totalCents) {
    paymentError = 'Amount already paid cannot exceed the document total.';
  } else if (paymentCents > amountDueBeforePayment) {
    // Exact wording required: "Payment exceeds the amount due of PHP X."
    paymentError = `Payment exceeds the amount due of ${formatPHP(amountDueBeforePayment)}.`;
  }

  const isPaymentValid = !paymentError && paymentCents > 0 && totalCents > 0;
  const amountDueAfterPayment = isPaymentValid ? amountDueBeforePayment - paymentCents : amountDueBeforePayment;
  const isPaidInFull = isPaymentValid && amountDueAfterPayment === 0;

  const handleClear = () => {
    setRawTotal('');
    setRawPaid('0.00');
    setRawPayment('');
    setReference('');
  };

  // Build Journal Preview
  const journalLines: JournalLineItem[] = [];
  if (isPaymentValid) {
    if (docType === 'invoice') {
      // Invoice:
      // Dr 1000 Business Bank Account
      // Cr 1100 Accounts Receivable
      journalLines.push(
        {
          id: 'dr_bank',
          date: paymentDate,
          reference: `REC-${reference}`,
          description: `Payment received for ${reference}`,
          account: '1000 Business Bank Account',
          type: 'Asset',
          debitCentavos: paymentCents,
          creditCentavos: 0
        },
        {
          id: 'cr_ar',
          date: paymentDate,
          reference: `REC-${reference}`,
          description: `Clear Accounts Receivable for ${reference}`,
          account: '1100 Accounts Receivable',
          type: 'Asset',
          debitCentavos: 0,
          creditCentavos: paymentCents
        }
      );
    } else {
      // Bill:
      // Dr 2000 Accounts Payable
      // Cr 1000 Business Bank Account
      journalLines.push(
        {
          id: 'dr_ap',
          date: paymentDate,
          reference: `PAY-${reference}`,
          description: `Settlement for bill ${reference}`,
          account: '2000 Accounts Payable',
          type: 'Liability',
          debitCentavos: paymentCents,
          creditCentavos: 0
        },
        {
          id: 'cr_bank',
          date: paymentDate,
          reference: `PAY-${reference}`,
          description: `Bank disbursement for ${reference}`,
          account: '1000 Business Bank Account',
          type: 'Asset',
          debitCentavos: 0,
          creditCentavos: paymentCents
        }
      );
    }
  }

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#E2E8F0] dark:border-[#1E293B]">
        <div>
          <h2 className="text-[22px] font-bold tracking-[-0.02em] text-[#0F172A] dark:text-[#E2E8F0]">
            Payment & Settlement Calculator
          </h2>
          <p className="text-[14px] text-[#475569] dark:text-[#94A3B8] mt-1">
            Reconcile document collections and disbursements with overpayment validation.
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

      {/* Form & KPI Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Inputs */}
        <div className="lg:col-span-5 bg-[#FFFFFF] dark:bg-[#111B2E] border border-[#E2E8F0] dark:border-[#1E293B] rounded-[12px] p-6 shadow-[0_8px_24px_rgba(15,23,42,0.06)] space-y-5">
          <h3 className="text-[17px] font-bold text-[#0F172A] dark:text-[#E2E8F0] tracking-tight">
            Settlement Parameters
          </h3>

          {/* Doc Type Toggle */}
          <div>
            <label data-tour="pay-direction" className="block text-[12px] font-semibold text-[#475569] dark:text-[#94A3B8] mb-2 uppercase tracking-wider">
              Document Direction
            </label>
            <div className="grid grid-cols-2 gap-2 p-1 bg-[#F1F5F9] dark:bg-[#1E293B] rounded-[8px]">
              <button
                type="button"
                onClick={() => {
                  setDocType('invoice');
                }}
                className={`py-2 px-3 text-[13px] font-semibold rounded-[6px] transition-all text-center ${
                  docType === 'invoice'
                    ? 'bg-[#FFFFFF] dark:bg-[#111B2E] text-[#0F172A] dark:text-[#E2E8F0] shadow-sm'
                    : 'text-[#475569] dark:text-[#94A3B8] hover:text-[#0F172A] dark:hover:text-[#E2E8F0]'
                }`}
              >
                Customer Invoice
              </button>
              <button
                type="button"
                onClick={() => {
                  setDocType('bill');
                }}
                className={`py-2 px-3 text-[13px] font-semibold rounded-[6px] transition-all text-center ${
                  docType === 'bill'
                    ? 'bg-[#FFFFFF] dark:bg-[#111B2E] text-[#0F172A] dark:text-[#E2E8F0] shadow-sm'
                    : 'text-[#475569] dark:text-[#94A3B8] hover:text-[#0F172A] dark:hover:text-[#E2E8F0]'
                }`}
              >
                Supplier Bill
              </button>
            </div>
          </div>

          {/* Reference & Date */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label data-tour="pay-reference" className="block text-[12px] font-semibold text-[#475569] dark:text-[#94A3B8] mb-1.5 uppercase tracking-wider">
                Reference
              </label>
              <input
                type="text"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                className="w-full px-3 py-2 bg-[#FFFFFF] dark:bg-[#111B2E] border border-[#CBD5E1] dark:border-[#334155] rounded-[8px] text-[13px] text-[#0F172A] dark:text-[#E2E8F0] font-medium focus:outline-none focus:border-[#059669] focus:ring-3 focus:ring-[#059669]/12"
              />
            </div>
            <div>
              <label data-tour="pay-date" className="block text-[12px] font-semibold text-[#475569] dark:text-[#94A3B8] mb-1.5 uppercase tracking-wider">
                Payment Date
              </label>
              <input
                type="date"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                className="w-full px-3 py-2 bg-[#FFFFFF] dark:bg-[#111B2E] border border-[#CBD5E1] dark:border-[#334155] rounded-[8px] text-[13px] text-[#0F172A] dark:text-[#E2E8F0] font-medium font-mono focus:outline-none focus:border-[#059669] focus:ring-3 focus:ring-[#059669]/12"
              />
            </div>
          </div>

          {/* Document Total */}
          <div>
            <label data-tour="pay-total"
              htmlFor={totalInputId}
              className="block text-[12px] font-semibold text-[#475569] dark:text-[#94A3B8] mb-1.5 uppercase tracking-wider"
            >
              Document Total (PHP)
            </label>
            <input
              id={totalInputId}
              type="text"
              value={rawTotal}
              onChange={(e) => setRawTotal(e.target.value)}
              placeholder="0.00"
              className="w-full px-3 py-2 bg-[#FFFFFF] dark:bg-[#111B2E] border border-[#CBD5E1] dark:border-[#334155] rounded-[8px] text-[15px] font-mono num-tabular font-medium text-[#0F172A] dark:text-[#E2E8F0] text-right focus:outline-none focus:border-[#059669] focus:ring-3 focus:ring-[#059669]/12"
            />
          </div>

          {/* Amount Already Paid */}
          <div>
            <label data-tour="pay-paid"
              htmlFor={paidInputId}
              className="block text-[12px] font-semibold text-[#475569] dark:text-[#94A3B8] mb-1.5 uppercase tracking-wider"
            >
              Amount Already Paid (PHP)
            </label>
            <input
              id={paidInputId}
              type="text"
              value={rawPaid}
              onChange={(e) => setRawPaid(e.target.value)}
              placeholder="0.00"
              className="w-full px-3 py-2 bg-[#FFFFFF] dark:bg-[#111B2E] border border-[#CBD5E1] dark:border-[#334155] rounded-[8px] text-[15px] font-mono num-tabular font-medium text-[#0F172A] dark:text-[#E2E8F0] text-right focus:outline-none focus:border-[#059669] focus:ring-3 focus:ring-[#059669]/12"
            />
          </div>

          {/* This Payment */}
          <div>
            <label data-tour="pay-payment"
              htmlFor={paymentInputId}
              className="block text-[12px] font-semibold text-[#475569] dark:text-[#94A3B8] mb-1.5 uppercase tracking-wider"
            >
              This Payment (PHP)
            </label>
            <input
              id={paymentInputId}
              type="text"
              value={rawPayment}
              onChange={(e) => setRawPayment(e.target.value)}
              placeholder="0.00"
              aria-invalid={!!paymentError}
              aria-describedby={paymentError ? `${paymentInputId}-error` : undefined}
              className={`w-full px-3 py-2 bg-[#FFFFFF] dark:bg-[#111B2E] border rounded-[8px] text-[15px] font-mono num-tabular font-medium text-right focus:outline-none focus:ring-3 focus:ring-[#059669]/12 ${
                paymentError
                  ? 'border-[#DC2626] dark:border-[#F87171] text-[#DC2626] dark:text-[#F87171]'
                  : 'border-[#CBD5E1] dark:border-[#334155] text-[#0F172A] dark:text-[#E2E8F0] focus:border-[#059669]'
              }`}
            />
            {paymentError && (
              <div
                id={`${paymentInputId}-error`}
                className="mt-2 p-2.5 bg-[#DC2626]/10 border border-[#DC2626]/20 rounded-[8px] flex items-start gap-2 text-[12px] font-medium text-[#DC2626] dark:text-[#F87171]"
              >
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{paymentError}</span>
              </div>
            )}
          </div>
        </div>

        {/* Right Status & Breakdown Cards */}
        <div className="lg:col-span-7 space-y-6">
          {/* KPI Tiles */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Amount Due After Payment */}
            <div className="bg-[#FFFFFF] dark:bg-[#111B2E] border border-[#E2E8F0] dark:border-[#1E293B] rounded-[12px] p-5 shadow-[0_8px_24px_rgba(15,23,42,0.06)]">
              <span className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[#475569] dark:text-[#94A3B8] block mb-2">
                Amount Due After Payment
              </span>
              <div className="text-[26px] font-bold tracking-[-0.02em] font-mono num-tabular text-[#0F172A] dark:text-[#E2E8F0]">
                {formatPHP(amountDueAfterPayment)}
              </div>
              <span className="text-[12px] text-[#475569] dark:text-[#94A3B8] mt-1 block">
                Outstanding balance on document
              </span>
            </div>

            {/* Document Settlement Status Badge */}
            <div data-tour="pay-status" className="bg-[#FFFFFF] dark:bg-[#111B2E] border border-[#E2E8F0] dark:border-[#1E293B] rounded-[12px] p-5 shadow-[0_8px_24px_rgba(15,23,42,0.06)] flex flex-col justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[#475569] dark:text-[#94A3B8] block mb-2">
                Document Status
              </span>
              <div>
                {isPaidInFull ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[13px] font-semibold bg-[#059669]/10 text-[#047857] dark:text-[#34D399] border border-[#059669]/30">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Paid
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[13px] font-semibold bg-[#2563EB]/10 text-[#2563EB] dark:text-[#60A5FA] border border-[#2563EB]/30">
                    <CreditCard className="w-3.5 h-3.5" />
                    Awaiting payment
                  </span>
                )}
              </div>
              <span className="text-[12px] text-[#475569] dark:text-[#94A3B8] mt-2 block">
                {isPaidInFull
                  ? 'Zero balance remaining; account fully settled'
                  : `PHP ${formatPHP(amountDueAfterPayment, false)} awaiting final settlement`}
              </span>
            </div>
          </div>

          {/* Settlement Breakdown Table */}
          <div className="bg-[#FFFFFF] dark:bg-[#111B2E] border border-[#E2E8F0] dark:border-[#1E293B] rounded-[12px] p-5 shadow-[0_8px_24px_rgba(15,23,42,0.06)] space-y-3">
            <h4 className="text-[15px] font-bold text-[#0F172A] dark:text-[#E2E8F0]">
              Settlement Calculation Breakdown
            </h4>

            <div className="divide-y divide-[#E2E8F0] dark:divide-[#1E293B] text-[13px]">
              <div className="flex justify-between py-2">
                <span className="text-[#475569] dark:text-[#94A3B8]">Gross Document Total:</span>
                <span className="font-mono num-tabular font-medium text-[#0F172A] dark:text-[#E2E8F0]">
                  {formatPHP(totalCents)}
                </span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-[#475569] dark:text-[#94A3B8]">Less Historic Payments:</span>
                <span className="font-mono num-tabular font-medium text-[#475569] dark:text-[#94A3B8]">
                  {formatPHP(paidCents)}
                </span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-[#475569] dark:text-[#94A3B8]">Amount Due Prior to Current Run:</span>
                <span className="font-mono num-tabular font-semibold text-[#0F172A] dark:text-[#E2E8F0]">
                  {formatPHP(amountDueBeforePayment)}
                </span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-[#475569] dark:text-[#94A3B8]">This Payment Application:</span>
                <span className="font-mono num-tabular font-semibold text-[#059669] dark:text-[#34D399]">
                  {isPaymentValid ? formatPHP(paymentCents) : '—'}
                </span>
              </div>
              <div className="flex justify-between py-2 font-bold text-[14px]">
                <span className="text-[#0F172A] dark:text-[#E2E8F0]">Closing Amount Due:</span>
                <span className="font-mono num-tabular text-[#0F172A] dark:text-[#E2E8F0]">
                  {formatPHP(amountDueAfterPayment)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Live Journal Preview */}
      <JournalPreviewTable
        calculator="payment"
        title={docType === 'invoice' ? 'Bank Receipt Journal Preview' : 'Bank Disbursement Journal Preview'}
        subtitle={`Cash ledger posting for ${reference} payment`}
        lines={journalLines}
        emptyMessage={
          paymentError
            ? `Journal cannot be generated: ${paymentError}`
            : 'Enter a valid payment amount to preview double-entry cash journal.'
        }
      />
    </div>
  );
};
