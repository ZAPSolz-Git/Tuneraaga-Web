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
// ✅ Explicit CORS config to allow Authorization header + credentials
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://localhost:3000",
      "http://localhost:5174",
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

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

// 🔍 DEBUG LOGGER
app.use((req, res, next) => {
  console.log(`➡️  ${req.method} ${req.originalUrl}`);
  next();
});

// --- Health Check ---
app.get("/", (req, res) => {
  res.send("Server Running! 🚀");
});

// ✅ DEBUG: Test auth endpoint — hit this to check if token works
app.get("/api/debug/auth", authenticateUser, (req, res) => {
  res.json({
    success: true,
    user: {
      id: req.user.id,
      email: req.user.email,
      role: req.user.role,
      app_metadata: req.user.app_metadata,
    },
  });
});

// Content Routes
app.use("/api/content", contentRoutes);

// Safety-net artist request route
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

// 🔍 404 catch-all
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
