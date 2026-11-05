import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../hooks/useTheme';
import { CerosLogo } from '../CerosLogo';
import { BarList, ChartDatum, ColumnChart } from './charts';
import { User, UserRow, UserType, USER_TYPE_LABELS, userFromRow } from '../../types/auth';
import {
  ActivityAction,
  ActivityLogRow,
  ACTIVITY_LABELS,
  CALCULATOR_LABELS,
  CalculatorKey
} from '../../types/activity';
import {
  LayoutDashboard,
  Users,
  ScrollText,
  Calculator,
  RefreshCw,
  LogOut,
  Sun,
  Moon,
  Laptop,
  Search,
  Download,
  AlertCircle,
  CheckCircle2,
  XCircle
} from 'lucide-react';

type AdminTab = 'overview' | 'clients' | 'logs';

const LOG_WINDOW_DAYS = 30;
const LOG_FETCH_LIMIT = 1000; // Supabase's default max rows per request
const LOG_PAGE_SIZE = 100;

const card =
  'bg-[#FFFFFF] dark:bg-[#111B2E] border border-[#E2E8F0] dark:border-[#1E293B] rounded-[12px] shadow-[0_8px_24px_rgba(15,23,42,0.06)]';
const inputBase =
  'px-3 py-2 bg-[#FFFFFF] dark:bg-[#0B1220] border border-[#CBD5E1] dark:border-[#334155] rounded-[8px] text-[13px] text-[#0F172A] dark:text-[#E2E8F0] focus:outline-none focus:border-[#059669] focus:ring-3 focus:ring-[#059669]/12';

const dayKey = (d: Date) => d.toLocaleDateString('en-CA'); // YYYY-MM-DD in local time

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString('en-PH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' });
}

function describeDetails(row: ActivityLogRow): string {
  const parts: string[] = [];
  if (row.calculator) parts.push(CALCULATOR_LABELS[row.calculator]);
  const d = row.details ?? {};
  if (typeof d.target_username === 'string') parts.push(`@${d.target_username}`);
  if (typeof d.new_user_type === 'string') parts.push(`→ ${USER_TYPE_LABELS[d.new_user_type as UserType] ?? d.new_user_type}`);
  if (typeof d.lines === 'number') parts.push(`${d.lines} lines`);
  return parts.join(' · ');
}

function csvEscape(v: string) {
  return `"${v.replace(/"/g, '""')}"`;
}

