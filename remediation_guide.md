# Tuneraaga Developer Remediation Guide

This guide lists the remaining steps, exact files, and locations to fully secure and fix the Tuneraaga application.

---

## 1. Secure Client-Side Database Writes & File Uploads

### Task A: Add Server-Side Endpoints
* **Target File:** [contentRoutes.js](file:///c:/Users/Admin/Documents/GitHub/Tuneraaga-Web/backend/routes/contentRoutes.js)
* **Location:** Around line 20 (after `router.put("/radio/:id")`)
* **What to do:** Import `upload` middleware and add new POST routes.
  ```javascript
  const upload = require("../middleware/uploadMiddleware");
  // ...
  router.post("/releases", authenticateUser, requireAdmin, createRelease);
  router.post("/upload", authenticateUser, requireAdmin, upload.single("file"), uploadAsset);
  ```

---

### Task B: Implement Backend Upload & Save Logic
* **Target File:** `backend/controllers/contentController.js`
* **Location:** At the bottom of the file (after Line 108)
* **What to do:** Paste these functions to handle uploading files to Supabase and saving release metadata.
  ```javascript
  const { supabaseAdmin, bucket } = require("../config/supabaseClient");

  exports.uploadAsset = async (req, res) => {
    try {
      if (!req.file) return res.status(400).json({ error: "No file uploaded." });
      const fileName = `${Date.now()}_${req.file.originalname}`;
      const { error } = await supabaseAdmin.storage.from(bucket).upload(fileName, req.file.buffer, {
        contentType: req.file.mimetype,
      });
      if (error) throw error;
      const { data } = supabaseAdmin.storage.from(bucket).getPublicUrl(fileName);
      res.status(200).json({ success: true, url: data.publicUrl });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  };

  exports.createRelease = async (req, res) => {
    try {
      const { data, error } = await supabaseAdmin.from("releases").insert([req.body]).select();
      if (error) throw error;
      res.status(201).json({ success: true, data });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  };
  ```

---

### Task C: Redirect Frontend Dashboard Calls
* **Target File:** [AdminNewRelease.jsx](file:///c:/Users/Admin/Documents/GitHub/Tuneraaga-Web/frontend/src/admin/AdminNewRelease.jsx)
* **Location:** Around line 111 (for file upload) and line 480 (for metadata save)
* **What to do:** Re-route local Supabase calls to fetch backend queries.
  * **Replace file uploads (`.storage.upload(...)`)** with an HTTP `POST` to `/api/content/upload`.
  * **Replace DB write (`supabase.from("releases").insert(...)`)** with:
    ```javascript
    await apiCall("/content/releases", { method: "POST", body: JSON.stringify(payload) });
    ```

---

## 2. Sync Roles & Implement Webhooks

### Task A: Buffer Raw JSON Payloads
* **Target File:** [server.js](file:///c:/Users/Admin/Documents/GitHub/Tuneraaga-Web/backend/server.js)
* **Location:** Around line 20
* **What to do:** Modify the global parser middleware so it preserves raw body buffers under `req.rawBody`:
  ```javascript
  app.use(express.json({
    limit: "50mb",
    verify: (req, res, buf) => { req.rawBody = buf; }
  }));
  ```

---

### Task B: Update Roles in Database on Payments
* **Target File:** [orderController.js](file:///c:/Users/Admin/Documents/GitHub/Tuneraaga-Web/backend/controllers/orderController.js)
* **Location:** Around Line 280 (inside `verifyPayment`)
* **What to do:** Execute the role update in the database users profile:
  ```javascript
  await supabaseAdmin.from("users").update({ role: "premium" }).eq("id", order.user_id);
  ```

---

### Task C: Create Razorpay Webhook Handler
* **Target File:** [orderController.js](file:///c:/Users/Admin/Documents/GitHub/Tuneraaga-Web/backend/controllers/orderController.js)
* **Location:** At the bottom of the file
* **What to do:** Append signature verification and order capture logic:
  ```javascript
  exports.handleRazorpayWebhook = async (req, res) => {
    try {
      const signature = req.headers["x-razorpay-signature"];
      const expected = crypto.createHmac("sha256", process.env.RAZORPAY_WEBHOOK_SECRET).update(req.rawBody).digest("hex");
      if (signature !== expected) return res.status(400).send("Signature mismatch");
      
      if (req.body.event === "payment.captured") {
        const pay = req.body.payload.payment.entity;
        const { data: ord } = await supabaseAdmin.from("orders").select("*").eq("razorpay_order_id", pay.order_id).single();
        if (ord && ord.status !== "paid") {
          await supabaseAdmin.from("orders").update({ status: "paid", razorpay_payment_id: pay.id, paid_at: new Date().toISOString() }).eq("id", ord.id);
          await supabaseAdmin.from("users").update({ role: "premium" }).eq("id", ord.user_id);
        }
      }
      res.status(200).json({ received: true });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  };
  ```

---

### Task D: Add Webhook Route
* **Target File:** [orderRoutes.js](file:///c:/Users/Admin/Documents/GitHub/Tuneraaga-Web/backend/routes/orderRoutes.js)
* **Location:** Around line 17
* **What to do:** Register the webhook handler in order routes:
  ```javascript
  router.post("/webhooks/razorpay", handleRazorpayWebhook);
  ```

---

## 3. Repository Layout Hygiene

### Task A: Standardize Router Imports
* **Target File:** [App.jsx](file:///c:/Users/Admin/Documents/GitHub/Tuneraaga-Web/frontend/src/App.jsx)
* **Location:** Lines 58 & 59
* **What to do:** Update layout imports to reference clean directories:
  ```javascript
  import ArtistLayout from "./artist/ArtistLayout";
  import AdminLayout from "./admin/AdminLayout";
  ```

---

### Task B: Reorganize Files
* **What to do:** In your file explorer or terminal:
  1. Rename `frontend/src/admin/AdminLayout1.jsx` $\rightarrow$ `AdminLayout.jsx`.
  2. Delete `frontend/src/artist/ArtistLayout.jsx` (legacy duplicate).
  3. Rename `frontend/src/artist/ArtistLayout1.jsx` $\rightarrow$ `ArtistLayout.jsx`.
  4. Delete `frontend/src/artist/ArtistDashboard1.jsx` (legacy duplicate).
