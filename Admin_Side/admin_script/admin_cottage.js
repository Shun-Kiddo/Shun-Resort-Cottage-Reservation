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
  window.location.href = "/Client_Side/auth/loginpage.html";
});

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
                  <li onclick="deleteCottage(${c.id})"><i class="fa-solid fa-trash"></i> Delete</li>
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
    const res = await fetch("http://localhost:5000/admin-cottages/create", {
      method: "POST",
      body: formData,
    });

    const result = await res.json();

    if (res.ok) {
      alert(result.message);
      form.reset();
      previewImg.style.display = "none";
      loadCottages();
    } else {
      alert("Error: " + result.error);
    }
  } catch (err) {
    console.error("Error creating cottage:", err);
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

// === Delete Cottage ===
async function deleteCottage(id) {
  if (!confirm("Are you sure you want to delete this cottage?")) return;
  try {
    const res = await fetch(`http://localhost:5000/admin-cottages/${id}`, {
      method: "DELETE"
    });
    const result = await res.json();
    alert(result.message);
    loadCottages();
  } catch (err) {
    console.error("Error deleting cottage:", err);
  }
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

// === Update Cottage Submit ===
document.getElementById("updateForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const id = document.getElementById("update_id").value;
  const formData = new FormData(e.target);

  try {
    const res = await fetch(`http://localhost:5000/admin-cottages/${id}`, {
      method: "PUT",
      body: formData
    });
    const result = await res.json();

    if (res.ok) {
      alert(result.message);
      closeUpdateModal();
      loadCottages();
    } else {
      alert("Error: " + result.error);
    }
  } catch (err) {
    console.error("Error updating cottage:", err);
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
