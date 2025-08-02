(() => {
  "use strict";

  console.log("Overlay Timer content script loaded");

  let wrapper = null;
  let mask = null;
  let isDown = false;
  let startX, startY;

  /* 1. Toolbar click */
  chrome.runtime.onMessage.addListener((msg) => {
    console.log("Message received:", msg);
    if (msg === "toggle-overlay") toggleOverlay();
  });

  /* 2. Close message from iframe */
  window.addEventListener("message", (e) => {
    if (e.data === "close-overlay") {
      removeOverlay();
    } else if (e.data.type === "resize") {
      // Resize the wrapper when switching between normal and compact mode
      if (wrapper) {
        wrapper.style.height = `${e.data.height}px`;
      }
    }
  });

  /* 3. Show / hide overlay */
  function toggleOverlay() {
    console.log("Toggle overlay called, wrapper exists:", !!wrapper);
    wrapper ? removeOverlay() : createOverlay();
  }

  /* 4. Build timer + transparent drag mask */
  function createOverlay() {
    if (wrapper) return;

    console.log("Creating overlay...");

    /* --- wrapper --- */
    wrapper = document.createElement("div");
    Object.assign(wrapper.style, {
      position: "fixed",
      top: "20px",
      right: "20px",
      width: "280px",
      height: "260px", // Updated from 290px
      zIndex: "2147483647",
    });

    /* --- iframe --- */
    const iframe = document.createElement("iframe");
    const timerUrl = chrome.runtime.getURL("timer.html");
    console.log("Timer URL:", timerUrl);
    iframe.src = timerUrl;
    Object.assign(iframe.style, {
      width: "100%",
      height: "100%",
      border: "none",
      borderRadius: "18px",
    });

    iframe.onload = () => console.log("Timer iframe loaded successfully");
    iframe.onerror = (e) => console.error("Timer iframe failed to load:", e);

    wrapper.appendChild(iframe);

    /* --- transparent drag mask (top 12 px) --- */
    mask = document.createElement("div");
    Object.assign(mask.style, {
      position: "absolute",
      top: 0,
      left: 0,
      width: "100%",
      height: "12px" /* Reduced from 20px */,
      cursor: "grab",
      zIndex: "99999" /* above iframe */,
    });
    wrapper.appendChild(mask);

    document.documentElement.appendChild(wrapper);
    console.log("Overlay created and added to DOM");

    /* 5. Drag handlers on the mask */
    mask.addEventListener("pointerdown", (e) => {
      isDown = true;
      startX = e.clientX;
      startY = e.clientY;
      mask.setPointerCapture(e.pointerId);
      mask.style.cursor = "grabbing";
    });

    mask.addEventListener("pointermove", (e) => {
      if (!isDown) return;
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      wrapper.style.left = `${wrapper.offsetLeft + dx}px`;
      wrapper.style.top = `${wrapper.offsetTop + dy}px`;
      wrapper.style.right = "auto";
      startX = e.clientX;
      startY = e.clientY;
    });

    mask.addEventListener("pointerup", () => {
      isDown = false;
      mask.releasePointerCapture?.(mask.pointerId);
      mask.style.cursor = "grab";
    });
  }

  /* 6. Remove */
  function removeOverlay() {
    console.log("Removing overlay");
    if (wrapper) {
      wrapper.remove();
      wrapper = null;
      mask = null;
    }
  }
})();
