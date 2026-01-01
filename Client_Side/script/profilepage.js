
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


const token = localStorage.getItem("authToken");

if (!token) {
  window.location.replace("/Client_Side/auth/loginpage.html");
} else {
  fetch("http://localhost:5000/verifyToken", {
    method: "GET",
    headers: { "Authorization": `Bearer ${token}` }
  })
  .then(res => {
    if (!res.ok) {
      return res.json().then(err => {
        console.error("Error response:", err);
        throw new Error(err.message || "Unauthorized");
      });
    }
    return res.json();
  })
  .then(data => {

    // DISPLAY IN PROFILE PAGE
    document.getElementById("usernameDisplay").innerText = data.name;
    document.getElementById("useremailDisplay").innerText = data.email;

  })
  .catch(err => {
    localStorage.removeItem("authToken");
    window.location.replace("/Client_Side/auth/loginpage.html");
  });
}


const userEmail = localStorage.getItem("userEmail");
document.addEventListener("DOMContentLoaded", async () => {
    const usernameSpan = document.getElementById("usernameDisplay");
    const useremailSpan = document.getElementById("useremailDisplay");

    if (!userEmail) {
        usernameSpan.textContent = "Guest";
        useremailSpan.textContent = "guest@example.com";
        return;
    }

    try {
        const res = await fetch(`http://localhost:5000/get-user-info?email=${encodeURIComponent(userEmail)}`, {
        method: "GET",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        });

        if (!res.ok) throw new Error(`Server error: ${res.status}`);

        const data = await res.json();
        usernameSpan.textContent = data.name || "Guest";
        useremailSpan.textContent = userEmail || "guest@example.com";
    } catch (err) {
        console.error(err);
        useremailSpan.textContent = "guest@example.com";
        usernameSpan.textContent = "Guest";
    }
});
const profileDiv = document.getElementById("profile-img");
const profileIcon = profileDiv.querySelector("i");
const profileInput = document.getElementById("profileInput");
const usernameDisplay = document.getElementById("usernameDisplay");

// Fetch user info from backend
async function loadUserProfile() {
  try {
    const res = await fetch(`http://localhost:5000/get-user-info?email=${userEmail}`);
    const data = await res.json();

    if(data.name) {
      usernameDisplay.textContent = data.name;
    }

    if(data.profileImage) {
      profileIcon.style.display = "none";
      let img = profileDiv.querySelector("img");
      if(!img) {
        img = document.createElement("img");
        profileDiv.appendChild(img);
      }
      img.src = `http://localhost:5000${data.profileImage}`;
      img.alt = "Profile Picture";
    }
  } catch(err) {
    console.error("Failed to load user profile:", err);
  }
}

// Call on page load
window.addEventListener("load", loadUserProfile);

// --- Upload new profile image ---
profileDiv.addEventListener("click", () => profileInput.click());

profileInput.addEventListener("change", async (e) => {
  const file = e.target.files[0];
  if(!file) return;

  // Preview immediately
  const reader = new FileReader();
  reader.onload = function(event) {
    profileIcon.style.display = "none";
    let img = profileDiv.querySelector("img");
    if(!img) {
      img = document.createElement("img");
      profileDiv.appendChild(img);
    }
    img.src = event.target.result;
  };
  reader.readAsDataURL(file);

  // Upload to backend
  const formData = new FormData();
  formData.append("profile", file);
  formData.append("email", userEmail);

  try {
    const res = await fetch("http://localhost:5000/upload-profile", {
      method: "POST",
      body: formData
    });
    const data = await res.json();
    if(data.path) {
      console.log("Profile image uploaded:", data.path);
    }
  } catch(err) {
    console.error("Upload failed:", err);
  }
});


// Get Elements
const modal = document.getElementById("changePasswordModal");
const changePasswordBtn = document.getElementById("changePasswordBtn");
const closeModal = document.getElementById("closeModal");