export const AdminDashboard: React.FC<{ onOpenCalculators: () => void }> = ({ onOpenCalculators }) => {
  const { user, signOut, can, logActivity } = useAuth();
  const [theme, setTheme] = useTheme();
  const [tab, setTab] = useState<AdminTab>('overview');

  const [users, setUsers] = useState<User[]>([]);
  const [logs, setLogs] = useState<ActivityLogRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [busyUserId, setBusyUserId] = useState<string | null>(null);

  // Clients tab
  const [clientSearch, setClientSearch] = useState('');

  // Logs tab filters
  const [logUser, setLogUser] = useState<string>('all');
  const [logAction, setLogAction] = useState<ActivityAction | 'all'>('all');
  const [logUserType, setLogUserType] = useState<UserType | 'all'>('client');
  const [logLimit, setLogLimit] = useState(LOG_PAGE_SIZE);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    const since = new Date(Date.now() - LOG_WINDOW_DAYS * 86_400_000).toISOString();

    const [usersRes, logsRes] = await Promise.all([
      supabase
        .from('user_tb')
        .select('id, username, full_name, user_type, company_name, avatar_initials, is_active, created_at')
        .order('created_at', { ascending: false }),
      supabase
        .from('activity_log_tb')
        .select('id, user_id, action, calculator, details, user_agent, created_at')
        .gte('created_at', since)
        .order('created_at', { ascending: false })
        .limit(LOG_FETCH_LIMIT)
    ]);

    if (usersRes.error || logsRes.error) {
      setLoadError((usersRes.error ?? logsRes.error)?.message ?? 'Could not load data.');
    } else {
      setUsers((usersRes.data as UserRow[]).map(userFromRow));
      setLogs(logsRes.data as ActivityLogRow[]);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const usersById = useMemo(() => new Map(users.map((u) => [u.id, u])), [users]);
  const clients = useMemo(() => users.filter((u) => u.userType === 'client'), [users]);
  const clientIds = useMemo(() => new Set(clients.map((c) => c.id)), [clients]);
  const clientLogs = useMemo(() => logs.filter((l) => clientIds.has(l.user_id)), [logs, clientIds]);

  // ---------- Overview aggregates (client activity only) ----------
  const overview = useMemo(() => {
    const now = new Date();
    const todayKey = dayKey(now);
    const weekAgo = Date.now() - 7 * 86_400_000;

    const daily: ChartDatum[] = [];
    const dailyCounts = new Map<string, number>();
    for (let i = 13; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const key = dayKey(d);
      dailyCounts.set(key, 0);
      daily.push({
        key,
        label: d.toLocaleDateString('en-PH', { month: 'short', day: 'numeric' }),
        fullLabel: d.toLocaleDateString('en-PH', { weekday: 'short', month: 'short', day: 'numeric' }),
        value: 0
      });
    }

    const byAction = new Map<ActivityAction, number>();
    const byCalculator = new Map<CalculatorKey, number>();
    const byClient = new Map<string, number>();
    const activeThisWeek = new Set<string>();
    let today = 0;

    for (const l of clientLogs) {
      const key = dayKey(new Date(l.created_at));
      if (dailyCounts.has(key)) dailyCounts.set(key, (dailyCounts.get(key) ?? 0) + 1);
      if (key === todayKey) today++;
      if (new Date(l.created_at).getTime() >= weekAgo) activeThisWeek.add(l.user_id);
      byAction.set(l.action, (byAction.get(l.action) ?? 0) + 1);
      if (l.action === 'open_calculator' && l.calculator) {
        byCalculator.set(l.calculator, (byCalculator.get(l.calculator) ?? 0) + 1);
      }
      byClient.set(l.user_id, (byClient.get(l.user_id) ?? 0) + 1);
    }

    for (const d of daily) d.value = dailyCounts.get(d.key) ?? 0;

    const actionData: ChartDatum[] = [...byAction.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([k, v]) => ({ key: k, label: ACTIVITY_LABELS[k], value: v }));

    const calculatorData: ChartDatum[] = (Object.keys(CALCULATOR_LABELS) as CalculatorKey[])
      .map((k) => ({ key: k, label: CALCULATOR_LABELS[k], value: byCalculator.get(k) ?? 0 }))
      .sort((a, b) => b.value - a.value);

    const topClients: ChartDatum[] = [...byClient.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([id, v]) => {
        const u = usersById.get(id);
        return { key: id, label: u?.name ?? 'Unknown', fullLabel: u ? `${u.name} (@${u.username})` : id, value: v };
      });

    return {
      daily,
      actionData,
      calculatorData,
      topClients,
      today,
      activeThisWeek: activeThisWeek.size,
      total: clientLogs.length
    };
  }, [clientLogs, usersById]);

  // ---------- Clients table ----------
  const lastActivity = useMemo(() => {
    const m = new Map<string, { at: string; count: number }>();
    for (const l of logs) {
      const cur = m.get(l.user_id);
      if (!cur) m.set(l.user_id, { at: l.created_at, count: 1 });
      else cur.count++;
    }
    return m;
  }, [logs]);

  const filteredUsers = useMemo(() => {
    const q = clientSearch.trim().toLowerCase();
    if (!q) return users;
    return users.filter(
      (u) =>
        u.name.toLowerCase().includes(q) ||
        u.username.toLowerCase().includes(q) ||
        u.companyName.toLowerCase().includes(q)
    );
  }, [users, clientSearch]);

  const updateUser = async (target: User, changes: { is_active?: boolean; user_type?: UserType }) => {
    setActionError(null);
    setBusyUserId(target.id);
    const { error } = await supabase.from('user_tb').update(changes).eq('id', target.id);
    setBusyUserId(null);

    if (error) {
      setActionError(error.message);
      return;
    }

    if (changes.is_active !== undefined) {
      logActivity(changes.is_active ? 'client_activated' : 'client_deactivated', {
        details: { target_user_id: target.id, target_username: target.username }
      });
    }
    if (changes.user_type !== undefined) {
      logActivity('user_type_changed', {
        details: { target_user_id: target.id, target_username: target.username, new_user_type: changes.user_type }
      });
    }

    setUsers((prev) =>
      prev.map((u) =>
        u.id === target.id
          ? {
              ...u,
              isActive: changes.is_active ?? u.isActive,
              userType: changes.user_type ?? u.userType
            }
          : u
      )
    );
  };

  // ---------- Logs table ----------
  const filteredLogs = useMemo(() => {
    return logs.filter((l) => {
      const u = usersById.get(l.user_id);
      if (logUserType !== 'all' && u?.userType !== logUserType) return false;
      if (logUser !== 'all' && l.user_id !== logUser) return false;
      if (logAction !== 'all' && l.action !== logAction) return false;
      return true;
    });
  }, [logs, usersById, logUser, logAction, logUserType]);

  const exportLogsCsv = () => {
    const header = 'Time,Username,Name,User Type,Action,Calculator,Details';
    const rows = filteredLogs.map((l) => {
      const u = usersById.get(l.user_id);
      return [
        new Date(l.created_at).toISOString(),
        csvEscape(u?.username ?? ''),
        csvEscape(u?.name ?? ''),
        u ? USER_TYPE_LABELS[u.userType] : '',
        csvEscape(ACTIVITY_LABELS[l.action] ?? l.action),
        l.calculator ? csvEscape(CALCULATOR_LABELS[l.calculator]) : '',
        csvEscape(JSON.stringify(l.details ?? {}))
      ].join(',');
    });
    const blob = new Blob([[header, ...rows].join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cerosl1_trace_logs_${dayKey(new Date())}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const tabs: { id: AdminTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'clients', label: 'Clients', icon: Users },
    { id: 'logs', label: 'Trace Logs', icon: ScrollText }
  ];

  const canManage = can('clients.manage');

  return (
    <div className="min-h-screen flex flex-col bg-[#F1F5F9] dark:bg-[#0B1220] text-[#0F172A] dark:text-[#E2E8F0]">
      {/* Header */}
      <header className="bg-[#0F172A] text-[#F8FAFC] border-b border-[#1E293B]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <CerosLogo size={32} />
            <div>
              <div className="flex items-baseline gap-1.5">
                <span className="font-bold text-[17px] tracking-tight">CerosL1</span>
                <span className="text-[12px] font-semibold text-[#34D399]">Admin Console</span>
              </div>
              <p className="text-[11px] text-[#94A3B8]">
                {user?.name} · @{user?.username}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 bg-[#1E293B] p-0.5 rounded-[6px] border border-[#334155]">
              {(
                [
                  ['light', Sun, 'Light mode'],
                  ['dark', Moon, 'Dark mode'],
                  ['system', Laptop, 'System preference']
                ] as const
              ).map(([mode, Icon, title]) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setTheme(mode)}
                  title={title}
                  aria-label={title}
                  className={`p-1.5 rounded-[4px] transition-colors ${
                    theme === mode ? 'bg-[#0F172A] text-white' : 'text-[#94A3B8] hover:text-white'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={onOpenCalculators}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-[12px] font-semibold bg-[#059669] hover:bg-[#047857] text-white rounded-[8px] transition-colors"
            >
              <Calculator className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Open Calculators</span>
            </button>
            <button
              type="button"
              onClick={signOut}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-[12px] font-semibold text-[#94A3B8] hover:text-[#F87171] hover:bg-[#1E293B] rounded-[8px] transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Sign out</span>
            </button>
          </div>
        </div>

        {/* Tabs */}
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex gap-1 overflow-x-auto">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={`inline-flex items-center gap-2 px-3 py-2.5 text-[13px] font-semibold border-b-2 transition-colors whitespace-nowrap ${
                tab === id
                  ? 'border-[#34D399] text-[#34D399]'
                  : 'border-transparent text-[#94A3B8] hover:text-[#F8FAFC]'
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </nav>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-[22px] font-bold tracking-[-0.02em]">
              {tab === 'overview' && 'Client Activity Overview'}
              {tab === 'clients' && 'Clients & Accounts'}
              {tab === 'logs' && 'Trace Logs'}
            </h1>
            <p className="text-[13px] text-[#475569] dark:text-[#94A3B8] mt-0.5">
              Last {LOG_WINDOW_DAYS} days · up to {LOG_FETCH_LIMIT.toLocaleString()} most recent events
            </p>
          </div>
          <button
            type="button"
            onClick={() => void loadData()}
            disabled={isLoading}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-[13px] font-semibold text-[#475569] dark:text-[#94A3B8] bg-[#FFFFFF] dark:bg-[#111B2E] border border-[#CBD5E1] dark:border-[#334155] rounded-[8px] hover:text-[#0F172A] dark:hover:text-[#E2E8F0] disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {(loadError || actionError) && (
          <div className="p-3 bg-[#DC2626]/10 border border-[#DC2626]/30 rounded-[8px] flex items-start gap-2.5 text-[13px] text-[#B91C1C] dark:text-[#F87171]">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{loadError ?? actionError}</span>
          </div>
        )}

        {/* ================= OVERVIEW ================= */}
        {tab === 'overview' && (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: 'Total clients', value: clients.length, hint: `${clients.filter((c) => !c.isActive).length} deactivated` },
                { label: 'Active this week', value: overview.activeThisWeek, hint: 'Clients with any activity in 7 days' },
                { label: 'Events today', value: overview.today, hint: 'Client actions since midnight' },
                { label: `Events (${LOG_WINDOW_DAYS} days)`, value: overview.total, hint: 'All client actions' }
              ].map((k) => (
                <div key={k.label} className={`${card} p-5`}>
                  <span className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[#475569] dark:text-[#94A3B8] block">
                    {k.label}
                  </span>
                  <span className="block mt-2 text-[28px] font-bold font-mono tracking-tight tabular-nums">
                    {isLoading ? '—' : k.value.toLocaleString()}
                  </span>
                  <span className="block mt-1 text-[12px] text-[#64748B] dark:text-[#94A3B8]">{k.hint}</span>
                </div>
              ))}
            </div>

            <section className={`${card} p-5`}>
              <h2 className="text-[15px] font-bold">Client activity per day</h2>
              <p className="text-[12px] text-[#475569] dark:text-[#94A3B8] mb-4">Last 14 days · all client actions</p>
              <ColumnChart data={overview.daily} valueLabel="events" />
            </section>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <section className={`${card} p-5`}>
                <h2 className="text-[15px] font-bold">Calculator usage</h2>
                <p className="text-[12px] text-[#475569] dark:text-[#94A3B8] mb-4">Times each calculator was opened</p>
                <BarList data={overview.calculatorData} valueLabel="opens" />
              </section>
              <section className={`${card} p-5`}>
                <h2 className="text-[15px] font-bold">Activity by type</h2>
                <p className="text-[12px] text-[#475569] dark:text-[#94A3B8] mb-4">What clients did</p>
                <BarList data={overview.actionData} valueLabel="events" />
              </section>
              <section className={`${card} p-5`}>
                <h2 className="text-[15px] font-bold">Most active clients</h2>
                <p className="text-[12px] text-[#475569] dark:text-[#94A3B8] mb-4">Top 5 by number of events</p>
                <BarList data={overview.topClients} valueLabel="events" />
              </section>
            </div>
          </>
        )}

        {/* ================= CLIENTS ================= */}
        {tab === 'clients' && (
          <section className={`${card} overflow-hidden`}>
            <div className="p-4 border-b border-[#E2E8F0] dark:border-[#1E293B] flex flex-wrap items-center justify-between gap-3">
              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 text-[#94A3B8] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="search"
                  value={clientSearch}
                  onChange={(e) => setClientSearch(e.target.value)}
                  placeholder="Search name, username or company"
                  className={`${inputBase} w-full pl-9`}
                />
              </div>
              <span className="text-[12px] text-[#475569] dark:text-[#94A3B8]">
                {filteredUsers.length} of {users.length} accounts
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-[13px]">
                <thead className="bg-[#F8FAFC] dark:bg-[#0B1220] text-[11px] uppercase tracking-[0.06em] text-[#475569] dark:text-[#94A3B8]">
                  <tr>
                    <th className="text-left font-semibold px-4 py-3">Account</th>
                    <th className="text-left font-semibold px-4 py-3">Company</th>
                    <th className="text-left font-semibold px-4 py-3">User type</th>
                    <th className="text-left font-semibold px-4 py-3">Joined</th>
                    <th className="text-left font-semibold px-4 py-3">Last activity</th>
                    <th className="text-right font-semibold px-4 py-3">Events</th>
                    <th className="text-left font-semibold px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E8F0] dark:divide-[#1E293B]">
                  {filteredUsers.map((u) => {
                    const act = lastActivity.get(u.id);
                    const isSelf = u.id === user?.id;
                    const busy = busyUserId === u.id;
                    return (
                      <tr key={u.id} className="hover:bg-[#F8FAFC] dark:hover:bg-[#0B1220]/60">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-[#059669] text-white flex items-center justify-center font-bold text-[11px] shrink-0">
                              {u.avatarInitials ?? u.username.slice(0, 2).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <div className="font-semibold truncate">
                                {u.name}
                                {isSelf && <span className="ml-1.5 text-[11px] font-normal text-[#64748B]">(you)</span>}
                              </div>
                              <div className="text-[12px] text-[#64748B] dark:text-[#94A3B8] truncate">@{u.username}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-[#475569] dark:text-[#94A3B8]">{u.companyName}</td>
                        <td className="px-4 py-3">
                          {canManage && !isSelf ? (
                            <select
                              value={u.userType}
                              disabled={busy}
                              onChange={(e) => void updateUser(u, { user_type: e.target.value as UserType })}
                              className={`${inputBase} py-1`}
                              aria-label={`User type for ${u.username}`}
                            >
                              <option value="client">Client</option>
                              <option value="admin">Admin</option>
                            </select>
                          ) : (
                            <span className="text-[12px] font-semibold">{USER_TYPE_LABELS[u.userType]}</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-[#475569] dark:text-[#94A3B8] whitespace-nowrap">{formatDate(u.createdAt)}</td>
                        <td className="px-4 py-3 text-[#475569] dark:text-[#94A3B8] whitespace-nowrap">
                          {act ? formatDateTime(act.at) : '—'}
                        </td>
                        <td className="px-4 py-3 text-right font-mono tabular-nums">{act?.count ?? 0}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            {u.isActive ? (
                              <span className="inline-flex items-center gap-1 text-[12px] font-semibold text-[#047857] dark:text-[#34D399]">
                                <CheckCircle2 className="w-3.5 h-3.5" /> Active
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[12px] font-semibold text-[#B91C1C] dark:text-[#F87171]">
                                <XCircle className="w-3.5 h-3.5" /> Deactivated
                              </span>
                            )}
                            {canManage && !isSelf && (
                              <button
                                type="button"
                                disabled={busy}
                                onClick={() => void updateUser(u, { is_active: !u.isActive })}
                                className="ml-1 px-2 py-1 text-[11px] font-semibold rounded-[6px] border border-[#CBD5E1] dark:border-[#334155] text-[#475569] dark:text-[#94A3B8] hover:text-[#0F172A] dark:hover:text-[#E2E8F0] disabled:opacity-50"
                              >
                                {u.isActive ? 'Deactivate' : 'Activate'}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {filteredUsers.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-4 py-10 text-center text-[#64748B] dark:text-[#94A3B8]">
                        {isLoading ? 'Loading accounts…' : 'No accounts match your search.'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* ================= TRACE LOGS ================= */}
        {tab === 'logs' && (
          <section className={`${card} overflow-hidden`}>
            <div className="p-4 border-b border-[#E2E8F0] dark:border-[#1E293B] flex flex-wrap items-center gap-3">
              <select
                value={logUserType}
                onChange={(e) => {
                  setLogUserType(e.target.value as UserType | 'all');
                  setLogLimit(LOG_PAGE_SIZE);
                }}
                className={inputBase}
                aria-label="Filter by user type"
              >
                <option value="client">Clients only</option>
                <option value="admin">Admins only</option>
                <option value="all">All users</option>
              </select>
              <select
                value={logUser}
                onChange={(e) => {
                  setLogUser(e.target.value);
                  setLogLimit(LOG_PAGE_SIZE);
                }}
                className={inputBase}
                aria-label="Filter by user"
              >
                <option value="all">Every user</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} (@{u.username})
                  </option>
                ))}
              </select>
              <select
                value={logAction}
                onChange={(e) => {
                  setLogAction(e.target.value as ActivityAction | 'all');
                  setLogLimit(LOG_PAGE_SIZE);
                }}
                className={inputBase}
                aria-label="Filter by activity"
              >
                <option value="all">Every activity</option>
                {(Object.keys(ACTIVITY_LABELS) as ActivityAction[]).map((a) => (
                  <option key={a} value={a}>
                    {ACTIVITY_LABELS[a]}
                  </option>
                ))}
              </select>

              <div className="flex-1" />
              <span className="text-[12px] text-[#475569] dark:text-[#94A3B8]">{filteredLogs.length} events</span>
              <button
                type="button"
                onClick={exportLogsCsv}
                disabled={filteredLogs.length === 0}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-[12px] font-semibold text-[#047857] dark:text-[#34D399] bg-[#059669]/10 border border-[#059669]/30 rounded-[8px] hover:bg-[#059669]/20 disabled:opacity-50"
              >
                <Download className="w-3.5 h-3.5" />
                Export CSV
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-[13px]">
                <thead className="bg-[#F8FAFC] dark:bg-[#0B1220] text-[11px] uppercase tracking-[0.06em] text-[#475569] dark:text-[#94A3B8]">
                  <tr>
                    <th className="text-left font-semibold px-4 py-3">Time</th>
                    <th className="text-left font-semibold px-4 py-3">User</th>
                    <th className="text-left font-semibold px-4 py-3">Type</th>
                    <th className="text-left font-semibold px-4 py-3">Activity</th>
                    <th className="text-left font-semibold px-4 py-3">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E8F0] dark:divide-[#1E293B]">
                  {filteredLogs.slice(0, logLimit).map((l) => {
                    const u = usersById.get(l.user_id);
                    return (
                      <tr key={l.id} className="hover:bg-[#F8FAFC] dark:hover:bg-[#0B1220]/60">
                        <td className="px-4 py-2.5 whitespace-nowrap font-mono text-[12px] text-[#475569] dark:text-[#94A3B8]">
                          {formatDateTime(l.created_at)}
                        </td>
                        <td className="px-4 py-2.5">
                          <div className="font-semibold">{u?.name ?? 'Unknown user'}</div>
                          <div className="text-[12px] text-[#64748B] dark:text-[#94A3B8]">@{u?.username ?? '—'}</div>
                        </td>
                        <td className="px-4 py-2.5 text-[12px]">{u ? USER_TYPE_LABELS[u.userType] : '—'}</td>
                        <td className="px-4 py-2.5 font-medium">{ACTIVITY_LABELS[l.action] ?? l.action}</td>
                        <td className="px-4 py-2.5 text-[#475569] dark:text-[#94A3B8]">{describeDetails(l) || '—'}</td>
                      </tr>
                    );
                  })}
                  {filteredLogs.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-4 py-10 text-center text-[#64748B] dark:text-[#94A3B8]">
                        {isLoading ? 'Loading trace logs…' : 'No activity matches these filters.'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {filteredLogs.length > logLimit && (
              <div className="p-4 border-t border-[#E2E8F0] dark:border-[#1E293B] text-center">
                <button
                  type="button"
                  onClick={() => setLogLimit((n) => n + LOG_PAGE_SIZE)}
                  className="px-4 py-2 text-[13px] font-semibold text-[#047857] dark:text-[#34D399] hover:underline"
                >
                  Show {Math.min(LOG_PAGE_SIZE, filteredLogs.length - logLimit)} more
                </button>
              </div>
            )}
          </section>
        )}
      </main>

      <footer className="px-6 py-4 border-t border-[#E2E8F0] dark:border-[#1E293B] bg-[#FFFFFF] dark:bg-[#111B2E] text-center text-[12px] text-[#475569] dark:text-[#94A3B8]">
        Signed in as @{user?.username} (Admin) · CerosL1 Admin Console
      </footer>
    </div>
  );
};
