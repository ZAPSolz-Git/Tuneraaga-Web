const express = require("express");
const router = express.Router();
const upload = require("../middleware/uploadMiddleware");
const authenticateUser = require("../middleware/authMiddleware");
const {
  getAllArtists,
  createArtist,
  updateArtist,
  deleteArtist,
} = require("../controllers/artistController");

// 1. GET ALL ARTISTS (Public)
router.get("/", getAllArtists);

// 2. CREATE ARTIST (Public)
router.post("/", upload.single("image"), createArtist);

// 3. UPDATE ARTIST - authenticateUser hataya (Admin panel use karta hai)
router.put("/:id", upload.single("image"), updateArtist);

// 4. DELETE ARTIST - authenticateUser hataya (Admin panel use karta hai)
router.delete("/:id", deleteArtist);

module.exports = router;
