const express = require("express");
const router = express.Router();
const {
  authenticateUser,
  requireAdmin,
} = require("../middleware/authMiddleware");
const upload = require("../middleware/uploadMiddleware");
const {
  deleteRelease,
  deletePodcast,
  deleteRadioStation,
  updateRadioStation,
  createRelease,
  uploadAsset,
  publishAlbumTracks, // ✅ NEW — from contentController.additions.js
} = require("../controllers/contentController");
const {
  getListItems,
  addListItem,
  deleteListItem,
} = require("../controllers/listController"); // ✅ NEW FILE

// Upload operations — Admin only
router.post(
  "/upload",
  authenticateUser,
  requireAdmin,
  upload.single("file"),
  uploadAsset,
);

// Create release — Admin only
router.post("/releases", authenticateUser, requireAdmin, createRelease);

// ✅ NEW — Publish an entire album's tracks in one call (SEC-01 fix for
// AlbumReleaseForm's handlePublish, which used to write to Supabase
// directly with the anon key).
router.put(
  "/releases/publish",
  authenticateUser,
  requireAdmin,
  publishAlbumTracks,
);

// Delete operations — Admin only
router.delete("/releases/:id", authenticateUser, requireAdmin, deleteRelease);
router.delete("/podcasts/:id", authenticateUser, requireAdmin, deletePodcast);
router.delete("/radio/:id", authenticateUser, requireAdmin, deleteRadioStation);

// Update operations — Admin only
router.put("/radio/:id", authenticateUser, requireAdmin, updateRadioStation);

// ✅ NEW — Admin "list" pages (LatestReleasesAdmin, and any of
// Top10IndiaAdmin / TrendingSongsAdmin that follow the same
// {id, release_id, releases} join-table shape). :listName must match a
// whitelisted table in listController.js — see ALLOWED_LISTS there.
router.get("/lists/:listName", authenticateUser, requireAdmin, getListItems);
router.post("/lists/:listName", authenticateUser, requireAdmin, addListItem);
router.delete(
  "/lists/:listName/:id",
  authenticateUser,
  requireAdmin,
  deleteListItem,
);

module.exports = router;
