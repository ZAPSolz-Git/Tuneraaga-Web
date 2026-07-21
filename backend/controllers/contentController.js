const path = require("path");
const { supabaseAdmin } = require("../config/supabaseClient");

const STORAGE_BUCKET = process.env.SUPABASE_STORAGE_BUCKET || "music-assets";

exports.uploadAsset = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "File is required for upload." });
    }

    const extension = path.extname(req.file.originalname || "") || "";
    const filename = `uploads/${Date.now()}_${Math.random().toString(36).slice(2)}${extension}`;

    const { error: uploadError } = await supabaseAdmin.storage
      .from(STORAGE_BUCKET)
      .upload(filename, req.file.buffer, {
        contentType: req.file.mimetype,
        upsert: false,
      });

    if (uploadError) {
      throw uploadError;
    }

    const { data: urlData, error: urlError } = await supabaseAdmin.storage
      .from(STORAGE_BUCKET)
      .getPublicUrl(filename);

    if (urlError) {
      throw urlError;
    }

    return res
      .status(201)
      .json({ success: true, publicUrl: urlData.publicUrl, path: filename });
  } catch (err) {
    console.error("uploadAsset error:", err.message);
    return res.status(500).json({ error: err.message });
  }
};

exports.createRelease = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized. Please login." });
    }

    const {
      title,
      primary_artist,
      featuring_artists,
      genre,
      subgenre,
      language,
      format,
      cover_url,
      audio_url,
      lyrics,
      copyright_holder,
      copyright_year,
      publisher,
      status,
      track_number,
      actor_names,
      movie_name,
      album_name,
      album_cover_url,
      release_date,
      play_count,
      listeners_count,
    } = req.body;

    const payload = {
      title,
      primary_artist,
      featuring_artists,
      genre,
      subgenre,
      language,
      format,
      cover_url,
      audio_url,
      lyrics,
      copyright_holder,
      copyright_year,
      publisher,
      status,
      track_number,
      actor_names,
      movie_name,
      album_name,
      album_cover_url,
      release_date,
      play_count,
      listeners_count,
    };

    const { data, error } = await supabaseAdmin
      .from("releases")
      .insert([payload])
      .select()
      .single();

    if (error) {
      throw error;
    }

    return res.status(201).json({ success: true, release: data });
  } catch (err) {
    console.error("createRelease error:", err.message);
    return res.status(500).json({ error: err.message });
  }
};

// --- PUBLISH ALBUM TRACKS (bulk update, admin-only) ---
// ✅ NEW — fixes SEC-01 in AlbumReleaseForm's handlePublish, which used to
// run `supabase.from("releases").update({...}).in("id", ids)` directly
// from the browser with the anon key. Now it's one authenticated,
// admin-only call: PUT /api/content/releases/publish
exports.publishAlbumTracks = async (req, res) => {
  try {
    const { ids, lyrics, copyright_holder, copyright_year, publisher } =
      req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return res
        .status(400)
        .json({ error: "ids (array of release ids) is required." });
    }
    if (!copyright_holder || !copyright_year) {
      return res
        .status(400)
        .json({ error: "copyright_holder and copyright_year are required." });
    }

    const { data, error } = await supabaseAdmin
      .from("releases")
      .update({
        lyrics: lyrics || null,
        copyright_holder,
        copyright_year,
        publisher: publisher || null,
        status: "Published",
      })
      .in("id", ids)
      .select();

    if (error) {
      throw error;
    }

    return res.status(200).json({ success: true, releases: data });
  } catch (err) {
    console.error("publishAlbumTracks error:", err.message);
    return res.status(500).json({ error: err.message });
  }
};

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
