const express = require("express");
const router = express.Router();

const {
  createOrderSummaryPay,
  createRazorpayOrder,
  verifyPayment,
  handleRazorpayWebhook,
  checkOrderStatus,
  getMySubscription,
  getAllOrders,
  downloadReceipt,
} = require("../controllers/orderController");

const { validateOrderPayload } = require("../middleware/validateOrderPayload");

// ⚠️ CONFIRM: ye do naam (authenticateUser, requireAdmin) aur file ka path
// tumhare actual middleware se exactly match karne chahiye. Warna server
// start hote hi "undefined is not a function" / "cannot read properties of
// undefined" crash aayega.
const {
  authenticateUser,
  requireAdmin,
} = require("../middleware/authMiddleware");

// ── PROTECTED: login zaroori (req.user set hota hai) ──
router.post(
  "/ordersummarypay",
  authenticateUser,
  validateOrderPayload,
  createOrderSummaryPay,
);
router.post(
  "/orders/:orderId/create-razorpay-order",
  authenticateUser,
  createRazorpayOrder,
);
router.post("/orders/:orderId/verify-payment", authenticateUser, verifyPayment);

// ── PUBLIC: Razorpay servers se aata hai (koi user token nahi) ──
// authenticateUser MAT lagao — signature verification handler ke andar hai.
router.post("/orders/razorpay-webhook", handleRazorpayWebhook);

// ── PROTECTED reads ──
router.get("/orders/:orderId/status", authenticateUser, checkOrderStatus);
router.get("/orders/:orderId/receipt", authenticateUser, downloadReceipt);
router.get("/me/subscription", authenticateUser, getMySubscription);

// ── ADMIN: requireAdmin already login + admin role dono check karta hai ──
router.get("/orders", requireAdmin, getAllOrders);

module.exports = router;
