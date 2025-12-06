/*
document.addEventListener("contextmenu", e => e.preventDefault());
document.onkeydown = e => {
  if (e.key === "F12" || (e.ctrlKey && e.shiftKey && e.key === "I")) {
    e.preventDefault();
  }
};
*/

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

const scrollBtn = document.getElementById("scrollBtn");
  const progressCircle = document.querySelector(".progress");
  const circumference = 2 * Math.PI * 25;

  progressCircle.style.strokeDasharray = circumference;

  window.addEventListener("scroll", () => {
    let scrollTop = document.documentElement.scrollTop || document.body.scrollTop;
    let scrollHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
    let progress = (scrollTop / scrollHeight) * circumference;

    progressCircle.style.strokeDashoffset = circumference - progress;

    if (scrollTop > 100) {
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

// Auto-slide every 3s
setInterval(nextSlide, 3000);

// Dot click navigation
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
updateCoverflow();

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

// Contact Modal
const contactmodal = document.getElementById("contactModal");
const openBtn_contact = document.getElementById("openContactModal");
const closeBtn_contact = document.getElementById("closeContactModal");

openBtn_contact.addEventListener("click", (e) => {
  e.preventDefault();
  contactmodal.style.display = "flex";
});

closeBtn_contact.addEventListener("click", () => {
  contactmodal.style.display = "none";
});

window.addEventListener("click", (e) => {
  if (e.target === contactmodal) {
    contactmodal.style.display = "none";
  }
});

// Contact Form Submission
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

document.querySelectorAll('.contact-form').forEach(form => {
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const fullName = form.querySelector('#full-name')?.value.trim();
    const userEmail = form.querySelector('#email')?.value.trim();
    const message = form.querySelector('#contact-message')?.value.trim();

    if (!fullName || !userEmail || !message) {
      showToast("Please enter all fields.", true);
      return;
    }

    try {
      showLoading(true);
      const response = await fetch("http://localhost:5000/contact-landing-page", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName, email: userEmail, message }),
      });
      const data = await response.json();
      showLoading(false);

      if (response.ok && data.success) {
        showToast("Message sent successfully!");
        form.reset();
        document.getElementById("contactModal").style.display = "none";
      } else {
        showToast(data.message || "Failed to send message.", true);
      }
    } catch (error) {
      showLoading(false);
      console.error("Contact form error:", error);
      showToast("Something went wrong. Try again later.", true);
    }
  });
});

// Coverflow Component
document.addEventListener("DOMContentLoaded", () => {
  const items = document.querySelectorAll(".coverflow-item");
  let currentIndex = 0;

  function showSlide(index) {
    items.forEach((item, i) => {
      item.classList.remove("active", "left", "right");
      if (i === index) {
        item.classList.add("active");
      } else if (window.innerWidth > 768) {
  
        if (i === (index - 1 + items.length) % items.length) {
          item.classList.add("left");
        } else if (i === (index + 1) % items.length) {
          item.classList.add("right");
        }
      }
    });
  }
  showSlide(currentIndex);
  const leftBtn = document.querySelector(".nav-btn.left");
  const rightBtn = document.querySelector(".nav-btn.right");
  if (leftBtn && rightBtn) {
    leftBtn.addEventListener("click", () => {
      currentIndex = (currentIndex - 1 + items.length) % items.length;
      showSlide(currentIndex);
    });
    rightBtn.addEventListener("click", () => {
      currentIndex = (currentIndex + 1) % items.length;
      showSlide(currentIndex);
    });
  }

  // swipe for mobile
  let startX = 0;
  let endX = 0;
  const wrapper = document.querySelector(".coverflow-wrapper");

  wrapper.addEventListener("touchstart", (e) => {
    startX = e.touches[0].clientX;
  });

  wrapper.addEventListener("touchend", (e) => {
    endX = e.changedTouches[0].clientX;
    handleSwipe();
  });

  function handleSwipe() {
    const diff = endX - startX;
    if (Math.abs(diff) > 50) {
      if (diff > 0) {
        currentIndex = (currentIndex - 1 + items.length) % items.length;
      } else {
        currentIndex = (currentIndex + 1) % items.length;
      }
      showSlide(currentIndex);
    }
  }
  window.addEventListener("resize", () => showSlide(currentIndex));
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