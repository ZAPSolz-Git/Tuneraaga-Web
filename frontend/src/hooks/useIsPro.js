import { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";

// isPro = TRUE sirf tab jab user ka koi PAID order ho.
// Login ya role='premium' pe bharosa nahi — paid order hi asli proof hai.
export function useIsPro() {
  const [isPro, setIsPro] = useState(false);
  const [checking, setChecking] = useState(true);

  const check = async () => {
    setChecking(true);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const email = session?.user?.email?.toLowerCase();

      if (!email) {
        setIsPro(false); // logged out -> ad aayega
        return;
      }

      const { data, error } = await supabase
        .from("orders")
        .select("id")
        .ilike("email", email)
        .eq("status", "paid")
        .limit(1);

      if (error) {
        console.error("useIsPro error:", error.message);
        setIsPro(false);
        return;
      }
      setIsPro((data || []).length > 0);
    } finally {
      setChecking(false);
    }
  };

  useEffect(() => {
    check();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => check());
    return () => subscription.unsubscribe();
  }, []);

  return { isPro, checking, refresh: check };
}
