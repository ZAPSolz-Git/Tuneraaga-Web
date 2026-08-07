const { supabaseAdmin, distributionAuth } = require("../config/supabaseClient");
const verifyToken = async (token) => {
  // 1. Distribution — covers Distribution-native logins and "Continue with Movement Creations"
  try {
    const { data, error } = await distributionAuth.auth.getUser(token);
    if (!error && data?.user) {
      return { id: data.user.id, email: data.user.email };
    }
  } catch (_) {}

  // 2. Streaming's own project — native signups AND linked users' local password
  try {
    const { data, error } = await supabaseAdmin.auth.getUser(token);
    if (!error && data?.user) {
      const localId = data.user.id;
      // ✅ NEW — if this local account is linked, resolve to the canonical Distribution id
      const { data: linked } = await supabaseAdmin
        .from("users")
        .select("id, email")
        .eq("local_auth_id", localId)
        .maybeSingle();
      if (linked) return { id: linked.id, email: linked.email };
      return { id: localId, email: data.user.email };
    }
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
