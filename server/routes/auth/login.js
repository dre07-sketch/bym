// routes/authRoutes.js
const express = require('express');
const router = express.Router();
const db = require('../../db/connection'); // your MySQL connection
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

const JWT_SECRET = 'f9b3d8c2a1e74f0d9b6c5a8e3f7d1c0b'; // ideally from process.env.JWT_SECRET

// Login API
const roleMap = {
  "Store Manager": "tool-manager",
  "Stock Manager": "stock-manager",
  "Part Coordinator": "part-coordinator",
  "Inspection": "inspector",
  "Reception": "customer-service",
  "Manager": "manager",
  "Communication": "communication",
  "Marketing": "marketing",
  "Finance/HR": "finance", // optional if you build this later
};

router.post('/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password)
    return res.status(400).json({ message: 'Email and password required' });

  const query = 'SELECT * FROM employees WHERE email = ?';
  db.query(query, [email], async (err, results) => {
    if (err) return res.status(500).json({ message: 'Database error' });
    if (results.length === 0) return res.status(401).json({ message: 'Invalid credentials' });

    const user = results[0];

    // 🔒 Check employee status
    if (user.status !== 'activated') {
      return res.status(403).json({ message: 'Your account is deactivated. Please contact admin.' });
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) return res.status(401).json({ message: 'Invalid credentials' });

    // normalize role here
    const normalizedRole = roleMap[user.role] || user.role;

    const token = jwt.sign(
      {
        id: user.id,
        full_name: user.full_name,
        role: normalizedRole, // send normalized
        mechanic_status: user.mechanic_status,
        inspection_status: user.inspection_status,
      },
      JWT_SECRET,
      { expiresIn: '8h' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        full_name: user.full_name,
        role: normalizedRole, // send normalized
        mechanic_status: user.mechanic_status,
        inspection_status: user.inspection_status,
        status: user.status, // include status in response
      },
    });
  });
});



// Add this inside your authRoutes.js file, after the login route

// GET current user (protected route)
router.get('/me', (req, res) => {
  const token = req.headers.authorization?.split(' ')[1]; // Bearer <token>
  if (!token) return res.status(401).json({ message: 'No token provided' });

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) return res.status(403).json({ message: 'Invalid or expired token' });

    const query = `
      SELECT 
        id,
        full_name,
        email,
        role,
        image_url,
        phone_number,
        address,
        join_date,
        expertise,
        experience,
        salary,
        working_hours,
        mechanic_status,
        inspection_status,
        is_mechanic_permanent
      FROM employees 
      WHERE id = ?
    `;

    db.query(query, [decoded.id], (err, results) => {
      if (err) return res.status(500).json({ message: 'Database error' });
      if (results.length === 0) return res.status(404).json({ message: 'User not found' });

      const user = results[0];

      // Optional: hide sensitive info
      delete user.salary;

      // Map avatar URL
      user.avatar = user.image_url
        ? `https://ipasystem.bymsystem.com/uploads/${user.image_url}`
        : null;

      // Optional UI status
      user.status = 'online';

      res.json({ user });
    });
  });
});

router.put('/employees/:id', (req, res) => {
  const { id } = req.params;
  const { full_name, email } = req.body;

  if (!full_name || !email) {
    return res.status(400).json({ message: 'full_name and email are required' });
  }

  const sql = 'UPDATE employees SET full_name = ?, email = ? WHERE id = ?';
  db.query(sql, [full_name, email, id], (err, result) => {
    if (err) return res.status(500).json({ message: err.message });

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    res.json({ message: 'Employee updated successfully' });
  });
});

router.put('/:id/status', (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  // Allow only valid status values
  if (!['activated', 'deactivated'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status value' });
  }

  const sql = `UPDATE employees SET status = ? WHERE id = ?`;

  db.query(sql, [status, id], (err, result) => {
    if (err) {
      console.error('Error updating employee status:', err);
      return res.status(500).json({ error: 'Failed to update employee status' });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    res.json({ message: 'Employee status updated successfully', employeeId: id, newStatus: status });
  });
});


module.exports = router;
