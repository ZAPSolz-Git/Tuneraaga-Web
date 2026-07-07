const express = require("express");
const router = express.Router();

const {
  createOrderSummaryPay,
  createRazorpayOrder,
  verifyPayment,
  checkOrderStatus,
  downloadReceipt,
} = require("../controllers/orderController");

router.post("/ordersummarypay", createOrderSummaryPay);
router.post("/orders/:orderId/create-razorpay-order", createRazorpayOrder);
router.post("/orders/:orderId/verify-payment", verifyPayment);
router.get("/orders/:orderId/status", checkOrderStatus);
router.get("/orders/:orderId/receipt", downloadReceipt);

module.exports = router;
