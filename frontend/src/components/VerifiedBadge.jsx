import React from "react";

// Admin-assigned blue verification tick. Renders nothing unless `show` is true.
const VerifiedBadge = ({ show, size = 16, className = "" }) => {
  if (!show) return null;
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      role="img"
      aria-label="Verified artist"
      className={`inline-block flex-shrink-0 align-middle ${className}`}
    >
      <title>Verified artist</title>
      <path
        fill="#1d9bf0"
        d="M22.5 12.5c0-1.58-.88-2.95-2.18-3.66.54-1.4.24-3.03-.88-4.15s-2.75-1.42-4.15-.88C14.58 2.54 13.21 1.65 11.63 1.65S8.68 2.54 7.97 3.84c-1.4-.54-3.03-.24-4.15.88s-1.42 2.75-.88 4.15C1.64 9.58.75 10.95.75 12.53s.89 2.95 2.19 3.66c-.54 1.4-.24 3.03.88 4.15s2.75 1.42 4.15.88c.71 1.3 2.08 2.18 3.66 2.18s2.95-.88 3.66-2.18c1.4.54 3.03.24 4.15-.88s1.42-2.75.88-4.15c1.3-.71 2.18-2.08 2.18-3.66z"
      />
      <path
        fill="none"
        stroke="#fff"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M7.8 12.6l2.9 2.9 5.6-5.9"
      />
    </svg>
  );
};

export default VerifiedBadge;
