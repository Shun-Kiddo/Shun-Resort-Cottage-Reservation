// Block the inspect
/*
document.addEventListener("contextmenu", e => e.preventDefault());
document.onkeydown = e => {
  if (e.key === "F12" || (e.ctrlKey && e.shiftKey && e.key === "I")) {
    e.preventDefault();
  }
};
*/


// === Active Link Based on URL ===
const links = document.querySelectorAll(".nav-links a");
const currentPath = window.location.pathname;

links.forEach(link => {
  if (link.getAttribute("href") === currentPath) {
    link.classList.add("active");
  }
  link.addEventListener("click", () => {
    links.forEach(l => l.classList.remove("active"));
    link.classList.add("active");
  });
});
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
    document.getElementById("welcome").innerText = `Welcome, ${data.name}`;
  })
  .catch(err => {
    localStorage.removeItem("authToken");
    window.location.replace("/Client_Side/auth/loginpage.html");
  });
}

// Logout button
document.getElementById("logoutBtn").addEventListener("click", () => {
  localStorage.removeItem("authToken");
  window.location.replace("/Client_Side/auth/loginpage.html");
});

// Prevent back navigation to login page
window.history.pushState(null, null, window.location.href);
window.onpopstate = () => window.history.go(1);

const slides = document.querySelectorAll('.slide');
let index = 0;
function showSlide(i) {
  slides.forEach((slide, idx) => {
    slide.classList.remove('active');
    if (idx === i) {
      slide.classList.add('active');
    }
  });
}
function nextSlide() {
  index = (index + 1) % slides.length;
  showSlide(index);
}
setInterval(nextSlide, 3000);


const hamburger = document.getElementById('hamburger');
const navLinks = document.getElementById('navLinks');

// Detect scroll and close nav when scrolling up
window.addEventListener("scroll", () => {
  if (navLinks.classList.contains("active")) {
    if (window.scrollY < 50) {
      navLinks.classList.remove("active");
      hamburger.classList.remove("toggle");
      document.body.style.overflow = "auto";
    }
  }
});
hamburger.addEventListener('click', () => {
  navLinks.classList.toggle('active');
  hamburger.classList.toggle('toggle');
});


const scrollBtn = document.getElementById("scrollBtn");
const progressCircle = document.querySelector(".progress");
const circumference = 2 * Math.PI * 25; 
progressCircle.style.strokeDasharray = circumference;

window.addEventListener("scroll", () => {
    let scrollTop = document.documentElement.scrollTop || document.body.scrollTop;
    let scrollHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
    let progress = (scrollTop / scrollHeight) * circumference;

    progressCircle.style.strokeDashoffset = circumference - progress;

    if (scrollTop > 50) {
      scrollBtn.style.display = "flex";
    } else {
      scrollBtn.style.display = "none";
    }
});
scrollBtn.addEventListener("click", () => {
  window.scrollTo({ top: 0, behavior: "smooth" });
});
  
//Seacrh container
const searchContainer = document.querySelector('.search-container');
const offsetTop = searchContainer.offsetTop;

window.addEventListener('scroll', () => {
  if (window.scrollY > offsetTop) {
    searchContainer.classList.add('sticky');
  } else {
    searchContainer.classList.remove('sticky');
  }
});

