const multer = require("multer");

// Store images in memory (buffer) so we can upload them to Supabase Storage manually
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB limit
});

module.exports = upload;