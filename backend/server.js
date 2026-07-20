require("dotenv").config({ path: "./.env" });
const express = require("express");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const helmet = require("helmet");

const { supabase, supabaseAdmin } = require("./config/supabaseClient");
const artistRoutes = require("./routes/artistRoutes");
const authRoutes = require("./routes/authRoutes");
const orderRoutes = require("./routes/orderRoutes");
const contentRoutes = require("./routes/contentRoutes");
const { authenticateUser } = require("./middleware/authMiddleware");
const upload = require("./middleware/uploadMiddleware");
const { createArtistRequest } = require("./controllers/artistController");

const app = express();
const port = process.env.PORT || 5000;

// --- Middleware ---
app.use(cors());
app.use(
  express.json({
    limit: "50mb",
    verify: (req, res, buf, encoding) => {
      if (buf && buf.length) {
        req.rawBody = buf.toString(encoding || "utf8");
      }
    },
  }),
);
app.use(helmet());
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
  }),
);

// 🔍 TEMP DEBUG LOGGER — remove once confirmed working
app.use((req, res, next) => {
  console.log(`➡️  ${req.method} ${req.originalUrl}`);
  next();
});

// --- Health Check ---
app.get("/", (req, res) => {
  res.send("Server Running! 🚀");
});

// Content Routes
app.use("/api/content", contentRoutes);

// ✅ SAFETY-NET ROUTE — defined directly here so it registers
// no matter what is happening inside artistRoutes.js.
// If THIS works but the one inside artistRoutes.js doesn't,
// we've proven the bug is inside that file / how it's required.
app.post(
  "/api/artists/request",
  authenticateUser,
  upload.single("image"),
  createArtistRequest,
);

// --- Route Mounting ---
app.use("/api/artists", artistRoutes);
app.use("/api/auth", authRoutes);
app.use("/api", orderRoutes);

// 🔍 TEMP: catch-all 404 logger — returns JSON instead of HTML
app.use((req, res) => {
  console.log(`❌ No route matched: ${req.method} ${req.originalUrl}`);
  res
    .status(404)
    .json({ error: `Route not found: ${req.method} ${req.originalUrl}` });
});

// --- Start Server ---
app.listen(port, () => {
  console.log(`✅ Server is running: http://localhost:${port}`);
});
