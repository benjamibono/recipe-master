"use client";

import { createContext, useContext } from "react";
import { useAuth } from "@/lib/hooks/useAuth";
import { User } from "@supabase/supabase-js";

interface ProfileData {
  id: string;
  username?: string;
  email?: string;
  [key: string]: unknown;
}

interface AuthContextType {
  user: User | null | undefined;
  profile: ProfileData | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const auth = useAuth();

  // Asegurar que el perfil tiene el tipo correcto
  const authValue: AuthContextType = {
    ...auth,
    profile: auth.profile as ProfileData | null,
  };

  return (
    <AuthContext.Provider value={authValue}>{children}</AuthContext.Provider>
  );
}

export function useAuthContext() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuthContext must be used within an AuthProvider");
  }
  return context;
}
