/*
document.addEventListener("contextmenu", e => e.preventDefault());
document.onkeydown = e => {
  if (e.key === "F12" || (e.ctrlKey && e.shiftKey && e.key === "I")) {
    e.preventDefault();
  }
};
*/

document.querySelector("form").addEventListener("submit", async (e) => {
  e.preventDefault();

  const fullname = document.getElementById("fullname").value;
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  try {
    const response = await fetch("http://localhost:5000/admin-signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        a_full_name: fullname,
        a_gmail: email,
        a_password: password
      })
    });

    const data = await response.json();

    if (response.ok) {
      alert(data.message);
      document.querySelector("form").reset(); 
      window.location.href = "/Admin_Side/auth/html/loginpage.html";
    } else {
      alert("Error: " + data.error);
      document.querySelector("form").reset(); 
    }
  } catch (err) {
    console.error("Fetch error:", err);
    alert("Could not connect to server.");
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