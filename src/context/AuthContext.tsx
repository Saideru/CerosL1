import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { supabase, isSupabaseConfigured, usernameToEmail, USERNAME_PATTERN } from '../lib/supabase';
import { Permission, User, UserRow, userFromRow } from '../types/auth';
import { ActivityAction, CalculatorKey } from '../types/activity';

type Result = { success: boolean; error?: string; notice?: string };

interface LogOptions {
  calculator?: CalculatorKey;
  details?: Record<string, unknown>;
}

interface AuthContextType {
  user: User | null;
  permissions: Permission[];
  isLoading: boolean;
  /** Message shown on the sign-in screen after a forced sign-out (e.g. deactivated account). */
  authNotice: string | null;
  can: (permission: Permission) => boolean;
  signIn: (username: string, password: string) => Promise<Result>;
  signUp: (data: { name: string; username: string; password: string; companyName: string }) => Promise<Result>;
  signOut: () => Promise<void>;
  logActivity: (action: ActivityAction, options?: LogOptions) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const USER_COLUMNS = 'id, username, full_name, user_type, company_name, avatar_initials, is_active, created_at';

async function insertActivity(action: ActivityAction, options?: LogOptions) {
  const { error } = await supabase.from('activity_log_tb').insert({
    action,
    calculator: options?.calculator ?? null,
    details: options?.details ?? {},
    user_agent: typeof navigator !== 'undefined' ? navigator.userAgent.slice(0, 300) : null
  });
  if (error) console.warn('Activity log failed:', error.message);
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(isSupabaseConfigured);
  const [authNotice, setAuthNotice] = useState<string | null>(null);
  const loadedUserId = useRef<string | null>(null);

  /** Loads user_tb profile + RBAC permissions for the signed-in auth user. */
  const loadProfile = useCallback(async (authUserId: string): Promise<User | null> => {
    const { data: row, error } = await supabase
      .from('user_tb')
      .select(USER_COLUMNS)
      .eq('id', authUserId)
      .maybeSingle<UserRow>();

    if (error || !row) {
      await supabase.auth.signOut();
      setAuthNotice('Your profile could not be loaded. Please contact your administrator.');
      return null;
    }

    if (!row.is_active) {
      await supabase.auth.signOut();
      setAuthNotice('This account has been deactivated. Please contact your administrator.');
      return null;
    }

    const { data: permRows } = await supabase
      .from('user_type_permission_tb')
      .select('permission')
      .eq('user_type', row.user_type);

    const profile = userFromRow(row);
    loadedUserId.current = profile.id;
    setPermissions((permRows ?? []).map((p: { permission: Permission }) => p.permission));
    setUser(profile);
    return profile;
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured) return;

    let cancelled = false;

    supabase.auth.getSession().then(async ({ data }) => {
      if (cancelled) return;
      if (data.session) {
        await loadProfile(data.session.user.id);
      }
      if (!cancelled) setIsLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        loadedUserId.current = null;
        setUser(null);
        setPermissions([]);
        return;
      }
      // Defer Supabase calls out of the auth callback (avoids a client deadlock)
      if (loadedUserId.current !== session.user.id) {
        setTimeout(() => {
          if (!cancelled) loadProfile(session.user.id);
        }, 0);
      }
    });

    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, [loadProfile]);

  const can = useCallback((permission: Permission) => permissions.includes(permission), [permissions]);

  const logActivity = useCallback((action: ActivityAction, options?: LogOptions) => {
    if (!isSupabaseConfigured || !loadedUserId.current) return;
    void insertActivity(action, options);
  }, []);

  const signIn = async (username: string, password: string): Promise<Result> => {
    const trimmed = username.trim();
    if (!trimmed) return { success: false, error: 'Username is required.' };
    if (!password) return { success: false, error: 'Password is required.' };

    setAuthNotice(null);
    const { data, error } = await supabase.auth.signInWithPassword({
      email: usernameToEmail(trimmed),
      password
    });

    if (error || !data.user) {
      if (error?.message.toLowerCase().includes('email not confirmed')) {
        return { success: false, error: 'This account has not been confirmed yet. Please contact your administrator.' };
      }
      return { success: false, error: 'Incorrect username or password.' };
    }

    const profile = await loadProfile(data.user.id);
    if (!profile) {
      return { success: false, error: 'This account cannot sign in. Please contact your administrator.' };
    }

    void insertActivity('sign_in');
    return { success: true };
  };

  const signUp = async (data: {
    name: string;
    username: string;
    password: string;
    companyName: string;
  }): Promise<Result> => {
    const username = data.username.trim();
    const name = data.name.trim();
    const company = data.companyName.trim() || 'My Company Inc.';

    if (!name) return { success: false, error: 'Full name is required.' };
    if (!USERNAME_PATTERN.test(username)) {
      return {
        success: false,
        error: 'Username must be 3–30 characters: letters, numbers, spaces, dots, dashes or underscores.'
      };
    }
    if (data.password.length < 8) {
      return { success: false, error: 'Password must be at least 8 characters in length.' };
    }

    setAuthNotice(null);
    const { data: res, error } = await supabase.auth.signUp({
      email: usernameToEmail(username),
      password: data.password,
      options: { data: { username, full_name: name, company_name: company } }
    });

    if (error) {
      const msg = error.message.toLowerCase();
      if (msg.includes('already registered') || msg.includes('database error')) {
        return { success: false, error: `The username "${username}" is already taken.` };
      }
      return { success: false, error: error.message };
    }

    // Supabase returns a user without a session when "Confirm email" is on
    if (!res.session || !res.user) {
      return {
        success: true,
        notice: 'Account created. An administrator must confirm it before you can sign in.'
      };
    }

    const profile = await loadProfile(res.user.id);
    if (profile) void insertActivity('sign_up');
    return { success: true };
  };

  const signOut = async () => {
    if (loadedUserId.current) {
      await insertActivity('sign_out');
    }
    await supabase.auth.signOut();
    loadedUserId.current = null;
    setUser(null);
    setPermissions([]);
  };

  return (
    <AuthContext.Provider
      value={{ user, permissions, isLoading, authNotice, can, signIn, signUp, signOut, logActivity }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
