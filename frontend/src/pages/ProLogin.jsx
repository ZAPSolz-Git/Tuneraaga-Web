import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Auth from "../components/Auth";

/**
 * Route: /pro/login?plan=<planId>
 *
 * Normal website users (Auth.jsx) yahan login/signup karte hain jab woh
 * "Start Free Trial" ya kisi plan card par click karte hain bina logged-in hue.
 * Success hone par unhe wapas usi plan ke Package Summary page par bhej diya
 * jaata hai. (Admin/Artist LoginPage.jsx isse bilkul alag hai aur untouched hai.)
 */
const ProLogin = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const params = new URLSearchParams(location.search);
  const planId = params.get("plan");

  const handleAuthSuccess = () => {
    if (planId) {
      navigate(`/pro/plan/${planId}`, { replace: true });
    } else {
      navigate("/pro", { replace: true });
    }
  };

  const handleClose = () => {
    // X button dabaya bina login kiye -> wapas plans list par
    navigate("/pro");
  };

  return (
    <Auth
      onSuccess={handleAuthSuccess}
      onClose={handleClose}
      initialMode="login"
    />
  );
};

export default ProLogin;
