const { supabaseAdmin } = require("../config/supabaseClient");
const razorpayInstance = require("../config/razorpay");
const crypto = require("crypto");
const generateReceiptPDF = require("../utils/generateReceiptPDF");

// UPSERT: row na ho to bana de, warna update kar de. Isse current plan
// hamesha store hota hai (email NOT NULL isliye email zaroori pass karo).
const activateUserPlan = async (userId, info) => {
  if (!userId) return;
  const payload = {
    id: userId,
    email: info.email, // NOT NULL — insert case ke liye zaroori
    role: "premium",
    current_plan_id: info.planId,
    current_plan_name: info.planName,
    current_plan_price_id: info.planPriceId || null,
    current_duration_label: info.durationLabel || null,
    plan_status: "active",
    plan_payment_type: info.paymentType,
    plan_activated_at: new Date().toISOString(),
    last_transaction_id:
      info.transactionId || (info.paymentType === "free" ? "FREE" : null),
  };
  const { error } = await supabaseAdmin
    .from("users")
    .upsert(payload, { onConflict: "id" });
  if (error) console.warn("activateUserPlan error:", error.message);
};

/** POST /api/ordersummarypay
 *  🔒 authMiddleware already ran before this — req.user is guaranteed
 *  to exist and be trustworthy. We now use req.user.id / req.user.email
 *  as the SOURCE OF TRUTH instead of trusting whatever the client sent
 *  in the body. This closes the loophole where someone could fake a
 *  different email/userId in the request to bypass the same-plan block.
 */
