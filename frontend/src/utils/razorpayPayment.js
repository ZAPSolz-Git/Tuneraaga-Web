const API_BASE = (
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000"
).replace(/\/+$/, "");

function loadRazorpayScript() {
  return new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export async function startRazorpayPayment(orderId, accessToken, opts = {}) {
  const { email, planName, onSuccess, onError } = opts;

  const ok = await loadRazorpayScript();
  if (!ok || !window.Razorpay) {
    onError?.(
      "Razorpay script load nahi hui. Internet check karke reload karo.",
    );
    return;
  }

  const headers = {
    "Content-Type": "application/json",
    ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
  };

  let data;
  try {
    const res = await fetch(
      `${API_BASE}/api/orders/${orderId}/create-razorpay-order`,
      { method: "POST", headers },
    );
    data = await res.json();
    if (!res.ok || !data.success) {
      onError?.(data.message || "Payment shuru nahi ho paaya.");
      return;
    }
  } catch (err) {
    console.error("create-razorpay-order error:", err);
    onError?.("Network error — backend chal raha hai check karo.");
    return;
  }

  const options = {
    key: data.key_id,
    amount: data.amount,
    currency: data.currency || "INR",
    name: "TuneRaaga",
    description: `${planName || "Pro Plan"} Purchase`,
    order_id: data.razorpay_order_id,
    prefill: { email },
    theme: { color: "#10b981" },
    handler: async function (response) {
      try {
        const verifyRes = await fetch(
          `${API_BASE}/api/orders/${orderId}/verify-payment`,
          {
            method: "POST",
            headers,
            body: JSON.stringify({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            }),
          },
        );
        const verifyData = await verifyRes.json();
        if (verifyRes.ok && verifyData.success) {
          onSuccess?.(verifyData.receipt);
        } else {
          onError?.(verifyData.message || "Payment verify nahi ho paayi.");
        }
      } catch (e) {
        console.error("verify-payment error:", e);
        onError?.(
          "Payment hui lekin verify karte waqt error aaya. Support se contact karein.",
        );
      }
    },
    modal: {
      ondismiss: function () {
        onError?.("Payment cancel kar di gayi.");
      },
    },
  };

  const rzp = new window.Razorpay(options);
  rzp.on("payment.failed", function (response) {
    console.error("Razorpay payment failed:", response.error);
    onError?.(response.error?.description || "Payment fail ho gayi.");
  });
  rzp.open();
}

export default startRazorpayPayment;
