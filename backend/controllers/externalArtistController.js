const axios = require("axios");
const { spotifyApi } = require("../config/spotifyClient");

const WIKIPEDIA_SUMMARY_URL = "https://en.wikipedia.org/api/rest_v1/page/summary";

// Wikipedia asks server-side clients to identify themselves with a real
// User-Agent (unlike browsers, Node has no restriction against setting one).
const wikipediaHeaders = {
  "User-Agent": "TuneRaaga/1.0 (https://tuneraagaweb.vercel.app; contact: support@movementcreations.in)",
};

function mapSpotifyArtistItem(artist) {
  return {
    id: artist.id,
    name: artist.name,
    genres: artist.genres,
    followers: artist.followers?.total ?? 0,
    popularity: artist.popularity,
    image: artist.images?.[0]?.url ?? null,
    spotifyUrl: artist.external_urls?.spotify ?? null,
  };
}

async function fetchSpotifyArtist(name) {
  const { data: searchData } = await spotifyApi.get("/search", {
    params: { q: name, type: "artist", limit: 1 },
  });

  const artist = searchData.artists?.items?.[0];
  if (!artist) return null;

  return mapSpotifyArtistItem(artist);
}

// This app's Spotify access tier omits `followers`/`popularity`/`genres`
// from every artist response entirely (confirmed directly against Spotify's
// Get Artist endpoint) — not a bug here, a platform-side restriction for
// apps without extended quota. Deezer's public search API needs no auth/key
// and returns a real "nb_fan" count, so it's used as a free substitute for
// follower counts on Spotify-sourced artists.
async function fetchDeezerFollowers(name) {
  try {
    const { data } = await axios.get("https://api.deezer.com/search/artist", {
      params: { q: name, limit: 1 },
    });
    return data.data?.[0]?.nb_fan ?? 0;
  } catch (err) {
    return 0;
  }
}

async function enrichWithFollowers(artist) {
  if (!artist || artist.followers > 0) return artist;
  const followers = await fetchDeezerFollowers(artist.name);
  return followers > 0 ? { ...artist, followers } : artist;
}

async function fetchWikipediaBio(name) {
  try {
    const { data } = await axios.get(
      `${WIKIPEDIA_SUMMARY_URL}/${encodeURIComponent(name)}`,
      { headers: wikipediaHeaders },
    );
    if (data.type === "disambiguation") return null;
    return {
      bio: data.extract ?? null,
      thumbnail: data.thumbnail?.source ?? null,
      wikipediaUrl: data.content_urls?.desktop?.page ?? null,
    };
  } catch (err) {
    // No matching Wikipedia page (404) or other lookup failure — bio is
    // optional, so the artist profile should still return without it.
    return null;
  }
}

// Spotify no longer exposes any "trending/top artists" endpoint for new apps
// (Featured/Category Playlists and Related Artists were deprecated Nov 2024),
// so there's no way to ask Spotify for "popular artists" directly. This is a
// curated seed list — a mix of Indian and international names matching
// TuneRaaga's audience — that gets looked up and ranked by follower count.
const POPULAR_ARTIST_SEEDS = [
  "Arijit Singh",
  "Shreya Ghoshal",
  "A.R. Rahman",
  "Neha Kakkar",
  "Diljit Dosanjh",
  "Badshah",
  "Armaan Malik",
  "Jubin Nautiyal",
  "Atif Aslam",
  "Sonu Nigam",
  "Taylor Swift",
  "Ed Sheeran",
  "The Weeknd",
  "Drake",
  "Ariana Grande",
  "Justin Bieber",
  "Coldplay",
  "Dua Lipa",
  "Bruno Mars",
  "Rihanna",
];

let popularArtistsCache = null;
let popularArtistsCacheExpiresAt = 0;
const POPULAR_ARTISTS_CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

