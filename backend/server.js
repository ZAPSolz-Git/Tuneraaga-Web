require("dotenv").config({ path: "./.env" });
const express = require("express");
const cors = require("cors");
const { supabase } = require("./config/supabaseClient");
const artistRoutes = require("./routes/artistRoutes");

const app = express();
const port = process.env.PORT || 5000;

// --- Middleware ---
app.use(cors());
app.use(express.json({ limit: "50mb" }));

// --- Health Check ---
app.get("/", (req, res) => {
  res.send("Server Running! 🚀");
});

// --- Route Mounting ---
// Any request coming to /api/artists will be handled by artistRoutes
app.use("/api/artists", artistRoutes);



// --- Start Server ---
app.listen(port, () => {
  console.log(`✅ Server is running: http://localhost:${port}`);
});