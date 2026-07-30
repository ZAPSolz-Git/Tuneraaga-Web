const { supabaseAdmin, distributionAuth } = require("../config/supabaseClient");

const verifyToken = async (token) => {
  try {
    const { data, error } = await distributionAuth.auth.getUser(token);
    if (!error && data?.user) return data.user;
  } catch (_) {}
  try {
    const { data, error } = await supabaseAdmin.auth.getUser(token);
    if (!error && data?.user) return data.user;
  } catch (_) {}
  return null;
};

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
    if (!token || token === "null" || token === "undefined") {
      return res
        .status(401)
        .json({ success: false, message: "Access denied. Token is invalid." });
    }

    const user = await verifyToken(token);
    if (!user) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid or expired token." });
    }

    req.user = user;
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
        const user = await verifyToken(token);
        if (user) req.user = user;
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
        return res.status(401).json({
          success: false,
          message: "Access denied. Authorization token is missing.",
        });
      }
      const token = authHeader.split(" ")[1];
      const user = await verifyToken(token);
      if (!user)
        return res
          .status(401)
          .json({ success: false, message: "Invalid or expired session." });
      req.user = user;
    }

    const { data: profile, error: profileError } = await supabaseAdmin
      .from("users")
      .select("role")
      .ilike("email", (req.user.email || "").toLowerCase())
      .maybeSingle();

    if (profileError) throw profileError;
    if (!profile)
      return res.status(403).json({
        success: false,
        message: "Access denied. User profile not found.",
      });
    if (profile.role !== "admin")
      return res.status(403).json({
        success: false,
        message: "Access denied. Only admins can perform this action.",
      });
    next();
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { authenticateUser, optionalAuth, requireAdmin };
