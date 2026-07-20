const express = require("express");
const router = express.Router();
const upload = require("../middleware/uploadMiddleware");
const {
  authenticateUser,
  requireAdmin,
} = require("../middleware/authMiddleware");
const {
  getAllArtists,
  createArtist,
  updateArtist,
  deleteArtist,
} = require("../controllers/artistController");

// Public — For users to view artists
router.get("/", getAllArtists);

// ✅ SECURED — Only admins can create a new artist
router.post(
  "/",
  authenticateUser,
  requireAdmin,
  upload.single("image"),
  createArtist,
);

// ✅ SECURED — Only admins can edit
router.put(
  "/:id",
  authenticateUser,
  requireAdmin,
  upload.single("image"),
  updateArtist,
);

// ✅ SECURED — Only admins can delete
router.delete("/:id", authenticateUser, requireAdmin, deleteArtist);

module.exports = router;
