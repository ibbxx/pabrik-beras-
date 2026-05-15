import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export interface AdminProfile {
  id: string;
  full_name: string | null;
  role: string | null;
  is_active: boolean | null;
}

interface AuthContextType {
  user: User | null;
  adminProfile: AdminProfile | null;
  isAdmin: boolean;
  isLoading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  adminProfile: null,
  isAdmin: false,
  isLoading: true,
  signOut: async () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [adminProfile, setAdminProfile] = useState<AdminProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;

    // Safety: pastikan loading tidak stuck lebih dari 5 detik
    const safetyTimer = setTimeout(() => {
      if (active) setIsLoading(false);
    }, 5000);

    const syncSession = async (session: Session | null) => {
      if (!active) return;

      setUser(session?.user ?? null);

      if (!session?.user) {
        setAdminProfile(null);
        setIsLoading(false);
        clearTimeout(safetyTimer);
        return;
      }

      const { data, error } = await supabase
        .from("admin_profiles")
        .select("id, full_name, role, is_active")
        .eq("id", session.user.id)
        .maybeSingle();

      if (!active) return;

      if (error) {
        console.error("Failed to load admin profile:", error);
        setAdminProfile(null);
      } else {
        const profile = data as AdminProfile | null;
        setAdminProfile(profile?.is_active ? profile : null);
      }

      setIsLoading(false);
      clearTimeout(safetyTimer);
    };

    // Ambil sesi yang sudah ada
    supabase.auth.getSession().then(({ data: { session } }) => {
      void syncSession(session);
    });

    // Pantau perubahan login/logout
    // PENTING: Jangan set isLoading=true pada TOKEN_REFRESHED atau INITIAL_SESSION
    // karena ini akan menghancurkan semua komponen anak (admin page) dan
    // menghilangkan data yang sedang diedit user.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') {
          setIsLoading(true);
        }
        void syncSession(session);
      }
    );

    return () => {
      active = false;
      clearTimeout(safetyTimer);
      subscription.unsubscribe();
    };
  }, []);

  const signOut = useCallback(async () => {
    setUser(null);
    setAdminProfile(null);
    await supabase.auth.signOut();
  }, []);

  const isAdmin = Boolean(user);

  return (
    <AuthContext.Provider value={{ user, adminProfile, isAdmin, isLoading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
