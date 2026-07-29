
const { supabaseAdmin, distributionAuth } = require("../config/supabaseClient");

const authenticateUser = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ success: false, message: "Access denied. Authorization token is missing." });
    }
    const token = authHeader.split(" ")[1];
    if (!token || token === "null" || token === "undefined") {
      return res.status(401).json({ success: false, message: "Access denied. Token is invalid." });
    }

    // ✅ CHANGED: verify against Distribution, not Streaming's own project
    const { data, error } = await distributionAuth.auth.getUser(token);

    if (error || !data.user) {
      return res.status(401).json({ success: false, message: "Invalid or expired token." });
    }
    req.user = data.user;
    next();
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.split(" ")[1];
      if (token && token !== "null" && token !== "undefined") {
        const { data, error } = await distributionAuth.auth.getUser(token); // ✅ CHANGED
        if (!error && data.user) req.user = data.user;
      }
    }
    next();
  } catch (err) {
    next();
  }
};

const requireAdmin = async (req, res, next) => {
  try {
    if (!req.user) {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ success: false, message: "Access denied. Authorization token is missing." });
      }
      const token = authHeader.split(" ")[1];
      const { data, error: userError } = await distributionAuth.auth.getUser(token); // ✅ CHANGED
      if (userError || !data.user) {
        return res.status(401).json({ success: false, message: "Invalid or expired session." });
      }
      req.user = data.user;
    }

    // unchanged — still Streaming's own role table
    const { data: profile, error: profileError } = await supabaseAdmin
      .from("users").select("role").eq("id", req.user.id).maybeSingle();
    if (profileError) throw profileError;
    if (!profile) return res.status(403).json({ success: false, message: "Access denied. User profile not found." });
    if (profile.role !== "admin") return res.status(403).json({ success: false, message: "Access denied. Only admins can perform this action." });
    next();
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { authenticateUser, optionalAuth, requireAdmin };
