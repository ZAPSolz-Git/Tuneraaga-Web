require("dotenv").config({ path: "./.env" });
const express = require("express");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const helmet = require("helmet");

const { supabase } = require("./config/supabaseClient");
const artistRoutes = require("./routes/artistRoutes");
const authRoutes = require("./routes/authRoutes");
const orderRoutes = require("./routes/orderRoutes");

const contentRoutes = require("./routes/contentRoutes");

const app = express();
const port = process.env.PORT || 5000;

// --- Middleware ---
app.use(cors());
app.use(express.json({ limit: "50mb" }));
app.use(helmet());
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
  }),
);

// --- Health Check ---
app.get("/", (req, res) => {
  res.send("Server Running! 🚀");
});

// Content Routes
app.use("/api/content", contentRoutes);

// --- Route Mounting ---
app.use("/api/artists", artistRoutes);
app.use("/api/auth", authRoutes);
app.use("/api", orderRoutes);

// --- Start Server ---
app.listen(port, () => {
  console.log(`✅ Server is running: http://localhost:${port}`);
});
