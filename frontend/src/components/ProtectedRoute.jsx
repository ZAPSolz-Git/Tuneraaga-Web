import React, { useEffect, useState, useCallback } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";
import { Loader2 } from "lucide-react";

const ProtectedRoute = ({ children, requiredRole }) => {
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState(null);
  // FIX: Read from cache initially instead of hitting the database
  const [userRole, setUserRole] = useState(localStorage.getItem("userRole"));

  const checkAuth = useCallback(async () => {
    setLoading(true);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      setSession(session);

      if (session) {
        // FIX: Removed supabase.from("artists") DB call. Using cache instead.
        setUserRole(localStorage.getItem("userRole"));
      } else {
        // No session — clean up everything
        setUserRole(null);
        localStorage.removeItem("userRole");
        localStorage.removeItem("adminId");
        localStorage.removeItem("adminName");
        localStorage.removeItem("adminEmail");
        localStorage.removeItem("artistId");
        localStorage.removeItem("artistName");
        localStorage.removeItem("artistEmail");
      }
    } catch (err) {
      console.error("Auth check error:", err);
      setSession(null);
      setUserRole(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();

    const handlePageShow = (e) => {
      if (e.persisted) {
        checkAuth();
      }
    };
    window.addEventListener("pageshow", handlePageShow);

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (!session) {
        setUserRole(null);
        localStorage.removeItem("userRole");
        localStorage.removeItem("adminId");
        localStorage.removeItem("adminName");
        localStorage.removeItem("adminEmail");
        localStorage.removeItem("artistId");
        localStorage.removeItem("artistName");
        localStorage.removeItem("artistEmail");
      } else {
        // FIX: Read from cache instead of making a new DB call
        setUserRole(localStorage.getItem("userRole"));
      }
    });

    return () => {
      window.removeEventListener("pageshow", handlePageShow);
      subscription.unsubscribe();
    };
  }, [checkAuth]);

  // 1. Loading
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="animate-spin text-blue-600 w-10 h-10" />
      </div>
    );
  }

  // 2. No session → go to login
  if (!session) {
    return <Navigate to="/login" replace />;
  }

  // 3. Wrong role → redirect to correct dashboard
  if (requiredRole && userRole !== requiredRole) {
    if (userRole === "admin") {
      return <Navigate to="/admin" replace />;
    } else if (userRole === "artist") {
      return <Navigate to="/artist/dashboard" replace />;
    } else {
      return <Navigate to="/login" replace />;
    }
  }

  // 4. All good
  return children;
};

export default ProtectedRoute;
