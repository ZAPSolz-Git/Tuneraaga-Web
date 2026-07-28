const express = require("express");
const router = express.Router();
const { supabaseAdmin } = require("../config/supabaseClient");

router.post("/releases", async (req, res) => {
  if (req.headers["x-internal-secret"] !== process.env.STREAMING_INTERNAL_SECRET) {
    return res.status(403).json({ error: "Forbidden" });
  }

  const {
    source_submission_id, owner_user_id,
    title, primary_artist, featuring_artists, release_date,
    genre, subgenre, language, format,
    copyright_holder, copyright_year, publisher,
    audio_url, cover_url, distribution_platforms,
  } = req.body;

  if (!source_submission_id || !title) {
    return res.status(400).json({ error: "source_submission_id and title are required" });
  }

  const payload = {
    source_submission_id,
    owner_user_id,
    title,
    primary_artist,
    featuring_artists,
    release_date,
    genre,
    subgenre,
    language,
    format,
    copyright_holder,
    copyright_year: copyright_year != null ? String(copyright_year) : null, // Distribution stores int, Streaming stores text
    publisher,
    audio_url,
    cover_url,
    platforms: distribution_platforms || [], // field renamed between the two schemas
    status: "Published",
  };

  const { data, error } = await supabaseAdmin
    .from("releases")
    .upsert(payload, { onConflict: "source_submission_id" })
    .select()
    .single();

  if (error) {
    console.error("internal releases upsert error:", error.message);
    return res.status(500).json({ error: error.message });
  }

  return res.status(200).json({ success: true, release: data });
});

module.exports = router; 