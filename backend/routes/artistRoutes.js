const express = require("express");
const router = express.Router();
const upload = require("../middleware/uploadMiddleware");
const authenticateUser = require("../middleware/authMiddleware"); // Middleware import kiya
const {
  getAllArtists,
  createArtist,
  updateArtist,
  deleteArtist,
} = require("../controllers/artistController");

// 1. GET ALL ARTISTS (Public - Login ki zarurat nahi)
router.get("/", getAllArtists);

// 2. CREATE ARTIST (Public/Signup - Login ki zarurat nahi, naya account banane ke liye)
router.post("/", upload.single("image"), createArtist);

// 3. UPDATE ARTIST (PROTECTED - Sirf khud ka account update kar sakta hai)
router.put("/:id", authenticateUser, upload.single("image"), updateArtist);

// 4. DELETE ARTIST (PROTECTED - Sirf khud ka account delete kar sakta hai)
router.delete("/:id", authenticateUser, deleteArtist);

module.exports = router;