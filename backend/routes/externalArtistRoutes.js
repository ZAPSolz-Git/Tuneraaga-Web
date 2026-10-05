const express = require("express");
const {
  getArtistProfile,
  searchArtistPlaylists,
  getPopularArtists,
  searchArtists,
} = require("../controllers/externalArtistController");

const {
  authenticateUser,
  requireAdmin,
} = require("../middleware/authMiddleware");
const {
  listVerified,
  addVerified,
  removeVerified,
} = require("../controllers/verifiedApiArtistController");

const router = express.Router();

// GET /api/external-artist/popular          -> curated list of popular Spotify artists
// GET /api/external-artist/search?q=...     -> search any artist, each with its Wikipedia bio
// GET /api/external-artist/:name            -> Spotify profile + Wikipedia bio
// GET /api/external-artist/:name/playlists  -> playlists matching the artist name
//
// /popular and /search must stay above /:name — otherwise Express would
// treat them as an artist name and these routes would never be reached.
router.get("/popular", getPopularArtists);
router.get("/search", searchArtists);
// Admin-approved blue ticks for API artists (must stay above /:name)
router.get("/verified", listVerified);
router.post("/verified", authenticateUser, requireAdmin, addVerified);
router.delete("/verified/:spotifyId", authenticateUser, requireAdmin, removeVerified);
router.get("/:name", getArtistProfile);
router.get("/:name/playlists", searchArtistPlaylists);

module.exports = router;
