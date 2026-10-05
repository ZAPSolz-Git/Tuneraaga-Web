const { supabaseAdmin } = require("../config/supabaseClient");
const { TABLE } = require("../utils/apiArtistVerification");

// GET /api/external-artist/verified — all admin-verified API artists.
exports.listVerified = async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from(TABLE)
      .select("spotify_id, name, image, created_at")
      .order("created_at", { ascending: false });
    if (error) throw error;
    res.status(200).json({ success: true, artists: data || [] });
  } catch (err) {
    console.error("List verified API artists error:", err.message);
    res.status(500).json({
      error: "Failed to load verified artists.",
      details: err.message,
    });
  }
};

// POST /api/external-artist/verified  { spotify_id, name, image? }  (admin)
exports.addVerified = async (req, res) => {
  try {
    const spotifyId = String(req.body.spotify_id || "").trim();
    const name = String(req.body.name || "").trim();
    if (!spotifyId || !name) {
      return res
        .status(400)
        .json({ error: "spotify_id and name are required." });
    }
    const { error } = await supabaseAdmin.from(TABLE).upsert(
      {
        spotify_id: spotifyId,
        name,
        image: req.body.image || null,
        verified_by: req.user?.id || null,
      },
      { onConflict: "spotify_id" },
    );
    if (error) throw error;
    res.status(200).json({ success: true });
  } catch (err) {
    console.error("Verify API artist error:", err.message);
    res.status(500).json({
      error: "Failed to verify artist.",
      details: err.message,
    });
  }
};

// DELETE /api/external-artist/verified/:spotifyId  (admin)
exports.removeVerified = async (req, res) => {
  try {
    const { error } = await supabaseAdmin
      .from(TABLE)
      .delete()
      .eq("spotify_id", req.params.spotifyId);
    if (error) throw error;
    res.status(200).json({ success: true });
  } catch (err) {
    console.error("Unverify API artist error:", err.message);
    res.status(500).json({
      error: "Failed to remove verification.",
      details: err.message,
    });
  }
};
