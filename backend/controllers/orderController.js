const { supabaseAdmin } = require("../config/supabaseClient");
const razorpayInstance = require("../config/razorpay");
const crypto = require("crypto");

/**
 * POST /api/ordersummarypay
 * (UNCHANGED)
 */
const createOrderSummaryPay = async (req, res) => {
  try {
    const { email, userId, plan, amount } = req.body;

    if (req.user && req.user.id !== userId) {
      return res.status(403).json({
        success: false,
        message: "userId logged-in user se match nahi karta.",
      });
    }

    const { data: planRow, error: planErr } = await supabaseAdmin
      .from("pro_plans")
      .select("id, name")
      .eq("id", plan)
      .eq("is_active", true)
      .single();

    if (planErr || !planRow) {
      return res.status(404).json({
        success: false,
        message: "Plan nahi mila ya inactive hai.",
      });
    }

    const { data: priceRow, error: priceErr } = await supabaseAdmin
      .from("pro_plan_prices")
      .select("id, price, duration_label")
      .eq("plan_id", plan)
      .eq("price", amount)
      .maybeSingle();

    if (priceErr || !priceRow) {
      return res.status(400).json({
        success: false,
        message: "Amount is plan ki kisi bhi valid price se match nahi karta.",
      });
    }

    const { data: order, error: insertErr } = await supabaseAdmin
      .from("orders")
      .insert([
        {
          user_id: userId,
          email,
          plan_id: plan,
          plan_price_id: priceRow.id,
          amount,
          status: "pending",
        },
      ])
      .select()
      .single();

    if (insertErr) {
      console.error("Order insert error:", insertErr.message);
      return res.status(500).json({
        success: false,
        message: "Order create nahi ho paaya.",
      });
    }

    return res.status(201).json({
      success: true,
      message: "Order successfully create ho gaya.",
      order,
    });
  } catch (err) {
    console.error("createOrderSummaryPay error:", err.message);
    return res.status(500).json({
      success: false,
      message: "Kuch galat ho gaya, dobara try karein.",
    });
  }
};

/**
 * POST /api/orders/:orderId/create-razorpay-order
 *
 * Yeh QR Code API nahi use karta (jo aapke account pe disabled hai),
 * balki Razorpay ka basic "Orders" API use karta hai — yeh HAR account
 * mein by default enabled hota hai, koi activation nahi chahiye.
 * Frontend isi order_id se Razorpay Checkout popup kholega, jisme
 * UPI/QR/Card sab options already available hote hain.
 */
const createRazorpayOrder = async (req, res) => {
  try {
    const { orderId } = req.params;

    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      console.error(
        "❌ RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET .env mein missing hain",
      );
      return res.status(500).json({
        success: false,
        message: "Server config error: Razorpay keys missing.",
      });
    }

    const { data: order, error: fetchErr } = await supabaseAdmin
      .from("orders")
      .select("*")
      .eq("id", orderId)
      .single();

    if (fetchErr || !order) {
      console.error("Order fetch error:", fetchErr?.message);
      return res
        .status(404)
        .json({ success: false, message: "Order nahi mila." });
    }

    if (req.user && order.user_id !== req.user.id) {
      return res.status(403).json({ success: false, message: "Unauthorized." });
    }

    if (order.status === "paid") {
      return res
        .status(400)
        .json({ success: false, message: "Order already paid hai." });
    }

    const amountNum = Number(order.amount);
    if (!amountNum || amountNum <= 0) {
      console.error("❌ Invalid order.amount:", order.amount);
      return res.status(400).json({
        success: false,
        message: "Order ka amount invalid hai.",
      });
    }

    // agar Razorpay order pehle se bana hua hai (retry case), wahi reuse karo
    if (order.razorpay_order_id) {
      return res.status(200).json({
        success: true,
        razorpay_order_id: order.razorpay_order_id,
        amount: Math.round(amountNum * 100),
        currency: "INR",
        key_id: process.env.RAZORPAY_KEY_ID,
      });
    }

    console.log(
      "➡️ Creating Razorpay order for:",
      order.id,
      "amount(paise):",
      Math.round(amountNum * 100),
    );

    const razorpayOrder = await razorpayInstance.orders.create({
      amount: Math.round(amountNum * 100),
      currency: "INR",
      receipt: `order_${order.id}`,
      notes: {
        order_id: String(order.id),
        user_id: String(order.user_id),
      },
    });

    console.log("✅ Razorpay order created:", razorpayOrder.id);

    const { error: updateErr } = await supabaseAdmin
      .from("orders")
      .update({ razorpay_order_id: razorpayOrder.id })
      .eq("id", orderId);

    if (updateErr) {
      console.error("Razorpay order id save error:", updateErr.message);
    }

    return res.status(200).json({
      success: true,
      razorpay_order_id: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      key_id: process.env.RAZORPAY_KEY_ID,
    });
  } catch (err) {
    const rzpError = err?.error || err?.response?.data?.error;
    console.error(
      "❌ createRazorpayOrder FULL ERROR:",
      rzpError || err.message,
    );

    return res.status(500).json({
      success: false,
      message: rzpError?.description || "Razorpay order create nahi ho paaya.",
    });
  }
};

