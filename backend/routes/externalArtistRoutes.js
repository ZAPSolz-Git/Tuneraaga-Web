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


router.get("/popular", getPopularArtists);
router.get("/search", searchArtists);
// Admin-approved blue ticks for API artists (must stay above /:name)
router.get("/verified", listVerified);
router.post("/verified", authenticateUser, requireAdmin, addVerified);
router.delete("/verified/:spotifyId", authenticateUser, requireAdmin, removeVerified);
router.get("/:name", getArtistProfile);
router.get("/:name/playlists", searchArtistPlaylists);

module.exports = router;
