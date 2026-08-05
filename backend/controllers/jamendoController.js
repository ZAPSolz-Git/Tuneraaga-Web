const { jamendoApi } = require("../config/jamendoClient");
const { supabaseAdmin } = require("../config/supabaseClient");
const { v5: uuidv5 } = require("uuid");

const PAGE_SIZE = 200;

// Fixed namespace UUID for TuneRaaga's Jamendo sync — arbitrary but constant,
// so uuidv5(namespace, jamendoTrackId) always produces the same UUID for the
// same track across every sync run (safe for upsert onConflict).
const JAMENDO_NAMESPACE = "7f3f1e2a-6b1c-4e3a-9d3a-1c2b3a4d5e6f";

function jamendoTrackUuid(jamendoId) {
  return uuidv5(`jamendo_${jamendoId}`, JAMENDO_NAMESPACE);
}

async function syncJamendoTracks(req, res) {
  try {
    const limit = Number(req.query.limit ?? 500);
    const tags = req.query.tags ? String(req.query.tags) : undefined;

    let fetched = 0;
    let offset = 0;
    let totalUpserted = 0;

    while (fetched < limit) {
      const { data } = await jamendoApi.get("/tracks/", {
        params: {
          limit: PAGE_SIZE,
          offset,
          include: "musicinfo",
          audioformat: "mp32",
          ...(tags ? { tags } : {}),
        },
      });

      const results = data.results ?? [];
      if (fetched === 0) {
        // one-time debug peek at the raw Jamendo response shape
        console.log("Jamendo raw response:", JSON.stringify(data).slice(0, 1000));
      }
      if (results.length === 0) break;

      const rows = results.map((track) => ({
        source_submission_id: jamendoTrackUuid(track.id),
        owner_user_id: null,
        title: track.name,
        primary_artist: track.artist_name,
        featuring_artists: null,
        release_date: track.releasedate || null,
        genre: track.musicinfo?.tags?.genres?.[0] ?? null,
        subgenre: null,
        language: null,
        format: "single",
        copyright_holder: track.license_ccurl
          ? `Jamendo (${track.license_ccurl})`
          : "Jamendo / Creative Commons",
        copyright_year: track.releasedate
          ? String(new Date(track.releasedate).getFullYear())
          : null,
        publisher: null,
        audio_url: track.audio,
        cover_url: track.image || track.album_image || null,
        status: "Published",
      }));

      const { data: upserted, error } = await supabaseAdmin
        .from("releases")
        .upsert(rows, { onConflict: "source_submission_id" })
        .select("id");

      if (error) throw error;

      totalUpserted += upserted?.length ?? rows.length;
      fetched += results.length;
      offset += PAGE_SIZE;
    }

    res.json({ success: true, fetched, totalUpserted });
  } catch (err) {
    console.error("Jamendo sync failed:", err.message);
    res.status(500).json({ success: false, error: err.message });
  }
}

module.exports = { syncJamendoTracks };