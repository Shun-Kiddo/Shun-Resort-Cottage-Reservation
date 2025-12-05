document.addEventListener("DOMContentLoaded", fetchRevenue);

function showToast(message, isError = false) {
  const toast = document.getElementById("toast");
  toast.textContent = message;
  toast.style.background = isError
    ? "linear-gradient(135deg, #e63946, #d62828)"
    : "linear-gradient(135deg, #0077b6, #00b4d8)";
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 3000);
}

function showLoading(show) {
  const overlay = document.getElementById("loading-overlay");
  overlay.style.display = show ? "flex" : "none";
}

// Logout
document.getElementById("logoutBtn").addEventListener("click", () => {
  if(confirm("Are you sure you want to logout?")){
    localStorage.clear();
    window.location.href = "/Admin_Side/auth/html/loginpage.html";
  }
});

async function fetchRevenue() {
  showLoading(true);
  try {
    const res = await fetch("http://localhost:5000/admin-revenue");
    const data = await res.json();

    // Total revenue
    document.getElementById("totalRevenue").textContent = parseFloat(data.totalRevenue).toLocaleString();

    // Prepare monthly chart
    const months = data.monthly.map(m => m.month);
    const revenue = data.monthly.map(m => m.revenue);

    const ctx = document.getElementById("monthlyChart").getContext("2d");
    new Chart(ctx, {
      type: "bar",
      data: {
        labels: months,
        datasets: [{
          label: "Revenue (₱)",
          data: revenue,
          backgroundColor: "rgba(6, 248, 27, 1)",
          borderColor: "rgba(6, 248, 27, 1)",
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { display: false },
          tooltip: { mode: "index", intersect: false }
        },
        scales: {
          y: { beginAtZero: true }
        }
      }
    });

  } catch (err) {
    console.error(err);
    showToast("❌ Failed to load revenue data", true);
  } finally {
    showLoading(false);
  }
}
