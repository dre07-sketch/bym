const express = require('express');
const router = express.Router();
const db = require('../../db/connection');

router.get('/pending', (req, res) => {
  const sql = `
    SELECT 
      st.id,
      st.ticket_number,
      st.customer_type,
      st.customer_id,
      st.customer_name,
      st.vehicle_id,
      st.vehicle_info,
      st.license_plate,
      st.title,
      st.description,
      st.priority,
      st.type,
      st.urgency_level,
      st.status,
      st.appointment_id,
      st.created_at,
      st.updated_at,
      
      st.completion_date,
      v.make,
      v.model,
      v.year,
      v.image,
      COALESCE(ic.phone, cc.phone) AS customer_phone,
      COALESCE(ic.email, cc.email) AS customer_email
    FROM service_tickets st
    LEFT JOIN vehicles v ON st.vehicle_id = v.id
    LEFT JOIN individual_customers ic ON st.customer_type = 'individual' AND st.customer_id = ic.customer_id
    LEFT JOIN company_customers cc ON st.customer_type = 'company' AND st.customer_id = cc.customer_id
    WHERE st.status = 'pending'
    ORDER BY st.created_at DESC
  `;

  db.query(sql, (err, results) => {
    if (err) {
      console.error('Error fetching pending service tickets:', err);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
    res.json(results);
  });
});


router.get('/details/:ticket_number', (req, res) => {
  const { ticket_number } = req.params;

  const sql = `
    SELECT 
      st.id,
      st.ticket_number,
      st.customer_type,
      st.customer_id,
      st.customer_name,
      st.vehicle_id,
      st.vehicle_info,
      st.license_plate,
      st.title,
      st.description,
      st.priority,
      st.type,
      st.urgency_level,
      st.status,
      st.appointment_id,
      st.created_at,
      st.updated_at,
      
      st.completion_date,
      v.make,
      v.model,
      v.year,
      v.image,
      COALESCE(ic.phone, cc.phone) AS customer_phone,
      COALESCE(ic.email, cc.email) AS customer_email
    FROM service_tickets st
    LEFT JOIN vehicles v ON st.vehicle_id = v.id
    LEFT JOIN individual_customers ic ON st.customer_type = 'individual' AND st.customer_id = ic.customer_id
    LEFT JOIN company_customers cc ON st.customer_type = 'company' AND st.customer_id = cc.customer_id
    WHERE st.ticket_number = ?
    LIMIT 1
  `;

  db.query(sql, [ticket_number], (err, results) => {
    if (err) {
      console.error('Error fetching ticket details:', err);
      return res.status(500).json({ error: 'Internal Server Error' });
    }

    if (results.length === 0) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    res.json(results[0]);
  });
});



router.get('/mechanics', (req, res) => {
  const query = `
    SELECT id, full_name, email, specialty, is_mechanic_permanent, phone_number,
           address, join_date, expertise, experience, salary, working_hours, image_url
    FROM employees
    WHERE role = 'mechanic'
  `;

  db.query(query, (err, results) => {
    if (err) {
      console.error('Error fetching mechanics:', err);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
    res.json(results);
  });
});

module.exports = router;