document.addEventListener("DOMContentLoaded", async () => {
  const cottageTypeSelect = document.getElementById("cottage-type-label");
  const capacitySelect = document.getElementById("person-capacity-label");
  const params = new URLSearchParams(window.location.search);
  const typeParam = params.get("type");
  const capacityParam = params.get("capacity");

  // === Fetch cottage types ===
  try {
    const res = await fetch("http://localhost:5000/cottage-types");
    const types = await res.json();

    cottageTypeSelect.innerHTML = `<option value="" disabled selected hidden>${typeParam || "Cottage Type"}</option>`;
    types.forEach(row => {
      cottageTypeSelect.innerHTML += `<option value="${row.type}">${row.type}</option>`;
    });

    // Auto-select if typeParam exists
    if (typeParam) {
      cottageTypeSelect.value = typeParam;
    }
  } catch (error) {
    console.error("Error loading cottage types:", error);
  }

  // === Fetch person capacities ===
  try {
    const res = await fetch("http://localhost:5000/person-capacity");
    const capacities = await res.json();

    // If capacityParam exists, show it as "X Person"
    capacitySelect.innerHTML = `<option value="" disabled selected hidden>${capacityParam ? capacityParam + " Person" : "Person Capacity"}</option>`;
    capacities.forEach(row => {
      capacitySelect.innerHTML += `<option value="${row.capacity}">${row.capacity} Person</option>`;
    });

    // Auto-select if capacityParam exists
    if (capacityParam) {
      capacitySelect.value = capacityParam;
    }

  } catch (error) {
    console.error("Error loading capacities:", error);
  }

  // === Auto-trigger search when both params exist ===
  if (typeParam || capacityParam) {
    setTimeout(() => {
      const searchBtn = document.querySelector(".search-button");
      if (searchBtn) searchBtn.click();
    }, 500); // Wait a bit for dropdowns to populate
  }
});


//Search cottage
// === Search cottage ===
document.addEventListener("DOMContentLoaded", async () => {
  const typeSelect = document.getElementById("cottage-type-label");
  const capacitySelect = document.getElementById("person-capacity-label");
  const searchBtn = document.querySelector(".search-button");
  const cottageGrid = document.getElementById("cottageGrid");

  // Get search parameters from URL
  const params = new URLSearchParams(window.location.search);
  const typeParam = params.get("type");
  const capacityParam = params.get("capacity");

  console.log("Type:", typeParam, "Capacity:", capacityParam);  

  // Wait for dropdowns to load before searching
  await new Promise(resolve => setTimeout(resolve, 400));

  // Auto-search if parameters exist
  if (typeParam || capacityParam) {
    if (typeParam) typeSelect.value = typeParam;
    if (capacityParam) capacitySelect.value = capacityParam;
    await searchCottages(typeParam, capacityParam);
  } else {
    await loadAllCottages();
  }

  // Manual search button
  searchBtn.addEventListener("click", async () => {
    const selectedType = typeSelect.value;
    const selectedCapacity = capacitySelect.value;

    if (!selectedType || !selectedCapacity) {
      cottageGrid.innerHTML = "<p>No cottages found for your search.</p>";
      setTimeout(() => window.location.reload(), 3000);
      return;
    }

    await searchCottages(selectedType, selectedCapacity);
  });

  // === Fetch all cottages ===
  async function loadAllCottages() {
    try {
      const res = await fetch("http://localhost:5000/cottages-search");
      const cottages = await res.json();
      displayCottages(cottages);
    } catch (error) {
      console.error("Error fetching cottages:", error);
    }
  }

  // === Search filtered cottages ===
  async function searchCottages(type, capacity) {
    try {
      const url = new URL("http://localhost:5000/cottages-search");
      if (type) url.searchParams.append("type", type);
      if (capacity) url.searchParams.append("capacity", capacity);

      const res = await fetch(url);
      const cottages = await res.json();
      displayCottages(cottages);
    } catch (error) {
      console.error("Error fetching filtered cottages:", error);
    }
  }

  // === Display results ===
  function displayCottages(cottages) {
    cottageGrid.innerHTML = "";
    if (!cottages || cottages.length === 0) {
      cottageGrid.innerHTML = "<p>No cottages found for your search.</p>";
      return;
    }

    cottages.forEach(cottage => {
      const card = document.createElement("div");
      card.classList.add("cottage-card");
      card.innerHTML = `
        <img src="${cottage.image}" alt="${cottage.name}">
        <div class="cottage-info">
          <h3>${cottage.name} / <span class="heart" data-id="${cottage.id}">❤ ${cottage.likes}</span></h3>
          <p>Cottage Type: ${cottage.type}<br>
             Person Capacity: ${cottage.capacity}<br>
             Status: ${cottage.availability}</p>
          <div class="cottage-footer">
            <span class="price">₱${parseFloat(cottage.price).toLocaleString()}</span>
            <button class="book-btn">Book</button>
          </div>
        </div>
      `;
      cottageGrid.appendChild(card);
    });
  }
});




