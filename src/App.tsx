import React, { useEffect, useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AuthScreen } from './components/auth/AuthScreen';
import { CerosLogo } from './components/CerosLogo';
import { VatCalculator } from './components/calculators/VatCalculator';
import { InvoiceBillCalculator } from './components/calculators/InvoiceBillCalculator';
import { PaymentCalculator } from './components/calculators/PaymentCalculator';
import { JournalBalancer } from './components/calculators/JournalBalancer';
import { StatementCheck } from './components/calculators/StatementCheck';
import { AgingCalculator } from './components/calculators/AgingCalculator';
import { AcceptanceTestModal } from './components/AcceptanceTestModal';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { useTheme } from './hooks/useTheme';
import { USER_TYPE_LABELS } from './types/auth';
import { CalculatorKey } from './types/activity';
import {
  Percent,
  FileSpreadsheet,
  CreditCard,
  Scale,
  FileCheck2,
  Clock,
  Sun,
  Moon,
  Laptop,
  Menu,
  X,
  ShieldCheck,
  ChevronRight,
  Info,
  LogOut,
  Building2,
  LayoutDashboard
} from 'lucide-react';

export type CalculatorId = CalculatorKey;

interface NavItem {
  id: CalculatorId;
  label: string;
  shortDesc: string;
  icon: React.ComponentType<{ className?: string }>;
}

const NAV_ITEMS: NavItem[] = [
  {
    id: 'vat',
    label: 'VAT',
    shortDesc: 'Net & Gross Value Added Tax',
    icon: Percent
  },
  {
    id: 'invoice_bill',
    label: 'Invoice & Bill',
    shortDesc: 'Line-item taxes & GL preview',
    icon: FileSpreadsheet
  },
  {
    id: 'payment',
    label: 'Payment',
    shortDesc: 'Document settlement & status',
    icon: CreditCard
  },
  {
    id: 'balancer',
    label: 'Journal Balancer',
    shortDesc: 'Debits, credits & CSV export',
    icon: Scale
  },
  {
    id: 'statement',
    label: 'Statement Check',
    shortDesc: 'P&L profit & balance sheet audit',
    icon: FileCheck2
  },
  {
    id: 'aging',
    label: 'Aging',
    shortDesc: '5-bracket receivables & payables',
    icon: Clock
  }
];

