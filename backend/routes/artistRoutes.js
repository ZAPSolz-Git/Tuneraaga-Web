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

// Public — Users ko artists dikhane ke liye
router.get("/", getAllArtists);

// ✅ SECURED — Sirf admin naya artist bana sakta hai
router.post(
  "/",
  authenticateUser,
  requireAdmin,
  upload.single("image"),
  createArtist,
);

// ✅ SECURED — Sirf admin edit kar sakta hai
router.put(
  "/:id",
  authenticateUser,
  requireAdmin,
  upload.single("image"),
  updateArtist,
);

// ✅ SECURED — Sirf admin delete kar sakta hai
router.delete("/:id", authenticateUser, requireAdmin, deleteArtist);

module.exports = router;
