// backend/controllers/authController.js — FULL UPDATED FILE

const crypto = require("crypto"); // ✅ NEW
const { supabase, supabaseAdmin } = require("../config/supabaseClient");
const { sendResetEmail } = require("../utils/sendEmail"); // ✅ NEW

// --- 1. LOGIN ---
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required.",
      });
    }

    const { data: authData, error: authError } =
      await supabase.auth.signInWithPassword({
        email,
        password,
      });

    if (authError) {
      console.error("Login auth error:", authError.message);

      if (authError.message.toLowerCase().includes("email not confirmed")) {
        return res.status(401).json({
          success: false,
          message:
            "Your email is not verified. Please check the confirmation email sent after signup.",
        });
      }

      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    const userId = authData.user.id;

    let { data: existingUser, error: fetchError } = await supabaseAdmin
      .from("users")
      .select("id, email, role, created_at, updated_at")
      .eq("id", userId)
      .single();

    if (fetchError || !existingUser) {
      const { data: newUser, error: insertError } = await supabaseAdmin
        .from("users")
        .insert({
          id: userId,
          email: email,
          role: "user",
        })
        .select("id, email, role, created_at, updated_at")
        .single();

      if (insertError) {
        console.error("User insert error:", insertError.message);
        existingUser = {
          id: userId,
          email: email,
          role: "user",
          created_at: new Date().toISOString(),
        };
      } else {
        existingUser = newUser;
      }
    }

    res.status(200).json({
      success: true,
      message: "Login successful!",
      data: {
        user: existingUser,
        session: {
          access_token: authData.session.access_token,
          refresh_token: authData.session.refresh_token,
          expires_at: authData.session.expires_at,
        },
      },
    });
  } catch (err) {
    console.error("Login Error:", err);
    res.status(500).json({
      success: false,
      message: "Internal server error.",
    });
  }
};

// --- 2. SIGNUP ---
exports.signup = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required.",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters long.",
      });
    }

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (authError) {
      console.error("Signup auth error:", authError.message);
      if (authError.message.toLowerCase().includes("already registered")) {
        return res.status(400).json({
          success: false,
          message: "This email is already registered. Please login.",
        });
      }
      return res.status(400).json({
        success: false,
        message: authError.message,
      });
    }

    const userId = authData.user.id;

    const { data: newUser, error: insertError } = await supabaseAdmin
      .from("users")
      .insert({
        id: userId,
        email: email,
        role: "user",
      })
      .select("id, email, role, created_at, updated_at")
      .single();

    if (insertError) {
      console.error("User insert error (Non-Critical):", insertError.message);
    }

    let session = null;
    if (authData.session) {
      session = {
        access_token: authData.session.access_token,
        refresh_token: authData.session.refresh_token,
        expires_at: authData.session.expires_at,
      };
    }

    res.status(201).json({
      success: true,
      message: session
        ? "Registration successful!"
        : "Registration successful! Please verify your email, then you can login.",
      data: {
        user: newUser || {
          id: userId,
          email: email,
          role: "user",
          created_at: new Date().toISOString(),
        },
        session: session,
        emailConfirmationRequired: !session,
      },
    });
  } catch (err) {
    console.error("Signup Error:", err);
    res.status(500).json({
      success: false,
      message: "Internal server error.",
    });
  }
};

// --- 3. GET CURRENT USER PROFILE ---
exports.getProfile = async (req, res) => {
  try {
    const userId = req.user.id;

    const { data, error } = await supabaseAdmin
      .from("users")
      .select("id, email, role, created_at, updated_at")
      .eq("id", userId)
      .single();

    if (error || !data) {
      const { data: newUser, error: insertError } = await supabaseAdmin
        .from("users")
        .insert({
          id: userId,
          email: req.user.email,
          role: "user",
        })
        .select("id, email, role, created_at, updated_at")
        .single();

      if (insertError) {
        return res.status(404).json({
          success: false,
          message: "User profile not found.",
        });
      }

      return res.status(200).json({
        success: true,
        data: newUser,
      });
    }

    res.status(200).json({
      success: true,
      data,
    });
  } catch (err) {
    console.error("Get Profile Error:", err);
    res.status(500).json({
      success: false,
      message: "Internal server error.",
    });
  }
};

