require("dotenv").config({ path: "./.env" });
const express = require("express");
const cors = require("cors");
const { supabase } = require("./config/supabaseClient");
const artistRoutes = require("./routes/artistRoutes");
const authRoutes = require("./routes/authRoutes");
const orderRoutes = require("./routes/orderRoutes");

const app = express();
const port = process.env.PORT || 5000;

// --- Middleware (yeh HAMESHA routes se pehle hona chahiye) ---
app.use(cors());

// ⚠️ IMPORTANT: Razorpay webhook ko RAW body chahiye signature verify karne ke liye.
// Isliye webhook route ko express.json() se PEHLE, raw parser ke sath mount karo.
app.use("/api/webhook/razorpay", express.raw({ type: "application/json" }));

// Baaki saari routes ke liye normal JSON parser
app.use(express.json({ limit: "50mb" }));

// --- Health Check ---
app.get("/", (req, res) => {
  res.send("Server Running! 🚀");
});

// --- Route Mounting ---
// Any request coming to /api/artists will be handled by artistRoutes
app.use("/api/artists", artistRoutes);

// Auth routes
app.use("/api/auth", authRoutes);

// Order / Pro-plan payment routes (create order, generate QR, status, webhook)
app.use("/api", orderRoutes);

// --- Start Server ---
app.listen(port, () => {
  console.log(`✅ Server is running: http://localhost:${port}`);
});
