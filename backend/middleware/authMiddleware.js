const { supabase, supabaseAdmin } = require("../config/supabaseClient");

// --- Verify Supabase JWT and attach user to req ---
const authenticateUser = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Access denied. Token nahi mila.",
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
        message: "Invalid ya expired token.",
      });
    }

    req.user = user;
    next();
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// --- Optional auth - fail nahi karta agar token nahi hai ---
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
const requireAdmin = async (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: "Access denied. Pehle login karo.",
    });
  }

  try {
    // Use supabaseAdmin to bypass RLS
    const { data: profile, error } = await supabaseAdmin
      .from("artists")
      .select("role")
      .eq("id", req.user.id)
      .maybeSingle();

    if (error) throw error;

    if (!profile || profile.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Access denied. Sirf admin yeh action kar sakta hai.",
      });
    }

    next();
  } catch (err) {
    console.error("requireAdmin error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  authenticateUser,
  optionalAuth,
  requireAdmin,
};
