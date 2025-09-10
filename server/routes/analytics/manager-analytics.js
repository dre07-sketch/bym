const express = require('express');
const router = express.Router();
const db = require('../../db/connection'); // make sure this exports a MySQL connection or pool

// 1. Total Employees
router.get('/total-employees', (req, res) => {
  db.query('SELECT COUNT(*) AS total FROM employees', (err, results) => {
    if (err) {
      console.error('Error fetching total employees:', err);
      return res.status(500).json({ error: 'Failed to fetch total employees' });
    }
    res.json({ total: results[0].total });
  });
});

// 2. Active Customers (company + individual)
router.get('/active-customers', (req, res) => {
  db.query('SELECT COUNT(*) AS total FROM company_customers', (err1, companyResults) => {
    if (err1) {
      console.error('Error fetching company customers:', err1);
      return res.status(500).json({ error: 'Failed to fetch active customers' });
    }

    db.query('SELECT COUNT(*) AS total FROM individual_customers', (err2, individualResults) => {
      if (err2) {
        console.error('Error fetching individual customers:', err2);
        return res.status(500).json({ error: 'Failed to fetch active customers' });
      }

      const total = companyResults[0].total + individualResults[0].total;
      res.json({ total });
    });
  });
});

// 3. Vehicles in Service (status = 'In Progress')
router.get('/vehicles-in-service', (req, res) => {
  db.query("SELECT COUNT(*) AS total FROM service_tickets WHERE status = 'In Progress'", (err, results) => {
    if (err) {
      console.error('Error fetching vehicles in service:', err);
      return res.status(500).json({ error: 'Failed to fetch vehicles in service' });
    }
    res.json({ total: results[0].total });
  });
});

// 4. Pending Inspections (status = 'Pending')
router.get('/pending-inspections', (req, res) => {
  db.query("SELECT COUNT(*) AS total FROM service_tickets WHERE status = 'Pending'", (err, results) => {
    if (err) {
      console.error('Error fetching pending inspections:', err);
      return res.status(500).json({ error: 'Failed to fetch pending inspections' });
    }
    res.json({ total: results[0].total });
  });
});


router.get('/pending', (req, res) => {
  const query = `
    SELECT 
      id,
      ticket_number,
      customer_type,
      customer_id,
      customer_name,
      vehicle_id,
      vehicle_info,
      license_plate,
      title,
      
      description,
      priority,
      type,
      urgency_level,
      status,
      appointment_id,
      created_at,
      updated_at,
      completion_date
    FROM service_tickets
    WHERE status = 'pending'
    ORDER BY created_at DESC
  `;

  db.query(query, (err, results) => {
    if (err) {
      console.error('Error fetching pending service tickets:', err);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
    res.status(200).json(results);
  });
});

module.exports = router;
