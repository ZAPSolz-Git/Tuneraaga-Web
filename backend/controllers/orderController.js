const { supabaseAdmin } = require("../config/supabaseClient");
const razorpayInstance = require("../config/razorpay");
const crypto = require("crypto");
const generateReceiptPDF = require("../utils/generateReceiptPDF");

const lc = (s) => (s || "").toLowerCase();

// current active plan = us email ka sabse recent PAID order
const getCurrentPaidPlan = async (email) => {
  if (!email) return null;
  const { data: paid } = await supabaseAdmin
    .from("orders")
    .select(
      "plan_id, plan_name, duration_label, payment_type, paid_at, created_at, razorpay_payment_id, email",
    )
    .ilike("email", lc(email))
    .eq("status", "paid");
  if (!paid || paid.length === 0) return null;
  return [...paid].sort(
    (a, b) =>
      new Date(b.paid_at || b.created_at) - new Date(a.paid_at || a.created_at),
  )[0];
};

/** POST /api/ordersummarypay */
const createOrderSummaryPay = async (req, res) => {
  try {
    const { email, userId, plan, amount, fullName, phone } = req.body;

    const canonicalEmail = lc(req.user?.email || email);
    if (req.user?.email && email && lc(email) !== canonicalEmail) {
      return res.status(403).json({
        success: false,
        message: "Email logged-in user se match nahi karta.",
      });
    }

    const { data: planRow, error: planErr } = await supabaseAdmin
      .from("pro_plans")
      .select("id, name")
      .eq("id", plan)
      .eq("is_active", true)
      .single();

    if (planErr || !planRow) {
      return res
        .status(404)
        .json({ success: false, message: "Plan not found or inactive." });
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

    // 🚫 SAME-PLAN BLOCK (case-insensitive; users + orders dono check)
    const { data: userRow } = await supabaseAdmin
      .from("users")
      .select(
        "current_plan_id, current_plan_name, plan_status, full_name, phone",
      )
      .ilike("email", canonicalEmail)
      .maybeSingle();

    const { data: paidSame } = await supabaseAdmin
      .from("orders")
      .select("id")
      .ilike("email", canonicalEmail)
      .eq("plan_id", plan)
      .eq("status", "paid")
      .limit(1);

    const alreadyHasThisPlan =
      (userRow?.plan_status === "active" &&
        userRow?.current_plan_id === plan) ||
      (paidSame && paidSame.length > 0);

    if (alreadyHasThisPlan) {
      return res.status(409).json({
        success: false,
        code: "SAME_PLAN_ACTIVE",
        message: `Aapka "${userRow?.current_plan_name || planRow.name}" plan already active hai. Same plan dobara nahi le sakte — doosra plan choose karke upgrade karein.`,
      });
    }

    const finalName = fullName || userRow?.full_name || null;
    const finalPhone = phone || userRow?.phone || null;

    const isFree = Number(amount) === 0;
    const nowIso = new Date().toISOString();

    const { data: order, error: insertErr } = await supabaseAdmin
      .from("orders")
      .insert([
        {
          user_id: userId,
          email: canonicalEmail,
          full_name: finalName,
          phone: finalPhone,
          plan_id: plan,
          plan_name: planRow.name,
          plan_price_id: priceRow.id,
          duration_label: priceRow.duration_label,
          amount,
          payment_type: isFree ? "free" : "paid",
          status: isFree ? "paid" : "pending", // 'paid' hote hi DB trigger users fill karega
          paid_at: isFree ? nowIso : null,
        },
      ])
      .select()
      .single();

    if (insertErr) {
      console.error("Order insert error:", insertErr.message);
      return res
        .status(500)
        .json({ success: false, message: "Order create failed." });
    }

    return res.status(201).json({
      success: true,
      message: isFree ? "Free plan activated." : "Order successfully created.",
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

/** POST /api/orders/:orderId/create-razorpay-order */
const createRazorpayOrder = async (req, res) => {
  try {
    const { orderId } = req.params;

    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
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
      return res
        .status(404)
        .json({ success: false, message: "Order not found." });
    }
    if (req.user?.email && order.email !== lc(req.user.email)) {
      return res.status(403).json({ success: false, message: "Unauthorized." });
    }
    if (order.status === "paid") {
      return res
        .status(400)
        .json({ success: false, message: "Order is already paid." });
    }

    // 🚫 defense-in-depth: is email ka ye plan already PAID? Toh roko.
    const { data: paidSame } = await supabaseAdmin
      .from("orders")
      .select("id")
      .ilike("email", order.email)
      .eq("plan_id", order.plan_id)
      .eq("status", "paid")
      .neq("id", order.id)
      .limit(1);
    if (paidSame && paidSame.length) {
      return res.status(409).json({
        success: false,
        code: "SAME_PLAN_ACTIVE",
        message:
          "This plan is already active. Please choose a different plan to upgrade.",
      });
    }

    const amountNum = Number(order.amount);
    if (!amountNum || amountNum <= 0) {
      return res
        .status(400)
        .json({ success: false, message: "Order amount is invalid." });
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

    const razorpayOrder = await razorpayInstance.orders.create({
      amount: Math.round(amountNum * 100),
      currency: "INR",
      receipt: shortReceipt,
      notes: { order_id: String(order.id), user_id: String(order.user_id) },
    });

    await supabaseAdmin
      .from("orders")
      .update({ razorpay_order_id: razorpayOrder.id })
      .eq("id", orderId);

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

/** POST /api/orders/:orderId/verify-payment */
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
      return res.status(400).json({
        success: false,
        message: "Payment verify failed (invalid signature).",
      });
    }

    const paidAt = new Date().toISOString();

    // status='paid' set hote hi DB trigger users.current_plan_* auto-fill karega
    const { error: updateErr } = await supabaseAdmin
      .from("orders")
      .update({
        status: "paid",
        payment_type: "paid",
        razorpay_payment_id,
        paid_at: paidAt,
      })
      .eq("id", orderId);

    if (updateErr) {
      return res.status(500).json({
        success: false,
        message: "Payment Done but order Failed: " + updateErr.message,
      });
    }

    return res.status(200).json({
      success: true,
      message: "Payment verified & order updated.",
      receipt: {
        orderId: order.id,
        paymentId: razorpay_payment_id,
        email: order.email,
        fullName: order.full_name,
        phone: order.phone,
        planName: order.plan_name || "Pro Plan",
        planId: order.plan_id,
        durationLabel: order.duration_label || "1 Month",
        amount: order.amount,
        paymentType: "paid",
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

/** POST /api/orders/razorpay-webhook */
const handleRazorpayWebhook = async (req, res) => {
  try {
    const rawBody = req.rawBody || JSON.stringify(req.body);
    const signature = req.headers["x-razorpay-signature"];

    if (!process.env.RAZORPAY_KEY_SECRET)
      return res
        .status(500)
        .json({ success: false, message: "Server config error." });
    if (!signature)
      return res
        .status(400)
        .json({ success: false, message: "Signature header missing." });

    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(rawBody)
      .digest("hex");

    if (expectedSignature !== signature)
      return res
        .status(400)
        .json({ success: false, message: "Invalid signature." });

    const event = req.body?.event;
    const payment = req.body?.payload?.payment?.entity;
    if (!payment)
      return res
        .status(400)
        .json({ success: false, message: "Missing payment payload." });

    const { data: order, error: orderErr } = await supabaseAdmin
      .from("orders")
      .select("*")
      .eq("razorpay_order_id", payment.order_id)
      .maybeSingle();

    if (orderErr) throw orderErr;
    if (!order)
      return res
        .status(404)
        .json({ success: false, message: "Order not found." });

    let status = order.status;
    if (event === "payment.captured" || payment.status === "captured")
      status = "paid";
    else if (event === "payment.failed" || payment.status === "failed")
      status = "failed";

    const updates = { status, razorpay_payment_id: payment.id };
    if (status === "paid") {
      updates.payment_type = "paid";
      updates.paid_at = new Date().toISOString();
    }

    // trigger users ko auto-fill karega jab status='paid'
    const { error: updateErr } = await supabaseAdmin
      .from("orders")
      .update(updates)
      .eq("id", order.id);
    if (updateErr) throw updateErr;

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

/** GET /api/orders/:orderId/status */
const checkOrderStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { data: order, error } = await supabaseAdmin
      .from("orders")
      .select("id, status, payment_type")
      .eq("id", orderId)
      .single();
    if (error || !order)
      return res
        .status(404)
        .json({ success: false, message: "Order not found." });
    return res.status(200).json({
      success: true,
      status: order.status,
      paymentType: order.payment_type,
    });
  } catch (err) {
    return res
      .status(500)
      .json({ success: false, message: "Status check failed." });
  }
};

/** GET /api/me/subscription — current plan + history */
const getMySubscription = async (req, res) => {
  try {
    if (!req.user)
      return res
        .status(401)
        .json({ success: false, message: "Login required." });

    const email = lc(req.user.email);

    const { data: u } = await supabaseAdmin
      .from("users")
      .select(
        "full_name, phone, email, role, current_plan_id, current_plan_name, current_duration_label, plan_status, plan_payment_type, plan_activated_at, last_transaction_id",
      )
      .ilike("email", email)
      .maybeSingle();

    const { data: orders } = await supabaseAdmin
      .from("orders")
      .select(
        "id, created_at, paid_at, status, payment_type, amount, plan_id, plan_name, duration_label, razorpay_payment_id, email, full_name, phone",
      )
      .ilike("email", email)
      .order("created_at", { ascending: false });

    const subscription = {
      email,
      full_name: u?.full_name || orders?.[0]?.full_name || null,
      phone: u?.phone || orders?.[0]?.phone || null,
      role: u?.role || "user",
      plan_status: u?.plan_status || "none",
      current_plan_id: u?.current_plan_id || null,
      current_plan_name: u?.current_plan_name || null,
      current_duration_label: u?.current_duration_label || null,
      plan_payment_type: u?.plan_payment_type || null,
      plan_activated_at: u?.plan_activated_at || null,
      last_transaction_id: u?.last_transaction_id || null,
    };

    return res
      .status(200)
      .json({ success: true, subscription, orders: orders || [] });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

/** GET /api/orders — ADMIN */
const getAllOrders = async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from("orders")
      .select(
        "id, created_at, paid_at, status, payment_type, amount, email, full_name, phone, user_id, plan_id, plan_name, plan_price_id, duration_label, razorpay_order_id, razorpay_payment_id",
      )
      .order("created_at", { ascending: false });
    if (error)
      return res.status(500).json({ success: false, message: error.message });
    return res.status(200).json({ success: true, orders: data || [] });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

/** GET /api/orders/:orderId/receipt */
const downloadReceipt = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { data: order, error: fetchErr } = await supabaseAdmin
      .from("orders")
      .select("*")
      .eq("id", orderId)
      .single();

    if (fetchErr || !order)
      return res
        .status(404)
        .json({ success: false, message: "Order not found." });
    if (req.user?.email && order.email !== lc(req.user.email))
      return res.status(403).json({ success: false, message: "Unauthorized." });
    if (order.status !== "paid")
      return res.status(400).json({
        success: false,
        message: "Receipt available nahi (payment pending).",
      });

    const pdfBuffer = await generateReceiptPDF({
      orderId: order.id,
      paymentId:
        order.razorpay_payment_id ||
        (order.payment_type === "free" ? "FREE" : "N/A"),
      email: order.email,
      planName: order.plan_name || "Pro Plan",
      durationLabel: order.duration_label || "1 Month",
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
    return res
      .status(500)
      .json({ success: false, message: "Receipt generation failed." });
  }
};

module.exports = {
  createOrderSummaryPay,
  createRazorpayOrder,
  verifyPayment,
  handleRazorpayWebhook,
  checkOrderStatus,
  getMySubscription,
  getAllOrders,
  downloadReceipt,
};
