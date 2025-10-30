// === Disable Inspect (Optional) ===
/*
document.addEventListener("contextmenu", e => e.preventDefault());
document.onkeydown = e => {
  if (e.key === "F12" || (e.ctrlKey && e.shiftKey && e.key === "I")) {
    e.preventDefault();
  }
};
*/

let userEmail = "";

// === Toast Notification ===
function showToast(message, isError = false) {
  const toast = document.getElementById("toast");
  toast.textContent = message;
  toast.style.background = isError
    ? "linear-gradient(135deg, #e63946, #d62828)" // red error
    : "linear-gradient(135deg, #0077b6, #00b4d8)"; // resort blue
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 3000);
}

// === Loading Spinner ===
function showLoading(show) {
  const overlay = document.getElementById("loading-overlay");
  overlay.style.display = show ? "flex" : "none";
}

// === Send OTP ===
async function sendOtp() {
  const emailInput = document.getElementById("email");
  const email = emailInput.value.trim();
  if (!email) return showToast("⚠️ Please enter your email", true);

  try {
    showLoading(true);
    const response = await fetch("http://localhost:5000/forgot", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email })
    });

    const result = await response.json();
    showLoading(false);

    if (response.ok && result.success) {
      showToast("✅ OTP sent to your email!");
      userEmail = email;
      emailInput.value = "";

      document.getElementById("emailStep").style.display = "none";
      document.getElementById("otpStep").style.display = "block";
      document.querySelectorAll(".otp-box").forEach(input => (input.value = ""));
    } else {
      showToast(result.error || "❌ Failed to send OTP", true);
      emailInput.value = "";
    }
  } catch (err) {
    showLoading(false);
    console.error("Error:", err);
    showToast("🚫 Server error. Try again later.", true);
    emailInput.value = "";
  }
}

// === Verify OTP ===
async function verifyOtp() {
  const otpInputs = document.querySelectorAll(".otp-box");
  const otp = Array.from(otpInputs).map(input => input.value).join("");

  if (otp.length !== 6)
    return showToast("⚠️ Please enter a valid 6-digit OTP", true);

  try {
    showLoading(true);
    const response = await fetch("http://localhost:5000/verify-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: userEmail, otp })
    });

    const result = await response.json();
    showLoading(false);

    if (response.ok && result.success) {
      localStorage.setItem("resetEmail", userEmail);
      showToast("✅ OTP Verified! Redirecting...");
      setTimeout(() => {
        window.location.href = "/Client_Side/auth/resetpassword.html";
      }, 1000);
    } else {
      showToast(result.error || "❌ Invalid OTP. Try again.", true);
      otpInputs.forEach(input => (input.value = ""));
      otpInputs[0].focus();
    }
  } catch (err) {
    showLoading(false);
    console.error("Error verifying OTP:", err);
    showToast("🚫 Server error. Try again later.", true);
    document.querySelectorAll(".otp-box").forEach(input => (input.value = ""));
  }
}

// === Resend OTP ===
async function resendOtp() {
  if (!userEmail) return showToast("⚠️ Enter your email first", true);

  try {
    showLoading(true);
    const response = await fetch("http://localhost:5000/forgot", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: userEmail })
    });

    const result = await response.json();
    showLoading(false);

    if (response.ok && result.success) {
      showToast("✅ OTP resent to your email!");
      document.querySelectorAll(".otp-box").forEach(input => (input.value = ""));
    } else {
      showToast(result.error || "❌ Failed to resend OTP", true);
    }
  } catch (err) {
    showLoading(false);
    console.error("Error:", err);
    showToast("🚫 Server error. Try again later.", true);
  }
}

// === Auto move cursor in OTP inputs ===
document.addEventListener("DOMContentLoaded", () => {
  const inputs = document.querySelectorAll(".otp-box");
  inputs.forEach((input, index) => {
    input.addEventListener("input", () => {
      if (input.value.length === 1 && index < inputs.length - 1) {
        inputs[index + 1].focus();
      }
    });
  });
});
