const express = require("express");
const router = express.Router();
const {
  authenticateUser,
  requireAdmin,
} = require("../middleware/authMiddleware");
const upload = require("../middleware/uploadMiddleware");

// Import base controllers safely
const contentController = require("../controllers/contentController");
const {
  deleteRelease,
  deletePodcast,
  deleteRadioStation,
  updateRadioStation,
  createRelease,
  uploadAsset,
} = contentController;

// ✅ FIX: Safely fallback for publishAlbumTracks
const publishAlbumTracks =
  contentController.publishAlbumTracks ||
  ((req, res) =>
    res.status(501).json({ error: "publishAlbumTracks not implemented yet" }));

// Import list controller
const {
  getListItems,
  addListItem,
  deleteListItem,
} = require("../controllers/listController");

// ✅ NEW: Import chart controller
const {
  createChart,
  updateChart,
  deleteChart,
} = require("../controllers/chartController");

// ✅ NEW: Import playlist controller
const {
  createPlaylist,
  updatePlaylist,
  deletePlaylist,
} = require("../controllers/playlistController");

// ────────────────────────────────────────────
// DEBUG: confirm the routes are registered
// ────────────────────────────────────────────
console.log("✅ contentRoutes.js loaded — registering all routes:");

// ──── Upload operations — Admin only ────
router.post(
  "/upload",
  authenticateUser,
  requireAdmin,
  upload.single("file"),
  uploadAsset,
);
console.log("   POST /upload            →  uploadAsset");

// ──── Releases ────
router.post("/releases", authenticateUser, requireAdmin, createRelease);
router.put(
  "/releases/publish",
  authenticateUser,
  requireAdmin,
  publishAlbumTracks,
);
router.delete(
  "/releases/:id",
  authenticateUser,
  requireAdmin,
  deleteRelease,
);
console.log("   POST /releases          →  createRelease");
console.log("   PUT  /releases/publish  →  publishAlbumTracks");
console.log("   DEL  /releases/:id      →  deleteRelease");

// ──── Podcasts ────
router.delete(
  "/podcasts/:id",
  authenticateUser,
  requireAdmin,
  deletePodcast,
);
console.log("   DEL  /podcasts/:id      →  deletePodcast");

// ──── Radio ────
router.put("/radio/:id", authenticateUser, requireAdmin, updateRadioStation);
router.delete(
  "/radio/:id",
  authenticateUser,
  requireAdmin,
  deleteRadioStation,
);
console.log("   PUT  /radio/:id         →  updateRadioStation");
console.log("   DEL  /radio/:id         →  deleteRadioStation");

// ──── Admin "list" pages (latest_releases, top10_india, trending_songs) ────
router.get(
  "/lists/:listName",
  authenticateUser,
  requireAdmin,
  getListItems,
);
router.post(
  "/lists/:listName",
  authenticateUser,
  requireAdmin,
  addListItem,
);
router.delete(
  "/lists/:listName/:id",
  authenticateUser,
  requireAdmin,
  deleteListItem,
);
console.log("   GET  /lists/:listName   →  getListItems");
console.log("   POST /lists/:listName   →  addListItem");
console.log("   DEL  /lists/:listName/:id → deleteListItem");

// ──── Charts CRUD ────
router.post("/charts", authenticateUser, requireAdmin, createChart);
router.put("/charts/:id", authenticateUser, requireAdmin, updateChart);
router.delete("/charts/:id", authenticateUser, requireAdmin, deleteChart);
console.log("   POST /charts            →  createChart");
console.log("   PUT  /charts/:id        →  updateChart");
console.log("   DEL  /charts/:id        →  deleteChart");

// ──── Playlists CRUD ────
router.post("/playlists", authenticateUser, requireAdmin, createPlaylist);
router.put("/playlists/:id", authenticateUser, requireAdmin, updatePlaylist);
router.delete(
  "/playlists/:id",
  authenticateUser,
  requireAdmin,
  deletePlaylist,
);
console.log("   POST /playlists         →  createPlaylist");
console.log("   PUT  /playlists/:id     →  updatePlaylist");
console.log("   DEL  /playlists/:id     →  deletePlaylist");

module.exports = router;