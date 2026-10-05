const express = require("express");
const router = express.Router();
const {
  authenticateUser,
  requireAdmin,
} = require("../middleware/authMiddleware");
const {
  getIncomingSongs,
  syncIncomingSongs,
} = require("../controllers/IncomingSongsController");

router.get("/", authenticateUser, requireAdmin, getIncomingSongs);
router.post("/sync", authenticateUser, requireAdmin, syncIncomingSongs);

module.exports = router;