const createOrderSummaryPay = async (req, res) => {
  try {
    if (!req.user) {
      // Defensive check — should never trigger since authMiddleware
      // already blocks unauthenticated requests, but kept as a safety net.
      return res.status(401).json({
        success: false,
        message: "Login required before payment.",
      });
    }

    const { plan, amount, fullName, phone } = req.body;

    // ✅ Trust the authenticated session, not the request body.
    const userId = req.user.id;
    const email = req.user.email;

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

    // ── CHECK #1: same account (by userId) already has this exact plan active ──
    const { data: userRow } = await supabaseAdmin
      .from("users")
      .select(
        "full_name, phone, current_plan_id, current_plan_name, plan_status",
      )
      .eq("id", userId)
      .maybeSingle();

    if (
      userRow &&
      userRow.plan_status === "active" &&
      userRow.current_plan_id === plan
    ) {
      return res.status(409).json({
        success: false,
        code: "SAME_PLAN_ACTIVE",
        message: `Aapka "${userRow.current_plan_name || planRow.name}" plan already active hai. Same plan dobara nahi le sakte — kisi doosre plan par upgrade/change karein.`,
      });
    }

    // ── CHECK #2: same EMAIL (possibly a different account/userId) already
    // has this exact plan active. This blocks someone from creating a second
    // account with the same email to pay again for the same plan. ──
    const { data: emailActiveRow } = await supabaseAdmin
      .from("users")
      .select("id, current_plan_id, current_plan_name, plan_status")
      .eq("email", email)
      .eq("plan_status", "active")
      .neq("id", userId)
      .maybeSingle();

    if (emailActiveRow && emailActiveRow.current_plan_id === plan) {
      return res.status(409).json({
        success: false,
        code: "SAME_EMAIL_PLAN_ACTIVE",
        message: `Is email (${email}) par already "${emailActiveRow.current_plan_name || planRow.name}" plan active hai. Same email se dobara same plan nahi khareed sakte.`,
      });
    }

    // ── CHECK #3: an unpaid/pending order already exists for this exact
    // user + plan + amount — reuse it instead of creating a duplicate row. ──
    const { data: pendingOrder } = await supabaseAdmin
      .from("orders")
      .select("*")
      .eq("user_id", userId)
      .eq("plan_id", plan)
      .eq("status", "pending")
      .order("created_at", { ascending: false })
      .maybeSingle();

    if (pendingOrder) {
      return res.status(200).json({
        success: true,
        message: "Pending order already exists — resuming it.",
        order: pendingOrder,
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
          email,
          full_name: finalName,
          phone: finalPhone,
          plan_id: plan,
          plan_name: planRow.name,
          plan_price_id: priceRow.id,
          duration_label: priceRow.duration_label,
          amount,
          payment_type: isFree ? "free" : "paid",
          status: isFree ? "paid" : "pending",
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

    if (isFree) {
      await activateUserPlan(userId, {
        email,
        planId: plan,
        planName: planRow.name,
        planPriceId: priceRow.id,
        durationLabel: priceRow.duration_label,
        paymentType: "free",
        transactionId: "FREE",
      });
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

    // 🔒 req.user is guaranteed now (authMiddleware) — strict ownership check.
    if (order.user_id !== req.user.id) {
      return res.status(403).json({ success: false, message: "Unauthorized." });
    }
    if (order.status === "paid") {
      return res
        .status(400)
        .json({ success: false, message: "Order is already paid." });
    }

    // 🔒 LAST-LINE-OF-DEFENSE CHECK — runs no matter which code path
    // created this order row. This is the true choke point: Razorpay
    // checkout can ONLY open through this endpoint, so blocking here
    // guarantees no duplicate charge for an already-active plan,
    // regardless of any bypass earlier in the flow.
    const { data: userRow } = await supabaseAdmin
      .from("users")
      .select("current_plan_id, current_plan_name, plan_status")
      .eq("id", order.user_id)
      .maybeSingle();

    if (
      userRow &&
      userRow.plan_status === "active" &&
      userRow.current_plan_id === order.plan_id
    ) {
      // Mark this stray order as cancelled so it doesn't sit as "pending" forever.
      await supabaseAdmin
        .from("orders")
        .update({ status: "cancelled" })
        .eq("id", orderId);

      return res.status(409).json({
        success: false,
        code: "SAME_PLAN_ACTIVE",
        message: `Aapka "${userRow.current_plan_name || order.plan_name}" plan already active hai. Same plan dobara nahi khareed sakte.`,
      });
    }

    // 🔒 Same check across email (covers duplicate accounts with same email).
    const { data: emailActiveRow } = await supabaseAdmin
      .from("users")
      .select("id, current_plan_id, current_plan_name, plan_status")
      .eq("email", order.email)
      .eq("plan_status", "active")
      .neq("id", order.user_id)
      .maybeSingle();

    if (emailActiveRow && emailActiveRow.current_plan_id === order.plan_id) {
      await supabaseAdmin
        .from("orders")
        .update({ status: "cancelled" })
        .eq("id", orderId);

      return res.status(409).json({
        success: false,
        code: "SAME_EMAIL_PLAN_ACTIVE",
        message: `Is email (${order.email}) par already yeh plan active hai. Same email se dobara same plan nahi khareed sakte.`,
      });
    }

    const amountNum = Number(order.amount);
    if (!amountNum || amountNum <= 0) {
      return res.status(400).json({
        success: false,
        message: "Order amount is invalid (free plan?).",
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

    const razorpayOrder = await razorpayInstance.orders.create({
      amount: Math.round(amountNum * 100),
      currency: "INR",
      receipt: shortReceipt,
      notes: { order_id: String(order.id), user_id: String(order.user_id) },
    });

    const { error: updateErr } = await supabaseAdmin
      .from("orders")
      .update({ razorpay_order_id: razorpayOrder.id })
      .eq("id", orderId);
    if (updateErr)
      console.error("Razorpay order id save error:", updateErr.message);

    return res.status(200).json({
      success: true,
      razorpay_order_id: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      key_id: process.env.RAZORPAY_KEY_ID,
    });
  } catch (err) {
    const rzpError = err?.error || err?.response?.data?.error;
    console.error("createRazorpayOrder FULL ERROR:", rzpError || err.message);
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

    if (order.user_id !== req.user.id) {
      return res.status(403).json({ success: false, message: "Unauthorized." });
    }

    // 🔒 Already paid? Don't re-process — prevents double activation
    // if verify-payment is somehow called twice for the same order.
    if (order.status === "paid") {
      return res.status(200).json({
        success: true,
        message: "Order already verified & paid.",
        receipt: {
          orderId: order.id,
          paymentId: order.razorpay_payment_id,
          email: order.email,
          fullName: order.full_name,
          phone: order.phone,
          planName: order.plan_name || "Pro Plan",
          planId: order.plan_id,
          durationLabel: order.duration_label || "1 Month",
          amount: order.amount,
          paymentType: "paid",
          paidAt: order.paid_at,
        },
      });
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

    await activateUserPlan(order.user_id, {
      email: order.email,
      planId: order.plan_id,
      planName: order.plan_name,
      planPriceId: order.plan_price_id,
      durationLabel: order.duration_label,
      paymentType: "paid",
      transactionId: razorpay_payment_id,
    });

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
    console.error("verifyPayment FULL ERROR:", err.message);
    return res.status(500).json({
      success: false,
      message: "Verification fail hua: " + err.message,
    });
  }
};

/** POST /api/orders/razorpay-webhook
 *  NOTE: no authMiddleware here on purpose — Razorpay calls this directly.
 *  Security comes from the signature check below. */
const handleRazorpayWebhook = async (req, res) => {
  try {
    const rawBody = req.rawBody || JSON.stringify(req.body);
    const signature = req.headers["x-razorpay-signature"];

    if (!process.env.RAZORPAY_KEY_SECRET) {
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

    const { data: order, error: orderErr } = await supabaseAdmin
      .from("orders")
      .select("*")
      .eq("razorpay_order_id", payment.order_id)
      .maybeSingle();

    if (orderErr) throw orderErr;
    if (!order) {
      return res
        .status(404)
        .json({ success: false, message: "Order not found." });
    }

    // Already processed — avoid double-activating the plan.
    if (order.status === "paid") {
      return res.status(200).json({
        success: true,
        message: "Already processed.",
        orderId: order.id,
      });
    }

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

    const { error: updateErr } = await supabaseAdmin
      .from("orders")
      .update(updates)
      .eq("id", order.id);
    if (updateErr) throw updateErr;

    if (status === "paid") {
      await activateUserPlan(order.user_id, {
        email: order.email,
        planId: order.plan_id,
        planName: order.plan_name,
        planPriceId: order.plan_price_id,
        durationLabel: order.duration_label,
        paymentType: "paid",
        transactionId: payment.id,
      });
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

/** GET /api/orders/:orderId/status */
const checkOrderStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { data: order, error } = await supabaseAdmin
      .from("orders")
      .select("id, user_id, status, payment_type")
      .eq("id", orderId)
      .single();
    if (error || !order) {
      return res
        .status(404)
        .json({ success: false, message: "Order not found." });
    }
    if (order.user_id !== req.user.id) {
      return res.status(403).json({ success: false, message: "Unauthorized." });
    }
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

/** GET /api/me/subscription  (current plan + apni history) */
const getMySubscription = async (req, res) => {
  try {
    const { data: sub } = await supabaseAdmin
      .from("users")
      .select(
        "full_name, phone, email, role, current_plan_id, current_plan_name, current_duration_label, plan_status, plan_payment_type, plan_activated_at, last_transaction_id",
      )
      .eq("id", req.user.id)
      .maybeSingle();

    const { data: orders } = await supabaseAdmin
      .from("orders")
      .select(
        "id, created_at, paid_at, status, payment_type, amount, plan_id, plan_name, duration_label, razorpay_payment_id",
      )
      .eq("user_id", req.user.id)
      .order("created_at", { ascending: false });

    return res
      .status(200)
      .json({ success: true, subscription: sub || null, orders: orders || [] });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

/** GET /api/orders  (ADMIN — sab transactions)
 *  NOTE: role check ab requireAdmin middleware mein already ho chuka hai,
 *  isliye yahan dobara check karne ki zaroorat nahi. */
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
    if (order.user_id !== req.user.id)
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