// GET /api/external-artist/popular
// Returns the seed list's Spotify profiles, deduped and sorted by follower
// count — cached in memory for an hour since the underlying data barely
// changes and this fans out ~20 requests to Spotify per uncached call.
exports.getPopularArtists = async (req, res) => {
  try {
    if (popularArtistsCache && Date.now() < popularArtistsCacheExpiresAt) {
      return res.status(200).json({ success: true, artists: popularArtistsCache });
    }

    const results = await Promise.all(
      POPULAR_ARTIST_SEEDS.map((name) =>
        fetchSpotifyArtist(name).catch(() => null),
      ),
    );

    const seen = new Set();
    const deduped = results.filter(Boolean).filter((artist) => {
      const key = artist.id;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    const artists = (await Promise.all(deduped.map(enrichWithFollowers))).sort(
      (a, b) => (b.followers || 0) - (a.followers || 0),
    );

    popularArtistsCache = artists;
    popularArtistsCacheExpiresAt = Date.now() + POPULAR_ARTISTS_CACHE_TTL_MS;

    res.status(200).json({ success: true, artists });
  } catch (err) {
    console.error("Get Popular Artists Error:", err.message);
    res.status(500).json({
      error: "Failed to fetch popular artists.",
      details: err.message,
    });
  }
};

// GET /api/external-artist/search?q=<query>&limit=10
// Lets the user search for ANY artist, not just the curated popular list.
// Each result is paired with its Wikipedia bio (same as the single-artist
// endpoint below) so the search results already carry a bio, not just the
// Spotify metadata.
exports.searchArtists = async (req, res) => {
  try {
    const query = (req.query.q || "").trim();
    if (!query) {
      return res.status(400).json({ error: "A search query (q) is required." });
    }
    // This app's Spotify access tier rejects search limit > 10 with a 400
    // ("Invalid limit"), even though Spotify's docs say up to 50 is allowed.
    const limit = Math.min(Number(req.query.limit ?? 10), 10);

    const { data: searchData } = await spotifyApi.get("/search", {
      params: { q: query, type: "artist", limit },
    });

    const spotifyArtists = (searchData.artists?.items ?? []).map(
      mapSpotifyArtistItem,
    );

    const artists = await Promise.all(
      spotifyArtists.map(async (artist) => {
        const [wikipedia, enriched] = await Promise.all([
          fetchWikipediaBio(artist.name),
          enrichWithFollowers(artist),
        ]);
        return {
          ...enriched,
          bio: wikipedia?.bio ?? null,
          wikipediaUrl: wikipedia?.wikipediaUrl ?? null,
          thumbnail: wikipedia?.thumbnail ?? null,
        };
      }),
    );

    res.status(200).json({ success: true, artists });
  } catch (err) {
    console.error("Search Artists Error:", err.message);
    res.status(500).json({
      error: "Failed to search artists.",
      details: err.message,
    });
  }
};

// GET /api/external-artist/:name
// Combines Spotify's artist profile (followers, popularity, genres, image)
// with a Wikipedia summary for the bio text, since Spotify's public API no
// longer exposes artist bios.
exports.getArtistProfile = async (req, res) => {
  try {
    const { name } = req.params;
    if (!name) {
      return res.status(400).json({ error: "Artist name is required." });
    }

    const [spotifyArtist, wikipedia] = await Promise.all([
      fetchSpotifyArtist(name),
      fetchWikipediaBio(name),
    ]);

    if (!spotifyArtist) {
      return res.status(404).json({ error: "Artist not found on Spotify." });
    }

    const enriched = await enrichWithFollowers(spotifyArtist);

    res.status(200).json({
      success: true,
      artist: {
        ...enriched,
        bio: wikipedia?.bio ?? null,
        wikipediaUrl: wikipedia?.wikipediaUrl ?? null,
        thumbnail: wikipedia?.thumbnail ?? null,
      },
    });
  } catch (err) {
    console.error("Get External Artist Profile Error:", err.message);
    res.status(500).json({
      error: "Failed to fetch artist profile.",
      details: err.message,
    });
  }
};

// GET /api/external-artist/:name/playlists
// Spotify deprecated the Featured/Category Playlists endpoints for new apps
// (Nov 2024), so there's no "popular playlists" endpoint anymore — this
// searches public playlists matching the artist name instead.
exports.searchArtistPlaylists = async (req, res) => {
  try {
    const { name } = req.params;
    // Same limit>10 restriction as the artist search endpoint above.
    const limit = Math.min(Number(req.query.limit ?? 10), 10);

    const { data } = await spotifyApi.get("/search", {
      params: { q: name, type: "playlist", limit },
    });

    const playlists = (data.playlists?.items ?? [])
      .filter(Boolean)
      .map((playlist) => ({
        id: playlist.id,
        name: playlist.name,
        description: playlist.description,
        image: playlist.images?.[0]?.url ?? null,
        owner: playlist.owner?.display_name ?? null,
        tracksTotal: playlist.tracks?.total ?? 0,
        spotifyUrl: playlist.external_urls?.spotify ?? null,
      }));

    res.status(200).json({ success: true, playlists });
  } catch (err) {
    console.error("Search Artist Playlists Error:", err.message);
    res.status(500).json({
      error: "Failed to fetch playlists.",
      details: err.message,
    });
  }
};
