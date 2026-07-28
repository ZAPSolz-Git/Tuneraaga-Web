import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Auth from "../components/Auth";

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
