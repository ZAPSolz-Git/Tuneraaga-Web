const express = require("express");
const {
  createOrderSummaryPay,
  createRazorpayOrder,
  verifyPayment,
  checkOrderStatus,
  handleRazorpayWebhook,
} = require("../controllers/orderController");
const { validateOrderPayload } = require("../middleware/validateOrderPayload");
const { authenticateUser } = require("../middleware/authMiddleware");

const router = express.Router();

// Final endpoint: POST /api/ordersummarypay
router.post(
  "/ordersummarypay",
  authenticateUser,
  validateOrderPayload,
  createOrderSummaryPay,
);

// Razorpay checkout order banao (QR/UPI/Card sab isi ke andar honge)
router.post(
  "/orders/:orderId/create-razorpay-order",
  authenticateUser,
  createRazorpayOrder,
);

// Payment success hone ke baad signature verify karo
router.post("/orders/:orderId/verify-payment", authenticateUser, verifyPayment);

// Frontend yahan poll karega payment hui ya nahi check karne ke liye
router.get("/orders/:orderId/status", authenticateUser, checkOrderStatus);

// Razorpay webhook (auth ke bina — Razorpay khud call karta hai)
router.post("/webhook/razorpay", handleRazorpayWebhook);

module.exports = router;
