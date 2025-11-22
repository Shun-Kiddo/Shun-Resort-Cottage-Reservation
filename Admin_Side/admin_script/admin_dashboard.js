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

  // === Total User ===
  async function fetchTotalUsers() {
      try {
      const response = await fetch("http://localhost:5000/admin-total-users");
      const data = await response.json();
      document.getElementById("total-user").textContent = data.total;
      } catch (error) {
      console.error("Error fetching total users:", error);
      }
  }

  // === Available Cottage ===
  async function fetchAvailableCottages() {
        try {
        const response = await fetch("http://localhost:5000/admin-cottages-available");
        const data = await response.json();
        document.getElementById("available-cottage").textContent = data.total;
        } catch (error) {
        console.error("Error fetching total users:", error);
        }
    }


  // === Total booked today ===
  async function fetchTotalBookedToday() {
    try {
      const response = await fetch("http://localhost:5000/admin-total-booked-today");
      const data = await response.json();
      document.getElementById("total-book").textContent = data.total || 0;
    } catch (error) {
      console.error("Error fetching total booked today:", error);
    }
  }

  // === Total revenue ===
    async function fetchTotalRevenue() {
      try {
        const response = await fetch("http://localhost:5000/admin-total-revenue");
        const data = await response.json();

        const total = Number(data.totalRevenue) || 0; // Convert to number
        document.getElementById("total-revenue").textContent = "₱" + total.toLocaleString(undefined, { maximumFractionDigits: 0 });
        
      } catch (error) {
        console.error("Error fetching total revenue:", error);
      }
    }

  // === Message ===
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
            <a href="/Admin_Side/admin_html/admin_messages.html" style="text-decoration: none; color: inherit;">
              <div class="message-info">
                  <div class="left-info">
                  <p class="sender">
                      <i class="fa-solid fa-user"></i>${msg.full_name || "Anonymous"} / ${msg.source_page}
                  </p>
                  <p class="time">${msg.formatted_date}</p>
                  </div>
              <div class="message-body">
                  <p>${msg.message}</p>
              </div>
            </a>
            `;


          messagesSection.appendChild(card);
        });
      } catch (error) {
        console.error("Error fetching messages:", error);
      }
    }

    window.addEventListener("DOMContentLoaded", () => {
      fetchTotalUsers();
      fetchAvailableCottages();
      fetchTotalBookedToday();
      fetchTotalRevenue();
      fetchMessages();
    });