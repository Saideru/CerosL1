import React, { useCallback, useEffect, useLayoutEffect, useState } from 'react';
import { HelpCircle, X, ArrowLeft, ArrowRight } from 'lucide-react';
import { CalculatorKey, CALCULATOR_LABELS } from '../types/activity';

/**
 * Step-by-step guided tour for each calculator.
 * Each step points (with an arrow) at an element tagged data-tour="<target>".
 * A step without a target is shown centred (intro / summary).
 */
interface TourStep {
  target?: string;
  title: string;
  body: string;
}

const MONEY_RULES: TourStep = {
  title: 'How amounts are handled',
  body:
    'Type amounts with or without commas or "PHP" / "₱" (e.g. 1,250.50). Negative amounts are not allowed. ' +
    'Every amount is converted to whole centavos and rounded half-up, so totals never drift. ' +
    'Nothing is posted to your ledger — these are calculations and previews only.'
};

export const CALCULATOR_TOURS: Record<CalculatorKey, TourStep[]> = {
  vat: [
    { title: 'VAT Calculator', body: 'Works out the Net, VAT and Gross figures for one amount using Philippine VAT rates. Click Next to go through each part.' },
    { target: 'vat-mode', title: '1. Calculation Mode', body: '"Add VAT" when your amount is the price BEFORE tax (net). "Extract VAT" when your amount already INCLUDES tax (gross).' },
    { target: 'vat-amount', title: '2. Amount', body: 'Enter the net amount (Add mode) or the gross amount (Extract mode).' },
    { target: 'vat-rate', title: '3. Tax Classification', body: 'VAT 12% is the standard rate. Zero-rated 0% is for exports and zero-rated sales. VAT Exempt 0% is for exempt transactions. Both 0% options give ₱0.00 VAT.' },
    { target: 'vat-results', title: '4. Results', body: 'Add VAT: VAT = Net × 12%, Gross = Net + VAT. Extract VAT: Net = Gross ÷ 1.12, VAT = Gross − Net. Example: adding 12% to ₱1,000.00 gives VAT ₱120.00 and Gross ₱1,120.00.' },
    { target: 'vat-breakdown', title: '5. Calculation breakdown', body: 'Shows the exact formula, rate and rounding used so you can check the figures line by line.' },
    MONEY_RULES
  ],

  invoice_bill: [
    { title: 'Invoice & Bill Calculator', body: 'Builds a sales invoice (money owed to you) or a supplier bill (money you owe), totals every line with tax, and previews the journal entry it creates.' },
    { target: 'inv-type', title: '1. Invoice or Bill', body: 'Invoice = you are billing a customer. Bill = a supplier is billing you. Switching changes the accounts used in the journal.' },
    { target: 'inv-number', title: '2. Document number', body: 'Your reference number for the invoice or bill, e.g. INV-1001 or BILL-1001.' },
    { target: 'inv-contact', title: '3. Customer / Supplier', body: 'The name of who the document is for.' },
    { target: 'inv-issue', title: '4. Issue Date', body: 'The date of the document. Changing it automatically sets the due date to 30 days later.' },
    { target: 'inv-due', title: '5. Due Date', body: 'When payment is due. It cannot be before the issue date.' },
    { target: 'inv-lines', title: '6. Line items', body: 'One row per product or service: Description, Account, Quantity × Unit Price, and Tax Rate. Use "Add Line" for more rows and the bin icon to remove one.' },
    { target: 'inv-totals', title: '7. Totals', body: 'Each line\'s VAT is rounded to the centavo, then Subtotal (net), Total VAT and Grand Total are added up.' },
    { target: 'journal', title: '8. Journal preview', body: 'Invoice: Debit Accounts Receivable; Credit Revenue and VAT Payable. Bill: Debit Expense and VAT; Credit Accounts Payable. Use Copy CSV or Download CSV to import it into your ledger.' },
    MONEY_RULES
  ],

  payment: [
    { title: 'Payment Calculator', body: 'Records a payment against an invoice or bill, checks it does not exceed what is owed, and shows the remaining balance and status.' },
    { target: 'pay-direction', title: '1. Document Direction', body: 'Customer Invoice = money you receive. Supplier Bill = money you pay out.' },
    { target: 'pay-reference', title: '2. Reference', body: 'The invoice or bill number being paid.' },
    { target: 'pay-date', title: '3. Payment Date', body: 'The date the money was received or paid.' },
    { target: 'pay-total', title: '4. Document Total', body: 'The full amount of the invoice or bill.' },
    { target: 'pay-paid', title: '5. Amount Already Paid', body: 'Any earlier payments on the same document. It cannot be more than the Document Total.' },
    { target: 'pay-payment', title: '6. This Payment', body: 'The amount being paid now. If it is more than the amount due it is refused with "Payment exceeds the amount due of PHP X."' },
    { target: 'pay-status', title: '7. Status', body: 'Amount Due = Total − Already Paid − This Payment. Shows "Paid" when nothing is left owing, otherwise "Awaiting payment".' },
    { target: 'journal', title: '8. Journal preview', body: 'Invoice payment: Debit Bank; Credit Accounts Receivable. Bill payment: Debit Accounts Payable; Credit Bank. Export with Copy CSV or Download CSV.' },
    MONEY_RULES
  ],

  balancer: [
    { title: 'Journal Balancer', body: 'Enter a manual journal entry line by line and check that total debits equal total credits before posting it in your ledger.' },
    { target: 'jrn-date', title: '1. Posting Date', body: 'The date the journal entry takes effect.' },
    { target: 'jrn-ref', title: '2. Reference', body: 'An ID for the entry, e.g. JRN-1001.' },
    { target: 'jrn-rows', title: '3. Journal lines', body: 'Account: type a code or name (e.g. "1000" or "Business Bank Account"); the Type fills in automatically (1 = Asset, 2 = Liability, 3 = Equity, 4 = Revenue, 5–8 = Expense). Each line is a Debit OR a Credit — typing in one clears the other.' },
    { target: 'jrn-add', title: '4. Add Row', body: 'Adds another journal line. Use the bin icon on a row to remove it.' },
    { target: 'jrn-status', title: '5. Balance check', body: '"Balanced" when there are at least two lines and debits equal credits. Otherwise it shows exactly: "Journal does not balance: debits X vs credits Y."' },
    { target: 'journal', title: '6. Preview & export', body: 'The lines with amounts, ready to copy or download as CSV.' },
    MONEY_RULES
  ],

  statement: [
    { title: 'Statement Check', body: 'Checks your profit for the period and verifies the balance-sheet equation: Assets = Liabilities + Equity.' },
    { target: 'st-pl', title: '1. Profit & Loss', body: 'This section works out Net Profit = Revenue − Expenses.' },
    { target: 'st-revenue', title: '2. Revenue', body: 'Total income for the period.' },
    { target: 'st-expenses', title: '3. Expenses', body: 'Total costs for the period. If expenses are higher than revenue, the result is a net loss.' },
    { target: 'st-bs', title: '4. Balance Sheet', body: 'This section checks that Assets = Liabilities + Equity.' },
    { target: 'st-link', title: '5. Link profit to equity', body: 'On (default): the Net Profit above is added to equity automatically. Off: type the current-year profit yourself.' },
    { target: 'st-assets', title: '6. Total Assets', body: 'Everything the business owns: cash, receivables, inventory, equipment.' },
    { target: 'st-liabilities', title: '7. Total Liabilities', body: 'Everything the business owes: payables, VAT payable, loans.' },
    { target: 'st-equity', title: '8. Equity', body: 'Owner\'s equity BEFORE this period\'s profit.' },
    { target: 'st-profit', title: '9. Current Year Profit / Loss', body: 'Taken from the P&L section when linked, or typed in when not linked.' },
    { target: 'st-result', title: '10. Result', body: '"Assets equal liabilities plus equity" when it balances. Otherwise "Assets differ from liabilities plus equity by PHP X." — use that amount to find the missing or wrong entry.' },
    MONEY_RULES
  ],

  aging: [
    { title: 'Aging Calculator', body: 'Sorts unpaid customer invoices or supplier bills by how overdue they are, so you can see what to chase or pay first.' },
    { target: 'ag-type', title: '1. Schedule Type', body: 'Aged Receivables = customers who owe you. Aged Payables = suppliers you owe.' },
    { target: 'ag-kpis', title: '2. Summary', body: 'Total outstanding, total overdue and how much of it is in each bracket.' },
    { target: 'ag-asof', title: '3. As-Of Date', body: 'The cut-off date every row is measured from — usually today or month-end.' },
    { target: 'ag-table', title: '4. Schedule rows', body: 'For each party enter the name, due date and amount. Brackets: Current (due on or after the as-of date), 1–30, 31–60, 61–90 and Over 90 days past due.' },
    { target: 'ag-add', title: '5. Add Row', body: 'Adds another invoice or bill. Use the bin icon on a row to remove it.' },
    MONEY_RULES
  ]
};

