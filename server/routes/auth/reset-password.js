const express = require('express');
const router = express.Router();
const db = require('../../db/connection'); // your MySQL connection




// POST /api/auth/request-password-reset
router.post("/request-password-reset", (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: "Email is required" });

  const checkEmployeeQuery = "SELECT id FROM employees WHERE email = ?";
  db.query(checkEmployeeQuery, [email], (err, results) => {
    if (err) return res.status(500).json({ message: "Server error" });

    if (results.length === 0) {
      // Do not reveal existence of email
      return res.json({ message: "If this email exists, the request was logged." });
    }

    const employeeId = results[0].id;

    // Insert password reset request
    const insertQuery = `
      INSERT INTO password_reset_requests (employee_id, email, requested_at, status)
      VALUES (?, ?, NOW(), 'pending')
    `;
    db.query(insertQuery, [employeeId, email], (err2) => {
      if (err2) return res.status(500).json({ message: "Server error" });

      // Optional: update employees table last request time
      const updateEmployeeQuery = "UPDATE employees SET password_request_time = NOW() WHERE id = ?";
      db.query(updateEmployeeQuery, [employeeId], (err3) => {
        if (err3) console.error("Failed to update password_request_time:", err3);
      });

      return res.json({ message: "Password reset request submitted successfully." });
    });
  });
});


// GET /api/auth/reset-requests
router.get("/get-reset-requests", (req, res) => {
  const query = `
    SELECT r.*, e.full_name, e.email
    FROM password_reset_requests r
    JOIN employees e ON e.id = r.employee_id
    WHERE r.status = 'pending'
    ORDER BY r.requested_at DESC
  `;
  db.query(query, (err, results) => {
    if (err) return res.status(500).json({ error: 'Internal server error' });
    return res.json(results);
  });
});


// POST /api/auth/reset-password
router.post("/reset-password", (req, res) => {
  const { employeeId, newPassword } = req.body;
  if (!employeeId || !newPassword) return res.status(400).json({ message: "Employee ID and new password required" });

  const bcrypt = require("bcrypt");
  const hashedPassword = bcrypt.hashSync(newPassword, 10);

  // Update employees table
  const updateQuery = "UPDATE employees SET password = ? WHERE id = ?";
  db.query(updateQuery, [hashedPassword, employeeId], (err) => {
    if (err) return res.status(500).json({ message: "Server error" });

    // Mark reset request as completed
    const markQuery = "UPDATE password_reset_requests SET status = 'completed' WHERE employee_id = ? AND status = 'pending'";
    db.query(markQuery, [employeeId], (err2) => {
      if (err2) console.error("Error marking reset request:", err2);
      return res.json({ message: "Password reset successfully." });
    });
  });
});


module.exports = router;