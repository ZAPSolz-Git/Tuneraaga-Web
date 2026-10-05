const express = require("express");
const router = express.Router();
const {
  authenticateUser,
  requireAdmin,
} = require("../middleware/authMiddleware");
const upload = require("../middleware/uploadMiddleware");

// ─────────────────────────────────────────────────────────────
// Base content controller (upload, releases, radio, podcasts)
// ─────────────────────────────────────────────────────────────
const contentController = require("../controllers/contentController");
const {
  deleteRelease,
  deletePodcast,
  deleteRadioStation,
  updateRadioStation,
  createRelease,
  uploadAsset,
} = contentController;

const publishAlbumTracks =
  contentController.publishAlbumTracks ||
  ((req, res) =>
    res.status(501).json({ error: "publishAlbumTracks not implemented yet" }));

// ─────────────────────────────────────────────────────────────
// Admin "list" pages (latest_releases, top10_india, trending_songs)
// ─────────────────────────────────────────────────────────────
const {
  getListItems,
  addListItem,
  deleteListItem,
} = require("../controllers/listController");

// ─────────────────────────────────────────────────────────────
// Chart controller — file MUST exist at:
//   backend/controllers/chartController.js
// (filename is case-sensitive on Linux servers)
// ─────────────────────────────────────────────────────────────
const {
  createChart,
  updateChart,
  deleteChart,
} = require("../controllers/chartController");

// ─────────────────────────────────────────────────────────────
// Playlist controller — file MUST exist at:
//   backend/controllers/playlistController.js
// (filename is case-sensitive on Linux servers)
// ─────────────────────────────────────────────────────────────
const {
  createPlaylist,
  updatePlaylist,
  deletePlaylist,
} = require("../controllers/playlistController");


// ──── Upload operations — Admin only ────
router.post(
  "/upload",
  authenticateUser,
  requireAdmin,
  upload.large.single("file"),
  uploadAsset,
);

// ──── Releases ────
router.post("/releases", authenticateUser, requireAdmin, createRelease);
router.put(
  "/releases/publish",
  authenticateUser,
  requireAdmin,
  publishAlbumTracks,
);
router.delete("/releases/:id", authenticateUser, requireAdmin, deleteRelease);

// ──── Albums management (album tracks only) ────
const albumController = require("../controllers/albumController");
router.get("/albums", authenticateUser, requireAdmin, albumController.getAlbums);
router.put("/albums", authenticateUser, requireAdmin, albumController.updateAlbum);
router.delete("/albums", authenticateUser, requireAdmin, albumController.deleteAlbum);
router.put(
  "/albums/tracks/:id",
  authenticateUser,
  requireAdmin,
  albumController.updateAlbumTrack,
);
router.delete(
  "/albums/tracks/:id",
  authenticateUser,
  requireAdmin,
  albumController.deleteAlbumTrack,
);

// ──── Podcasts ────
router.delete("/podcasts/:id", authenticateUser, requireAdmin, deletePodcast);

// ──── Radio ────
router.put("/radio/:id", authenticateUser, requireAdmin, updateRadioStation);
router.delete("/radio/:id", authenticateUser, requireAdmin, deleteRadioStation);

// ──── Admin "list" pages (latest_releases, top10_india, trending_songs) ────
router.get("/lists/:listName", authenticateUser, requireAdmin, getListItems);
router.post("/lists/:listName", authenticateUser, requireAdmin, addListItem);
router.delete(
  "/lists/:listName/:id",
  authenticateUser,
  requireAdmin,
  deleteListItem,
);

// ──── Charts CRUD ────
router.post("/charts", authenticateUser, requireAdmin, createChart);
router.put("/charts/:id", authenticateUser, requireAdmin, updateChart);
router.delete("/charts/:id", authenticateUser, requireAdmin, deleteChart);

// ──── Playlists CRUD ────
router.post("/playlists", authenticateUser, requireAdmin, createPlaylist);
router.put("/playlists/:id", authenticateUser, requireAdmin, updatePlaylist);
router.delete("/playlists/:id", authenticateUser, requireAdmin, deletePlaylist);

module.exports = router;
