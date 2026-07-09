import React, { createContext, useContext, useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";

const AuthContext = createContext({
  user: null,
  role: null,
  loading: true,
});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Initial mount: Check if an active session exists
    const initializeAuth = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session?.user) {
        setUser(session.user);
        // Read role from localStorage (set by LoginPage.jsx)
        setRole(localStorage.getItem("userRole") || null);
      } else {
        setUser(null);
        setRole(null);
      }
      setLoading(false);
    };

    initializeAuth();

    // 2. Listen for auth state changes (Login, Logout)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser(session.user);
        // Small timeout ensures LoginPage has time to set localStorage
        // before AuthContext tries to read it
        setTimeout(() => {
          setRole(localStorage.getItem("userRole") || null);
        }, 50);
      } else {
        // User logged out - clear everything
        setUser(null);
        setRole(null);
        localStorage.removeItem("userRole");
        localStorage.removeItem("adminId");
        localStorage.removeItem("adminName");
        localStorage.removeItem("adminEmail");
        localStorage.removeItem("artistId");
        localStorage.removeItem("artistName");
        localStorage.removeItem("artistEmail");
        localStorage.removeItem("userId");
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, role, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook for easy usage in components
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