// --- 4. LOGOUT ---
exports.logout = async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.split(" ")[1];
      await supabaseAdmin.auth.admin.signOut(token);
    }

    res.status(200).json({
      success: true,
      message: "Logout successful!",
    });
  } catch (err) {
    console.error("Logout Error:", err.message);
    res.status(200).json({
      success: true,
      message: "Logout successful!",
    });
  }
};

// --- 5. GET ALL USERS (ADMIN ONLY) ---
exports.getAllUsers = async (req, res) => {
  try {
    const { data: adminUser, error: adminError } = await supabaseAdmin
      .from("users")
      .select("role")
      .eq("id", req.user.id)
      .single();

    if (adminError || !adminUser || adminUser.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Admin access required.",
      });
    }

    const { data, error } = await supabaseAdmin
      .from("users")
      .select("id, email, role, created_at, updated_at")
      .order("created_at", { ascending: false });

    if (error) throw error;

    res.status(200).json({
      success: true,
      data,
      count: data.length,
    });
  } catch (err) {
    console.error("Get All Users Error:", err);
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// --- 6. UPDATE USER ROLE (ADMIN ONLY) ---
exports.updateUserRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!["user", "admin"].includes(role)) {
      return res.status(400).json({
        success: false,
        message: "Invalid role. 'user' or 'admin' is required.",
      });
    }

    const { data: adminUser, error: adminError } = await supabaseAdmin
      .from("users")
      .select("role")
      .eq("id", req.user.id)
      .single();

    if (adminError || !adminUser || adminUser.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Admin access required.",
      });
    }

    if (req.user.id === id && role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "You cannot change your own role.",
      });
    }

    const { data, error } = await supabaseAdmin
      .from("users")
      .update({ role })
      .eq("id", id)
      .select("id, email, role, created_at, updated_at")
      .single();

    if (error) {
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }

    if (!data) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    res.status(200).json({
      success: true,
      message: `User role updated to ${role}`,
      data,
    });
  } catch (err) {
    console.error("Update Role Error:", err);
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// --- 7. DELETE USER (ADMIN ONLY) ---
exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    const { data: adminUser, error: adminError } = await supabaseAdmin
      .from("users")
      .select("role")
      .eq("id", req.user.id)
      .single();

    if (adminError || !adminUser || adminUser.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Admin access required.",
      });
    }

    if (req.user.id === id) {
      return res.status(403).json({
        success: false,
        message: "You cannot delete your own account.",
      });
    }

    await supabaseAdmin.from("history").delete().eq("user_id", id);
    await supabaseAdmin.from("likes").delete().eq("user_id", id);

    const { error: dbError } = await supabaseAdmin
      .from("users")
      .delete()
      .eq("id", id);

    if (dbError) {
      return res.status(500).json({
        success: false,
        message: dbError.message,
      });
    }

    try {
      await supabaseAdmin.auth.admin.deleteUser(id);
    } catch (authErr) {
      console.log("Auth delete skipped:", authErr.message);
    }

    res.status(200).json({
      success: true,
      message: "User successfully deleted!",
    });
  } catch (err) {
    console.error("Delete User Error:", err);
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// --- 8. GET USER STATS (ADMIN ONLY) ---
exports.getUserStats = async (req, res) => {
  try {
    const { data: adminUser, error: adminError } = await supabaseAdmin
      .from("users")
      .select("role")
      .eq("id", req.user.id)
      .single();

    if (adminError || !adminUser || adminUser.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Admin access required.",
      });
    }

    const { count: totalUsers } = await supabaseAdmin
      .from("users")
      .select("*", { count: "exact", head: true });

    const { count: adminCount } = await supabaseAdmin
      .from("users")
      .select("*", { count: "exact", head: true })
      .eq("role", "admin");

    const { count: userCount } = await supabaseAdmin
      .from("users")
      .select("*", { count: "exact", head: true })
      .eq("role", "user");

    res.status(200).json({
      success: true,
      data: {
        totalUsers: totalUsers || 0,
        adminCount: adminCount || 0,
        userCount: userCount || 0,
      },
    });
  } catch (err) {
    console.error("Get Stats Error:", err);
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// ═══════════════════════════════════════════════════════
// ✅ NEW — 9. FORGOT PASSWORD
// ═══════════════════════════════════════════════════════
exports.forgotPassword = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({
      success: false,
      message: "Email is required.",
    });
  }

  try {
    // ---- Look up user by email in Supabase Auth ----
    const { data: listData, error: listError } =
      await supabaseAdmin.auth.admin.listUsers({ perPage: 10000 });

    if (listError) {
      console.error("listUsers error:", listError);
      return res.json({
        success: true,
        message:
          "If this email is registered, a reset link has been sent.",
      });
    }

    const authUser = listData.users.find(
      (u) => u.email.toLowerCase() === email.toLowerCase()
    );

    // ---- Email not found — still return success (security) ----
    if (!authUser) {
      console.log(`⚠ forgotPassword: email not found — ${email}`);
      return res.json({
        success: true,
        message:
          "If this email is registered, a reset link has been sent.",
      });
    }

    // ---- Invalidate previous unused tokens for this email ----
    await supabaseAdmin
      .from("password_resets")
      .update({ used: true })
      .eq("email", email)
      .eq("used", false);

    // ---- Generate new token ----
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1 hour

    // ---- Store token ----
    const { error: insertError } = await supabaseAdmin
      .from("password_resets")
      .insert({
        user_id: authUser.id,
        email: email,
        token: token,
        expires_at: expiresAt,
        used: false,
      });

    if (insertError) {
      console.error("Token insert error:", insertError);
      return res.status(500).json({
        success: false,
        message: "Something went wrong. Please try again.",
      });
    }

    // ---- Send reset email via Nodemailer ----
    const frontendUrl =
      process.env.FRONTEND_URL || "http://localhost:5173";
    const resetUrl = `${frontendUrl}/reset-password?token=${token}`;

    try {
      await sendResetEmail(email, resetUrl);
    } catch (emailError) {
      console.error("Email send error:", emailError);
      return res.status(500).json({
        success: false,
        message:
          "Failed to send email. Please try again later.",
      });
    }

    return res.json({
      success: true,
      message:
        "If this email is registered, a reset link has been sent. Please check your inbox (and spam folder).",
    });
  } catch (err) {
    console.error("forgotPassword unexpected error:", err);
    return res.status(500).json({
      success: false,
      message: "Something went wrong. Please try again.",
    });
  }
};