async function fetchCottages() {
  try {
    const response = await fetch("http://localhost:5000/cottages-page");
    const cottages = await response.json();

    const grid = document.getElementById("cottageGrid");
    grid.innerHTML = ""; // Clear previous contents

    cottages.forEach(cottage => {
      const card = document.createElement("div");
      card.classList.add("cottage-card");

      card.innerHTML = `
        <img src="${cottage.image}" alt="${cottage.name}">
        <div class="cottage-info">
          <h3>${cottage.name} / <span class="heart" data-id="${cottage.id}">❤ ${cottage.likes}</span></h3>
          <p>Cottage Type: ${cottage.type}<br>
             Person Capacity: ${cottage.capacity}<br>
             Status: ${cottage.availability}</p>
          <div class="cottage-footer">
            <span class="price">₱${parseFloat(cottage.price).toLocaleString()}</span>
            <button class="book-btn">Book</button>
          </div>
        </div>
        
      `;

      grid.appendChild(card);
    });
  } catch (error) {
    console.error("Error fetching cottages:", error);
  }
}

// Fetch cottages when page loads
window.addEventListener("DOMContentLoaded", fetchCottages);

// Handle heart button
document.addEventListener("click", async function (e) {
  if (e.target.classList.contains("heart")) {
    const heart = e.target;
    const cottageId = heart.dataset.id;
    const userId = localStorage.getItem("userId"); 

    try {
      const response = await fetch(`http://localhost:5000/cottage-like/${cottageId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customer_id: userId })
      });

      const data = await response.json();
      if (data.success) {
        heart.innerHTML = `❤ ${data.likes}`;
        heart.classList.toggle("liked", data.liked);
      }
    } catch (error) {
      console.error("Error updating likes:", error);
    }
  }
});

// Contact Modal Functionality
const contactModal = document.getElementById("contactModal");
const openContactNav = document.getElementById("openContactNav");
const openContactSection = document.getElementById("openContactSection");
const closeContactModal = document.getElementById("closeContactModal");

// Open modal from Navbar or Contact Section
[openContactNav, openContactSection].forEach(btn => {
  if (btn) {
    btn.addEventListener("click", () => {
      contactModal.style.display = "flex";
    });
  }
});

// Close modal
if (closeContactModal) {
  closeContactModal.addEventListener("click", () => {
    contactModal.style.display = "none";
    
    //Removing active color
    const navLinks = document.querySelectorAll(".nav-links a");
    if (navLinks[2]) {
      navLinks[2].classList.remove("active");
    }

    if(navLinks[1]){
      navLinks[1].classList.add("active");
    }

  });
}

// Close modal when clicking outside content
window.addEventListener("click", (event) => {
  if (event.target === contactModal) {
    contactModal.style.display = "none";
  }
});

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

document.querySelector(".contact-form").addEventListener("submit", async (e) => {
  e.preventDefault(); 

  const message = document.getElementById("contact-message").value.trim();
  const userEmail = localStorage.getItem("userEmail");

  if (!userEmail) return showToast("⚠️ Please log in first", true);
  if (!message) return showToast("✉️ Please enter a message", true);

  try {
    showLoading(true); 
    const response = await fetch("http://localhost:5000/contact-home", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: userEmail, message }),
    });

    const data = await response.json();
    showLoading(false); 

    if (response.ok && data.success) {
      showToast("✅ Message sent successfully!");
      document.querySelector(".contact-form").reset();
      document.getElementById("contactModal").style.display = "none";
    } else {
      showToast(data.error || "❌ Failed to send message", true);
    }
  } catch (err) {
    showLoading(false);
    console.error("Contact form error:", err);
    showToast("🚫 Something went wrong. Try again later.", true);
  }
});
