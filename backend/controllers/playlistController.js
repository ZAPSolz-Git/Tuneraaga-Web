const { supabaseAdmin } = require("../config/supabaseClient");

// ─────────────────────────────────────────────────────────────
// Helper: map frontend song objects → playlist_songs rows
// Frontend sends: { release_id, title, artist, featuring_artists,
//                    album_name, cover_url, audio_url }
// ─────────────────────────────────────────────────────────────
const buildPlaylistSongRows = (playlistId, songs = []) =>
  songs.map((song, idx) => ({
    playlist_id: playlistId,
    release_id: song.release_id || null,
    title: song.title,
    artist: song.artist || null,
    featuring_artists: song.featuring_artists || null,
    album_name: song.album_name || null,
    cover_url: song.cover_url || null,
    audio_url: song.audio_url,
    order_num: idx + 1,
  }));

// ─── CREATE PLAYLIST (playlist + all songs) ───
exports.createPlaylist = async (req, res) => {
  try {
    const { title, language, image_url, songs } = req.body;

    if (!title) {
      return res.status(400).json({ error: "Playlist title is required." });
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

    // 1. Insert the playlist itself
    const { data: playlist, error: playlistError } = await supabaseAdmin
      .from("playlists")
      .insert([{ title, language: language || null, image_url }])
      .select()
      .single();

    if (playlistError) throw playlistError;

    // 2. Insert playlist_songs linked to the new playlist
    const songRows = buildPlaylistSongRows(playlist.id, songs);
    const { error: songsError } = await supabaseAdmin
      .from("playlist_songs")
      .insert(songRows);

    if (songsError) {
      // Roll back the playlist row so we don't leave an empty/broken playlist behind
      await supabaseAdmin.from("playlists").delete().eq("id", playlist.id);
      throw songsError;
    }

    res.status(201).json({ success: true, playlist });
  } catch (err) {
    console.error("Create Playlist Error:", err);
    res
      .status(500)
      .json({ error: "Failed to create playlist.", details: err.message });
  }
};

// ─── UPDATE PLAYLIST (edit details + full replace of songs) ───
exports.updatePlaylist = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, language, image_url, songs } = req.body;

    if (!title) {
      return res.status(400).json({ error: "Playlist title is required." });
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

    // 1. Confirm the playlist exists
    const { data: existing, error: checkError } = await supabaseAdmin
      .from("playlists")
      .select("id")
      .eq("id", id)
      .maybeSingle();
    if (checkError) throw checkError;
    if (!existing) {
      return res.status(404).json({ error: "Playlist not found." });
    }

    // 2. Update playlist details
    const { error: updateError } = await supabaseAdmin
      .from("playlists")
      .update({ title, language: language || null, image_url })
      .eq("id", id);
    if (updateError) throw updateError;

    // 3. Replace all playlist_songs — simplest reliable way to keep
    //    the song list, order, and count in sync with the form
    const { error: deleteError } = await supabaseAdmin
      .from("playlist_songs")
      .delete()
      .eq("playlist_id", id);
    if (deleteError) throw deleteError;

    const songRows = buildPlaylistSongRows(id, songs);
    const { error: insertError } = await supabaseAdmin
      .from("playlist_songs")
      .insert(songRows);
    if (insertError) throw insertError;

    res
      .status(200)
      .json({ success: true, message: "Playlist updated successfully." });
  } catch (err) {
    console.error("Update Playlist Error:", err);
    res
      .status(500)
      .json({ error: "Failed to update playlist.", details: err.message });
  }
};

// ─── DELETE PLAYLIST (playlist_songs cascade automatically via FK) ───
exports.deletePlaylist = async (req, res) => {
  try {
    const { id } = req.params;
    const { error } = await supabaseAdmin
      .from("playlists")
      .delete()
      .eq("id", id);
    if (error) throw error;
    res
      .status(200)
      .json({ success: true, message: "Playlist deleted successfully." });
  } catch (err) {
    console.error("Delete Playlist Error:", err);
    res
      .status(500)
      .json({ error: "Failed to delete playlist.", details: err.message });
  }
};
