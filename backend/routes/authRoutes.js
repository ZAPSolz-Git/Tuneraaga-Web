const express = require("express");
const router = express.Router();
const { supabaseAdmin } = require("../config/supabaseClient");

// Get user profile (bypasses RLS)
router.get("/profile/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    const { data, error } = await supabaseAdmin
      .from("artists")
      .select("*")
      .eq("id", userId)
      .single();

    if (error) {
      return res.status(404).json({ error: "Profile not found" });
    }

    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
