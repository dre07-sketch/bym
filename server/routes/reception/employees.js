const express = require('express');
const router = express.Router();
const db = require('../../db/connection');
const multer = require('multer');
const path = require('path');
const bcrypt = require('bcrypt');

// Multer storage configuration for image upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname),
});
const upload = multer({ storage });

router.post('/', upload.single('image'), (req, res) => {
  let {
    fullName,
    email,
    password,
    role,
    specialty,
    isMechanicPermanent,
    phoneNumber,
    address,
    joinDate,
    expertise,
    experience,
    salary,
    workingHours,
  } = req.body;

  // Basic required fields
  if (!fullName || !role) {
    return res.status(400).json({ message: 'Full name and role are required.' });
  }

  const imageUrl = req.file ? req.file.filename : null;

  // Validate specialty for Mechanic and Inspection
  if (role === 'Mechanic' || role === 'Inspection') {
    if (!specialty) {
      return res.status(400).json({ 
        message: `${role === 'Mechanic' ? 'Specialty' : 'Vehicle type'} is required for ${role.toLowerCase()}s.` 
      });
    }
  }

  // Only Mechanics have employment type
  if (role === 'Mechanic') {
    if (!specialty) {
      return res.status(400).json({ message: 'Specialty is required for mechanics.' });
    }
    if (isMechanicPermanent !== 'Permanent' && isMechanicPermanent !== 'Temporary') {
      return res.status(400).json({ 
        message: "isMechanicPermanent must be 'Permanent' or 'Temporary' for mechanics." 
      });
    }
  }

  // Password required for all non-Mechanics (including Inspection)
  if (role !== 'Mechanic' && !password) {
    return res.status(400).json({ message: 'Password is required for this role.' });
  }

  // Hash password if not mechanic
  let hashedPassword = null;
  if (role !== 'Mechanic') {
    bcrypt.hash(password, 10, (hashErr, hash) => {
      if (hashErr) {
        console.error('Hashing error:', hashErr);
        return res.status(500).json({ message: 'Password processing error.' });
      }

      saveEmployee(hash);
    });
  } else {
    // No password hashing for mechanics
    saveEmployee(null);
  }

  // Unified function to avoid duplicate query logic
  function saveEmployee(hashedPassword) {
    const sql = `
      INSERT INTO employees (
        full_name, email, password, role, specialty,
        is_mechanic_permanent, phone_number, address, join_date,
        expertise, experience, salary, working_hours, image_url
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const values = [
      fullName,
      email || null,
      hashedPassword, // null for mechanic
      role,
      (role === 'Mechanic' || role === 'Inspection') ? specialty : null,
      role === 'Mechanic' ? isMechanicPermanent : null,
      phoneNumber || null,
      address || null,
      joinDate || null,
      role === 'Mechanic' ? (expertise || null) : null,
      role === 'Mechanic' ? (experience ? parseInt(experience) : null) : null,
      salary ? parseFloat(salary) : null,
      workingHours || null,
      imageUrl,
    ];

    db.query(sql, values, (err, result) => {
      if (err) {
        console.error('Error saving employee:', err);
        return res.status(500).json({ message: 'Database error' });
      }

      res.status(201).json({
        message: `${role} created successfully`,
        employeeId: result.insertId,
      });
    });
  }
});


// GET all employees with details
router.get('/getemployees', (req, res) => {
  const query = `
    SELECT 
      id, 
      full_name, 
      email, 
      phone_number, 
      address, 
      join_date, 
      role, 
      specialty, 
      expertise, 
      experience, 
      is_mechanic_permanent, 
      salary, 
      working_hours, 
      image_url,
      created_at
    FROM employees
  `;

  db.query(query, (err, results) => {
    if (err) {
      console.error('❌ Error fetching employees:', err);
      return res.status(500).json({ error: 'Failed to fetch employees' });
    }
    if (!results) {
      console.warn('No results returned from DB');
      return res.json([]);
    }

    const formattedResults = results.map(item => {
      // Safely handle expertise (could be null, string, or already array)
      let expertiseArray = [];
      if (item.expertise) {
        if (Array.isArray(item.expertise)) {
          expertiseArray = item.expertise;
        } else if (typeof item.expertise === 'string') {
          expertiseArray = item.expertise.split(',').map(s => s.trim());
        }
      }

      return {
        id: item.id,
        name: item.full_name,
        email: item.email,
        phone: item.phone_number,
        location: item.address,
        joinDate: item.join_date,
        role: item.role,
        specialty: item.specialty,
        expertise: expertiseArray,
        experience: item.experience,
        employmentType: item.is_mechanic_permanent,
        salary: item.salary,
        workingHours: item.working_hours,
        image: item.image_url ? `http://localhost:5001/uploads/${item.image_url}` : null,
        createdAt: item.created_at // <-- Added created_at here
      };
    });

    res.json(formattedResults);
  });
});


router.get('/test', (req, res) => {
  res.send('Employees route works!');
});


module.exports = router;