// Open modal
changePasswordBtn.addEventListener("click", () => {
  modal.style.display = "flex";
});

// Close modal (X button)
closeModal.addEventListener("click", () => {
  modal.style.display = "none";
});

// Close modal if clicking outside the content
window.addEventListener("click", (e) => {
  if (e.target === modal) {
    modal.style.display = "none";
  }
});

// Change Password
document.querySelector(".changePassword-form").addEventListener("submit", async (e) => {
  e.preventDefault();

  try {
    showLoading(true);

    const currentPassword = document.getElementById("currentPassword").value;
    const newPassword = document.getElementById("newPassword").value;
    const confirmPassword = document.getElementById("confirmPassword").value;
    const email = userEmail;

    if (!email) {
      showLoading(false);
      showToast("No user logged in.", true);
      return;
    }

    if (currentPassword === newPassword) {
      showLoading(false);
      showToast("New password must be different from the current password.", true);
      return;
    }

    if (newPassword !== confirmPassword) {
      showLoading(false);
      showToast("New password and confirm password do not match.", true);
      return;
    }

    const response = await fetch("http://localhost:5000/change-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, currentPassword, newPassword })
    });

    if (!response.ok) {
      showLoading(false);
      showToast("Server Error. Try again later.", true);
      return;
    }

    const result = await response.json();
    showLoading(false);
    showToast(result.message);

    // Reload only after success
    setTimeout(() => location.reload(), 800);

  } catch (error) {
    showLoading(false);
    console.error("Error:", error);
    showToast("Something went wrong. Please try again.", true);
  }
});


// ===== Password Views =====
function togglePassword(inputId, iconId) {
  const input = document.getElementById(inputId);
  const icon = document.getElementById(iconId);

  if (input.type === "password") {
    input.type = "text";
    icon.classList.remove("fa-eye");
    icon.classList.add("fa-eye-slash");
  } else {
    input.type = "password";
    icon.classList.remove("fa-eye-slash");
    icon.classList.add("fa-eye");
  }
}

// Toggle buttons
document.getElementById("toggleCurrentPassword").addEventListener("click", () => {
  togglePassword("currentPassword", "toggleCurrentPassword");
});
document.getElementById("toggleNewPassword").addEventListener("click", () => {
  togglePassword("newPassword", "toggleNewPassword");
});

document.getElementById("toggleConfirmPassword").addEventListener("click", () => {
  togglePassword("confirmPassword", "toggleConfirmPassword");
});


// Go to Home
document.getElementById("backHomeBtn").addEventListener("click", () => {
  window.location.href = "/Client_Side/html/homepage.html";
});

const confirmationModal = document.getElementById("confirmationModal");
const confirmationTitle = document.getElementById("confirmationTitle");
const confirmationMessage = document.getElementById("confirmationMessage");
const confirmYesBtn = document.getElementById("confirmYesBtn");
const confirmNoBtn = document.getElementById("confirmNoBtn");

confirmNoBtn.addEventListener("click", () => {
  confirmationModal.style.display = "none";
});

window.addEventListener("click", (e) => {
  if (e.target === confirmationModal) {
    confirmationModal.style.display = "none";
  }
});

function showConfirmationModal({ title, message, onYes, onNo }) {
  const modal = document.getElementById("confirmationModal");
  const modalTitle = modal.querySelector(".changePassword-header");
  const modalMessage = modal.querySelector("p");
  const yesBtn = modal.querySelector("#confirmYesBtn");
  const noBtn = modal.querySelector("#confirmNoBtn");

  modalTitle.innerText = title;
  modalMessage.innerText = message;
  modal.style.display = "flex";

  yesBtn.onclick = () => {
    modal.style.display = "none";
    if (onYes) onYes();
  };

  noBtn.onclick = () => {
    modal.style.display = "none";
    if (onNo) onNo();
  };
}


