import React, { createContext, useContext, useEffect, useState, useCallback, useRef, useMemo } from "react";
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

  // Track current user ID to avoid unnecessary re-fetches on token refresh
  const currentUserIdRef = useRef<string | null>(null);
  // Track whether initial load has completed
  const initialLoadDoneRef = useRef(false);

  useEffect(() => {
    let active = true;

    // Safety: pastikan loading tidak stuck lebih dari 5 detik
    const safetyTimer = setTimeout(() => {
      if (active) {
        setIsLoading(false);
        initialLoadDoneRef.current = true;
      }
    }, 5000);

    const fetchAdminProfile = async (userId: string): Promise<AdminProfile | null> => {
      const { data, error } = await supabase
        .from("admin_profiles")
        .select("id, full_name, role, is_active")
        .eq("id", userId)
        .maybeSingle();

      if (error) {
        console.error("Failed to load admin profile:", error);
        return null;
      }

      const profile = data as AdminProfile | null;
      return profile?.is_active ? profile : null;
    };

    const syncSession = async (session: Session | null, event?: string) => {
      if (!active) return;

      const newUserId = session?.user?.id ?? null;
      const previousUserId = currentUserIdRef.current;

      // ── Token refresh for the SAME user: do NOT touch React state at all ──
      // This is the critical fix: TOKEN_REFRESHED fires frequently in the
      // background. If we call setUser / setAdminProfile here, it triggers
      // re-renders that unmount the entire admin page tree, destroying any
      // unsaved form data.
      if (
        event === 'TOKEN_REFRESHED' &&
        newUserId &&
        newUserId === previousUserId
      ) {
        // Session token refreshed for the same user — nothing to do.
        return;
      }

      // ── INITIAL_SESSION for the same user (e.g. tab focus): skip ──
      if (
        event === 'INITIAL_SESSION' &&
        newUserId &&
        newUserId === previousUserId &&
        initialLoadDoneRef.current
      ) {
        return;
      }

      // ── User actually changed (login/logout/different account) ──
      if (!session?.user) {
        // Logged out
        currentUserIdRef.current = null;
        setUser(null);
        setAdminProfile(null);
        setIsLoading(false);
        initialLoadDoneRef.current = true;
        clearTimeout(safetyTimer);
        return;
      }

      // If the user ID hasn't changed and we already have profile data, skip
      if (newUserId === previousUserId && initialLoadDoneRef.current) {
        return;
      }

      currentUserIdRef.current = newUserId;
      setUser(session.user);

      const profile = await fetchAdminProfile(session.user.id);
      if (!active) return;

      setAdminProfile(profile);
      setIsLoading(false);
      initialLoadDoneRef.current = true;
      clearTimeout(safetyTimer);
    };

    // Ambil sesi yang sudah ada
    supabase.auth.getSession().then(({ data: { session } }) => {
      void syncSession(session, 'INITIAL_SESSION');
    });

    // Pantau perubahan login/logout
    // PENTING: Jangan set isLoading=true pada TOKEN_REFRESHED atau INITIAL_SESSION
    // karena ini akan menghancurkan semua komponen anak (admin page) dan
    // menghilangkan data yang sedang diedit user.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        // Only show loading spinner for genuine sign-in/sign-out transitions
        if (event === 'SIGNED_IN' && currentUserIdRef.current !== session?.user?.id) {
          setIsLoading(true);
        } else if (event === 'SIGNED_OUT') {
          setIsLoading(true);
        }
        // Never set isLoading=true for TOKEN_REFRESHED or INITIAL_SESSION
        void syncSession(session, event);
      }
    );

    return () => {
      active = false;
      clearTimeout(safetyTimer);
      subscription.unsubscribe();
    };
  }, []);

  const signOut = useCallback(async () => {
    currentUserIdRef.current = null;
    setUser(null);
    setAdminProfile(null);
    await supabase.auth.signOut();
  }, []);

  const isAdmin = Boolean(user);

  // Memoize context value to prevent unnecessary re-renders in consumers
  const contextValue = useMemo(
    () => ({ user, adminProfile, isAdmin, isLoading, signOut }),
    [user, adminProfile, isAdmin, isLoading, signOut]
  );

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
