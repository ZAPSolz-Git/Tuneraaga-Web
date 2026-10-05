// ═══════════════════════════════════════════════════════════
// ALBUM MANAGEMENT (admin) — album tracks only; singles are never touched.
// An album = all releases sharing the same album_name + album_cover_url.
// ═══════════════════════════════════════════════════════════
const { supabaseAdmin } = require("../config/supabaseClient");

// Files that passed release validation live under this prefix
// (see contentController.uploadAsset).
const hasValidatedPrefix = (url) =>
  typeof url === "string" && url.includes("/validated/");

const isSingle = (r) => String(r.format || "").trim().toLowerCase() === "single";
// A release belongs to Album Management when it carries an album name (and is
// not a single), or when it is an older record whose format is "album" but
// that never had an album name saved.
const isAlbumRow = (r) =>
  !isSingle(r) &&
  (!!String(r.album_name || "").trim() ||
    String(r.format || "").trim().toLowerCase() === "album");

const parseIds = (v) =>
  (Array.isArray(v) ? v : String(v || "").split(","))
    .map((x) => Number(x))
    .filter((x) => Number.isInteger(x));

// Tables that reference releases.id. Admin "list" rows are removed together
// with the release; chart / playlist entries keep their own copy of the song
// data, so they are just detached.
const LIST_TABLES = ["latest_releases", "top10_india", "trending_songs"];
const DETACH_TABLES = ["chart_songs", "playlist_songs"];

const detachReleases = async (ids) => {
  for (const table of LIST_TABLES) {
    const { error } = await supabaseAdmin
      .from(table)
      .delete()
      .in("release_id", ids);
    if (error) throw error;
  }
  for (const table of DETACH_TABLES) {
    const { error } = await supabaseAdmin
      .from(table)
      .update({ release_id: null })
      .in("release_id", ids);
    if (error) throw error;
  }
};

// Load the given ids and keep only album rows (singles are never returned).
const loadAlbumRows = async (ids) => {
  if (!ids.length) return [];
  const { data, error } = await supabaseAdmin
    .from("releases")
    .select("*")
    .in("id", ids);
  if (error) throw error;
  return (data || []).filter(isAlbumRow);
};

const ALBUM_TRACK_FIELDS = [
  "title",
  "primary_artist",
  "featuring_artists",
  "genre",
  "subgenre",
  "language",
  "actor_names",
  "movie_name",
  "track_number",
  "lyrics",
  "status",
];

const VALID_STATUS = ["Published", "Draft"];

exports.getAlbums = async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from("releases")
      .select("*")
      .or("album_name.not.is.null,format.ilike.album")
      .order("track_number", { ascending: true })
      .limit(10000);
    if (error) throw error;

    const map = new Map();
    for (const r of (data || []).filter(isAlbumRow)) {
      const named = String(r.album_name || "").trim();
      const cover = r.album_cover_url || r.cover_url || "";
      // Older records without an album name are shown as their own album.
      const key = named ? `n|${named}|${cover}` : `id|${r.id}`;
      if (!map.has(key)) {
        map.set(key, {
          album_name: named || r.title,
          album_cover_url: cover || null,
          primary_artist: r.primary_artist,
          release_date: r.release_date,
          created_at: r.created_at,
          copyright_holder: r.copyright_holder,
          copyright_year: r.copyright_year,
          publisher: r.publisher,
          lyrics: r.lyrics,
          format: r.format,
          tracks: [],
        });
      }
      map.get(key).tracks.push(r);
    }

    const albums = [...map.values()].map((a) => {
      const statuses = new Set(a.tracks.map((t) => t.status || "Draft"));
      return {
        ...a,
        track_ids: a.tracks.map((t) => t.id),
        status: statuses.size === 1 ? [...statuses][0] : "Mixed",
        track_count: a.tracks.length,
      };
    });
    albums.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    return res.status(200).json({ success: true, albums });
  } catch (err) {
    console.error("getAlbums error:", err.message);
    return res.status(500).json({ error: err.message });
  }
};