/**
 * POST /api/orders/:orderId/verify-payment
 * Checkout popup mein payment success hone ke baad frontend yeh call karega.
 * Signature verify karke order ko "paid" mark karte hain.
 */
const verifyPayment = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
      req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res
        .status(400)
        .json({ success: false, message: "Payment details missing hain." });
    }

    const { data: order, error: fetchErr } = await supabaseAdmin
      .from("orders")
      .select("*")
      .eq("id", orderId)
      .single();

    if (fetchErr || !order) {
      return res
        .status(404)
        .json({ success: false, message: "Order nahi mila." });
    }

    if (order.razorpay_order_id !== razorpay_order_id) {
      return res
        .status(400)
        .json({ success: false, message: "Order ID match nahi karta." });
    }

    const generatedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (generatedSignature !== razorpay_signature) {
      console.error("❌ Signature mismatch for order:", orderId);
      return res.status(400).json({
        success: false,
        message: "Payment verify nahi ho paaya (invalid signature).",
      });
    }

    const { error: updateErr } = await supabaseAdmin
      .from("orders")
      .update({
        status: "paid",
        razorpay_payment_id,
      })
      .eq("id", orderId);

    if (updateErr) {
      console.error("Order status update error:", updateErr.message);
      return res.status(500).json({
        success: false,
        message: "Payment hui, lekin order update fail hua.",
      });
    }

    return res
      .status(200)
      .json({ success: true, message: "Payment verified & order updated." });
  } catch (err) {
    console.error("verifyPayment error:", err.message);
    return res
      .status(500)
      .json({ success: false, message: "Verification fail hua." });
  }
};

/**
 * GET /api/orders/:orderId/status
 * (UNCHANGED)
 */
const checkOrderStatus = async (req, res) => {
  try {
    const { orderId } = req.params;

    const { data: order, error } = await supabaseAdmin
      .from("orders")
      .select("id, status")
      .eq("id", orderId)
      .single();

    if (error || !order) {
      return res
        .status(404)
        .json({ success: false, message: "Order nahi mila." });
    }

    return res.status(200).json({ success: true, status: order.status });
  } catch (err) {
    console.error("checkOrderStatus error:", err.message);
    return res
      .status(500)
      .json({ success: false, message: "Status check fail hua." });
  }
};

/**
 * POST /api/webhook/razorpay
 * Webhook ab "order.paid" / "payment.captured" event sunega
 * (safety net — agar frontend verify call kisi wajah se miss ho jaaye).
 */
const handleRazorpayWebhook = async (req, res) => {
  try {
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    const signature = req.headers["x-razorpay-signature"];

    const expectedSignature = crypto
      .createHmac("sha256", webhookSecret)
      .update(req.body)
      .digest("hex");

    if (expectedSignature !== signature) {
      console.warn("Invalid Razorpay webhook signature");
      return res
        .status(400)
        .json({ success: false, message: "Invalid signature" });
    }

    const payload = JSON.parse(req.body.toString());
    const event = payload.event;

    if (event === "payment.captured" || event === "order.paid") {
      const notes =
        payload.payload?.payment?.entity?.notes ||
        payload.payload?.order?.entity?.notes;

      const orderId = notes?.order_id;

      if (orderId) {
        await supabaseAdmin
          .from("orders")
          .update({ status: "paid" })
          .eq("id", orderId);
      }
    }

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error("Webhook error:", err.message);
    return res.status(500).json({ success: false });
  }
};

module.exports = {
  createOrderSummaryPay,
  createRazorpayOrder,
  verifyPayment,
  checkOrderStatus,
  handleRazorpayWebhook,
};
