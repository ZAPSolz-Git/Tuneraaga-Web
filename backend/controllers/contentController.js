const path = require("path");
const { supabaseAdmin } = require("../config/supabaseClient");

const {
  MAX_RELEASE_ALBUMS,
  MAX_ALBUM_TRACKS,
  validateCover,
  validateAudio,
} = require("../utils/mediaValidation");

const STORAGE_BUCKET = process.env.SUPABASE_STORAGE_BUCKET || "music-assets";


const VALIDATED_PREFIX = "validated";
const hasValidatedPrefix = (url) =>
  typeof url === "string" && url.includes(`/${VALIDATED_PREFIX}/`);

const RELEASE_KINDS = { release_cover: validateCover, release_audio: validateAudio };

exports.uploadAsset = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "File is required for upload." });
    }

    // Release artwork / audio are validated here, on the server.
    const kind = req.body?.kind;
    let folder = "uploads";
    let extension = path.extname(req.file.originalname || "") || "";
    let contentType = req.file.mimetype;
    if (kind) {
      const validate = RELEASE_KINDS[kind];
      if (!validate) {
        return res.status(400).json({ error: "Unknown upload type." });
      }
      const problem = validate(req.file.buffer);
      if (problem) {
        return res.status(422).json({ error: problem, code: "INVALID_MEDIA" });
      }
      folder = VALIDATED_PREFIX;
      extension = kind === "release_cover" ? ".jpg" : ".wav";
      contentType = kind === "release_cover" ? "image/jpeg" : "audio/wav";
    }

    const filename = `${folder}/${Date.now()}_${Math.random().toString(36).slice(2)}${extension}`;

    const { error: uploadError } = await supabaseAdmin.storage
      .from(STORAGE_BUCKET)
      .upload(filename, req.file.buffer, {
        contentType,
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

const escapeLike = (v) => String(v).replace(/[\\%_]/g, (c) => "\\" + c);

// Returns an error message when `artist` already owns MAX_RELEASE_ALBUMS
// distinct albums and `albumName` is not one of them; otherwise null.
const checkAlbumLimit = async (artist, albumName) => {
  if (!artist) return null;
  const { data, error } = await supabaseAdmin
    .from("releases")
    .select("album_name")
    .ilike("primary_artist", escapeLike(artist))
    .not("album_name", "is", null)
    .limit(10000);
  if (error) throw error;

  const albums = new Set(
    (data || [])
      .map((r) => String(r.album_name || "").trim().toLowerCase())
      .filter(Boolean),
  );
  if (albums.has(String(albumName).trim().toLowerCase())) return null;
  if (albums.size >= MAX_RELEASE_ALBUMS) {
    return `Maximum album upload limit reached. "${artist}" already has ${MAX_RELEASE_ALBUMS} albums. Please delete an existing album before uploading a new one.`;
  }
  return null;
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

    const badFiles = [];
    if (!hasValidatedPrefix(cover_url)) badFiles.push("poster (JPG, min 3000 × 3000 px)");
    if (!hasValidatedPrefix(audio_url)) badFiles.push("audio (WAV)");
    if (badFiles.length) {
      return res.status(422).json({
        error: `Please re-upload the ${badFiles.join(" and ")} — it was not uploaded through the validated release uploader.`,
        code: "INVALID_MEDIA",
      });
    }

    // Album limit — enforced here so it cannot be bypassed from the frontend.
    if (album_name && String(album_name).trim()) {
      const limitError = await checkAlbumLimit(primary_artist, album_name);
      if (limitError) {
        return res
          .status(403)
          .json({ error: limitError, code: "ALBUM_LIMIT_REACHED" });
      }
    }

    // Track limit — one album (same name + cover) holds at most 10 tracks.
    if (album_name && String(album_name).trim()) {
      let trackQuery = supabaseAdmin
        .from("releases")
        .select("id", { count: "exact", head: true })
        .eq("album_name", album_name);
      trackQuery = album_cover_url
        ? trackQuery.eq("album_cover_url", album_cover_url)
        : trackQuery;
      const { count, error: countError } = await trackQuery;
      if (countError) throw countError;
      if ((count || 0) >= MAX_ALBUM_TRACKS) {
        return res.status(403).json({
          error: `Maximum track limit reached. An album can contain up to ${MAX_ALBUM_TRACKS} tracks.`,
          code: "ALBUM_TRACK_LIMIT_REACHED",
        });
      }
    }

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
