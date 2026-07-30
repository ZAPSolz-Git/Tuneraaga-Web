import { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";

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
        console.log("[useIsPro] logged out -> isPro=false (ad aayega)");
        setIsPro(false);
        setChecking(false);
        return;
      }

      const { data, error } = await supabase
        .from("orders")
        .select("id")
        .ilike("email", email)
        .eq("status", "paid")
        .limit(1);

      const pro = !error && (data || []).length > 0;
      console.log(
        "[useIsPro] email:",
        email,
        "paid orders:",
        data?.length ?? 0,
        "=> isPro:",
        pro,
      );
      setIsPro(pro);
    } catch (e) {
      console.error("[useIsPro] error:", e);
      setIsPro(false); // fail -> ad aayega (safe)
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
