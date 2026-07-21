const { supabaseAdmin } = require("../config/supabaseClient");

// --- Verify Supabase JWT and attach user to req ---
const authenticateUser = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      console.log("❌ Auth rejected: No Bearer token in header");
      return res.status(401).json({
        success: false,
        message: "Access denied. Authorization token is missing.",
      });
    }

    const token = authHeader.split(" ")[1];

    if (!token || token === "null" || token === "undefined") {
      console.log("❌ Auth rejected: Token is empty/null/undefined");
      return res.status(401).json({
        success: false,
        message: "Access denied. Token is invalid.",
      });
    }

    // ✅ FIX: Use supabaseAdmin (service role) for server-side token
    // verification. The anon-key client can silently fail on the server
    // because it has no session context.
    const { data, error } = await supabaseAdmin.auth.getUser(token);

    if (error) {
      console.log(
        "❌ Auth rejected: Token verification failed —",
        error.message,
      );
      return res.status(401).json({
        success: false,
        message: "Invalid or expired token.",
        details: error.message,
      });
    }

    if (!data.user) {
      console.log("❌ Auth rejected: No user found for token");
      return res.status(401).json({
        success: false,
        message: "Invalid or expired token.",
      });
    }

    req.user = data.user;
    console.log("✅ Auth OK:", data.user.email, "| id:", data.user.id);
    next();
  } catch (err) {
    console.error("❌ Auth middleware crash:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// --- Optional auth - does not fail if the token is missing ---
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.split(" ")[1];

      if (token && token !== "null" && token !== "undefined") {
        const { data, error } = await supabaseAdmin.auth.getUser(token);

        if (!error && data.user) {
          req.user = data.user;
        }
      }
    }

    next();
  } catch (err) {
    next();
  }
};

// --- Require the authenticated user to have the "admin" role ---
const requireAdmin = async (req, res, next) => {
  try {
    // If req.user not set, verify token first
    if (!req.user) {
      const authHeader = req.headers.authorization;

      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({
          success: false,
          message: "Access denied. Authorization token is missing.",
        });
      }

      const token = authHeader.split(" ")[1];

      const { data, error: userError } =
        await supabaseAdmin.auth.getUser(token);

      if (userError || !data.user) {
        console.log(
          "❌ Admin auth rejected: Token invalid —",
          userError?.message,
        );
        return res.status(401).json({
          success: false,
          message: "Invalid or expired session.",
        });
      }

      req.user = data.user;
    }

    // Check role from "users" table using supabaseAdmin (bypasses RLS)
    const { data: profile, error: profileError } = await supabaseAdmin
      .from("users")
      .select("role")
      .eq("id", req.user.id)
      .maybeSingle();

    if (profileError) {
      console.error("❌ Admin check: DB error —", profileError.message);
      throw profileError;
    }

    if (!profile) {
      console.log("❌ Admin check: No users row for", req.user.email);
      return res.status(403).json({
        success: false,
        message: "Access denied. User profile not found.",
      });
    }

    if (profile.role !== "admin") {
      console.log("❌ Admin check:", req.user.email, "has role:", profile.role);
      return res.status(403).json({
        success: false,
        message: "Access denied. Only admins can perform this action.",
      });
    }

    console.log("✅ Admin OK:", req.user.email);
    next();
  } catch (err) {
    console.error("❌ requireAdmin crash:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  authenticateUser,
  optionalAuth,
  requireAdmin,
};
