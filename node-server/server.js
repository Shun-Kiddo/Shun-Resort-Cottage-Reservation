require('dotenv').config();
const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const app = express();
const jwt = require('jsonwebtoken');
const nodemailer = require("nodemailer");
const path = require("path");
const multer = require("multer");

// Secret key (use env variable in real projects!)
const JWT_SECRET = process.env.JWT_SECRET || "shun_secret_key";

// Middleware
app.use(express.json());

//Enable CORS for your frontend
app.use(cors({
  origin: 'http://127.0.0.1:5500', 
  credentials: true
}));

// === Multer setup ===
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, "../image/cottages")); // adjust folder path
  },
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + "-" + file.originalname;
    cb(null, uniqueName);
  }
});
const upload = multer({ storage });


const PORT = process.env.PORT || 5000;

// MySQL connection
const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME
});

// Configure Gmail transporter
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,   
    pass: process.env.GMAIL_PASS  
  }
});

// Connect to MySQL
db.connect(err => {
  if (err) {
    console.error('Database connection failed:', err);
    process.exit(1);
  }
  console.log('Connected to MySQL');
});

// Routes
app.get('/', (req, res) => {
  res.send('MySQL + Node.js server running!');
});

// Signup route (optional)
app.post('/signup', (req, res) => {
  const { c_full_name, c_gmail, c_password } = req.body;

  if (!c_full_name || !c_gmail || !c_password) {
    return res.status(400).json({ error: "All fields are required" });
  }

  const hashedPassword = bcrypt.hashSync(c_password, 10);

  const sql = 'INSERT INTO customer (c_full_name, c_gmail, c_password) VALUES (?, ?, ?)';
  db.query(sql, [c_full_name, c_gmail, hashedPassword], (err, result) => {
    if (err) {
      console.error("MySQL Error:", err);
      return res.status(500).json({ error: "Database error", details: err.sqlMessage });
    }
    res.json({ message: 'Account created successfully!', id: result.insertId });
  });
});

