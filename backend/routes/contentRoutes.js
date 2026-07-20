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
} = require("../controllers/contentController");

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

// Delete operations — Admin only
router.delete("/releases/:id", authenticateUser, requireAdmin, deleteRelease);
router.delete("/podcasts/:id", authenticateUser, requireAdmin, deletePodcast);
router.delete("/radio/:id", authenticateUser, requireAdmin, deleteRadioStation);

// Update operations — Admin only
router.put("/radio/:id", authenticateUser, requireAdmin, updateRadioStation);

module.exports = router;
