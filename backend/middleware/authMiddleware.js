const { supabase } = require("../config/supabaseClient");

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

    // Supabase se token verify karo
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

    req.user = user; // user object next middleware/controller ko milega
    next();
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Optional auth - fail nahi karta agar token nahi hai
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

module.exports = {
  authenticateUser,
  optionalAuth,
};
