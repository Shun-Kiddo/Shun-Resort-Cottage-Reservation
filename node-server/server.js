require('dotenv').config();
const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const app = express();
const jwt = require('jsonwebtoken');
const nodemailer = require("nodemailer");
const path = require("path");
// Secret key (use env variable in real projects!)
const JWT_SECRET = process.env.JWT_SECRET || "shun_secret_key";

// Middleware
app.use(express.json());

//Enable CORS for your frontend
app.use(cors({
  origin: 'http://127.0.0.1:5500', 
  credentials: true
}));

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


// Start server
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});



// Update user
/*
app.put('/api/customer/:id', (req, res) => {
  const { id } = req.params;
  const { name, email } = req.body;
  db.query('UPDATE customer SET name = ?, email = ? WHERE id = ?', [name, email, id], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'User updated successfully' });
  });
});
*/

// Delete user
/*
app.delete('/api/customer/:id', (req, res) => {
  const { id } = req.params;
  db.query('DELETE FROM customer WHERE id = ?', [id], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'User deleted successfully' });
  });
});
*/

