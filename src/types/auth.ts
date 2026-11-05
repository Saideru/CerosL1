// Mirrors the RBAC tables in supabase/ceros_db.sql
export type UserType = 'admin' | 'client';

export type Permission =
  | 'calculator.use'
  | 'calculation.save'
  | 'calculation.view_all'
  | 'activity.log_own'
  | 'activity.view_all'
  | 'profile.update_own'
  | 'clients.view'
  | 'clients.manage';

export const USER_TYPE_LABELS: Record<UserType, string> = {
  admin: 'Admin',
  client: 'Client'
};

export interface User {
  id: string;
  username: string;
  name: string;
  userType: UserType;
  companyName: string;
  avatarInitials?: string;
  isActive: boolean;
  createdAt: string;
}

/** Row shape of public.user_tb */
export interface UserRow {
  id: string;
  username: string;
  full_name: string;
  user_type: UserType;
  company_name: string;
  avatar_initials: string | null;
  is_active: boolean;
  created_at: string;
}

export function userFromRow(row: UserRow): User {
  return {
    id: row.id,
    username: row.username,
    name: row.full_name,
    userType: row.user_type,
    companyName: row.company_name,
    avatarInitials: row.avatar_initials ?? undefined,
    isActive: row.is_active,
    createdAt: row.created_at
  };
}
