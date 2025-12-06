// === Sidebar link active state ===
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

// === Loading Overlay ===
function showLoading(show) {
  const overlay = document.getElementById("loading-overlay");
  overlay.style.display = show ? "flex" : "none";
}

document.addEventListener("DOMContentLoaded", fetchUserList);
async function fetchUserList() {
  try {
    const response = await fetch("http://localhost:5000/admin-user-list");
    const userList = await response.json();

    const userSection = document.querySelector(".user-section");
    userSection.innerHTML = "";

    if (userList.length === 0) {
      userSection.innerHTML = `<p>No users found.</p>`;
      return;
    }

    userList.forEach(user => {
      const card = document.createElement("div");
      card.classList.add("user-card");
      
      const iconClass = user.is_blocked ? "fa-solid fa-check" : "fa-solid fa-ban";
      const buttonTitle = user.is_blocked ? "Unblock User" : "Block User";

      card.innerHTML = `
        <a href="#" style="text-decoration: none; color: inherit;">
          <div class="user-info">
            <div class="left-info">
              <p class="sender">
                <i class="fa-solid fa-user"></i> ${user.c_full_name || "Anonymous"} / ${user.c_gmail}
              </p>
              <p class="time">${user.formatted_date}</p>
            </div>
            <button class="block-btn" data-id="${user.c_id}" title="${buttonTitle}">
              <i class="${iconClass}"></i>
            </button>
          </div>
        </a>
      `;

      userSection.appendChild(card);

      // Modal open
      card.addEventListener("click", e => {
        if (!e.target.closest(".block-btn")) openModal(user);
      });

      // Block/Unblock button click
      card.querySelector(".block-btn").addEventListener("click", e => {
        e.stopPropagation();
        toggleBlockUser(user.c_id, user.is_blocked);
      });
    });


  } catch (error) {
    console.error("Error fetching users:", error);
    showToast("Failed to load users", true);
  }
}

// ====== Modal Controls ======
const modal = document.getElementById("userModal");
const closeModalBtn = document.getElementById("closeModal");

function openModal(user) {
  document.getElementById("profileName").textContent = user.c_full_name;
  document.getElementById("profileEmail").textContent = user.c_gmail;
  document.getElementById("profileDate").textContent = `Joined on: ${user.formatted_date}`;
  modal.style.display = "flex";
}

closeModalBtn.addEventListener("click", () => (modal.style.display = "none"));
window.addEventListener("click", e => {
  if (e.target === modal) modal.style.display = "none";
});

// ====== Delete Confirmation ======
function confirmBlock(id, fullName) {
  const confirmBox = document.createElement("div");
  confirmBox.classList.add("confirm-box");
  confirmBox.innerHTML = `
    <div class="confirm-content">
      <p>Are you sure you want to block <strong>${fullName}</strong>?</p>
      <div class="confirm-buttons">
        <button id="confirmYes" class="yes-btn">Yes</button>
        <button id="confirmNo" class="no-btn">No</button>
      </div>
    </div>
  `;
  document.body.appendChild(confirmBox);

  document.getElementById("confirmYes").addEventListener("click", async () => {
    confirmBox.remove();
    await blockUser(id);
  });

  document.getElementById("confirmNo").addEventListener("click", () => {
    confirmBox.remove();
  });
}

// ====== BLOCK FUNCTION ======
async function toggleBlockUser(id, currentlyBlocked) {
  showLoading(true);
  try {
    const action = currentlyBlocked ? "unblock" : "block";

    const response = await fetch(`http://localhost:5000/admin-user-list/${action}/${id}`, {
      method: "PUT",
    });

    if (response.ok) {
      const message = currentlyBlocked
        ? "User account unblocked successfully!"
        : "User account blocked successfully!";
      showToast(message);

      await fetchUserList();
    } else {
      showToast("❌ Failed to update user status.", true);
    }
  } catch (error) {
    console.error("Error updating user status:", error);
    showToast("❌ Error updating user status.", true);
  } finally {
    showLoading(false);
  }
}
