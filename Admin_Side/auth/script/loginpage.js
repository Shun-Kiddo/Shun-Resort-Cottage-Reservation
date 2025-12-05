// Block the inspect
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

// === Login Form Logic ===
document.querySelector("form").addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();

  if (!email || !password) return showToast("⚠️ Please fill in all fields", true);

  try {
    showLoading(true);
    const response = await fetch("http://localhost:5000/admin-login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });

    const result = await response.json();
    showLoading(false);

  if (response.ok) {
    document.querySelector("form").reset();
    showToast("Login successful! Redirecting...");
    showLoading(true);

    setTimeout(() => {
      showLoading(false);
      window.location.replace("/Admin_Side/admin_html/admin_dashboard.html");
    }, 2000);
  }else {
      showToast(result.message || "Invalid email or password", true);
    }

  } catch (err) {
    showLoading(false);
    console.error("Login error:", err);
    showToast("🚫 Something went wrong. Try again later.", true);
  }
});

// === Password Visibility Toggle ===
const togglePassword = document.getElementById("togglePassword");
const password = document.getElementById("password");
togglePassword.addEventListener("click", () => {
  const type = password.getAttribute("type") === "password" ? "text" : "password";
  password.setAttribute("type", type);
  togglePassword.classList.toggle("fa-eye");
  togglePassword.classList.toggle("fa-eye-slash");
});
