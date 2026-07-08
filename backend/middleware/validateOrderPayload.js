
const validateOrderPayload = (req, res, next) => {
  const { email, userId, plan, amount } = req.body;
  const errors = [];

  if (
    !email ||
    typeof email !== "string" ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  ) {
    errors.push("Valid email is required.");
  }

  if (!userId || typeof userId !== "string") {
    errors.push("userId is required.");
  }

  if (!plan || typeof plan !== "string") {
    errors.push("plan (plan id) is required.");
  }

  if (
    amount === undefined ||
    amount === null ||
    isNaN(Number(amount)) ||
    Number(amount) < 0
  ) {
    errors.push("amount must be a valid non-negative number.");
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: "Invalid order payload.",
      errors,
    });
  }

 
  req.body.amount = Number(amount);

  next();
};

module.exports = { validateOrderPayload };
