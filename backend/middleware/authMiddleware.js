const { supabase, supabaseAdmin } = require("../config/supabaseClient");

// --- Verify Supabase JWT and attach user to req ---
const authenticateUser = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Access denied. Authorization token is missing.",
      });
    }

    const token = authHeader.split(" ")[1];

    // Verify token with Supabase
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({
        success: false,
        message: "Invalid or expired token.",
      });
    }

    req.user = user;
    next();
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// --- Optional auth - does not fail if the token is missing ---
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.split(" ")[1];

      const {
        data: { user },
        error,
      } = await supabase.auth.getUser(token);

      if (!error && user) {
        req.user = user;
      }
    }

    next();
  } catch (err) {
    // Don't fail, just continue without user
    next();
  }
};

// --- Require the authenticated user to have the "admin" role ---
// ✅ FIX: Token verify + role ab "users" table se check hota hai
const requireAdmin = async (req, res, next) => {
  try {
    // Agar req.user pehle se nahi hai (yani authenticateUser pehle se run nahi hua)
    // toh pehle token verify karo
    if (!req.user) {
      const authHeader = req.headers.authorization;

      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({
          success: false,
          message: "Access denied. Authorization token is missing.",
        });
      }

      const token = authHeader.split(" ")[1];

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser(token);

      if (userError || !user) {
        return res.status(401).json({
          success: false,
          message: "Invalid or expired session.",
        });
      }

      req.user = user;
    }

    // Ab user ki role check karo "users" table se using supabaseAdmin (bypass RLS)
    const { data: profile, error: profileError } = await supabaseAdmin
      .from("users")
      .select("role")
      .eq("id", req.user.id)
      .maybeSingle();

    if (profileError) throw profileError;

    // Agar role admin nahi hai toh reject karo
    if (!profile || profile.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Access denied. Only admins can perform this action.",
      });
    }

    next();
  } catch (err) {
    console.error("requireAdmin error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  authenticateUser,
  optionalAuth,
  requireAdmin,
};