// Go to Login
document.getElementById("logoutBtn").addEventListener("click", () => {
  showConfirmationModal({
    title: "Logout",
    message: "Are you sure you want to logout?",
    onYes: () => {
      localStorage.clear();
      showLoading(true);
      setTimeout(() => {
        showLoading(false); 
        window.location.href = "/Client_Side/auth/index.html";
        showToast("Thank Youu!...");
      }, 2000);
    },
    onNo: () => {
      location.reload();
    }
  });
});

const userID = localStorage.getItem("userId");

async function fetchUserBookings(userId) {
  try {
    const response = await fetch(`http://localhost:5000/user-bookings/${userId}`);
    const bookings = await response.json();

    const bookingList = document.getElementById("bookingList");
    bookingList.innerHTML = ""; 

    if (!bookings || bookings.length === 0) {
      bookingList.innerHTML = "<tr><td colspan='6'>No bookings found.</td></tr>";
      return;
    }

    bookings.forEach(booking => {
      const tr = document.createElement("tr");
      tr.setAttribute("data-id", booking.booking_id);

      let actionBtnHTML = "";
      // If CASH + confirmed ➜ Show Cancel button
      if (booking.payment_method === "cash" && booking.status === "confirmed") {
        actionBtnHTML = `<button class="cancel-btn" data-id="${booking.booking_id}">Cancel</button>`;
      }
      // If PAID or cancelled ➜ Show Delete button (frontend-only)
      if (booking.status === "paid" || booking.status === "cancelled") {
        actionBtnHTML = `<button class="delete-btn" data-id="${booking.booking_id}">Delete</button>`;
      }

      tr.innerHTML = `
        <td>${booking.name}</td>
        <td>${booking.type}</td>
        <td>${booking.capacity}</td>
        <td>${new Date(booking.booking_date).toLocaleString()}</td>
        <td>${booking.status}</td>
        <td>${actionBtnHTML}</td>
      `;
      bookingList.appendChild(tr);
    });

    // --- Cancel button ---
    document.querySelectorAll(".cancel-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        const bookingId = btn.dataset.id;
        if (!bookingId) return;

        showConfirmationModal({
          title: "Cancel Booking",
          message: "Are you sure you want to cancel this booking?",
          onYes: async () => {
            showToast("Cancelling booking...", false);
            showLoading(true);

            try {
              const res = await fetch("http://localhost:5000/booking-cancel", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ bookingId }),
              });

              const data = await res.json();
              showLoading(false);

              if (data.success) {
                btn.closest("tr").remove();
                showToast("Booking cancelled successfully!");
              } else {
                showToast("Failed to cancel booking.", true);
              }
            } catch (err) {
              showLoading(false);
              showToast("Error cancelling booking.", true);
              console.error(err);
            }
          },
          onNo: () => {
            location.reload();
          }
        });
      });
    });

    // --- Delete button (UI only, stored in localStorage) ---
    document.querySelectorAll(".delete-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        const row = btn.closest("tr");
        const bookingId = btn.dataset.id;

        showConfirmationModal({
          title: "Delete Booking",
          message: "This will hide the booking. Continue?",
          onYes: () => {
            // Save deleted booking in localStorage
            let deleted = JSON.parse(localStorage.getItem("deletedBookings")) || [];
            if (!deleted.includes(bookingId)) {
              deleted.push(bookingId);
              localStorage.setItem("deletedBookings", JSON.stringify(deleted));
            }

            // Remove from UI
            row.remove();
            showToast("Booking deleted.");
            location.reload();
          },
          onNo: () => {}
        });
      });
    });

    // --- Remove deleted bookings on load ---
    const deleted = JSON.parse(localStorage.getItem("deletedBookings")) || [];
    deleted.forEach(id => {
      const row = document.querySelector(`tr[data-id="${id}"]`);
      if (row) row.remove();
    });

  } catch (err) {
    console.error("Error fetching bookings:", err);
  }
}

// Call the function
fetchUserBookings(userID);




