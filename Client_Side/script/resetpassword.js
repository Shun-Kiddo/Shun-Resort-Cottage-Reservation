// === Disable inspect (optional) ===
/*
document.addEventListener("contextmenu", e => e.preventDefault());
document.onkeydown = e => {
  if (e.key === "F12" || (e.ctrlKey && e.shiftKey && e.key === "I")) {
    e.preventDefault();
  }
};
*/

// === Toast Notification ===
function showToast(message, isError = false) {
  const toast = document.getElementById("toast");
  toast.textContent = message;
  toast.style.background = isError
    ? "linear-gradient(135deg, #e63946, #d62828)" 
    : "linear-gradient(135deg, #0077b6, #00b4d8)";
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 3000);
}

// === Loading Overlay ===
function showLoading(show) {
  const overlay = document.getElementById("loading-overlay");
  overlay.style.display = show ? "flex" : "none";
}

// === Reset Password Logic ===
document.querySelector("form").addEventListener("submit", async (e) => {
  e.preventDefault();
  await resetPassword();
});

async function resetPassword() {
  const newPassword = document.getElementById("newPassword").value.trim();
  const confirmPassword = document.getElementById("confirmPassword").value.trim();

  if (!newPassword || !confirmPassword)
    return showToast("Please fill in all fields", true);

  if (newPassword !== confirmPassword)
    return showToast("Passwords do not match!", true);

  const email = localStorage.getItem("resetEmail");
  if (!email)
    return showToast("No email found. Please verify OTP again.", true);

  try {
    showLoading(true);
    const response = await fetch("http://localhost:5000/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, newPassword }),
    });

    const result = await response.json();
    showLoading(false);

    if (response.ok && result.success) {
      showToast("Password reset successful! Redirecting...");
      localStorage.removeItem("resetEmail");
      setTimeout(() => {
        window.location.href = "/Client_Side/auth/loginpage.html";
      }, 1000);
    } else {
      showToast(result.error || "Failed to reset password.", true);
    }
  } catch (error) {
    showLoading(false);
    console.error("Reset password error:", error);
    showToast("Something went wrong. Try again later.", true);
  }
}

// === Password Visibility Toggles ===
const toggleNewPassword = document.getElementById("toggleNewPassword");
const newPasswordInput = document.getElementById("newPassword");

if (toggleNewPassword && newPasswordInput) {
  toggleNewPassword.addEventListener("click", () => {
    const type = newPasswordInput.type === "password" ? "text" : "password";
    newPasswordInput.type = type;
    toggleNewPassword.classList.toggle("fa-eye");
    toggleNewPassword.classList.toggle("fa-eye-slash");
  });
}

const toggleConfirmPassword = document.getElementById("toggleConfirmPassword");
const confirmPasswordInput = document.getElementById("confirmPassword");

if (toggleConfirmPassword && confirmPasswordInput) {
  toggleConfirmPassword.addEventListener("click", () => {
    const type = confirmPasswordInput.type === "password" ? "text" : "password";
    confirmPasswordInput.type = type;
    toggleConfirmPassword.classList.toggle("fa-eye");
    toggleConfirmPassword.classList.toggle("fa-eye-slash");
  });
}
