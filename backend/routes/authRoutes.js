const express = require("express");
const router = express.Router();
const { authenticateUser } = require("../middleware/authMiddleware");
const {
  login,
  signup,
  getProfile,
  logout,
  getAllUsers,
  updateUserRole,
  deleteUser,
  getUserStats,
} = require("../controllers/authController");

// Public routes
router.post("/login", login);
router.post("/signup", signup);

// Protected routes (login required)
router.get("/profile", authenticateUser, getProfile);
router.post("/logout", authenticateUser, logout);

// Admin routes
router.get("/users", authenticateUser, getAllUsers);
router.get("/users/stats", authenticateUser, getUserStats);
router.patch("/users/:id/role", authenticateUser, updateUserRole);
router.delete("/users/:id", authenticateUser, deleteUser);

module.exports = router;
