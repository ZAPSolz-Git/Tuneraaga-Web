const { distributionData, supabaseAdmin } = require("../config/supabaseClient");
console.log("distributionData is:", typeof distributionData, distributionData);
const SUBMISSIONS_TABLE = "submissions";
const APPROVED_STATUS = "approved";

function mapSubmissionToRelease(submission, releaseType) {
  const tracks = Array.isArray(submission.tracks) ? submission.tracks : [];
  const primaryTrack = tracks.length
    ? [...tracks].sort(
        (a, b) => new Date(a.created_at) - new Date(b.created_at),
      )[0]
    : null;

  const normalizedType =
    releaseType && ["Single", "Album"].includes(releaseType)
      ? releaseType
      : submission.release_type && submission.release_type !== "Single"
        ? "Album"
        : "Single";

  const isAlbum = normalizedType === "Album";

  return {
    source_submission_id: submission.id, // upsert / dedupe key
    owner_user_id: submission.user_id || null,
    title: submission.title || primaryTrack?.title || "Untitled",
    primary_artist:
      submission.primary_artist || primaryTrack?.primaryArtist || "Unknown",
    featuring_artists:
      submission.featuring_artists || primaryTrack?.featuring || null,
    release_date:
      submission.main_release_date || submission.release_date || null,
    genre: submission.genre || primaryTrack?.genre || null,
    subgenre: submission.subgenre || primaryTrack?.subgenre || null,
    language: submission.language || primaryTrack?.trackTitleLanguage || null,
    format: normalizedType,
    copyright_holder: submission.copyright_holder || null,
    copyright_year: submission.copyright_year
      ? String(submission.copyright_year)
      : primaryTrack?.productionYear
        ? String(primaryTrack.productionYear)
        : null,
    publisher: submission.publisher || primaryTrack?.publisher || null,
    platforms: submission.distribution_platforms || null,
    cover_url: submission.cover_url || null,
    audio_url: submission.audio_url || primaryTrack?.audio_file_url || null,
    lyrics: primaryTrack?.lyrics || null,

    album_name: isAlbum
      ? submission.title || primaryTrack?.title || null
      : null,
    track_number: 1,
    status: "Published",
  };
}

async function getIncomingSongs(req, res) {
  try {
    const { data: submissions, error: subError } = await distributionData
      .from(SUBMISSIONS_TABLE)
      .select(
        `
        *,
        tracks (*),
        users:user_id ( full_name, label_name, email )
      `,
      )
      .eq("status", APPROVED_STATUS)
      .order("created_at", { ascending: false });

    if (subError) {
      console.error("[getIncomingSongs] submissions fetch error:", subError);
      return res.status(500).json({
        error:
          "Distribution se submissions load nahi hue. FK embedding / RLS check karo: " +
          subError.message,
      });
    }

    const { data: existing, error: existingError } = await supabaseAdmin
      .from("releases")
      .select("source_submission_id")
      .not("source_submission_id", "is", null);

    if (existingError) {
      console.error(
        "[getIncomingSongs] existing releases fetch error:",
        existingError,
      );
      return res.status(500).json({
        error: "TuneRaaga releases check fail hua: " + existingError.message,
      });
    }

    const importedIds = new Set(
      (existing || []).map((r) => r.source_submission_id),
    );

    const result = (submissions || []).map((s) => ({
      ...s,
      imported: importedIds.has(s.id),
    }));

    return res.json({ submissions: result });
  } catch (err) {
    console.error("[getIncomingSongs] unexpected error:", err);
    return res.status(500).json({ error: "Unexpected server error" });
  }
}

async function syncIncomingSongs(req, res) {
  try {
    const { submissionIds, releaseType } = req.body || {};

    let query = distributionData
      .from(SUBMISSIONS_TABLE)
      .select(
        `
        *,
        tracks (*)
      `,
      )
      .eq("status", APPROVED_STATUS);

    if (Array.isArray(submissionIds) && submissionIds.length > 0) {
      query = query.in("id", submissionIds);
    }

    const { data: submissions, error: subError } = await query;

    if (subError) {
      console.error("[syncIncomingSongs] submissions fetch error:", subError);
      return res.status(500).json({ error: subError.message });
    }

    if (!submissions || submissions.length === 0) {
      return res.json({ synced: 0, releases: [] });
    }

    const payloads = submissions.map((s) =>
      mapSubmissionToRelease(s, releaseType),
    );

    const { data: upserted, error: upsertError } = await supabaseAdmin
      .from("releases")
      .upsert(payloads, { onConflict: "source_submission_id" })
      .select(
        "id, source_submission_id, title, primary_artist, format, album_name",
      );

    if (upsertError) {
      console.error("[syncIncomingSongs] upsert error:", upsertError);
      return res.status(500).json({ error: upsertError.message });
    }

    return res.json({ synced: upserted.length, releases: upserted });
  } catch (err) {
    console.error("[syncIncomingSongs] unexpected error:", err);
    return res.status(500).json({ error: "Unexpected server error" });
  }
}

module.exports = { getIncomingSongs, syncIncomingSongs };
