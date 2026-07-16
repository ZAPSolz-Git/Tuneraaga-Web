// backend/routes/authRoutes.js — FULL UPDATED FILE

const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");

// ─── Public Routes (no auth middleware needed) ───
router.post("/login", authController.login);
router.post("/signup", authController.signup);

// ✅ NEW — Forgot Password Routes
router.post("/forgot-password", authController.forgotPassword);
router.post("/reset-password", authController.resetPassword);

// ─── Protected Routes (add your verifyToken middleware if you have one) ───
// Example: router.get("/profile", verifyToken, authController.getProfile);
router.get("/profile", authController.getProfile);
router.post("/logout", authController.logout);
router.get("/users", authController.getAllUsers);
router.put("/users/:id/role", authController.updateUserRole);
router.delete("/users/:id", authController.deleteUser);
router.get("/stats", authController.getUserStats);

module.exports = router;
