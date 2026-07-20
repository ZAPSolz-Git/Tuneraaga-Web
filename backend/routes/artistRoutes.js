const express = require("express");
const router = express.Router();
const upload = require("../middleware/uploadMiddleware");
const {
  authenticateUser,
  requireAdmin,
} = require("../middleware/authMiddleware");
const {
  getAllArtists,
  getMyArtistStatus,
  createArtist,
  createArtistRequest,
  approveArtistRequest,
  rejectArtistRequest,
  updateArtist,
  deleteArtist,
} = require("../controllers/artistController");

router.get("/", getAllArtists);

// ✅ Logged-in user checks their own artist request status
router.get("/me/status", authenticateUser, getMyArtistStatus);

router.post(
  "/request",
  authenticateUser,
  upload.single("image"),
  createArtistRequest,
);

router.put(
  "/:id/approve",
  authenticateUser,
  requireAdmin,
  approveArtistRequest,
);
router.put("/:id/reject", authenticateUser, requireAdmin, rejectArtistRequest);

router.post(
  "/",
  authenticateUser,
  requireAdmin,
  upload.single("image"),
  createArtist,
);
router.put(
  "/:id",
  authenticateUser,
  requireAdmin,
  upload.single("image"),
  updateArtist,
);
router.delete("/:id", authenticateUser, requireAdmin, deleteArtist);

module.exports = router;
