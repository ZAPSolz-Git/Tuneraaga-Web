const { supabaseAdmin } = require("../config/supabaseClient");

// ─────────────────────────────────────────────────────────────
// Helper: map frontend song objects → chart_songs rows
// Frontend sends: { release_id, title, artist, featuring_artists,
//                    album_name, cover_url, audio_url }
// ─────────────────────────────────────────────────────────────
const buildChartSongRows = (chartId, songs = []) =>
  songs.map((song) => ({
    chart_id: chartId,
    release_id: song.release_id || null,
    title: song.title,
    artist: song.artist || null,
    featuring_artists: song.featuring_artists || null,
    album_name: song.album_name || null,
    cover_url: song.cover_url || null,
    audio_url: song.audio_url,
  }));

// ─── CREATE CHART (chart + all songs) ───
exports.createChart = async (req, res) => {
  try {
    const { title, type, language, image_url, songs } = req.body;

    if (!title) {
      return res.status(400).json({ error: "Chart title is required." });
    }
    // if (!image_url) {
    //   return res.status(400).json({
    //     error:
    //       "Cover image URL is missing — the image upload likely failed or didn't finish before submitting. Please re-select the cover image and try again.",
    //   });
    // }
    if (!Array.isArray(songs) || songs.length === 0) {
      return res.status(400).json({ error: "At least one song is required." });
    }

    // 1. Insert the chart itself
    const { data: chart, error: chartError } = await supabaseAdmin
      .from("charts")
      .insert([
        { title, type: type || null, language: language || null, image_url },
      ])
      .select()
      .single();

    if (chartError) throw chartError;

    // 2. Insert chart_songs linked to the new chart
    const songRows = buildChartSongRows(chart.id, songs);
    const { error: songsError } = await supabaseAdmin
      .from("chart_songs")
      .insert(songRows);

    if (songsError) {
      // Roll back the chart row so we don't leave an empty/broken chart behind
      await supabaseAdmin.from("charts").delete().eq("id", chart.id);
      throw songsError;
    }

    res.status(201).json({ success: true, chart });
  } catch (err) {
    console.error("Create Chart Error:", err);
    res
      .status(500)
      .json({ error: "Failed to create chart.", details: err.message });
  }
};

// ─── UPDATE CHART (edit details + full replace of songs) ───
exports.updateChart = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, type, language, image_url, songs } = req.body;

    if (!title) {
      return res.status(400).json({ error: "Chart title is required." });
    }
    if (!image_url) {
      return res.status(400).json({
        error:
          "Cover image URL is missing — the image upload likely failed or didn't finish before submitting. Please re-select the cover image and try again.",
      });
    }
    if (!Array.isArray(songs) || songs.length === 0) {
      return res.status(400).json({ error: "At least one song is required." });
    }

    // 1. Confirm the chart exists
    const { data: existing, error: checkError } = await supabaseAdmin
      .from("charts")
      .select("id")
      .eq("id", id)
      .maybeSingle();
    if (checkError) throw checkError;
    if (!existing) {
      return res.status(404).json({ error: "Chart not found." });
    }

    // 2. Update chart details
    const { error: updateError } = await supabaseAdmin
      .from("charts")
      .update({
        title,
        type: type || null,
        language: language || null,
        image_url,
      })
      .eq("id", id);
    if (updateError) throw updateError;

    // 3. Replace all chart_songs — simplest reliable way to keep
    //    the song list, order, and count in sync with the form
    const { error: deleteError } = await supabaseAdmin
      .from("chart_songs")
      .delete()
      .eq("chart_id", id);
    if (deleteError) throw deleteError;

    const songRows = buildChartSongRows(id, songs);
    const { error: insertError } = await supabaseAdmin
      .from("chart_songs")
      .insert(songRows);
    if (insertError) throw insertError;

    res
      .status(200)
      .json({ success: true, message: "Chart updated successfully." });
  } catch (err) {
    console.error("Update Chart Error:", err);
    res
      .status(500)
      .json({ error: "Failed to update chart.", details: err.message });
  }
};

// ─── DELETE CHART (chart_songs cascade automatically via FK) ───
exports.deleteChart = async (req, res) => {
  try {
    const { id } = req.params;
    const { error } = await supabaseAdmin.from("charts").delete().eq("id", id);
    if (error) throw error;
    res
      .status(200)
      .json({ success: true, message: "Chart deleted successfully." });
  } catch (err) {
    console.error("Delete Chart Error:", err);
    res
      .status(500)
      .json({ error: "Failed to delete chart.", details: err.message });
  }
};
