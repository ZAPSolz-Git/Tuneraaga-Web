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

// ⚠️ CONFIRM FILENAME: agar aapki file "auth.js" ya kisi aur naam se
// saved hai, toh yahan "authMiddleware" ki jagah woh naam likho.
const {
  authenticateUser,
  requireAdmin,
} = require("../middleware/authMiddleware");

// 🔒 Auth required BEFORE payment can start — login first, then pay.
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

// Webhook is called by Razorpay's servers directly (no user token) —
// must NOT have authenticateUser. Protected by signature verification
// inside handleRazorpayWebhook itself.
router.post("/orders/razorpay-webhook", handleRazorpayWebhook);

router.get("/orders/:orderId/status", authenticateUser, checkOrderStatus);
router.get("/orders/:orderId/receipt", authenticateUser, downloadReceipt);

router.get("/me/subscription", authenticateUser, getMySubscription);

// 👇 requireAdmin already checks login + admin role both, isliye
// authenticateUser dobara lagane ki zaroorat nahi.
router.get("/orders", requireAdmin, getAllOrders);

module.exports = router;