// PUT /albums — update album-wide details on every track of one album.
exports.updateAlbum = async (req, res) => {
  try {
    const { updates = {} } = req.body;
    const ids = parseIds(req.body.ids);
    if (!ids.length) {
      return res.status(400).json({ error: "Album track ids are required." });
    }

    const patch = {};
    if (updates.album_name !== undefined) {
      if (!String(updates.album_name).trim()) {
        return res.status(400).json({ error: "Album name cannot be empty." });
      }
      patch.album_name = String(updates.album_name).trim();
    }
    if (updates.album_cover_url !== undefined) {
      if (!hasValidatedPrefix(updates.album_cover_url)) {
        return res.status(422).json({
          error:
            "Please re-upload the poster (JPG, min 3000 × 3000 px) — it was not uploaded through the validated release uploader.",
          code: "INVALID_MEDIA",
        });
      }
      patch.album_cover_url = updates.album_cover_url;
      patch.cover_url = updates.album_cover_url;
    }
    for (const f of [
      "lyrics",
      "copyright_holder",
      "copyright_year",
      "publisher",
      "release_date",
    ]) {
      if (updates[f] !== undefined) patch[f] = updates[f] || null;
    }
    if (updates.status !== undefined) {
      if (!VALID_STATUS.includes(updates.status)) {
        return res.status(400).json({ error: "Invalid status." });
      }
      patch.status = updates.status;
    }
    if (Object.keys(patch).length === 0) {
      return res.status(400).json({ error: "Nothing to update." });
    }

    const rows = await loadAlbumRows(ids);
    if (rows.length === 0) {
      return res.status(404).json({ error: "Album not found." });
    }
    const { data, error } = await supabaseAdmin
      .from("releases")
      .update(patch)
      .in("id", rows.map((r) => r.id))
      .select();
    if (error) throw error;
    return res.status(200).json({ success: true, tracks: data });
  } catch (err) {
    console.error("updateAlbum error:", err.message);
    return res.status(500).json({ error: err.message });
  }
};

// DELETE /albums?ids=1,2,3 — delete an album and all its tracks.
exports.deleteAlbum = async (req, res) => {
  try {
    const ids = parseIds(req.query.ids);
    if (!ids.length) {
      return res.status(400).json({ error: "Album track ids are required." });
    }
    const rows = await loadAlbumRows(ids);
    if (rows.length === 0) {
      return res.status(404).json({ error: "Album not found." });
    }
    const rowIds = rows.map((r) => r.id);
    await detachReleases(rowIds);
    const { data, error } = await supabaseAdmin
      .from("releases")
      .delete()
      .in("id", rowIds)
      .select("id");
    if (error) throw error;
    return res
      .status(200)
      .json({ success: true, deleted: (data || []).length });
  } catch (err) {
    console.error("deleteAlbum error:", err.message);
    return res.status(500).json({ error: err.message });
  }
};

// PUT /albums/tracks/:id — edit a single track of an album.
exports.updateAlbumTrack = async (req, res) => {
  try {
    const { id } = req.params;
    const patch = {};
    for (const f of ALBUM_TRACK_FIELDS) {
      if (req.body[f] !== undefined) patch[f] = req.body[f];
    }
    if (req.body.audio_url !== undefined) {
      if (!hasValidatedPrefix(req.body.audio_url)) {
        return res.status(422).json({
          error:
            "Please re-upload the audio (WAV) — it was not uploaded through the validated release uploader.",
          code: "INVALID_MEDIA",
        });
      }
      patch.audio_url = req.body.audio_url;
    }
    if (patch.title !== undefined && !String(patch.title).trim()) {
      return res.status(400).json({ error: "Track title cannot be empty." });
    }
    if (patch.status !== undefined && !VALID_STATUS.includes(patch.status)) {
      return res.status(400).json({ error: "Invalid status." });
    }
    if (Object.keys(patch).length === 0) {
      return res.status(400).json({ error: "Nothing to update." });
    }

    const [row] = await loadAlbumRows([Number(id)]); // never touches singles
    if (!row) return res.status(404).json({ error: "Album track not found." });
    const { data, error } = await supabaseAdmin
      .from("releases")
      .update(patch)
      .eq("id", row.id)
      .select()
      .single();
    if (error) throw error;
    return res.status(200).json({ success: true, track: data });
  } catch (err) {
    console.error("updateAlbumTrack error:", err.message);
    return res.status(500).json({ error: err.message });
  }
};

// DELETE /albums/tracks/:id — remove a single track from an album.
exports.deleteAlbumTrack = async (req, res) => {
  try {
    const { id } = req.params;
    const [row] = await loadAlbumRows([Number(id)]); // never touches singles
    if (!row) return res.status(404).json({ error: "Album track not found." });
    await detachReleases([row.id]);
    const { error } = await supabaseAdmin
      .from("releases")
      .delete()
      .eq("id", row.id);
    if (error) throw error;
    return res.status(200).json({ success: true });
  } catch (err) {
    console.error("deleteAlbumTrack error:", err.message);
    return res.status(500).json({ error: err.message });
  }
};
