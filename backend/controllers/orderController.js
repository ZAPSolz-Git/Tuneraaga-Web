const { supabaseAdmin } = require("../config/supabaseClient");
const razorpayInstance = require("../config/razorpay");
const crypto = require("crypto");
const generateReceiptPDF = require("../utils/generateReceiptPDF");

/**
 * POST /api/ordersummarypay
 */
const createOrderSummaryPay = async (req, res) => {
  try {
    const { email, userId, plan, amount } = req.body;

    if (req.user && req.user.id !== userId) {
      return res.status(403).json({
        success: false,
        message: "userId logged-in user not match.",
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
        message: "Plan not found or inactive.",
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
        message: "Amount is not valid for the selected plan.",
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
        message: "Order create failed.",
      });
    }

    return res.status(201).json({
      success: true,
      message: "Order successfully created.",
      order,
    });
  } catch (err) {
    console.error("createOrderSummaryPay error:", err.message);
    return res.status(500).json({
      success: false,
      message: "Something went wrong, please try again.",
    });
  }
};

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
        .json({ success: false, message: "Order not found." });
    }

    if (req.user && order.user_id !== req.user.id) {
      return res.status(403).json({ success: false, message: "Unauthorized." });
    }

    if (order.status === "paid") {
      return res
        .status(400)
        .json({ success: false, message: "Order is already paid." });
    }

    const amountNum = Number(order.amount);
    if (!amountNum || amountNum <= 0) {
      console.error("❌ Invalid order.amount:", order.amount);
      return res.status(400).json({
        success: false,
        message: "Order amount is invalid.",
      });
    }

    if (order.razorpay_order_id) {
      return res.status(200).json({
        success: true,
        razorpay_order_id: order.razorpay_order_id,
        amount: Math.round(amountNum * 100),
        currency: "INR",
        key_id: process.env.RAZORPAY_KEY_ID,
      });
    }

    const shortReceipt = `ord_${String(order.id).replace(/-/g, "").slice(0, 30)}`;

    console.log(
      "➡️ Creating Razorpay order for:",
      order.id,
      "amount(paise):",
      Math.round(amountNum * 100),
      "receipt:",
      shortReceipt,
    );

    const razorpayOrder = await razorpayInstance.orders.create({
      amount: Math.round(amountNum * 100),
      currency: "INR",
      receipt: shortReceipt,
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
      message: rzpError?.description || "Razorpay order create failed.",
    });
  }
};

const verifyPayment = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
      req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res
        .status(400)
        .json({ success: false, message: "Payment details are missing." });
    }

    const { data: order, error: fetchErr } = await supabaseAdmin
      .from("orders")
      .select("*")
      .eq("id", orderId)
      .single();

    if (fetchErr || !order) {
      return res
        .status(404)
        .json({ success: false, message: "Order not found." });
    }

    if (order.razorpay_order_id !== razorpay_order_id) {
      return res
        .status(400)
        .json({ success: false, message: "Order ID does not match." });
    }

    const generatedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (generatedSignature !== razorpay_signature) {
      console.error("❌ Signature mismatch for order:", orderId);
      return res.status(400).json({
        success: false,
        message: "Payment verify failed (invalid signature).",
      });
    }

    const paidAt = new Date().toISOString();

    // ✅ FIXED: removed the double-update retry logic. The "orders" table
    // schema already has a "paid_at" column, so the fallback that retried
    // without it was dead code — it only added an extra query and could
    // silently mask a real DB error instead of surfacing it. Now this is
    // a single, clean update; if it fails, the real error is returned.
    const { error: updateErr } = await supabaseAdmin
      .from("orders")
      .update({
        status: "paid",
        razorpay_payment_id,
        paid_at: paidAt,
      })
      .eq("id", orderId);

    if (updateErr) {
      console.error("❌ Order status update FULL ERROR:", updateErr.message);
      return res.status(500).json({
        success: false,
        message:
          "Payment Done but order Failed: " + updateErr.message,
      });
    }

    if (order.user_id) {
      const { error: roleErr } = await supabaseAdmin
        .from("users")
        .update({ role: "premium" })
        .eq("id", order.user_id);
      if (roleErr) {
        console.warn("Unable to update user role to premium:", roleErr.message);
      }
    }

    const { data: planRow } = await supabaseAdmin
      .from("pro_plans")
      .select("name")
      .eq("id", order.plan_id)
      .single();

    const { data: priceRow } = await supabaseAdmin
      .from("pro_plan_prices")
      .select("duration_label")
      .eq("id", order.plan_price_id)
      .maybeSingle();

    return res.status(200).json({
      success: true,
      message: "Payment verified & order updated.",
      receipt: {
        orderId: order.id,
        paymentId: razorpay_payment_id,
        email: order.email,
        planName: planRow?.name || "Pro Plan",
        durationLabel: priceRow?.duration_label || "1 Month",
        amount: order.amount,
        paidAt,
      },
    });
  } catch (err) {
    console.error("❌ verifyPayment FULL ERROR:", err.message);
    return res.status(500).json({
      success: false,
      message: "Verification fail hua: " + err.message,
    });
  }
};