/** Round "?" button for the right side of a header. */
export const HelpButton: React.FC<{ onClick: () => void; label: string; className?: string }> = ({
  onClick,
  label,
  className = ''
}) => (
  <button
    type="button"
    onClick={onClick}
    title={`How the ${label} calculator works`}
    aria-label={`Help: how the ${label} calculator works`}
    className={`inline-flex items-center justify-center w-8 h-8 rounded-full border border-[#059669]/40 text-[#047857] dark:text-[#34D399] bg-[#059669]/10 hover:bg-[#059669]/20 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#059669] ${className}`}
  >
    <HelpCircle className="w-4 h-4" />
  </button>
);

/** Labels/headings point at their whole field or card, not just the text. */
function resolveTarget(id: string): HTMLElement | null {
  const el = document.querySelector<HTMLElement>(`[data-tour="${id}"]`);
  if (!el) return null;
  if (el.tagName === 'LABEL') return el.parentElement ?? el;
  if (el.tagName === 'H3') return el.closest<HTMLElement>('[class*="rounded-[12px]"]') ?? el;
  return el;
}

interface Box {
  top: number;
  left: number;
  width: number;
  height: number;
}

const PAD = 6; // spotlight padding around the target
const POP_W = 340;
const GAP = 14; // space between target and popover (arrow sits here)

