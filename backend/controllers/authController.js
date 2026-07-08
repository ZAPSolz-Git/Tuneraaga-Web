const { supabase, supabaseAdmin } = require("../config/supabaseClient");

// --- 1. LOGIN ---
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email aur password zaroori hain.",
      });
    }

    // Step 1: Sign in with Supabase Auth (this is the ONLY place login actually happens)
    const { data: authData, error: authError } =
      await supabase.auth.signInWithPassword({
        email,
        password,
      });

    if (authError) {
      // Log the REAL reason on the server so you can debug easily
      console.error("Login auth error:", authError.message);

      // Give the user a more useful message depending on the actual reason
      if (authError.message.toLowerCase().includes("email not confirmed")) {
        return res.status(401).json({
          success: false,
          message:
            "Aapka email verify nahi hua hai. Signup ke baad bheja gaya confirmation email check karo.",
        });
      }

      return res.status(401).json({
        success: false,
        message: "Invalid email ya password.",
      });
    }

    const userId = authData.user.id;

    // Step 2: Check if user exists in users table (Use supabaseAdmin to bypass RLS)
    let { data: existingUser, error: fetchError } = await supabaseAdmin
      .from("users")
      .select("id, email, role, created_at, updated_at")
      .eq("id", userId)
      .single();

    // Step 3: If not in users table (e.g. old account), create entry now
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
        message: "Email aur password zaroori hain.",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password kam se kam 6 characters ka hona chahiye.",
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
          message: "Yeh email pehle se registered hai. Login karo.",
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
        : "Registration successful! Apna email verify karo, uske baad login ho payega.",
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
          message: "User profile nahi mila.",
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



exports.updateUserRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!["user", "admin"].includes(role)) {
      return res.status(400).json({
        success: false,
        message: "Invalid role. 'user' ya 'admin' hona chahiye.",
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
        message: "Aap apna role change nahi kar sakte.",
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
        message: "User nahi mila.",
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
        message: "Aap apna account delete nahi kar sakte.",
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
      message: "User successfully delete ho gaya!",
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
