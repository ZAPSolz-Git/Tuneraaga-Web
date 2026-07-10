import { useEffect } from "react";

const useAntiInspect = () => {
  useEffect(() => {
    // ── Block right-click ──
    const blockRightClick = (e) => e.preventDefault();
    document.addEventListener("contextmenu", blockRightClick);

    // ── Block keyboard shortcuts ──
    const blockKeys = (e) => {
      // F12
      if (e.key === "F12") {
        e.preventDefault();
        return false;
      }

      // Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+Shift+C
      if (
        e.ctrlKey &&
        e.shiftKey &&
        ["I", "J", "C"].includes(e.key.toUpperCase())
      ) {
        e.preventDefault();
        return false;
      }

      // Ctrl+U (View Source)
      if (e.ctrlKey && e.key.toUpperCase() === "U") {
        e.preventDefault();
        return false;
      }

      // Ctrl+S (Save Page)
      if (e.ctrlKey && e.key.toUpperCase() === "S") {
        e.preventDefault();
        return false;
      }

      // Ctrl+A (Select All)
      if (e.ctrlKey && e.key.toUpperCase() === "A") {
        e.preventDefault();
        return false;
      }

      // Ctrl+C (Copy)
      if (e.ctrlKey && e.key.toUpperCase() === "C") {
        e.preventDefault();
        return false;
      }
    };
    document.addEventListener("keydown", blockKeys);

    // ── Block drag ──
    const blockDrag = (e) => e.preventDefault();
    document.addEventListener("dragstart", blockDrag);

    // ── Block copy/cut events ──
    const blockCopy = (e) => e.preventDefault();
    document.addEventListener("copy", blockCopy);
    document.addEventListener("cut", blockCopy);

    // ── Block text selection via CSS ──
    const style = document.createElement("style");
    style.textContent = `
      * {
        -webkit-user-select: none !important;
        -moz-user-select: none !important;
        -ms-user-select: none !important;
        user-select: none !important;
        -webkit-touch-callout: none !important;
      }
    `;
    document.head.appendChild(style);

    // ── Detect DevTools open (debugger trap) ──
    const detectDevTools = () => {
      const threshold = 160;
      const check = () => {
        const widthThreshold =
          window.outerWidth - window.innerWidth > threshold;
        const heightThreshold =
          window.outerHeight - window.innerHeight > threshold;
        if (widthThreshold || heightThreshold) {
          document.body.innerHTML = "";
          document.body.style.background = "#0D0B1A";
          document.body.style.display = "flex";
          document.body.style.alignItems = "center";
          document.body.style.justifyContent = "center";
          document.body.style.height = "100vh";
          document.body.style.margin = "0";
          document.body.innerHTML = `
            <div style="text-align:center;color:#8B879E;font-family:sans-serif;">
              <h1 style="font-size:48px;margin:0;">🚫</h1>
              <p style="font-size:18px;margin:10px 0 0;">Access Denied</p>
              <p style="font-size:12px;margin:5px 0 0;color:#555;">Inspecting this application is not allowed.</p>
            </div>
          `;
        }
      };
      setInterval(check, 1000);
    };
    detectDevTools();

    // ── Cleanup on unmount ──
    return () => {
      document.removeEventListener("contextmenu", blockRightClick);
      document.removeEventListener("keydown", blockKeys);
      document.removeEventListener("dragstart", blockDrag);
      document.removeEventListener("copy", blockCopy);
      document.removeEventListener("cut", blockCopy);
      if (style.parentNode) document.head.removeChild(style);
    };
  }, []);
};

export default useAntiInspect;