export const CalculatorTour: React.FC<{
  calculator: CalculatorKey;
  isOpen: boolean;
  onClose: () => void;
}> = ({ calculator, isOpen, onClose }) => {
  const [step, setStep] = useState(0);
  const [box, setBox] = useState<Box | null>(null);

  // Only keep steps whose target is on screen (or centred steps)
  const [steps, setSteps] = useState<TourStep[]>([]);

  useEffect(() => {
    if (!isOpen) return;
    const all = CALCULATOR_TOURS[calculator];
    setSteps(all.filter((s) => !s.target || resolveTarget(s.target)));
    setStep(0);
  }, [isOpen, calculator]);

  const current = steps[step];

  const measure = useCallback(() => {
    if (!current?.target) {
      setBox(null);
      return;
    }
    const el = resolveTarget(current.target);
    if (!el) {
      setBox(null);
      return;
    }
    const r = el.getBoundingClientRect();
    setBox({ top: r.top - PAD, left: r.left - PAD, width: r.width + PAD * 2, height: r.height + PAD * 2 });
  }, [current]);

  // Scroll the target into view, then follow it while scrolling/resizing
  useLayoutEffect(() => {
    if (!isOpen || !current) return;
    if (current.target) {
      resolveTarget(current.target)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    measure();
    const t = window.setTimeout(measure, 400);
    window.addEventListener('scroll', measure, true);
    window.addEventListener('resize', measure);
    return () => {
      window.clearTimeout(t);
      window.removeEventListener('scroll', measure, true);
      window.removeEventListener('resize', measure);
    };
  }, [isOpen, current, measure]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') setStep((s) => Math.min(s + 1, steps.length - 1));
      if (e.key === 'ArrowLeft') setStep((s) => Math.max(s - 1, 0));
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose, steps.length]);

  if (!isOpen || !current) return null;

  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const popW = Math.min(POP_W, vw - 32);
  const isLast = step === steps.length - 1;

  // Popover position: below the target if there is room, otherwise above
  let popStyle: React.CSSProperties;
  let arrow: { side: 'top' | 'bottom'; left: number } | null = null;

  if (box) {
    const placeBelow = box.top + box.height + GAP + 220 < vh || box.top < 240;
    const centerX = box.left + box.width / 2;
    const left = Math.max(16, Math.min(centerX - popW / 2, vw - popW - 16));
    const arrowLeft = Math.max(16, Math.min(centerX - left, popW - 16));
    if (placeBelow) {
      popStyle = { top: Math.min(box.top + box.height + GAP, vh - 200), left, width: popW };
      arrow = { side: 'top', left: arrowLeft };
    } else {
      popStyle = { bottom: Math.max(vh - box.top + GAP, 16), left, width: popW };
      arrow = { side: 'bottom', left: arrowLeft };
    }
  } else {
    popStyle = { top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: popW };
  }

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-labelledby="tour-title">
      {/* Dim backdrop with a spotlight cut-out around the target */}
      {box ? (
        <div
          className="fixed rounded-[10px] ring-2 ring-[#34D399] transition-all duration-200 pointer-events-none"
          style={{
            top: box.top,
            left: box.left,
            width: box.width,
            height: box.height,
            boxShadow: '0 0 0 9999px rgba(15, 23, 42, 0.65)'
          }}
        />
      ) : (
        <div className="fixed inset-0 bg-[#0F172A]/65" />
      )}
      {/* Click-catcher (clicking outside closes) */}
      <div className="fixed inset-0" onClick={onClose} />

      {/* Popover */}
      <div
        className="fixed bg-[#FFFFFF] dark:bg-[#111B2E] border border-[#E2E8F0] dark:border-[#334155] rounded-[12px] shadow-[0_20px_50px_rgba(0,0,0,0.35)] transition-all duration-200"
        style={popStyle}
      >
        {arrow && (
          <span
            aria-hidden="true"
            className={`absolute w-3.5 h-3.5 rotate-45 bg-[#FFFFFF] dark:bg-[#111B2E] border-[#E2E8F0] dark:border-[#334155] ${
              arrow.side === 'top' ? '-top-[8px] border-l border-t' : '-bottom-[8px] border-r border-b'
            }`}
            style={{ left: arrow.left - 7 }}
          />
        )}

        <div className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[#047857] dark:text-[#34D399]">
                {CALCULATOR_LABELS[calculator]} · Step {step + 1} of {steps.length}
              </span>
              <h2 id="tour-title" className="text-[16px] font-bold text-[#0F172A] dark:text-[#E2E8F0] mt-0.5">
                {current.title}
              </h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close guide"
              className="p-1 rounded-[6px] text-[#475569] dark:text-[#94A3B8] hover:bg-[#F1F5F9] dark:hover:bg-[#1E293B]"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <p className="mt-2 text-[14px] leading-relaxed text-[#475569] dark:text-[#94A3B8]">{current.body}</p>
        </div>

        <div className="px-4 pb-4 flex items-center justify-between gap-3">
          {/* Progress dots */}
          <div className="flex items-center gap-1" aria-hidden="true">
            {steps.map((_, i) => (
              <span
                key={i}
                className={`h-1.5 rounded-full transition-all ${
                  i === step ? 'w-4 bg-[#059669] dark:bg-[#34D399]' : 'w-1.5 bg-[#CBD5E1] dark:bg-[#334155]'
                }`}
              />
            ))}
          </div>

          <div className="flex items-center gap-2">
            {step > 0 && (
              <button
                type="button"
                onClick={() => setStep(step - 1)}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-[13px] font-semibold text-[#475569] dark:text-[#94A3B8] border border-[#CBD5E1] dark:border-[#334155] rounded-[8px] hover:text-[#0F172A] dark:hover:text-[#E2E8F0]"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Back
              </button>
            )}
            <button
              type="button"
              onClick={() => (isLast ? onClose() : setStep(step + 1))}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-[13px] font-semibold text-white bg-[#059669] hover:bg-[#047857] rounded-[8px]"
            >
              {isLast ? 'Finish' : 'Next'} {!isLast && <ArrowRight className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
