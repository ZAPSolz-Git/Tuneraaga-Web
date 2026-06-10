// backend/middleware/authMiddleware.js
const { supabase } = require("../config/supabaseClient");

const authenticateUser = async (req, res, next) => {
  try {
    // 1. Header se Token lo
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return res.status(401).json({ error: "Login required: No token found." });
    }

    // Header format: "Bearer <token>"
    const token = authHeader.split(' ')[1];

    // 2. Supabase se Token Verify Karo
    const { data, error } = await supabase.auth.getUser(token);

    if (error) {
      console.error("Auth Error:", error.message);
      return res.status(401).json({ error: "Invalid or expired token." });
    }

    // 3. User ko req object mein daalo taaki Controller use kar sake
    req.user = data.user;
    next(); // Aage badho (Controller mein jao)

  } catch (err) {
    console.error("Server Auth Error:", err);
    res.status(500).json({ error: "Authentication check failed." });
  }
};

module.exports = authenticateUser;