// backend/routes/authRoutes.js — FULL UPDATED FILE

const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const { authenticateUser } = require("../middleware/authMiddleware");

// ─── Public Routes (no auth middleware needed) ───
router.post("/login", authController.login);
router.post("/signup", authController.signup);

// ✅ Forgot Password Routes (public — user isn't logged in yet)
router.post("/forgot-password", authController.forgotPassword);
router.post("/reset-password", authController.resetPassword);

// ─── Protected Routes ───

router.get("/profile", authenticateUser, authController.getProfile);
router.post("/logout", authenticateUser, authController.logout);
router.get("/users", authenticateUser, authController.getAllUsers);
router.put("/users/:id/role", authenticateUser, authController.updateUserRole);
router.delete("/users/:id", authenticateUser, authController.deleteUser);
router.get("/stats", authenticateUser, authController.getUserStats);

module.exports = router;
