import { supabase } from "@/lib/supabaseClient";

/**
 * Centralized logout function.
 * Call this from ANY logout button (Admin or Artist).
 *
 * Usage:
 *   import { handleLogout } from "@/utils/logout";
 *   <button onClick={() => handleLogout(navigate)}>Logout</button>
 */
export const handleLogout = async (navigate) => {
  try {
    // 1. Sign out from Supabase (invalidates session on server + clears local storage)
    await supabase.auth.signOut();
  } catch (err) {
    console.error("Logout error:", err);
  } finally {
    // 2. Clear all localStorage keys regardless of whether signOut succeeded
    localStorage.removeItem("userRole");
    localStorage.removeItem("adminId");
    localStorage.removeItem("adminName");
    localStorage.removeItem("adminEmail");
    localStorage.removeItem("artistId");
    localStorage.removeItem("artistName");
    localStorage.removeItem("artistEmail");

    // 3. Navigate to login and REPLACE history so back button can't go back
    navigate("/login", { replace: true });
  }
};
