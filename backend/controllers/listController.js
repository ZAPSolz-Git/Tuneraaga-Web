const { supabaseAdmin } = require("../config/supabaseClient");

// ─────────────────────────────────────────────────────────────
// Generic controller for admin "list" tables that just reference
// a release (id, release_id, joined releases row). Used to fix
// SEC-01 for pages like LatestReleasesAdmin, Top10IndiaAdmin, and
// TrendingSongsAdmin, which previously wrote to Supabase directly
// with the anon key.
//
// The table name is NEVER taken as a raw string from the request —
// it must match a key in ALLOWED_LISTS below. This prevents a
// malicious :listName param from being used to target an arbitrary
// table. Add a new entry here whenever you wire up another list-style
// admin page (e.g. top10_india, trending_songs) — do NOT loosen this
// into a free-form table lookup.
// ─────────────────────────────────────────────────────────────
const ALLOWED_LISTS = {
  latest_releases: "latest_releases",
  // ✅ Verified schema: id (bigint identity), release_id (bigint, FK →
  // releases.id), created_at (timestamptz).
  top10_india: "top10_india",
  // ✅ Verified schema: id (bigint identity), release_id (bigint NOT
  // NULL, FK → releases.id, ON DELETE CASCADE), created_at (timestamptz).
  trending_songs: "trending_songs",
};

const resolveTable = (listName) => ALLOWED_LISTS[listName] || null;

// ─── GET all items in a list, joined with release info ───
exports.getListItems = async (req, res) => {
  try {
    const table = resolveTable(req.params.listName);
    if (!table) {
      return res.status(400).json({ error: "Unknown list name." });
    }

    const { data, error } = await supabaseAdmin
      .from(table)
      .select(
        `*, releases (id, title, cover_url, primary_artist, release_date)`,
      )
      .order("id", { ascending: false });

    if (error) throw error;
    res.status(200).json(data);
  } catch (err) {
    console.error("Get List Items Error:", err);
    res
      .status(500)
      .json({ error: "Failed to fetch list.", details: err.message });
  }
};

// ─── ADD an item to a list ───
exports.addListItem = async (req, res) => {
  try {
    const table = resolveTable(req.params.listName);
    if (!table) {
      return res.status(400).json({ error: "Unknown list name." });
    }

    const { release_id } = req.body;
    if (!release_id) {
      return res.status(400).json({ error: "release_id is required." });
    }

    const { data, error } = await supabaseAdmin
      .from(table)
      .insert([{ release_id }])
      .select();

    if (error) throw error;
    res.status(201).json({ success: true, item: data[0] });
  } catch (err) {
    console.error("Add List Item Error:", err);
    res
      .status(500)
      .json({ error: "Failed to add item.", details: err.message });
  }
};

// ─── DELETE an item from a list ───
exports.deleteListItem = async (req, res) => {
  try {
    const table = resolveTable(req.params.listName);
    if (!table) {
      return res.status(400).json({ error: "Unknown list name." });
    }

    const { id } = req.params;
    const { error } = await supabaseAdmin.from(table).delete().eq("id", id);

    if (error) throw error;
    res.status(200).json({ success: true });
  } catch (err) {
    console.error("Delete List Item Error:", err);
    res
      .status(500)
      .json({ error: "Failed to delete item.", details: err.message });
  }
};
