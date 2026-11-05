import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types/auth';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signUp: (data: { name: string; email: string; password: string; companyName: string }) => Promise<{ success: boolean; error?: string }>;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_KEY_CURRENT_USER = 'cerosl1_current_user_session';
const STORAGE_KEY_USERS_DB = 'cerosl1_registered_users_db';

// IDs of the demo accounts that earlier builds seeded into localStorage.
const LEGACY_DEMO_USER_IDS = ['usr_owner_1', 'usr_admin_1', 'usr_viewer_1'];

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Load existing session and user database on startup
  useEffect(() => {
    try {
      // Purge demo accounts seeded by earlier builds
      const storedUsers = localStorage.getItem(STORAGE_KEY_USERS_DB);
      if (storedUsers) {
        const users: User[] = JSON.parse(storedUsers);
        const realUsers = users.filter(u => !LEGACY_DEMO_USER_IDS.includes(u.id));
        if (realUsers.length !== users.length) {
          localStorage.setItem(STORAGE_KEY_USERS_DB, JSON.stringify(realUsers));
        }
      }

      // Check for active session
      const storedSession = localStorage.getItem(STORAGE_KEY_CURRENT_USER);
      if (storedSession) {
        const parsed: User = JSON.parse(storedSession);
        if (LEGACY_DEMO_USER_IDS.includes(parsed.id)) {
          localStorage.removeItem(STORAGE_KEY_CURRENT_USER);
        } else {
          setUser(parsed);
        }
      }
    } catch {
      // In case of storage issues, stay logged out
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getUsersFromDb = (): User[] => {
    try {
      const data = localStorage.getItem(STORAGE_KEY_USERS_DB);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  };

  const signIn = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    const trimmedEmail = email.trim().toLowerCase();
    
    if (!trimmedEmail) {
      return { success: false, error: 'Email address is required.' };
    }
    if (!password) {
      return { success: false, error: 'Password is required.' };
    }
    if (password.length < 8) {
      return { success: false, error: 'Password must be at least 8 characters in length.' };
    }

    const users = getUsersFromDb();
    const matchedUser = users.find(u => u.email.toLowerCase() === trimmedEmail);

    if (!matchedUser) {
      // Error message per CerosL1 SOP-02 and Section 7 troubleshooting: "No CerosL1 account uses ..."
      return {
        success: false,
        error: `No CerosL1 account uses ${trimmedEmail}. Check your email address or create an account.`
      };
    }

    // Successful sign in
    setUser(matchedUser);
    localStorage.setItem(STORAGE_KEY_CURRENT_USER, JSON.stringify(matchedUser));
    return { success: true };
  };

  const signUp = async (data: {
    name: string;
    email: string;
    password: string;
    companyName: string;
  }): Promise<{ success: boolean; error?: string }> => {
    const trimmedEmail = data.email.trim().toLowerCase();
    const trimmedName = data.name.trim();
    const trimmedCompany = data.companyName.trim() || 'My Company Inc.';

    if (!trimmedName) {
      return { success: false, error: 'Full name is required.' };
    }
    if (!trimmedEmail || !/^\S+@\S+\.\S+$/.test(trimmedEmail)) {
      return { success: false, error: 'Please enter a valid work email address.' };
    }
    if (data.password.length < 8) {
      return { success: false, error: 'Password must be at least 8 characters in length.' };
    }

    const users = getUsersFromDb();
    const existing = users.find(u => u.email.toLowerCase() === trimmedEmail);
    if (existing) {
      return {
        success: false,
        error: `An account already exists for ${trimmedEmail}. Please sign in instead.`
      };
    }

    // Get initials
    const nameParts = trimmedName.split(' ');
    const initials = nameParts.length > 1
      ? (nameParts[0][0] + nameParts[nameParts.length - 1][0]).toUpperCase()
      : trimmedName.slice(0, 2).toUpperCase();

    // Per SOP-01: First user for a newly registered company becomes Owner
    const newUser: User = {
      id: `usr_${Date.now()}`,
      name: trimmedName,
      email: trimmedEmail,
      role: 'Owner',
      companyName: trimmedCompany,
      avatarInitials: initials
    };

    const updatedUsers = [...users, newUser];
    localStorage.setItem(STORAGE_KEY_USERS_DB, JSON.stringify(updatedUsers));

    // Sign in the newly registered user
    setUser(newUser);
    localStorage.setItem(STORAGE_KEY_CURRENT_USER, JSON.stringify(newUser));

    return { success: true };
  };

  const signOut = () => {
    setUser(null);
    localStorage.removeItem(STORAGE_KEY_CURRENT_USER);
  };


  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        signIn,
        signUp,
        signOut
      }}
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
