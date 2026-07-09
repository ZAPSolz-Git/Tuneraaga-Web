// --- existing functions stay as-is, add these 3 new ones ---

// --- UPDATE RADIO STATION + MANAGE SONGS ---
exports.updateRadioStation = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      description,
      language,
      genre,
      image_url,
      stream_url,
      addSongs,
      removeSongs,
    } = req.body;

    // 1. Update station details
    const { error: updateError } = await supabaseAdmin
      .from("radio_stations")
      .update({
        name,
        description: description || null,
        language,
        genre,
        image_url,
        stream_url: stream_url || "https://stream.zeno.fm/0r0xa792kwzuv",
      })
      .eq("id", id);
    if (updateError) throw updateError;

    // 2. Remove song mappings
    if (removeSongs && removeSongs.length > 0) {
      const { error: removeErr } = await supabaseAdmin
        .from("radio_songs")
        .delete()
        .eq("radio_id", id)
        .in("song_id", removeSongs);
      if (removeErr) throw removeErr;
    }

    // 3. Add song mappings
    if (addSongs && addSongs.length > 0) {
      const { error: addErr } = await supabaseAdmin
        .from("radio_songs")
        .insert(addSongs.map((songId) => ({ radio_id: id, song_id: songId })));
      if (addErr) throw addErr;
    }

    res
      .status(200)
      .json({ success: true, message: "Radio station updated successfully." });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// --- DELETE RELEASE (published song) ---
exports.deleteRelease = async (req, res) => {
  try {
    const { id } = req.params;
    const { error } = await supabaseAdmin
      .from("releases")
      .delete()
      .eq("id", id);
    if (error) throw error;
    res
      .status(200)
      .json({ success: true, message: "Release deleted successfully." });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// --- DELETE PODCAST ---
exports.deletePodcast = async (req, res) => {
  try {
    const { id } = req.params;
    const { error } = await supabaseAdmin
      .from("podcasts")
      .delete()
      .eq("id", id);
    if (error) throw error;
    res
      .status(200)
      .json({ success: true, message: "Podcast deleted successfully." });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// --- DELETE RADIO STATION (CASCADE handles radio_songs) ---
exports.deleteRadioStation = async (req, res) => {
  try {
    const { id } = req.params;
    const { error } = await supabaseAdmin
      .from("radio_stations")
      .delete()
      .eq("id", id);
    if (error) throw error;
    res
      .status(200)
      .json({ success: true, message: "Radio station deleted successfully." });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
