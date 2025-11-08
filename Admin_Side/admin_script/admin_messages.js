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
  window.location.href = "/Client_Side/auth/loginpage.html";
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

// === Fetch Messages ===
document.addEventListener("DOMContentLoaded", fetchMessages);
async function fetchMessages() {
  try {
    const response = await fetch("http://localhost:5000/admin-messages");
    const messages = await response.json();

    const messagesSection = document.querySelector(".messages-section");
    messagesSection.innerHTML = "";

    if (messages.length === 0) {
      messagesSection.innerHTML = `<p>No messages found.</p>`;
      return;
    }

    messages.forEach(msg => {
      const card = document.createElement("div");
      card.classList.add("message-card");
      card.innerHTML = `
        <div class="message-info">
          <div class="left-info">
            <p class="sender">
              <i class="fa-solid fa-user"></i>
              ${msg.full_name || "Anonymous"} / ${msg.source_page}
            </p>
            <p class="time">${msg.formatted_date}</p>
          </div>
          <button class="delete-btn">
            <i class="fa-solid fa-trash"></i>
          </button>
        </div>
        <div class="message-body">
          <p>${msg.message}</p>
        </div>
      `;
      messagesSection.appendChild(card);

      // Attach delete event
      card.querySelector(".delete-btn").addEventListener("click", e => {
        e.stopPropagation();
        confirmDelete(msg.msg_id, msg.full_name || "Anonymous");
      });
    });
  } catch (error) {
    console.error("Error fetching messages:", error);
    showToast("Error fetching messages.", true);
  }
}

// === Confirmation Box ===
function confirmDelete(id, fullName) {
  const confirmBox = document.createElement("div");
  confirmBox.classList.add("confirm-box");
  confirmBox.innerHTML = `
    <div class="confirm-content">
      <h3>Confirm Delete</h3>
      <p>Are you sure you want to delete this message from <strong>${fullName}</strong>?</p>
      <div class="confirm-buttons">
        <button id="confirmYes" class="yes-btn">Yes</button>
        <button id="confirmNo" class="no-btn">No</button>
      </div>
    </div>
  `;
  document.body.appendChild(confirmBox);

  document.getElementById("confirmYes").addEventListener("click", async () => {
    confirmBox.remove();
    await deleteMessage(id);
  });

  document.getElementById("confirmNo").addEventListener("click", () => {
    confirmBox.remove();
  });
}

// === Delete Message Function ===
async function deleteMessage(id) {
  showLoading(true);
  try {
    const response = await fetch(`http://localhost:5000/admin-messages/${id}`, {
      method: "DELETE",
    });

    if (response.ok) {
      showToast("✅ Message deleted successfully!");
      fetchMessages();
    } else {
      showToast("❌ Failed to delete message.", true);
    }
  } catch (error) {
    console.error("Error deleting message:", error);
    showToast("❌ Error deleting message.", true);
  } finally {
    showLoading(false);
  }
}
