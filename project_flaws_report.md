  # Production-Grade Verification & Code Audit Report: Tuneraaga Web

  This document outlines the security vulnerabilities, architectural flaws, database design omissions, and frontend/backend code quality issues identified in the **Tuneraaga-Web** codebase. 

  While the project contains rich aesthetics and works as a functional prototype, it contains several critical vulnerabilities and architectural flaws that must be resolved before it can be classified as a secure, production-grade software system.

  ---

  ## Table of Contents
  1. [Executive Summary](#1-executive-summary)
  2. [Critical Security Vulnerabilities (Severity: High/Critical)](#2-critical-security-vulnerabilities-severity-highcritical)
    - 2.1 [Unauthenticated Put and Delete Endpoints on Artists](#21-unauthenticated-put-and-delete-endpoints-on-artists)
    - 2.2 [Plaintext Password Storage in Artists Table](#22-plaintext-password-storage-in-artists-table)
    - 2.3 [Weak Hardcoded Default Passwords](#23-weak-hardcoded-default-passwords)
    - 2.4 [Security Risks of Direct Client-Side Writes via Anonymous Key](#24-security-risks-of-direct-client-side-writes-via-anonymous-key)
    - 2.5 [Lack of API Rate Limiting and Security Headers](#25-lack-of-api-rate-limiting-and-security-headers)
    - 2.6 [Direct Client-Side File Upload to Production Buckets](#26-direct-client-side-file-upload-to-production-buckets)
  3. [Architectural & Subscription Logic Flaws (Severity: Medium/High)](#3-architectural--subscription-logic-flaws-severity-mediumhigh)
    - 3.1 [Disconnected Billing/Subscription Flow](#31-disconnected-billingsubscription-flow)
    - 3.2 [Lack of Payment Webhooks (Payment Drift Vulnerability)](#32-lack-of-payment-webhooks-payment-drift-vulnerability)
    - 3.3 [Database Schema Mismatch & Dirty Failovers](#33-database-schema-mismatch--dirty-failovers)
    - 3.4 [Orphaned Auth User Leakage on Transaction Failures](#34-orphaned-auth-user-leakage-on-transaction-failures)
    - 3.5 [Synchronous Remote Fetching & Lack of Caching in PDF Generator](#35-synchronous-remote-fetching--lack-of-caching-in-pdf-generator)
  4. [Code Quality, Performance & Anti-patterns (Severity: Low/Medium)](#4-code-quality-performance--anti-patterns-severity-lowmedium)
    - 4.1 [Extreme Code Duplication of `fetchUserRole`](#41-extreme-code-duplication-of-fetchuserrole)
    - 4.2 [Repetitive Controller-Level Admin Validation](#42-repetitive-controller-level-admin-validation)
    - 4.3 [Mixing Languages (Hinglish and English) in API Responses](#43-mixing-languages-hinglish-and-english-in-api-responses)
    - 4.4 [Hardcoded Media/Asset URLs](#44-hardcoded-mediaasset-urls)
    - 4.5 [Dead Code and Commented Routes](#45-dead-code-and-commented-routes)
    - 4.6 [Duplicate Layout & Dashboard Files (Repository Hygiene)](#46-duplicate-layout--dashboard-files-repository-hygiene)
    - 4.7 [Async/Await Anti-Pattern inside Promise Constructor](#47-asyncawait-anti-pattern-inside-promise-constructor)
  5. [Refactoring & Remediation Guide](#5-refactoring--remediation-guide)
    - 5.1 [Remediation: Role-Based Authorization Middleware](#51-remediation-role-based-authorization-middleware)
    - 5.2 [Remediation: Shared React AuthContext for Role Caching](#52-remediation-shared-react-authcontext-for-role-caching)
    - 5.3 [Remediation: Secure Webhook Processing](#53-remediation-secure-webhook-processing)
    - 5.4 [Remediation: PDF Utility Optimization & Local Caching](#54-remediation-pdf-utility-optimization--local-caching)
    - 5.5 [Remediation: Decoupling Client-Side Writes to Secure Server Routes](#55-remediation-decoupling-client-side-writes-to-secure-server-routes)
  6. [OWASP Top 10 Risk Mapping Checklist](#6-owasp-top-10-risk-mapping-checklist)

  ---

  ## 1. Executive Summary

  A comprehensive audit of the Tuneraaga application shows a strong disparity between its modern aesthetic styling and its underlying security and business logic. The application employs React, Express, Supabase, and Razorpay, which is a standard tech stack. However, several critical vulnerabilities violate fundamental software engineering principles.

  *   **Security Vulnerabilities**: High threat level. Write and delete operations on artist details are completely public. Cleartext passwords of artists are recorded in public database tables. Anonymous client keys are trusted to execute database changes directly without backend validation.
  *   **Billing Integrity**: Flawed implementation. The system accepts payments, but fails to provision privileges to users. The lack of standard payment webhooks risks transaction loss if a customer closes the browser prematurely.
  *   **Code Quality**: High maintenance overhead. Vital functions like role fetching are duplicated across page layouts, causing unnecessary database queries. API error logging utilizes a mix of English and Hinglish, which is inappropriate for production logging.

  This report serves as an exhaustive guide to correct these shortcomings and elevate the Tuneraaga application to a secure, stable, and production-grade environment.

  ---

  ## 2. Critical Security Vulnerabilities (Severity: High/Critical)

  ### 2.1 Unauthenticated Put and Delete Endpoints on Artists
  *   **File Location**: `backend/routes/artistRoutes.js` (Lines 18–22)
  *   **Code Snippet**:
      ```javascript
      // 3. UPDATE ARTIST - authenticateUser hataya (Admin panel use karta hai)
      router.put("/:id", upload.single("image"), updateArtist);
      
      // 4. DELETE ARTIST - authenticateUser hataya (Admin panel use karta hai)
      router.delete("/:id", deleteArtist);
      ```
  *   **Description**: 
      The route file reveals that authentication middleware (`authenticateUser`) was intentionally removed. The comments state this was done because the "Admin panel uses it." 
  *   **Implication**: 
      Any external client or user can send HTTP `PUT` or `DELETE` requests to `/api/artists/:id` and modify or delete any artist's profile, bio, email, or credentials. This is a severe vulnerability that allows malicious actors to erase the entire artist roster. Removing authentication middleware because a route is accessed by an administrative dashboard is an anti-pattern; administrators must authenticate using secure tokens containing admin claims.

  ---

  ### 2.2 Plaintext Password Storage in Artists Table
  *   **File Location**: `backend/controllers/artistController.js` (Lines 95–121)
  *   **Code Snippet**:
      ```javascript
      const { data: artist, error: dbError } = await supabase
        .from("artists")
        .insert([
          {
            id: authUserId,
            name,
            ...
            password: finalPassword, // Plaintext!
            role: "artist",
          },
        ])
      ```
  *   **Description**: 
      When an artist is registered, the server creates the user inside Supabase Auth (where it is securely hashed), but then inserts the plaintext password directly into the `artists` table in the database.
  *   **Implication**: 
      Storing passwords in plaintext violates compliance guidelines (OWASP, GDPR, PCI-DSS). If the database is compromised or read-access is leaked via an SQL injection or a misconfigured RLS policy, all artist passwords will be exposed in cleartext. Database tables must never record password credentials. The application should rely solely on Supabase Auth's encrypted identities.

  ---

  ### 2.3 Weak Hardcoded Default Passwords
  *   **File Location**: `backend/controllers/artistController.js` (Lines 64–65)
  *   **Code Snippet**:
      ```javascript
      const finalPassword =
        password && password.trim() !== "" ? password : "DefaultPass123!";
      ```
  *   **Description**: 
      If an administrator registers an artist without providing a password, the system assigns a weak, hardcoded default password: `"DefaultPass123!"`.
  *   **Implication**: 
      Malicious actors can easily compromise newly registered artist accounts through automated credential stuffing attacks using this default password. System-generated accounts should use cryptographically secure random passwords sent via automated secure registration links, or force a password reset on first login.

  ---

  ### 2.4 Security Risks of Direct Client-Side Writes via Anonymous Key
  *   **File Location**: Multiple frontend admin views (e.g., `frontend/src/admin/AdminNewRelease.jsx`, `PodcastAdmin.jsx`, `RadioAdmin.jsx`)
  *   **Code Snippet**:
      ```javascript
      // AdminNewRelease.jsx (Line 478)
      const { error } = await supabase.from("releases").insert([payload]);
      
      // AdminNewRelease.jsx (Line 1125)
      const { error } = await supabase.from("releases").delete().eq("id", id);
      ```
  *   **Description**: 
      The client-side application uses the public anonymous Supabase client (`supabase.from("releases").insert(...)` and `.delete()`) to create and delete songs, upload podcast episodes, and modify radio stations directly.
  *   **Implication**: 
      For these client-side calls to succeed, the PostgreSQL database tables (`releases`, `podcasts`, `radio_stations`) must have Row-Level Security (RLS) policies configured to allow public write access. Any user who inspects the network traffic and extracts the public anonymous token (`VITE_SUPABASE_ANON_KEY`) can execute raw SQL commands to insert, update, or delete media content. All write operations must be handled by authenticated server endpoints, or secured with restrictive RLS policies that validate the user's JWT claims.

  ---

  ### 2.5 Lack of API Rate Limiting and Security Headers
  *   **File Location**: `backend/server.js`
  *   **Description**: 
      The server setup does not include security headers (such as `helmet`) or rate limiting middleware (such as `express-rate-limit`).
  *   **Implication**: 
      The application is vulnerable to Brute Force Attacks, Denial of Service (DoS) attacks, and security vulnerabilities like clickjacking or cross-site scripting (XSS). An open backend must restrict repeated hits to `/api/auth/login` and `/api/auth/signup` to prevent automated credential attacks.

  ---

  ### 2.6 Direct Client-Side File Upload to Production Buckets
  *   **File Location**: `frontend/src/admin/AdminNewRelease.jsx`, `PodcastAdmin.jsx`
  *   **Code Snippet**:
      ```javascript
      // AdminNewRelease.jsx (Line 108)
      const { data, error } = await supabase.storage
        .from("music-assets")
        .upload(filePath, file);
      ```
  *   **Description**:
      Administrative panels perform media asset uploads (such as MP3 audio files and JPEG album artwork) directly from the client interface using the anonymous Supabase client.
  *   **Implication**:
      To permit anonymous client uploads, the storage bucket policies must be configured with broad write access. A malicious user could exploit this to upload unrelated files, leading to storage exhaustion, increased cloud hosting costs, or the hosting of malicious payloads (such as viruses or malware) on the application's CDN domain.

  ---

  ## 3. Architectural & Subscription Logic Flaws (Severity: Medium/High)

  ### 3.1 Disconnected Billing/Subscription Flow
  *   **File Location**: `backend/controllers/orderController.js` (Lines 202–317)
  *   **Description**: 
      The server-side payment verification controller (`verifyPayment`) updates the order status to `paid` upon validation of the Razorpay cryptographic signature. However, it does not update the user's role to a paid role (such as `pro` or `premium`) in the `users` table, nor does it log any subscription range inside a dedicated subscriptions ledger.
  *   **Implication**: 
      This is a critical functional flaw. While the checkout flow collects payments, the user's profile is never updated to reflect their premium status. Additionally, there are no checks in the streaming interface (e.g. the audio player dashboard) to restrict access for non-paying users. The payment gate is purely visual, and premium features are not actually enforced.

  ---

  ### 3.2 Lack of Payment Webhooks (Payment Drift Vulnerability)
  *   **File Location**: `backend/controllers/orderController.js`
  *   **Description**: 
      The application relies entirely on the frontend application calling `/api/verify-payment` within the Razorpay client callback handler. There is no server-to-server webhook endpoint (`/api/webhooks/razorpay`) configured to listen to asynchronous payment events from Razorpay.
  *   **Implication**: 
      If a user completes a payment but closes their browser, loses network connectivity, or experiences a client-side crash before the frontend can dispatch the callback API request, the payment will be successfully processed by Razorpay, but the order status in the application's database will remain `pending` indefinitely. Production payment systems must implement webhooks to ensure eventual consistency.

  ---

  ### 3.3 Database Schema Mismatch & Dirty Failovers
  *   **File Location**: `backend/controllers/orderController.js` (Lines 245–283)
  *   **Code Snippet**:
      ```javascript
      let updateErr = null;
      const firstAttempt = await supabaseAdmin
        .from("orders")
        .update({
          status: "paid",
          razorpay_payment_id,
          paid_at: paidAt,
        })
        .eq("id", orderId);
        
      updateErr = firstAttempt.error;
      if (updateErr) {
        // paid_at column shayad exist nahi karta, retry without it
        const fallbackAttempt = await supabaseAdmin
          .from("orders")
          .update({
            status: "paid",
            razorpay_payment_id,
          })
          .eq("id", orderId);
        updateErr = fallbackAttempt.error;
      }
      ```
  *   **Description**: 
      The code attempts to update the order status with a `paid_at` timestamp. If it fails, it assumes the column does not exist in the database and retries the update without the timestamp.
  *   **Implication**: 
      This fallback mechanism masks database schema mismatches and configuration drift. In a production environment, database migrations must be synchronized across environments (Development, Staging, Production). If the `paid_at` column is missing, it should be resolved via a database migration rather than masking the error with runtime try-catch blocks.

  ---

  ### 3.4 Orphaned Auth User Leakage on Transaction Failures
  *   **File Location**: `backend/controllers/artistController.js` (Lines 95–129)
  *   **Code Snippet**:
      ```javascript
      const authUserId = authData.user.id;
      ...
      const { data: artist, error: dbError } = await supabase
        .from("artists")
        .insert([...])
        
      if (dbError) {
        console.error("DB Error:", dbError);
        await supabaseAdmin.auth.admin.deleteUser(authUserId);
        return res.status(500).json({ error: dbError.message });
      }
      ```
  *   **Description**: 
      When creating an artist, the controller first registers the user in Supabase Auth, and then inserts their details into the public `artists` table. If the database insert fails, the server makes an API call to delete the auth account.
  *   **Implication**: 
      This approach is prone to failures due to the lack of database transactions. If the subsequent `deleteUser` API call fails due to a network timeout or API error, the auth account will remain, resulting in an orphaned identity in Supabase Auth with no corresponding record in the `artists` table.

  ---

  ### 3.5 Synchronous Remote Fetching & Lack of Caching in PDF Generator
  *   **File Location**: `backend/utils/generateReceiptPDF.js` (Lines 6–16)
  *   **Code Snippet**:
      ```javascript
      async function fetchLogoBuffer() {
        try {
          const res = await fetch(LOGO_URL);
          if (!res.ok) return null;
          const arrayBuffer = await res.arrayBuffer();
          return Buffer.from(arrayBuffer);
        } catch (err) {
          ...
        }
      }
      ```
  *   **Description**:
      Every time a user requests an invoice download, the PDF generator executes an external HTTP network request to retrieve the branding logo image from a remote URL.
  *   **Implication**:
      This introduces a dependency on external network latency during HTTP requests. If the asset host experiences downtime or high latency, the invoice download process will block, potentially leading to server resource exhaustion. In a production-grade system, static assets like branding logos should be stored locally in the server's filesystem and read directly from disk.

  ---

  ## 4. Code Quality, Performance & Anti-patterns (Severity: Low/Medium)

  ### 4.1 Extreme Code Duplication of `fetchUserRole`
  *   **File Locations**: 
      - `frontend/src/components/AdminPanel.jsx` (Lines 71–89)
      - `frontend/src/components/ProtectedRoute.jsx` (Lines 20–35)
      - `frontend/src/pages/History.jsx` (Lines 112–129)
      - `frontend/src/pages/LikedSongs.jsx` (Lines 102–120)
  *   **Code Snippet** (Duplicated across all four files):
      ```javascript
      const fetchUserRole = async (userId) => {
        try {
          const { data, error } = await supabase
            .from("users")
            .select("role")
            .eq("id", userId)
            .single();
          if (!error && data) {
            setUserRole(data.role);
            localStorage.setItem("userRole", data.role);
          } else {
            setUserRole("user");
          }
        } catch (err) {
          setUserRole("user");
        }
      };
      ```
  *   **Description**: 
      The exact same function is declared inline in multiple components to retrieve and store the user's role.
  *   **Implication**: 
      This redundancy violates the DRY (Don't Repeat Yourself) principle. When a user navigates between the Dashboard, History, and Liked Songs pages, the application performs redundant queries to fetch the same role data. This information should be retrieved once and stored in a shared state (such as a Context Provider or state store).

  ---

  ### 4.2 Repetitive Controller-Level Admin Validation
  *   **File Location**: `backend/controllers/authController.js` (Lines 268–279, 315–326, 375–386, 433–441)
  *   **Code Snippet**:
      ```javascript
      // Repeated inside getAllUsers, updateUserRole, deleteUser, and getUserStats:
      const { data: adminUser, error: adminError } = await supabaseAdmin
        .from("users")
        .select("role")
        .eq("id", req.user.id)
        .single();
        
      if (adminError || !adminUser || adminUser.role !== "admin") {
        return res.status(403).json({
          success: false,
          message: "Admin access required.",
        });
      }
      ```
  *   **Description**: 
      The backend routes use the `authenticateUser` middleware to verify the user's identity, but leave the role validation to the controller level. As a result, every administrative endpoint queries the `users` table to check if the user is an admin.
  *   **Implication**: 
      This increases database load and introduces redundant code. Role-based access control should be handled by a dedicated middleware layer (e.g., `authorizeRole(["admin"])`) before the request reaches the controller.

  ---

  ### 4.3 Mixing Languages (Hinglish and English) in API Responses
  *   **File Locations**: Multiple backend controllers
  *   **Examples**:
      *   `authController.js`: `"Email aur password zaroori hain."`
      *   `authController.js`: `"Aapka email verify nahi hua hai. Signup ke baad bheja gaya confirmation email check karo."`
      *   `orderController.js`: `"userId logged-in user se match nahi karta."`
      *   `artistController.js`: `"Artist successfully delete ho gaya!"`
  *   **Description**: 
      The backend returns Hinglish (Hindi written in the Roman script) in its JSON error responses and success messages.
  *   **Implication**: 
      Returning Hinglish in API responses is not suitable for production APIs, as it limits frontend localization efforts. The backend should return standardized, language-agnostic error codes (e.g., `ERR_EMAIL_UNCONFIRMED`, `ERR_UNAUTHORIZED_OWNER`), and let the client handle translation and localization.

  ---

  ### 4.5 Dead Code and Commented Routes
  *   **File Location**: `frontend/src/App.jsx` (Line 87)
  *   **Code Snippet**:
      ```javascript
      // import OrderSummaryPay from "./pages/OrderSummaryPay";
      // ...
      {/* <Route path="/pro/pay/:orderId" element={<OrderSummaryPay />} /> */}
      ```
  *   **Description**: 
      The application contains commented-out routes and unused component files (like `OrderSummaryPay.jsx`) in the pages directory.
  *   **Implication**: 
      Dead code increases repository clutter and maintenance complexity. Unused components should be removed.

  ---

  ### 4.6 Duplicate Layout & Dashboard Files (Repository Hygiene)
  *   **File Location**: `frontend/src/admin/`, `frontend/src/artist/`
  *   **Description**: 
      The codebase contains duplicate files with numeric suffixes:
      *   `AdminLayout.jsx` (9.8 KB) vs. `AdminLayout1.jsx` (11.8 KB)
      *   `ArtistDashboard.jsx` (6.0 KB) vs. `ArtistDashboard1.jsx` (6.0 KB)
      *   `ArtistLayout.jsx` (5.4 KB) vs. `ArtistLayout1.jsx` (5.3 KB)
  *   **Implication**: 
      Keeping duplicate versions of layouts and dashboards in the repository indicates poor version control hygiene. Developers may inadvertently modify the wrong version of a layout, leading to inconsistencies and visual regression. Duplicate files should be cleaned up.

  ---

  ### 4.7 Async/Await Anti-Pattern inside Promise Constructor
  *   **File Location**: `backend/utils/generateReceiptPDF.js` (Lines 27–29)
  *   **Code Snippet**:
      ```javascript
      return new Promise(async (resolve, reject) => {
        try {
          const logoBuffer = await fetchLogoBuffer();
      ```
  *   **Description**:
      The PDF generator instantiates a new Promise using an `async` executor callback function (`new Promise(async (resolve, reject) => { ... })`).
  *   **Implication**:
      Using `async` within a Promise constructor is a common anti-pattern. If an error is thrown synchronously before the asynchronous operation begins, it may cause an unhandled promise rejection that crashes the server instead of being caught by the outer `.catch()` block.

  ---

  ## 5. Refactoring & Remediation Guide

  To address these vulnerabilities and transition the project to a production-grade system, the following modifications should be implemented:

  ### 5.1 Remediation: Role-Based Authorization Middleware
  To secure the endpoints and prevent unauthenticated access, implement a role-based access control middleware:

  ```javascript
  // backend/middleware/roleMiddleware.js
  const { supabaseAdmin } = require("../config/supabaseClient");

  const authorizeRole = (allowedRoles = []) => {
    return async (req, res, next) => {
      try {
        if (!req.user) {
          return res.status(401).json({
            success: false,
            code: "UNAUTHENTICATED",
            message: "Authentication required."
          });
        }

        // Fetch role from centralized db users table
        const { data: profile, error } = await supabaseAdmin
          .from("users")
          .select("role")
          .eq("id", req.user.id)
          .single();

        if (error || !profile || !allowedRoles.includes(profile.role)) {
          return res.status(403).json({
            success: false,
            code: "FORBIDDEN_ROLE",
            message: "You do not have permission to perform this action."
          });
        }

        req.user.role = profile.role; // Append role to request
        next();
      } catch (err) {
        return res.status(500).json({
          success: false,
          code: "INTERNAL_SERVER_ERROR",
          message: err.message
        });
      }
    };
  };

  module.exports = { authorizeRole };
  ```

  Mount this middleware to secure the routes:
  ```javascript
  // backend/routes/artistRoutes.js
  const { authenticateUser } = require("../middleware/authMiddleware");
  const { authorizeRole } = require("../middleware/roleMiddleware");

  // Secure update and delete endpoints
  router.put("/:id", authenticateUser, authorizeRole(["admin", "artist"]), upload.single("image"), updateArtist);
  router.delete("/:id", authenticateUser, authorizeRole(["admin"]), deleteArtist);
  ```

  ---

  ### 5.2 Remediation: Shared React AuthContext for Role Caching
  To eliminate the duplicated `fetchUserRole` queries on the frontend, wrap the application in a unified authentication state context:

  ```jsx
  // frontend/src/components/AuthContext.jsx
  import React, { createContext, useContext, useState, useEffect } from "react";
  import { supabase } from "../lib/supabaseClient";

  const AuthContext = createContext(null);

  export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [role, setRole] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
      // 1. Initial active session retrieval
      const initializeAuth = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          setUser(session.user);
          await refreshRole(session.user.id);
        }
        setLoading(false);
      };

      initializeAuth();

      // 2. Listen to state changes
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (session?.user) {
          setUser(session.user);
          await refreshRole(session.user.id);
        } else {
          setUser(null);
          setRole(null);
        }
        setLoading(false);
      });

      return () => subscription.unsubscribe();
    }, []);

    const refreshRole = async (userId) => {
      try {
        const { data, error } = await supabase
          .from("users")
          .select("role")
          .eq("id", userId)
          .single();
        if (!error && data) {
          setRole(data.role);
        } else {
          setRole("user");
        }
      } catch {
        setRole("user");
      }
    };

    return (
      <AuthContext.Provider value={{ user, role, loading, refreshRole }}>
        {children}
      </AuthContext.Provider>
    );
  };

  export const useAuth = () => useContext(AuthContext);
  ```

  Wrap `App.jsx` in the new `AuthProvider` to share the user context:
  ```jsx
  // frontend/src/main.jsx
  import { AuthProvider } from "./components/AuthContext";

  ReactDOM.createRoot(document.getElementById("root")).render(
    <React.StrictMode>
      <AuthProvider>
        <App />
      </AuthProvider>
    </React.StrictMode>
  );
  ```

  ---

  ### 5.3 Remediation: Secure Webhook Processing
  To prevent payments from failing when users close their browser before the client-side validation completes, implement a server-side webhook listener for Razorpay events:

  ```javascript
  // backend/routes/webhookRoutes.js
  const express = require("express");
  const router = express.Router();
  const crypto = require("crypto");
  const { supabaseAdmin } = require("../config/supabaseClient");

  router.post("/razorpay", express.raw({ type: "application/json" }), async (req, res) => {
    const signature = req.headers["x-razorpay-signature"];
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

    // Validate webhook origin authenticity
    const expectedSignature = crypto
      .createHmac("sha256", webhookSecret)
      .update(JSON.stringify(req.body))
      .digest("hex");

    if (signature !== expectedSignature) {
      return res.status(400).send("Invalid signature");
    }

    const event = req.body.event;
    if (event === "payment.captured") {
      const payment = req.body.payload.payment.entity;
      const orderId = payment.order_id; // Razorpay order id

      // Retrieve corresponding order database entry
      const { data: order, error: fetchError } = await supabaseAdmin
        .from("orders")
        .select("*")
        .eq("razorpay_order_id", orderId)
        .single();

      if (!fetchError && order && order.status !== "paid") {
        // 1. Mark order as paid
        await supabaseAdmin
          .from("orders")
          .update({
            status: "paid",
            razorpay_payment_id: payment.id,
            paid_at: new Date().toISOString()
          })
          .eq("id", order.id);

        // 2. Grant premium privileges (e.g. provision "premium" role)
        await supabaseAdmin
          .from("users")
          .update({ role: "premium" })
          .eq("id", order.user_id);
      }
    }

    res.status(200).json({ received: true });
  });

  module.exports = router;
  ```

  ---

  ### 5.4 Remediation: PDF Utility Optimization & Local Caching
  To resolve the synchronous HTTP fetch dependency and the async Promise constructor anti-pattern in the PDF generator, cache the logo asset locally in the server's filesystem:

  ```javascript
  // backend/utils/generateReceiptPDF.js
  const PDFDocument = require("pdfkit");
  const fs = require("fs");
  const path = require("path");

  function generateReceiptPDF({
    orderId,
    paymentId,
    email,
    planName,
    durationLabel,
    amount,
    paidAt,
  }) {
    // Return standard promise without wrapping in async callback
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ size: "A4", margin: 0 });
        const buffers = [];

        doc.on("data", (chunk) => buffers.push(chunk));
        doc.on("end", () => resolve(Buffer.concat(buffers)));
        doc.on("error", (err) => reject(err));

        const pageWidth = doc.page.width;
        const cardDark = "#16132B";
        const teal = "#22D3AE";
        const grayText = "#8B879E";
        const white = "#F5F3EC";

        const marginX = 50;
        const cardWidth = pageWidth - marginX * 2;

        // TOP: event-info panel
        const topHeight = 260;
        doc.rect(marginX, 40, cardWidth, topHeight).fill(cardDark);

        // Resolve logo image locally on the disk rather than over remote HTTP fetch
        const logoPath = path.join(__dirname, "../assets/logo.png");
        if (fs.existsSync(logoPath)) {
          try {
            doc.image(logoPath, pageWidth / 2 - 55, 65, { width: 110 });
          } catch {
            // Draw fallback text brand if loading fails
            doc.fillColor(white).fontSize(22).font("Helvetica-Bold")
              .text("TuneRaaga", marginX, 75, { width: cardWidth, align: "center" });
          }
        } else {
          doc.fillColor(white).fontSize(22).font("Helvetica-Bold")
            .text("TuneRaaga", marginX, 75, { width: cardWidth, align: "center" });
        }

        doc.fillColor(teal).fontSize(11).font("Helvetica-Bold")
          .text("✓ PAYMENT SUCCESSFUL", marginX, 130, {
            width: cardWidth,
            align: "center",
            characterSpacing: 1.2,
          });

        doc.fillColor(grayText).fontSize(9).font("Helvetica")
          .text("AMOUNT PAID", marginX, 165, {
            width: cardWidth,
            align: "center",
            characterSpacing: 1.5,
          });

        doc.fillColor(white).fontSize(36).font("Helvetica-Bold")
          .text(`Rs. ${amount}`, marginX, 180, { width: cardWidth, align: "center" });

        doc.fillColor(grayText).fontSize(10).font("Helvetica")
          .text(`${planName} - ${durationLabel}`, marginX, 232, { width: cardWidth, align: "center" });

        // PERFORATED DIVIDER
        const dividerY = 40 + topHeight;
        doc.moveTo(marginX, dividerY).lineTo(marginX + cardWidth, dividerY)
          .lineWidth(1.2).dash(4, { space: 4 }).strokeColor("#3a3555").stroke();
        doc.undash();

        // Punch notches
        doc.circle(marginX, dividerY, 11).fill("#ffffff");
        doc.circle(marginX + cardWidth, dividerY, 11).fill("#ffffff");

        // BOTTOM panel
        const bottomHeight = 260;
        doc.rect(marginX, dividerY, cardWidth, bottomHeight).fill(cardDark);

        const rows = [
          ["Email", email],
          ["Date", new Date(paidAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })],
          ["Payment ID", paymentId],
          ["Order ID", orderId],
        ];

        let rowY = dividerY + 30;
        const rowHeight = 34;

        rows.forEach(([label, value]) => {
          doc.fillColor(grayText).fontSize(9.5).font("Helvetica").text(label, marginX + 24, rowY);
          doc.fillColor(white).fontSize(9.5).font("Helvetica-Bold")
            .text(value, marginX + 24, rowY, { width: cardWidth - 48, align: "right" });
          rowY += rowHeight;
        });

        // Barcode strip representation
        const barcodeY = rowY + 20;
        let barX = marginX + 24;
        const barcodeHeights = [10, 22, 16, 22, 10, 22, 16, 10, 22];
        for (let i = 0; i < 40; i++) {
          const h = barcodeHeights[i % barcodeHeights.length];
          doc.rect(barX, barcodeY + (22 - h), 2, h).fill("#3a3555");
          barX += 5;
        }

        doc.fillColor(grayText).fontSize(8.5).font("Helvetica")
          .text("Thank you for going Pro with TuneRaaga", marginX, barcodeY + 40, { width: cardWidth, align: "center" });

        doc.roundedRect(marginX, 40, cardWidth, topHeight + bottomHeight, 20)
          .lineWidth(1).strokeColor("#3a3555").stroke();

        doc.end();
      } catch (err) {
        reject(err);
      }
    });
  }

  module.exports = generateReceiptPDF;
  ```

  ---

  ### 5.5 Remediation: Decoupling Client-Side Writes to Secure Server Routes
  To secure write operations, remove direct Supabase insert/delete calls from the frontend and process them via authenticated backend API endpoints:

  ```javascript
  // backend/routes/releaseRoutes.js
  const express = require("express");
  const router = express.Router();
  const { authenticateUser } = require("../middleware/authMiddleware");
  const { authorizeRole } = require("../middleware/roleMiddleware");
  const { createRelease, deleteRelease } = require("../controllers/releaseController");

  // Secure endpoints with authentication and authorization checks
  router.post("/", authenticateUser, authorizeRole(["admin"]), createRelease);
  router.delete("/:id", authenticateUser, authorizeRole(["admin"]), deleteRelease);

  module.exports = router;
  ```

  ---

  ## 6. OWASP Top 10 Risk Mapping Checklist

  The table below maps the vulnerabilities identified in the Tuneraaga application to the OWASP Top 10 classification of security risks.

  | OWASP Category | Vulnerability Identified | Impact | Remediation Status |
  | :--- | :--- | :--- | :--- |
  | **A01:2021-Broken Access Control** | Unauthenticated `PUT`/`DELETE` routes on `/api/artists/:id` | Attackers can modify or delete artist profile records. | **High Priority Action Required** - Apply role-based middleware verification. |
  | | Direct client-side database queries to write table records via anon-key. | Compromised clients can perform unauthorized table operations. | **High Priority Action Required** - Re-route transactions through backend validation. |
  | **A02:2021-Cryptographic Failures** | Storing plaintext passwords inside the public `artists` table. | Compromised databases expose plain passwords directly. | **High Priority Action Required** - Remove the password column from database tables. |
  | **A04:2021-Insecure Design** | Absence of asynchronous webhook confirmation loops. | Leads to payment discrepancies if clients disconnect prematurely. | **Medium Priority Action Required** - Configure Razorpay webhook listeners. |
  | **A05:2021-Security Misconfiguration**| Absence of rate limiting and basic security headers. | Exposes the API to brute force attacks and denial-of-service attempts. | **Medium Priority Action Required** - Incorporate `helmet` and `express-rate-limit`. |
  | **A07:2021-Identification & Auth Failures** | Default hardcoded passwords generated for registered users. | Trivial compromise of administrative onboarding accounts. | **Medium Priority Action Required** - Implement dynamically generated random passwords. |
  | **A09:2021-Security Logging & Monitoring** | Hinglish logged messages and database error logging. | Hinders server audits and integration with log management tools. | **Low Priority Action Required** - Standardize structured error codes. |
