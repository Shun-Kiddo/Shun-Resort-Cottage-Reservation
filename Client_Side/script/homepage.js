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
const dots = document.querySelectorAll('.dot');
let index = 0;

function showSlide(i) {
  slides.forEach((slide, idx) => {
    slide.classList.remove('active');
    dots[idx].classList.remove('active');
    if (idx === i) {
      slide.classList.add('active');
      dots[idx].classList.add('active');
    }
  });
}

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
  

function nextSlide() {
  index = (index + 1) % slides.length;
  showSlide(index);
}
setInterval(nextSlide, 3000);

dots.forEach((dot, i) => {
  dot.addEventListener('click', () => {
    index = i;
    showSlide(index);
  });
});

const mouseScroll = document.querySelector(".mouse-scroll");

mouseScroll.addEventListener("click", () => {
  window.scrollTo({
    top: window.innerHeight,
    behavior: "smooth"
  });
});
const items = document.querySelectorAll('.coverflow-item');
const prevBtn = document.querySelector('.nav-btn.left');
const nextBtn = document.querySelector('.nav-btn.right');
let activeIndex = 0;

function updateCoverflow() {
  items.forEach((item, index) => {
    item.classList.remove('active', 'left', 'right');

    if (index === activeIndex) {
      item.classList.add('active');
    } else if (index === (activeIndex - 1 + items.length) % items.length) {
      item.classList.add('left'); 
    } else if (index === (activeIndex + 1) % items.length) {
      item.classList.add('right'); 
    }
  });
}

prevBtn.addEventListener('click', () => {
  activeIndex = (activeIndex - 1 + items.length) % items.length;
  updateCoverflow();
});

nextBtn.addEventListener('click', () => {
  activeIndex = (activeIndex + 1) % items.length;
  updateCoverflow();
});

// init
updateCoverflow();

//=================Search cottages======================
document.addEventListener("DOMContentLoaded", async () => {
  const cottageTypeSelect = document.getElementById("cottage-type-label");
  const capacitySelect = document.getElementById("person-capacity-label");

  // Fetch cottage types
  try {
    const res = await fetch("http://localhost:5000/cottage-types");
    const types = await res.json();

    cottageTypeSelect.innerHTML = `<option value="" disabled selected hidden>Cottage Type</option>`;
    types.forEach(row => {
      cottageTypeSelect.innerHTML += `<option value="${row.type}">${row.type}</option>`;
    });
  } catch (error) {
    console.error("Error loading cottage types:", error);
  }

  // Fetch person capacities
  try {
    const res = await fetch("http://localhost:5000/person-capacity");
    const capacities = await res.json();

    capacitySelect.innerHTML = `<option value="" disabled selected hidden>Person Capacity</option>`;
    capacities.forEach(row => {
      capacitySelect.innerHTML += `<option value="${row.capacity}">${row.capacity} Person</option>`;
    });
  } catch (error) {
    console.error("Error loading capacities:", error);
  }
});

document.getElementById("searchBtn").addEventListener("click", () => {
  const type = document.getElementById("cottage-type-label").value;
  const capacity = document.getElementById("person-capacity-label").value;

  // redirect to cottagepage.html with the selected filters
  const query = new URLSearchParams({ type, capacity }).toString();
  alert(query);
  window.location.href = `cottagepage.html?${query}`;
});

// Employee Modal
const modal = document.getElementById("employeeModal");
  const openBtn = document.getElementById("openPartners");
  const closeBtn = document.getElementById("closeModal");

  openBtn.addEventListener("click", (e) => {
    e.preventDefault();
    modal.style.display = "flex";
  });

  closeBtn.addEventListener("click", () => {
    modal.style.display = "none";
  });

  window.addEventListener("click", (e) => {
    if (e.target === modal) {
      modal.style.display = "none";
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

    if(navLinks[0]){
      navLinks[0].classList.add("active");
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

function initMap() {
  const shunResort = { lat: 12.0676, lng: 124.5942 };
  const map = new google.maps.Map(document.getElementById("googleMap"), {
    zoom: 15,
    center: shunResort,
    mapTypeId: "hybrid",
  });

  // Marker with bounce
  new google.maps.Marker({
    position: shunResort,
    map: map,
    animation: google.maps.Animation.BOUNCE,
    title: "Shun Resort",
  });
}