const handleRazorpayWebhook = async (req, res) => {
  try {
    const rawBody = req.rawBody || JSON.stringify(req.body);
    const signature = req.headers["x-razorpay-signature"];

    if (!process.env.RAZORPAY_KEY_SECRET) {
      console.error("Missing Razorpay secret for webhook verification.");
      return res
        .status(500)
        .json({ success: false, message: "Server config error." });
    }

    if (!signature) {
      return res
        .status(400)
        .json({ success: false, message: "Signature header missing." });
    }

    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(rawBody)
      .digest("hex");

    if (expectedSignature !== signature) {
      console.error("Razorpay webhook signature mismatch.");
      return res
        .status(400)
        .json({ success: false, message: "Invalid signature." });
    }

    const event = req.body?.event;
    const payment = req.body?.payload?.payment?.entity;

    if (!payment) {
      return res
        .status(400)
        .json({ success: false, message: "Missing payment payload." });
    }

    const razorpayOrderId = payment.order_id;
    const razorpayPaymentId = payment.id;
    const paymentStatus = payment.status;

    const { data: order, error: orderErr } = await supabaseAdmin
      .from("orders")
      .select("*")
      .eq("razorpay_order_id", razorpayOrderId)
      .maybeSingle();

    if (orderErr) {
      throw orderErr;
    }

    if (!order) {
      return res
        .status(404)
        .json({ success: false, message: "Order not found." });
    }

    let status = order.status;
    if (event === "payment.captured" || paymentStatus === "captured") {
      status = "paid";
    } else if (event === "payment.failed" || paymentStatus === "failed") {
      status = "failed";
    }

    const updates = {
      status,
      razorpay_payment_id: razorpayPaymentId,
    };

    if (status === "paid") {
      updates.paid_at = new Date().toISOString();
    }

    const { error: updateErr } = await supabaseAdmin
      .from("orders")
      .update(updates)
      .eq("id", order.id);

    if (updateErr) {
      throw updateErr;
    }

    if (status === "paid" && order.user_id) {
      const { error: roleErr } = await supabaseAdmin
        .from("users")
        .update({ role: "premium" })
        .eq("id", order.user_id);
      if (roleErr) {
        console.warn("Unable to update user role to premium:", roleErr.message);
      }
    }

    return res.status(200).json({
      success: true,
      message: "Webhook processed successfully.",
      event,
      orderId: order.id,
    });
  } catch (err) {
    console.error("handleRazorpayWebhook error:", err.message);
    return res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * GET /api/orders/:orderId/status
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
        .json({ success: false, message: "Order not found." });
    }

    return res.status(200).json({ success: true, status: order.status });
  } catch (err) {
    console.error("checkOrderStatus error:", err.message);
    return res
      .status(500)
      .json({ success: false, message: "Status check failed." });
  }
};

/**
 * GET /api/orders/:orderId/receipt
 * pdf receipt generate
 */
const downloadReceipt = async (req, res) => {
  try {
    const { orderId } = req.params;

    const { data: order, error: fetchErr } = await supabaseAdmin
      .from("orders")
      .select("*")
      .eq("id", orderId)
      .single();

    if (fetchErr || !order) {
      return res
        .status(404)
        .json({ success: false, message: "Order not found." });
    }

    if (req.user && order.user_id !== req.user.id) {
      return res.status(403).json({ success: false, message: "Unauthorized." });
    }

    if (order.status !== "paid") {
      return res.status(400).json({
        success: false,
        message: "this order for not receipt available (payment pending).",
      });
    }

    const { data: planRow } = await supabaseAdmin
      .from("pro_plans")
      .select("name")
      .eq("id", order.plan_id)
      .single();

    const { data: priceRow } = await supabaseAdmin
      .from("pro_plan_prices")
      .select("duration_label")
      .eq("id", order.plan_price_id)
      .maybeSingle();

    const pdfBuffer = await generateReceiptPDF({
      orderId: order.id,
      paymentId: order.razorpay_payment_id || "N/A",
      email: order.email,
      planName: planRow?.name || "Pro Plan",
      durationLabel: priceRow?.duration_label || "1 Month",
      amount: order.amount,
      paidAt: order.paid_at || order.created_at || new Date().toISOString(),
    });

    res.set({
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="TuneRaaga_Receipt_${order.id}.pdf"`,
      "Content-Length": pdfBuffer.length,
    });

    return res.send(pdfBuffer);
  } catch (err) {
    console.error("❌ downloadReceipt FULL ERROR:", err.message);
    return res.status(500).json({
      success: false,
      message: "Receipt generation failed.",
    });
  }
};

module.exports = {
  createOrderSummaryPay,
  createRazorpayOrder,
  verifyPayment,
  handleRazorpayWebhook,
  checkOrderStatus,
  downloadReceipt,
};
