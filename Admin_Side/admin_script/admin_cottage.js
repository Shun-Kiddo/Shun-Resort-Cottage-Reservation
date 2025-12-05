// === Sidebar Active Link ===
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

// === Elements ===
const form = document.querySelector(".create-cottage");
const grid = document.querySelector(".cottage-grid");
const imageInput = document.getElementById("imageInput");
const previewImg = document.getElementById("previewImg");

// === Load Cottages ===
document.addEventListener("DOMContentLoaded", loadCottages);

async function loadCottages() {
  try {
    const res = await fetch("http://localhost:5000/admin-cottages");
    const cottages = await res.json();
    const grid = document.querySelector(".cottage-grid");

    grid.innerHTML = "";
    cottages.forEach(c => {
      const card = `
        <div class="cottage-card" data-id="${c.id}">
          <img src="${c.image || '/image/default_cottage.jpg'}" alt="${c.name}">
          
          <div class="cottage-info">
            <h3>${c.name}  /  <span class="heart">❤ ${c.likes}</span> </h3>
              <p>
              Cottage Type: ${c.type}<br>
              Person Capacity: ${c.capacity}<br>
              Status:${c.availability}     
            </p>
            
            <div class="cottage-footer">
              <span class="price">₱${parseFloat(c.price).toLocaleString()}</span>
              
              <!-- 3-dot menu -->
              <div class="menu-wrapper">
                <button class="menu-btn"><i class="fa-solid fa-ellipsis-vertical"></i></button>
                <ul class="menu-options">
                  <li onclick="openUpdateModal(${c.id})"><i class="fa-solid fa-pen"></i> Update</li>
                  <li onclick="deleteCottage(${c.id}, '${c.name}')"><i class="fa-solid fa-trash"></i> Delete</li>
                </ul>
              </div>
            </div>
          </div>
        </div>`;
      grid.insertAdjacentHTML("beforeend", card);
    });

    // Add event listener for 3-dot menu toggle
    document.querySelectorAll(".menu-btn").forEach(btn => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const options = btn.nextElementSibling;
        document.querySelectorAll(".menu-options").forEach(m => m !== options && m.classList.remove("show"));
        options.classList.toggle("show");
      });
    });

    // Close menus when clicking outside
    document.addEventListener("click", () => {
      document.querySelectorAll(".menu-options").forEach(m => m.classList.remove("show"));
    });
  } catch (err) {
    console.error("Error loading cottages:", err);
  }
}

// === Create New Cottage ===
form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const formData = new FormData(form);

  try {
    showLoading(true);
    const res = await fetch("http://localhost:5000/admin-cottages/create", {
      method: "POST",
      body: formData,
    });

    const result = await res.json();
    showLoading(false);

    if (res.ok) {
      showToast(result.message); // Success toast
      form.reset();
      previewImg.style.display = "none";
      loadCottages();
    } else {
      showToast("Error: " + result.error, true); // Error toast
    }
  } catch (err) {
    showLoading(false);
    console.error("Error creating cottage:", err);
    showToast("❌ Error creating cottage", true); // Error toast
  }
});

// === Image Preview ===
imageInput.addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (file) {
    previewImg.src = URL.createObjectURL(file);
    previewImg.style.display = "block";
  } else {
    previewImg.src = "";
    previewImg.style.display = "none";
  }
});

async function deleteCottage(id, name) {
  confirmAction(`Are you sure you want to delete <strong>${name}</strong>?`, async () => {
    showLoading(true);
    try {
      const res = await fetch(`http://localhost:5000/admin-cottages/${id}`, { method: "DELETE" });
      const result = await res.json();
      showToast(result.message, !res.ok);
      loadCottages();
    } catch (err) {
      console.error(err);
      showToast("Error deleting cottage", true);
    } finally {
      showLoading(false);
    }
  });
}


// === Open Update Modal ===
function openUpdateModal(id) {
  fetch(`http://localhost:5000/admin-cottages/${id}`)
    .then(res => res.json())
    .then(c => {
      document.getElementById("update_id").value = c.id;
      document.getElementById("update_name").value = c.name;
      document.getElementById("update_type").value = c.type;
      document.getElementById("update_capacity").value = c.capacity;
      document.getElementById("update_price").value = c.price;
      document.getElementById("update_availability").value = c.availability;

      const preview = document.getElementById("update_preview");
      if (c.image) {
        preview.src = c.image;
        preview.style.display = "block";
      } else {
        preview.style.display = "none";
      }

      document.getElementById("updateModal").style.display = "flex";
    })
    .catch(err => console.error("Error loading cottage data:", err));
}

// === Close Modal ===
function closeUpdateModal() {
  document.getElementById("updateModal").style.display = "none";
}

document.getElementById("updateForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const id = document.getElementById("update_id").value;
  const formData = new FormData(e.target);

  try {
    showLoading(true);
    const res = await fetch(`http://localhost:5000/admin-cottages/${id}`, {
      method: "PUT",
      body: formData
    });

    const result = await res.json();
    showLoading(false);

    if (res.ok) {
      showToast(result.message); // Success toast
      closeUpdateModal();
      loadCottages();
    } else {
      showToast("Error: " + result.error, true); // Error toast
    }
  } catch (err) {
    showLoading(false);
    console.error("Error updating cottage:", err);
    showToast("❌ Error updating cottage", true); // Error toast
  }
});

async function toggleLike(id, el) {
  try {
    const res = await fetch(`http://localhost:5000/admin-cottages/like/${id}`, {
      method: "POST",
    });

    const data = await res.json();
    if (data.success) {
      const countEl = el.nextElementSibling;
      countEl.textContent = data.likes;
      el.classList.toggle("liked");
    }
  } catch (err) {
    console.error("Error liking cottage:", err);
  }
}
