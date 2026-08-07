const express = require("express");
const { syncJamendoTracks } = require("../controllers/jamendoController");

const router = express.Router();

// POST /api/jamendo/sync?limit=500&tags=pop,rock
// Protected the same way as internalReleases.js — shared secret header,
// since this is a backend sync job, not a user-facing endpoint.
router.post("/sync", (req, res, next) => {
  if (req.headers["x-internal-secret"] !== process.env.STREAMING_INTERNAL_SECRET) {
    return res.status(403).json({ error: "Forbidden" });
  }
  next();
}, syncJamendoTracks);

module.exports = router;