// ═══════════════════════════════════════════════════════
// ✅ NEW — 10. RESET PASSWORD
// ═══════════════════════════════════════════════════════
exports.resetPassword = async (req, res) => {
  const { token, password } = req.body;

  if (!token || !password) {
    return res.status(400).json({
      success: false,
      message: "Token and new password are both required.",
    });
  }

  if (password.length < 6) {
    return res.status(400).json({
      success: false,
      message: "Password must be at least 6 characters long.",
    });
  }

  try {
    // ---- Look up token ----
    const { data: resetRecord, error: fetchError } = await supabaseAdmin
      .from("password_resets")
      .select("*")
      .eq("token", token)
      .eq("used", false)
      .single();

    if (fetchError || !resetRecord) {
      return res.status(400).json({
        success: false,
        message:
          "This reset link is invalid or has already been used. Please request a new one.",
      });
    }

    // ---- Check expiry ----
    if (new Date(resetRecord.expires_at) < new Date()) {
      await supabaseAdmin
        .from("password_resets")
        .update({ used: true })
        .eq("id", resetRecord.id);

      return res.status(400).json({
        success: false,
        message: "This reset link has expired. Please request a new one.",
      });
    }

    // ---- Update password in Supabase Auth ----
    const { error: updateError } =
      await supabaseAdmin.auth.admin.updateUserById(resetRecord.user_id, {
        password: password,
      });

    if (updateError) {
      console.error("Password update error:", updateError);
      return res.status(500).json({
        success: false,
        message: "Failed to update password. Please try again.",
      });
    }

    // ---- Mark token as used ----
    await supabaseAdmin
      .from("password_resets")
      .update({ used: true })
      .eq("id", resetRecord.id);

    console.log(
      `✅ Password reset successful for ${resetRecord.email}`
    );

    return res.json({
      success: true,
      message: "Password updated successfully! You can now log in.",
    });
  } catch (err) {
    console.error("resetPassword unexpected error:", err);
    return res.status(500).json({
      success: false,
      message: "Something went wrong. Please try again.",
    });
  }
};