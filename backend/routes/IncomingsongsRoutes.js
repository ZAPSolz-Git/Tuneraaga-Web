const express = require("express");
const router = express.Router();
const {
  getIncomingSongs,
  syncIncomingSongs,
} = require("../controllers/incomingSongsController");

router.get("/", getIncomingSongs);
router.post("/sync", syncIncomingSongs);

module.exports = router;