function CalculatorWorkspace({ onOpenAdmin }: { onOpenAdmin?: () => void }) {
  const { user, signOut, logActivity } = useAuth();
  const [activeCalc, setActiveCalc] = useState<CalculatorId>('vat');
  const [theme, setTheme] = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [testModalOpen, setTestModalOpen] = useState(false);

  const selectCalculator = (id: CalculatorId) => {
    if (id !== activeCalc) {
      logActivity('open_calculator', { calculator: id });
    }
    setActiveCalc(id);
    setMobileMenuOpen(false);
  };

  const openTests = () => {
    logActivity('run_acceptance_tests');
    setTestModalOpen(true);
  };

  const roleLabel = user ? USER_TYPE_LABELS[user.userType] : '';

  // Record the calculator shown when the workspace first opens
  useEffect(() => {
    logActivity('open_calculator', { calculator: 'vat' });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const currentNav = NAV_ITEMS.find((n) => n.id === activeCalc) ?? NAV_ITEMS[0];

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#F1F5F9] dark:bg-[#0B1220] text-[#0F172A] dark:text-[#E2E8F0]">
      {/* Mobile Top Bar */}
      <header className="md:hidden flex items-center justify-between px-4 py-3 bg-[#0F172A] text-[#F8FAFC] border-b border-[#1E293B] sticky top-0 z-40">
        <div className="flex items-center gap-2.5">
          <CerosLogo size={28} />
          <div>
            <span className="font-bold text-[15px] tracking-tight text-[#F8FAFC] block leading-none">
              CerosL1
            </span>
            <span className="text-[10px] font-semibold text-[#94A3B8] uppercase tracking-wider">
              {user?.companyName || 'Calculator'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={openTests}
            className="p-1.5 text-[#34D399] hover:bg-[#1E293B] rounded-[6px]"
            title="Acceptance Tests"
          >
            <ShieldCheck className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-1.5 text-[#F8FAFC] hover:bg-[#1E293B] rounded-[6px]"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* Mobile Dropdown Menu Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[#0F172A] border-b border-[#1E293B] px-4 py-3 space-y-2 z-40 sticky top-[53px]">
          {/* User Profile Strip */}
          <div className="p-3 bg-[#1E293B] rounded-[8px] flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-[#059669] text-white flex items-center justify-center font-bold text-[12px]">
                {user?.avatarInitials || 'US'}
              </div>
              <div>
                <div className="text-[13px] font-bold text-[#F8FAFC] leading-none">
                  {user?.name}
                </div>
                <div className="text-[11px] text-[#94A3B8] mt-0.5">@{user?.username}</div>
              </div>
            </div>
            <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-[#059669]/20 text-[#34D399] border border-[#059669]/30">
              {roleLabel}
            </span>
          </div>

          <div className="text-[11px] font-semibold uppercase tracking-wider text-[#94A3B8] px-2 py-1">
            Calculators
          </div>
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeCalc === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => selectCalculator(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-[8px] text-[13px] font-medium transition-colors text-left ${
                  isActive
                    ? 'bg-[#1E293B] text-[#34D399] font-semibold'
                    : 'text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-[#1E293B]/60'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-[#34D399]' : 'text-[#94A3B8]'}`} />
                <div className="flex-1">
                  <div className="leading-tight">{item.label}</div>
                  <div className="text-[11px] text-[#94A3B8] opacity-80">{item.shortDesc}</div>
                </div>
              </button>
            );
          })}

          {/* Theme & Sign Out */}
          <div className="pt-2 mt-2 border-t border-[#1E293B] flex items-center justify-between px-2 text-[12px] text-[#94A3B8]">
            <span>Interface Mode</span>
            <div className="flex items-center gap-1 bg-[#1E293B] p-0.5 rounded-[6px]">
              <button
                type="button"
                onClick={() => setTheme('light')}
                className={`p-1 rounded-[4px] ${theme === 'light' ? 'bg-[#0F172A] text-white' : 'text-[#94A3B8]'}`}
                title="Light mode"
              >
                <Sun className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setTheme('dark')}
                className={`p-1 rounded-[4px] ${theme === 'dark' ? 'bg-[#0F172A] text-white' : 'text-[#94A3B8]'}`}
                title="Dark mode"
              >
                <Moon className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setTheme('system')}
                className={`p-1 rounded-[4px] ${theme === 'system' ? 'bg-[#0F172A] text-white' : 'text-[#94A3B8]'}`}
                title="System theme"
              >
                <Laptop className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {onOpenAdmin && (
            <button
              type="button"
              onClick={onOpenAdmin}
              className="w-full mt-2 flex items-center justify-center gap-2 p-2 bg-[#1E293B] text-[#34D399] rounded-[8px] text-[13px] font-semibold"
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Back to Admin Console</span>
            </button>
          )}

          <button
            type="button"
            onClick={signOut}
            className="w-full mt-2 flex items-center justify-center gap-2 p-2 bg-[#DC2626]/10 text-[#F87171] hover:bg-[#DC2626]/20 rounded-[8px] text-[13px] font-semibold transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign out</span>
          </button>
        </div>
      )}

      {/* Desktop Deep Slate Sidebar */}
      <aside className="hidden md:flex flex-col w-[260px] lg:w-[280px] bg-[#0F172A] text-[#F8FAFC] border-r border-[#1E293B] shrink-0 min-h-screen sticky top-0 h-screen overflow-y-auto custom-scrollbar">
        {/* Brand Header */}
        <div className="p-5 border-b border-[#1E293B] flex items-center gap-3">
          <CerosLogo size={36} />
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="font-bold text-[18px] tracking-tight text-[#F8FAFC]">
                CerosL1
              </span>
              <span className="text-[12px] font-semibold text-[#34D399] tracking-normal">
                Calculator
              </span>
            </div>
            <p className="text-[11px] text-[#94A3B8] tracking-wide mt-0.5">
              Accounting Tools for CerosL1 Ledger
            </p>
          </div>
        </div>

        {/* Company Context Badge */}
        <div className="px-4 pt-3 pb-1">
          <div className="p-2.5 bg-[#1E293B] border border-[#334155]/60 rounded-[8px] flex items-center gap-2">
            <Building2 className="w-4 h-4 text-[#34D399] shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="text-[12px] font-semibold text-[#F8FAFC] truncate">
                {user?.companyName || 'CerosL1 Ledger'}
              </div>
              <div className="text-[10px] text-[#94A3B8] uppercase tracking-wider">
                Active Books
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Section */}
        <div className="flex-1 p-4 space-y-1">
          <div className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[#94A3B8] px-3 py-2">
            Ledger Calculators
          </div>
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeCalc === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => selectCalculator(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-[8px] text-[13px] transition-colors text-left group ${
                  isActive
                    ? 'bg-[#1E293B] text-[#34D399] font-semibold shadow-xs'
                    : 'text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-[#1E293B]/50'
                }`}
              >
                <Icon
                  className={`w-4 h-4 shrink-0 transition-colors ${
                    isActive ? 'text-[#34D399]' : 'text-[#94A3B8] group-hover:text-[#F8FAFC]'
                  }`}
                />
                <div className="flex-1 truncate">
                  <div className="truncate">{item.label}</div>
                  <div className="text-[11px] font-normal text-[#64748B] group-hover:text-[#94A3B8] truncate">
                    {item.shortDesc}
                  </div>
                </div>
                {isActive && <ChevronRight className="w-3.5 h-3.5 text-[#34D399] shrink-0" />}
              </button>
            );
          })}
        </div>

        {/* User Profile & SOP Sign Out Section */}
        <div className="p-4 border-t border-[#1E293B] space-y-3">
          {/* User info card */}
          <div className="relative p-2.5 bg-[#1E293B] rounded-[8px] border border-[#334155]/60">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-7 h-7 rounded-full bg-[#059669] text-white flex items-center justify-center font-bold text-[11px] shrink-0">
                  {user?.avatarInitials || 'US'}
                </div>
                <div className="min-w-0">
                  <div className="text-[12px] font-bold text-[#F8FAFC] truncate">
                    {user?.name}
                  </div>
                  <div className="text-[11px] text-[#94A3B8] truncate">@{user?.username}</div>
                </div>
              </div>

              {/* Role badge */}
              <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-[#059669]/20 text-[#34D399] border border-[#059669]/30 shrink-0">
                {roleLabel}
              </span>
            </div>
          </div>

          {onOpenAdmin && (
            <button
              type="button"
              onClick={onOpenAdmin}
              className="w-full flex items-center gap-2 px-3 py-2 bg-[#059669] hover:bg-[#047857] text-white rounded-[8px] text-[12px] font-semibold transition-colors"
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Back to Admin Console</span>
            </button>
          )}

          {/* Acceptance Test Inspector Button */}
          <button
            type="button"
            onClick={openTests}
            className="w-full flex items-center justify-between px-3 py-2 bg-[#1E293B] hover:bg-[#334155] text-[#34D399] border border-[#34D399]/30 rounded-[8px] text-[12px] font-semibold transition-colors"
          >
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4" />
              <span>Acceptance Tests</span>
            </div>
          </button>

          {/* Theme Selector */}
          <div className="flex items-center justify-between text-[12px] text-[#94A3B8]">
            <span>Theme</span>
            <div className="flex items-center gap-1 bg-[#1E293B] p-0.5 rounded-[6px] border border-[#334155]">
              <button
                type="button"
                onClick={() => setTheme('light')}
                className={`p-1.5 rounded-[4px] transition-colors ${
                  theme === 'light' ? 'bg-[#0F172A] text-white shadow-xs' : 'text-[#94A3B8] hover:text-white'
                }`}
                title="Light mode"
              >
                <Sun className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setTheme('dark')}
                className={`p-1.5 rounded-[4px] transition-colors ${
                  theme === 'dark' ? 'bg-[#0F172A] text-white shadow-xs' : 'text-[#94A3B8] hover:text-white'
                }`}
                title="Dark mode"
              >
                <Moon className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setTheme('system')}
                className={`p-1.5 rounded-[4px] transition-colors ${
                  theme === 'system' ? 'bg-[#0F172A] text-white shadow-xs' : 'text-[#94A3B8] hover:text-white'
                }`}
                title="System preference"
              >
                <Laptop className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* SOP-02 Step 5 Sign Out Button */}
          <button
            type="button"
            onClick={signOut}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-[12px] font-semibold text-[#94A3B8] hover:text-[#F87171] hover:bg-[#1E293B] border border-transparent hover:border-[#F87171]/20 rounded-[8px] transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Viewport */}
      <main className="flex-1 flex flex-col min-h-screen min-w-0">
        {/* Desktop Header Bar (Three-Zone Contract) */}
        <div className="hidden md:flex items-center justify-between px-8 py-4 bg-[#FFFFFF] dark:bg-[#111B2E] border-b border-[#E2E8F0] dark:border-[#1E293B]">
          {/* Breadcrumb / Section Name */}
          <div className="flex items-center gap-2 text-[13px] text-[#475569] dark:text-[#94A3B8]">
            <span className="font-semibold text-[#0F172A] dark:text-[#E2E8F0]">CerosL1 Calculator</span>
            <span>/</span>
            <span className="text-[#059669] dark:text-[#34D399] font-medium">{currentNav.label}</span>
          </div>

          {/* Quick System Status or Action */}
          <div className="flex items-center gap-4 text-[12px]">
            <div className="flex items-center gap-1.5 text-[#475569] dark:text-[#94A3B8] font-mono">
              <span className="w-2 h-2 rounded-full bg-[#059669]" />
              <span>Base Currency: PHP</span>
            </div>

            <div className="text-[12px] text-[#475569] dark:text-[#94A3B8]">
              Account: <strong className="text-[#0F172A] dark:text-[#E2E8F0]">{roleLabel}</strong>
            </div>

            <button
              type="button"
              onClick={openTests}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-semibold text-[#047857] dark:text-[#34D399] bg-[#059669]/10 hover:bg-[#059669]/20 border border-[#059669]/30 rounded-[8px] transition-colors"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Acceptance Tests</span>
            </button>
          </div>
        </div>

        {/* Calculator Workspace */}
        <div className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {activeCalc === 'vat' && <VatCalculator />}
          {activeCalc === 'invoice_bill' && <InvoiceBillCalculator />}
          {activeCalc === 'payment' && <PaymentCalculator />}
          {activeCalc === 'balancer' && <JournalBalancer />}
          {activeCalc === 'statement' && <StatementCheck />}
          {activeCalc === 'aging' && <AgingCalculator />}
        </div>

        {/* Standard Required Footer */}
        <footer className="mt-auto px-6 py-4 border-t border-[#E2E8F0] dark:border-[#1E293B] bg-[#FFFFFF] dark:bg-[#111B2E] text-center text-[12px] text-[#475569] dark:text-[#94A3B8]">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 max-w-7xl mx-auto">
            <div className="flex items-center gap-1.5 text-center sm:text-left">
              <Info className="w-3.5 h-3.5 text-[#94A3B8] shrink-0" />
              <span>Calculations only. Nothing is posted to the ledger.</span>
            </div>
            <div className="text-[11px] text-[#94A3B8]">
              Signed in as @{user?.username} ({roleLabel}) · CerosL1 Ledger Companion
            </div>
          </div>
        </footer>
      </main>

      {/* Acceptance Tests Modal */}
      <AcceptanceTestModal
        isOpen={testModalOpen}
        onClose={() => setTestModalOpen(false)}
        onSelectCalculator={(id) => selectCalculator(id as CalculatorId)}
      />
    </div>
  );
}

function AppWithAuth() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0F172A] flex items-center justify-center text-[#F8FAFC]">
        <div className="flex items-center gap-3">
          <CerosLogo size={32} />
          <span className="text-[14px] font-semibold text-[#94A3B8]">
            Loading CerosL1...
          </span>
        </div>
      </div>
    );
  }

  // If unauthenticated, show the sign-in screen first
  if (!user) {
    return <AuthScreen />;
  }

  // RBAC routing: admins land on the admin console, clients on the calculators
  return <RoleRouter />;
}

function RoleRouter() {
  const { user } = useAuth();
  const [adminView, setAdminView] = useState<'console' | 'calculators'>('console');

  if (user?.userType === 'admin') {
    return adminView === 'console' ? (
      <AdminDashboard onOpenCalculators={() => setAdminView('calculators')} />
    ) : (
      <CalculatorWorkspace onOpenAdmin={() => setAdminView('console')} />
    );
  }

  return <CalculatorWorkspace />;
}

export default function App() {
  return (
    <AuthProvider>
      <AppWithAuth />
    </AuthProvider>
  );
}
