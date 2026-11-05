export type UserRole = 'Owner' | 'Admin' | 'Viewer';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  companyName: string;
  avatarInitials?: string;
}
