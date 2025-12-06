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

document.querySelector("form").addEventListener("submit", async (e) => {
  e.preventDefault();

  const fullname = document.getElementById("fullname").value;
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  try {
    showLoading(true);
    const response = await fetch("http://localhost:5000/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        c_full_name: fullname,
        c_gmail: email,
        c_password: password
      })
    });

    const data = await response.json();
    showLoading(false);
    if (response.ok) {
        document.querySelector("form").reset(); 
        showLoading(true);
        showToast("Sign Up successful!");
        setTimeout(() => {
          showLoading(false);
          window.location.href = "/Client_Side/auth/loginpage.html";
        }, 2000);
      } else {
        alert("Error: " + data.error);
        document.querySelector("form").reset(); 
      }
  } catch (err) {
    showLoading(false);
    console.error("Fetch error:", err);
    showToast("Something went wrong. Try again later.", true);
  }
});

const togglePassword = document.getElementById('togglePassword');
const password = document.getElementById('password');
togglePassword.addEventListener('click', () => {
    
    const type = password.getAttribute('type') === 'password' ? 'text' : 'password';
    password.setAttribute('type', type);
    togglePassword.classList.toggle('fa-eye');
    togglePassword.classList.toggle('fa-eye-slash');
});