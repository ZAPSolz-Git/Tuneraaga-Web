const API_BASE =
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000";

const loadRazorpayScript = () =>
  new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });

export const startRazorpayPayment = async (
  orderId,
  accessToken,
  { email, planName, onSuccess, onError },
) => {
  try {
    const scriptLoaded = await loadRazorpayScript();
    if (!scriptLoaded) {
      onError?.("Payment script load nahi hui. Internet check karo.");
      return;
    }

    const headers = {
      "Content-Type": "application/json",
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    };

    const res = await fetch(
      `${API_BASE}/api/orders/${orderId}/create-razorpay-order`,
      {
        method: "POST",
        headers,
      },
    );

    const data = await res.json();

    if (!res.ok || !data.success) {
      onError?.(data.message || "Payment shuru nahi ho paaya.");
      return;
    }

    const options = {
      key: data.key_id,
      amount: data.amount,
      currency: data.currency,
      name: "TuneRaaga",
      description: planName ? `${planName} Purchase` : "Pro Plan Purchase",
      order_id: data.razorpay_order_id,
      prefill: { email: email || "" },
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
          onError?.("Payment cancel kar diya gaya.");
        },
      },
    };

    const rzp = new window.Razorpay(options);

    rzp.on("payment.failed", function (response) {
      console.error("Razorpay payment failed:", response.error);
      onError?.(response.error?.description || "Payment fail ho gayi.");
    });

    rzp.open();
  } catch (err) {
    console.error("startRazorpayPayment error:", err);
    onError?.("Network error — backend chal raha hai check karo.");
  }
};
