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
        message: "Payment verify failed (invalid signature).",
      });
    }

    const paidAt = new Date().toISOString();

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
      console.warn(
        "⚠️ paid_at column i think not exists:",
        updateErr.message,
      );

      const fallbackAttempt = await supabaseAdmin
        .from("orders")
        .update({
          status: "paid",
          razorpay_payment_id,
        })
        .eq("id", orderId);

      updateErr = fallbackAttempt.error;
    }

    if (updateErr) {
      console.error("❌ Order status update FULL ERROR:", updateErr.message);
      return res.status(500).json({
        success: false,
        message:
          "Payment hui, lekin order update fail hua: " + updateErr.message,
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
        message:
          "this order for not receipt available (payment pending).",
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
      message: "Receipt generate nahi ho paayi.",
    });
  }
};

module.exports = {
  createOrderSummaryPay,
  createRazorpayOrder,
  verifyPayment,
  checkOrderStatus,
  downloadReceipt,
};