//Login route
app.post('/login', (req, res) => {
  const { email, password } = req.body;

  const sql = 'SELECT * FROM customer WHERE c_gmail = ?';
  db.query(sql, [email], (err, results) => {
    if (err) return res.status(500).json({ error: err });
    if (results.length === 0) return res.status(401).json({ message: 'Invalid email or password' });

    const user = results[0];
    const passwordMatch = bcrypt.compareSync(password, user.c_password);

    if (!passwordMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const token = jwt.sign({ id: user.c_id, email: user.c_gmail },JWT_SECRET,{ expiresIn: "1h" });

    res.json({message: `Login successful`,token,user: {id: user.c_id,name: user.c_full_name,email: user.c_gmail}});
  });
});

// forgot-password route
app.post('/forgot', (req, res) => {
  console.log("Request body:", req.body);

  const { email } = req.body;
  if (!email) return res.status(400).json({ success: false, error: "Email is required" });

  // Generate 6-digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000);

  // Save OTP with expiry
  const sql = "UPDATE customer SET otp = ?, otp_expiry = DATE_ADD(NOW(), INTERVAL 5 MINUTE) WHERE c_gmail = ?";
  db.query(sql, [otp, email], (err, result) => {
    if (err) return res.status(500).json({ success: false, error: "Database error" });
    if (result.affectedRows === 0) return res.status(404).json({ success: false, error: "Email not found" });

    // Prepare email content
    const mailOptions = {
      from: `"Shun Resort" <${process.env.GMAIL_USER}>`,
      to: email,
      subject: "🔐 Verify Your Identity - Beach Cottage Reservation",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #e0e0e0; border-radius: 10px; padding: 20px;">
          <h2 style="color: #0077b6;">Hey Beach Guest!</h2>
          <p>A sign-in or password reset attempt requires further verification because we did not recognize your device. To continue, enter the verification code below:</p>
          
          <div style="background: #f1f5f9; border-left: 4px solid #0077b6; padding: 15px; margin: 20px 0;">
            <p style="margin: 0; font-size: 16px;">
              <strong>Verification Code:</strong> <span style="font-size: 22px; font-weight: bold; color: #0077b6;">${otp}</span>
            </p>
          </div>

          <p>If you did not attempt to sign in or reset your password, your account may be at risk. Please update your password immediately.</p>
          
          <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">

          <p style="font-size: 14px; color: #555;">
            If you’d like to improve your account security for your Shun Resort account.<br>
            Learn more about protecting your account at 
            <a href="http://127.0.0.1:5500/Client_Side/auth/accountsecurity.html" style="color: #0077b6;">Account Security</a>.
          </p>

          <p style="font-size: 14px; color: #999; margin-top: 30px;">
            Thanks,<br>
            <strong>Shun Resort Team - Dev: Jayson Mancol</strong>
          </p>
        </div>
      `
    };

    // Send email
    transporter.sendMail(mailOptions, (error) => {
      if (error) {
        console.error("Error sending email:", error);
        return res.status(500).json({ success: false, error: "Failed to send email" });
      }

      res.json({ success: true, message: "Verification code sent successfully" });
    });
  });
});

// Verify OTP
app.post('/verify-otp', (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    return res.status(400).json({ success: false, error: "Email and OTP required" });
  }

  const sql = `
    SELECT * 
    FROM customer 
    WHERE c_gmail = ? 
      AND otp = ? 
      AND otp_expiry > NOW()
  `;
  db.query(sql, [email, otp], (err, results) => {
    if (err) {
      console.error("Database error:", err);
      return res.status(500).json({ success: false, error: "Database error" });
    }

    if (results.length === 0) {
      return res.status(400).json({ success: false, error: "Invalid or expired OTP" });
    }

    res.json({ success: true, message: "OTP verified. You can reset your password now." });
  });
});

    
// Reset Password
app.post('/reset-password', (req, res) => {
  const { email, newPassword } = req.body;
  if (!email || !newPassword) return res.status(400).json({ success: false, error: "Email and new password required" });
  console.log("Reset request for:", email);
  const hashedPassword = bcrypt.hashSync(newPassword, 10);

  const sql = `
    UPDATE customer 
    SET c_password = ?, otp = NULL, otp_expiry = NULL 
    WHERE c_gmail = ?
  `;
  db.query(sql, [hashedPassword, email], (err, result) => {
    if (err) return res.status(500).json({ success: false, error: "Database error" });
    if (result.affectedRows === 0) return res.status(404).json({ success: false, error: "Email not found" });

    res.json({ success: true, message: "Password reset successful" });
  });
});

// Verify token route
app.get('/verifyToken', (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ message: "No token provided" });

  const token = authHeader.split(" ")[1];
  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) return res.status(403).json({ message: "Invalid or expired token" });
    res.json({ id: decoded.id, email: decoded.email, name: decoded.name || "User" });
  });
});

// Serve homepage file only
app.get('/home', (req, res) => {
  res.sendFile(path.join(__dirname, "../Client_Side/html/homepage.html"));
});


// Contact route for Home Page
app.post("/contact-home", (req, res) => {
  console.log("Request body:", req.body);

  const { email, message } = req.body;
  if (!email || !message) {
    return res.status(400).json({ success: false, error: "Email and message are required" });
  }

  const sql = "SELECT c_full_name FROM customer WHERE c_gmail = ?";
  db.query(sql, [email], (err, results) => {
    if (err) {
      console.error("Database query error:", err);
      return res.status(500).json({ success: false, error: "Database error" });
    }

    if (results.length === 0) {
      return res.status(404).json({ success: false, error: "User not found" });
    }
    const fullName = results[0].c_full_name;
    
    const insertSql = `
      INSERT INTO customer_message (full_name, email, message, source_page)
      VALUES (?, ?, ?, 'home')
    `;
    db.query(insertSql, [fullName, email, message], (insertErr) => {
      if (insertErr) {
        console.error("Error saving message:", insertErr);
        return res.status(500).json({ success: false, error: "Failed to save message" });
      }

      const mailOptions = {
        from: `"Shun Resort Contact Form" <${process.env.GMAIL_USER}>`,
        to: process.env.GMAIL_USER,
        subject: `📩 New Contact Message from ${fullName}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #e0e0e0; border-radius: 10px; padding: 20px;">
            <h2 style="color: #0077b6;">Hey Beach Admin!</h2>
            <p>You’ve received a new message from one of our guests through the <strong>Shun Resort Contact Form</strong>.</p>

            <div style="background: #f1f5f9; border-left: 4px solid #0077b6; padding: 15px; margin: 20px 0;">
              <p style="margin: 0; font-size: 16px;">
                <strong>From:</strong> ${fullName} <br>
                <strong>Email:</strong> ${email}
              </p>
            </div>

            <div style="background: #f9fafb; border-radius: 8px; padding: 15px; margin: 20px 0; border: 1px solid #e0e0e0;">
              <p style="margin: 0; font-size: 15px; color: #333;">
                <strong>Message:</strong><br><br>
                ${message.replace(/\n/g, "<br>")}
              </p>
            </div>

            <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">

            <p style="font-size: 14px; color: #555;">
              Reply directly to <a href="mailto:${email}" style="color: #0077b6;">${email}</a> to get in touch with this guest.
            </p>

            <p style="font-size: 14px; color: #999; margin-top: 30px;">
              Thanks,<br>
              <strong>Shun Resort Team - Dev: Jayson Mancol</strong>
            </p>
          </div>
        `
      };

      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          console.error("Error sending email:", error);
          return res.status(500).json({ success: false, error: "Failed to send email" });
        }

        console.log("Email sent:", info.response);
        res.json({ success: true, message: "Message sent and saved successfully!" });
      });
    });
  });
});

app.post("/contact-landing-page", (req, res) => {
  console.log("Request body:", req.body);

  const { email, message, fullName } = req.body;

  if (!email || !message || !fullName) {
    return res.status(400).json({ success: false, error: "All fields are required" });
  }

  const insertSql = `
    INSERT INTO customer_message (full_name, email, message, source_page)
    VALUES (?, ?, ?, 'landing')
  `;
  db.query(insertSql, [fullName, email, message], (insertErr) => {
    if (insertErr) {
      console.error("Error saving message:", insertErr);
      return res.status(500).json({ success: false, error: "Failed to save message" });
    }

    const mailOptions = {
      from: `"Shun Resort Contact Form" <${process.env.GMAIL_USER}>`,
      to: process.env.GMAIL_USER,
      subject: `📩 New Contact Message from ${fullName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #e0e0e0; border-radius: 10px; padding: 20px;">
          <h2 style="color: #0077b6;">Hey Beach Admin!</h2>
          <p>You’ve received a new message from one of our guests through the <strong>Shun Resort Contact Form</strong>.</p>

          <div style="background: #f1f5f9; border-left: 4px solid #0077b6; padding: 15px; margin: 20px 0;">
            <p style="margin: 0; font-size: 16px;">
              <strong>From:</strong> ${fullName} <br>
              <strong>Email:</strong> ${email}
            </p>
          </div>

          <div style="background: #f9fafb; border-radius: 8px; padding: 15px; margin: 20px 0; border: 1px solid #e0e0e0;">
            <p style="margin: 0; font-size: 15px; color: #333;">
              <strong>Message:</strong><br><br>
              ${message.replace(/\n/g, "<br>")}
            </p>
          </div>

          <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">

          <p style="font-size: 14px; color: #555;">
            Reply directly to <a href="mailto:${email}" style="color: #0077b6;">${email}</a>.
          </p>

          <p style="font-size: 14px; color: #999; margin-top: 30px;">
            Thanks,<br>
            <strong>Shun Resort Team - Dev: Jayson Mancol</strong>
          </p>
        </div>
      `
    };
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error("Error sending email:", error);
        return res.status(500).json({ success: false, error: "Failed to send email" });
      }

      console.log("Email sent:", info.response);
      res.status(200).json({ success: true, message: "Message sent and saved successfully!" });
    });
  });
});

//Cottages page
app.get("/cottages-page", (req, res) => {
  const sql = "SELECT * FROM cottages WHERE availability = 'Available'";
  db.query(sql, (err, results) => {
    if (err) {
      console.error("Error fetching cottages:", err);
      return res.status(500).json({ error: "Database error" });
    }
    res.json(results);
  });
});
//Cottage Like
app.post("/cottage-like/:id", async (req, res) => {
  const cottageId = req.params.id;
  const costumerId = req.body.customer_id; // Pass logged-in user's ID from frontend

  try {
    // 1️⃣ Check if the user already liked this cottage
    const [liked] = await db
      .promise()
      .query("SELECT * FROM cottage_likes WHERE customer_id = ? AND cottage_id = ?", [costumerId, cottageId]);

    if (liked.length > 0) {
      // 2️⃣ Already liked → unlike it
      await db.promise().query("DELETE FROM cottage_likes WHERE customer_id = ? AND cottage_id = ?", [costumerId, cottageId]);
      await db.promise().query("UPDATE cottages SET likes = likes - 1 WHERE id = ?", [cottageId]);

      const [updated] = await db.promise().query("SELECT likes FROM cottages WHERE id = ?", [cottageId]);
      return res.json({ success: true, liked: false, likes: updated[0].likes });
    } else {
      // 3️⃣ Not liked yet → like it
      await db.promise().query("INSERT INTO cottage_likes (customer_id, cottage_id) VALUES (?, ?)", [costumerId, cottageId]);
      await db.promise().query("UPDATE cottages SET likes = likes + 1 WHERE id = ?", [cottageId]);

      const [updated] = await db.promise().query("SELECT likes FROM cottages WHERE id = ?", [cottageId]);
      return res.json({ success: true, liked: true, likes: updated[0].likes });
    }
  } catch (error) {
    console.error("Error updating like:", error);
    res.status(500).json({ success: false, message: "Database error" });
  }
});

// Search Cottage
app.get("/cottage-types", async (req, res) => {
  try {
    
    const [rows] = await db.promise().query("SELECT DISTINCT type FROM cottages");
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error fetching cottage types" });
  }
});

app.get("/person-capacity", async (req, res) => {
  try {
    const [rows] = await db.promise().query("SELECT DISTINCT capacity FROM cottages");
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error fetching person capacities" });
  }
});

app.get("/cottages-search", async (req, res) => {
  const { type, capacity } = req.query;
  let sql = "SELECT * FROM cottages WHERE 1=1";
  const params = [];

  if (type) {
    sql += " AND type = ?";
    params.push(type);
  }
  if (capacity) {
    sql += " AND capacity = ?";
    params.push(capacity);
  }

  try {
    const [rows] = await db.promise().query(sql, params);
    res.json(rows);
  } catch (err) {
    console.error("Error fetching cottages:", err);
    res.status(500).json({ error: "Failed to fetch cottages" });
  }
});



/*===============ADMIN BACKEND=================== */

/* ==================== ADMIN - USER MANAGEMENT ==================== */
/* User List Count */
app.get('/admin-total-users',(req,res) => {
    const sql = "SELECT COUNT(*) AS total FROM customer";
    db.query(sql, (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ total: result[0].total });
  });
});

/* User List Display */
app.get('/admin-user-list', (req,res) => {
    const sql = `SELECT c_id,c_full_name,c_gmail,DATE_FORMAT(created_timestamp, '%m/%d/%Y %h:%i %p') AS formatted_date
    FROM customer
    ORDER BY created_timestamp DESC
  `;
  db.query(sql, (err, results) => {
    if (err) {
      console.error("Error fetching user:", err);
      return res.status(500).json({ error: "Database error" });
    }
    res.json(results);
  });
});

/* User List Delete */
app.delete("/admin-user-list/:id", (req, res) => {
  const userId = req.params.id;
  const sql = "DELETE FROM customer WHERE c_id = ?";

  db.query(sql, [userId], (err, result) => {
    if (err) {
      console.error("Error deleting user:", err);
      return res.status(500).json({ success: false, error: "Server error" });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    res.json({ success: true, message: "User deleted successfully" });
  });
});


app.get('/admin-messages', (req,res) => {
    const sql = `SELECT msg_id,full_name,email,message,source_page,DATE_FORMAT(created_at, '%m/%d/%Y %h:%i %p') AS formatted_date
    FROM customer_message
    ORDER BY created_at DESC
  `;
  db.query(sql, (err, results) => {
    if (err) {
      console.error("Error fetching messages:", err);
      return res.status(500).json({ error: "Database error" });
    }
    res.json(results);
  });
});

app.delete("/admin-messages/:id", (req, res) => {
  const messageId = req.params.id;
  const sql = "DELETE FROM customer_message WHERE msg_id = ?";

  db.query(sql, [messageId], (err, result) => {
    if (err) {
      console.error("Error deleting message:", err);
      return res.status(500).json({ success: false, error: "Server error" });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: "Message not found" });
    }

    res.json({ success: true, message: "Message deleted successfully" });
  });
});



/* ==================== ADMIN - COTTAGE MANAGEMENT ==================== */
/* Cottage Available Count */
app.get('/admin-cottages-available',(req,res) => {
    const sql = "SELECT COUNT(*) AS total FROM cottages WHERE availability = 'Available'";
    db.query(sql, (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ total: result[0].total });
  });
});

app.get('/admin-cottages-available',(req,res) => {
    const sql = "SELECT COUNT(*) AS total FROM cottages WHERE availability = 'Available'";
    db.query(sql, (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ total: result[0].total });
  });
});

// === Get all cottages ===
app.get("/admin-cottages", (req, res) => {
  const sql = "SELECT * FROM cottages ORDER BY created_at DESC";
  db.query(sql, (err, results) => {
    if (err) {
      console.error("Error fetching cottages:", err);
      return res.status(500).json({ error: "Database error" });
    }
    res.json(results);
  });
});

// === Create new cottage ===
app.post("/admin-cottages/create", upload.single("image"), (req, res) => {
  const { name, type, capacity, price, availability } = req.body;
  const image = req.file ? `/image/cottages/${req.file.filename}` : null;

  if (!name || !type || !capacity || !price ||!image|| !availability)
    return res.status(400).json({ error: "All fields are required" });

  const sql = `
    INSERT INTO cottages (name, type, capacity, price, image, availability)
    VALUES (?, ?, ?, ?, ?, ?)
  `;
  db.query(sql, [name, type, capacity, price, image, availability], (err) => {
    if (err) return res.status(500).json({ error: "Database error" });
    res.json({ success: true, message: "Cottage created successfully!" });
  });
});

app.use("/image/cottages", express.static(path.join(__dirname, "../image/cottages")));


// === UPDATE cottage (with optional image + availability) ===
app.put("/admin-cottages/:id", upload.single("image"), (req, res) => {
  const { id } = req.params;
  const { name, type, capacity, price, availability } = req.body;

  if (!name || !type || !capacity || !price || !availability) {
    return res.status(400).json({ error: "All fields are required" });
  }

 const image = req.file ? `/image/cottages/${req.file.filename}` : null;


  let sql, values;

  if (image) {
    sql = `
      UPDATE cottages
      SET name = ?, type = ?, capacity = ?, price = ?, availability = ?, image = ?
      WHERE id = ?
    `;
    values = [name, type, capacity, price, availability, image, id];
  } else {
    sql = `
      UPDATE cottages
      SET name = ?, type = ?, capacity = ?, price = ?, availability = ?
      WHERE id = ?
    `;
    values = [name, type, capacity, price, availability, id];
  }

  db.query(sql, values, (err, result) => {
    if (err) {
      console.error("Error updating cottage:", err);
      return res.status(500).json({ error: "Database error" });
    }
    res.json({ success: true, message: "Cottage updated successfully!" });
  });
});

// === Delete cottage ===
app.delete("/admin-cottages/:id", (req, res) => {
  const { id } = req.params;

  const sql = "DELETE FROM cottages WHERE id = ?";
  db.query(sql, [id], (err, result) => {
    if (err) {
      console.error("Error deleting cottage:", err);
      return res.status(500).json({ error: "Database error" });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: "Cottage not found" });
    }
    res.json({ success: true, message: "Cottage deleted successfully!" });
  });
});

// === Get single cottage (for update modal) ===
app.get("/admin-cottages/:id", (req, res) => {
  const { id } = req.params;
  const sql = "SELECT * FROM cottages WHERE id = ?";
  db.query(sql, [id], (err, results) => {
    if (err) {
      console.error("Error fetching cottage:", err);
      return res.status(500).json({ error: "Database error" });
    }
    if (results.length === 0) {
      return res.status(404).json({ error: "Cottage not found" });
    }
    res.json(results[0]);
  });
});

// Like cottage
app.post("/admin-cottages/like/:id", (req, res) => {
  const { id } = req.params;
  const sql = `
    UPDATE cottages 
    SET likes = COALESCE(likes, 0) + 1
    WHERE id = ?
  `;
  db.query(sql, [id], (err) => {
    if (err) return res.status(500).json({ error: err.message });

    db.query("SELECT likes FROM cottages WHERE id = ?", [id], (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true, likes: result[0].likes });
    });
  });
});

/*===============Total Revenue=============== */
//
app.get('/admin-total-revenue',(req,res) => {
    const sql = "SELECT COUNT(*) AS total FROM cottages WHERE availability = 'Available'";
    db.query(sql, (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ total: result[0].total });
  });
});




// Start server
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});



