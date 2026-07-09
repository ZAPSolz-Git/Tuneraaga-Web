const express = require("express");
const router = express.Router();
const {
  authenticateUser,
  requireAdmin,
} = require("../middleware/authMiddleware");
const {
  deleteRelease,
  deletePodcast,
  deleteRadioStation,
  updateRadioStation,
} = require("../controllers/contentController");

// Delete operations — Admin only
router.delete("/releases/:id", authenticateUser, requireAdmin, deleteRelease);
router.delete("/podcasts/:id", authenticateUser, requireAdmin, deletePodcast);
router.delete("/radio/:id", authenticateUser, requireAdmin, deleteRadioStation);

// Update operations — Admin only
router.put("/radio/:id", authenticateUser, requireAdmin, updateRadioStation);

module.exports = router;
