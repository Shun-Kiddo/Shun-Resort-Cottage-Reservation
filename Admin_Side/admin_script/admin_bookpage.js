const links = document.querySelectorAll(".menu a");
links.forEach(link => {
  link.addEventListener("click", () => {
    links.forEach(l => l.classList.remove("active"));
    link.classList.add("active");
  });
});

// === Logout Button ===
document.getElementById("logoutBtn").addEventListener("click", () => {
  localStorage.clear();
  window.location.href = "/Admin_Side/auth/html/loginpage.html";
});

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

// Confirmation Modal
function confirmAction(message, callbackYes) {
  const confirmBox = document.createElement("div");
  confirmBox.classList.add("confirm-box");

  confirmBox.innerHTML = `
    <div class="confirm-content">
      <p>${message}</p>
      <div class="confirm-buttons">
        <button class="yes-btn">Yes</button>
        <button class="no-btn">No</button>
      </div>
    </div>
  `;

  document.body.appendChild(confirmBox);

  const yesBtn = confirmBox.querySelector(".yes-btn");
  const noBtn = confirmBox.querySelector(".no-btn");

  yesBtn.addEventListener("click", () => {
    confirmBox.remove();
    if (callbackYes) callbackYes();
  });

  noBtn.addEventListener("click", () => {
    confirmBox.remove();
  });
}


// === Loading Overlay ===
function showLoading(show) {
  const overlay = document.getElementById("loading-overlay");
  overlay.style.display = show ? "flex" : "none";
}

document.addEventListener("DOMContentLoaded", fetchBookedUsers);
const deletedBookingss = JSON.parse(localStorage.getItem("deletedBookingss")) || [];
async function fetchBookedUsers() {
  try {
    const response = await fetch("http://localhost:5000/admin-booked-users");
    const bookingList = await response.json();

    const userSection = document.querySelector(".user-section");
    userSection.innerHTML = "";

    if (bookingList.length === 0) {
      userSection.innerHTML = `<p>No bookings found.</p>`;
      return;
    }

    // Load deleted bookings from localStorage
    
     
    bookingList.forEach(booking => {
      // Skip deleted bookings
      if (deletedBookingss.includes(booking.booking_id)) return;

      const card = document.createElement("div");
      card.classList.add("user-card");
      card.dataset.booking = JSON.stringify({
        name: booking.c_full_name,
        email: booking.c_gmail,
        cottage: `${booking.cottage_name} / ${booking.cottage_type}`,
        status: booking.booking_status,
        date: booking.formatted_date
      });

      // Confirm button for cash bookings
      let confirmBtnHTML = "";
      if (booking.payment_method === "cash" && booking.booking_status === "confirmed") {
        confirmBtnHTML = `
          <button class="confirm-btn" data-id="${booking.booking_id}" title="Confirm cash payment">
            <i class="fa-solid fa-check"></i>
          </button>
        `;
      }

      card.innerHTML = `
        <div class="user-info">
          <div class="left-info">
            <p class="sender"><i class="fa-solid fa-user"></i> ${booking.c_full_name} / ${booking.c_gmail}</p>
            <p class="cottage-info"><strong>Cottage:</strong> ${booking.cottage_name} / ${booking.cottage_type} / Capacity: ${booking.cottage_capacity} / ₱${parseFloat(booking.cottage_price).toLocaleString()}</p>
            <p class="time">Booking: ${booking.formatted_date} / Status: <span class="${booking.booking_status}">${booking.booking_status}</span></p>
          </div>
          <div class="right-actions">
            ${confirmBtnHTML}
            <button class="delete-btn" data-id="${booking.booking_id}">
              <i class="fa-solid fa-trash"></i>
            </button>
          </div>
        </div>
      `;

      userSection.appendChild(card);

      // Open modal when card is clicked
      card.addEventListener("click", (e) => {
        if (e.target.closest(".confirm-btn") || e.target.closest(".delete-btn")) return;

        const bookingData = JSON.parse(card.dataset.booking);
        profileName.textContent = bookingData.name;
        profileEmail.textContent = bookingData.email;
        profileCottage.textContent = "Cottage: " + bookingData.cottage;
        profileStatus.textContent = "Status: " + bookingData.status;
        profileDate.textContent = "Booking Date: " + bookingData.date;

        bookingModal.style.display = "flex";
      });

      const bookingModal = document.getElementById("bookingModal");
      const closeBookingModalBtn = document.getElementById("closeModal"); 

      closeBookingModalBtn.addEventListener("click", () => {
        bookingModal.style.display = "none";
      });

      window.addEventListener("click", (e) => {
        if (e.target === bookingModal) {
          bookingModal.style.display = "none";
        }
      });

      
      // Delete booking button (UI-only, persists in localStorage)
      card.querySelector(".delete-btn").addEventListener("click", e => {
        e.stopPropagation();
        confirmAction(
          `Are you sure you want to delete this booking for ${booking.c_full_name}?`,
          () => {
            // Save in localStorage
            let deleted = JSON.parse(localStorage.getItem("deletedBookingss")) || [];
            if (!deleted.includes(booking.booking_id)) {
              deleted.push(booking.booking_id);
              localStorage.setItem("deletedBookingss", JSON.stringify(deleted));
            }

            // Remove from UI
            card.remove();
            showToast("🗑️ Booking Deleted.");
          }
        );
      });
       
      // Confirm payment button
      const confirmBtn = card.querySelector(".confirm-btn");
      if (confirmBtn) {
        confirmBtn.addEventListener("click", e => {
          e.stopPropagation();
          confirmAction(
            `Are you sure you want to confirm payment for ${booking.c_full_name}?`,
            async () => {
              showLoading(true);
              try {
                const res = await fetch(`http://localhost:5000/admin-bookings/confirm-payment/${booking.booking_id}`, {
                  method: "PATCH",
                });
                if (res.ok) {
                  showToast(`✅ Payment confirmed for ${booking.c_full_name}`);
                  fetchBookedUsers();
                } else {
                  showToast("❌ Failed to confirm payment", true);
                }
              } catch (err) {
                console.error(err);
                showToast("❌ Error confirming payment", true);
              } finally {
                showLoading(false);
              }
            }
          );
        });
      }

    });

  } catch (error) {
    console.error("Error fetching booked users:", error);
    showToast("Failed to load booked users", true);
  }
}

