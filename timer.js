(() => {
  "use strict";
  const display = document.getElementById("timeDisplay");
  const compactDisplay = document.getElementById("compactTimeDisplay");
  const startPauseBtn = document.getElementById("startPause");
  const resetBtn = document.getElementById("reset");
  const closeBtn = document.getElementById("closeBtn");
  const minimizeBtn = document.getElementById("minimizeBtn");
  const compactStartPauseBtn = document.getElementById("compactStartPause");
  const compactResetBtn = document.getElementById("compactReset");
  const expandBtn = document.getElementById("expandBtn");
  const panel = document.getElementById("panel");
  const normalMode = document.getElementById("normalMode");
  const compactMode = document.getElementById("compactMode");
  const quickBtns = document.querySelectorAll(".quick-add button");
  const progressFill = document.querySelector(".progress-ring__fill");
  const CIRCUMFERENCE = 2 * Math.PI * 70; // Updated radius
  let BASE_SECONDS = 300; // 5 minutes = 5 * 60 seconds
  let total = BASE_SECONDS;
  let remaining = BASE_SECONDS;
  let running = false;
  let interval = null;
  let userEdited = false; // Track if user manually edited the time
  let isEditing = false; // Track if we're in edit mode
  let isCompact = false; // Track compact mode
  let isFinished = false; // Track if timer finished

  function secToHHMMSS(s) {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const ss = s % 60;
    return `${String(h).padStart(2, "0")}:${String(m).padStart(
      2,
      "0"
    )}:${String(ss).padStart(2, "0")}`;
  }
  function updateDisplay() {
    const timeStr = secToHHMMSS(remaining);
    display.value = timeStr;
    compactDisplay.value = timeStr;

    const pct = (total - remaining) / total;
    const offset = CIRCUMFERENCE * (1 - pct);
    progressFill.style.strokeDasharray = `${CIRCUMFERENCE}`;
    progressFill.style.strokeDashoffset = offset;

    // Show/hide quick-add buttons based on running state (only in normal mode)
    if (!isCompact) {
      const quickAddDiv = document.querySelector(".quick-add");
      if (running || isFinished) {
        quickAddDiv.classList.add("hidden");
      } else {
        quickAddDiv.classList.remove("hidden");
      }
    }

    // Update button states and visibility
    if (isFinished) {
      // Timer finished - only show reset button (centered)
      startPauseBtn.style.display = "none";
      resetBtn.style.display = "block";
      resetBtn.textContent = "⟲";
      resetBtn.classList.add("reset-only");

      compactStartPauseBtn.style.display = "none";
      compactResetBtn.style.display = "block";
      compactResetBtn.classList.add("active");
    } else {
      // Normal operation
      startPauseBtn.style.display = "block";
      resetBtn.style.display = "block";
      resetBtn.classList.remove("reset-only");

      startPauseBtn.textContent = running ? "⏸" : "▶";
      resetBtn.textContent = "⟲";

      compactStartPauseBtn.style.display = "block";
      compactResetBtn.style.display = "block";
      compactStartPauseBtn.textContent = running ? "⏸" : "▶";
      compactStartPauseBtn.classList.toggle("active", running);
      compactResetBtn.classList.remove("active");
    }
  }
  function beep() {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.setValueAtTime(800, ctx.currentTime);
    osc.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.3);
  }
  function tick() {
    if (remaining <= 0) {
      clearInterval(interval);
      running = false;
      isFinished = true;
      beep();
      updateDisplay();
      return;
    }
    remaining--;
    updateDisplay();
  }
  function startPause() {
    if (isFinished) return; // Don't allow start/pause when finished

    if (running) {
      clearInterval(interval);
      running = false;
    } else {
      // Only update base time if user manually edited it and we're starting fresh
      if (userEdited && remaining === BASE_SECONDS) {
        const currentDisplay = isCompact ? compactDisplay : display;
        const candidate = timeStringToSeconds(currentDisplay.value);
        BASE_SECONDS = candidate;
        total = BASE_SECONDS;
        remaining = BASE_SECONDS;
        userEdited = false; // Reset the flag
      }
      interval = setInterval(tick, 1000);
      running = true;
    }
    updateDisplay(); // Update display to show/hide buttons and apply validation
  }
  function reset() {
    clearInterval(interval);
    running = false;
    isFinished = false;
    total = BASE_SECONDS;
    remaining = BASE_SECONDS;
    userEdited = false; // Reset edit flag on reset
    updateDisplay();
  }

  // Convert HH:MM:SS string to 6-digit number string (removing colons)
  function timeStringToDigits(timeStr) {
    return timeStr.replace(/:/g, "");
  }

  // Convert 6-digit number string to HH:MM:SS format
  function digitsToTimeString(digits) {
    const paddedDigits = digits.padStart(6, "0");
    const hours = paddedDigits.substring(0, 2);
    const minutes = paddedDigits.substring(2, 4);
    const seconds = paddedDigits.substring(4, 6);
    return `${hours}:${minutes}:${seconds}`;
  }

  // Convert HH:MM:SS to seconds with validation
  function timeStringToSeconds(timeStr) {
    const [h, m, s] = timeStr.split(":").map(Number);
    // Cap hours at 99, minutes at 59, and seconds at 59
    const validHours = Math.min(h, 99);
    const validMinutes = Math.min(m, 59);
    const validSeconds = Math.min(s, 59);
    return validHours * 3600 + validMinutes * 60 + validSeconds;
  }

  function enterEditMode() {
    if (running) startPause(); // Pause if running
    isEditing = true;
    const currentDisplay = isCompact ? compactDisplay : display;
    currentDisplay.readOnly = false;
    currentDisplay.focus();
    // Set cursor to the end instead of selecting all
    currentDisplay.setSelectionRange(
      currentDisplay.value.length,
      currentDisplay.value.length
    );
  }

  function exitEditMode() {
    isEditing = false;
    const currentDisplay = isCompact ? compactDisplay : display;
    currentDisplay.readOnly = true;
    const newSeconds = timeStringToSeconds(currentDisplay.value);
    if (newSeconds !== remaining) {
      userEdited = true;
      remaining = newSeconds;
      if (!running) {
        BASE_SECONDS = newSeconds;
        total = BASE_SECONDS;
      }
    }
    updateDisplay();
  }

  function toggleCompactMode() {
    isCompact = !isCompact;
    if (isCompact) {
      panel.classList.add("compact");
      normalMode.style.display = "none";
      compactMode.style.display = "flex";
      minimizeBtn.style.display = "none";
      // Notify parent to resize
      window.parent.postMessage({ type: "resize", height: 44 }, "*");
    } else {
      panel.classList.remove("compact");
      normalMode.style.display = "flex";
      compactMode.style.display = "none";
      minimizeBtn.style.display = "block";
      // Notify parent to resize
      window.parent.postMessage({ type: "resize", height: 260 }, "*");
    }
    updateDisplay();
  }

  /* quick-add buttons */
  quickBtns.forEach((btn) =>
    btn.addEventListener("click", () => {
      const addSeconds = Number(btn.dataset.add);
      const maxSeconds = 99 * 3600 + 59 * 60 + 59; // 99:59:59 in seconds

      // Only add time if it won't exceed the maximum
      if (remaining + addSeconds <= maxSeconds) {
        remaining += addSeconds;
        // Also update base and total if not running
        if (!running) {
          BASE_SECONDS = remaining;
          total = BASE_SECONDS;
        }
        updateDisplay();
      }
    })
  );

  /* Click to edit */
  display.addEventListener("click", enterEditMode);
  compactDisplay.addEventListener("click", enterEditMode);

  /* Handle edit mode */
  display.addEventListener("blur", exitEditMode);
  compactDisplay.addEventListener("blur", exitEditMode);

  display.addEventListener("keydown", handleKeydown);
  compactDisplay.addEventListener("keydown", handleKeydown);

  function handleKeydown(e) {
    if (!isEditing) return;

    if (e.key === "Enter") {
      e.target.blur();
      return;
    }

    if (e.key === "Escape") {
      // Cancel editing, restore original value
      updateDisplay();
      e.target.blur();
      return;
    }

    // Handle number input (0-9)
    if (/^[0-9]$/.test(e.key)) {
      e.preventDefault();
      const currentDigits = timeStringToDigits(e.target.value);
      const newDigits = (currentDigits + e.key).slice(-6); // Keep only last 6 digits
      const newTimeString = digitsToTimeString(newDigits);

      // Allow input up to 99:59:59 (validation happens on start)
      const [hours, minutes, seconds] = newTimeString.split(":").map(Number);
      if (hours <= 99 && minutes <= 99 && seconds <= 99) {
        e.target.value = newTimeString;
      }
      return;
    }

    // Handle backspace/delete
    if (e.key === "Backspace" || e.key === "Delete") {
      e.preventDefault();
      const currentDigits = timeStringToDigits(e.target.value);
      const newDigits = currentDigits.slice(0, -1) || "0"; // Remove last digit, default to "0"
      e.target.value = digitsToTimeString(newDigits);
      return;
    }

    // Block all other keys except navigation keys
    if (!["ArrowLeft", "ArrowRight", "Home", "End", "Tab"].includes(e.key)) {
      e.preventDefault();
    }
  }

  startPauseBtn.addEventListener("click", startPause);
  resetBtn.addEventListener("click", reset);
  compactStartPauseBtn.addEventListener("click", startPause);
  compactResetBtn.addEventListener("click", reset);
  minimizeBtn.addEventListener("click", toggleCompactMode);
  expandBtn.addEventListener("click", toggleCompactMode);
  closeBtn.addEventListener("click", () => {
    window.parent.postMessage("close-overlay", "*");
  });
  updateDisplay();
})();
