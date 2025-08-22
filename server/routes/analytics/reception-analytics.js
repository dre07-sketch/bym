const express = require('express');
const router = express.Router();
const db = require('../../db/connection');

// 1. Get count of active tickets
router.get('/active-tickets', (req, res) => {
  const query = `
    SELECT COUNT(*) AS activeTickets
    FROM service_tickets
    WHERE status NOT IN ('completed', 'cancelled')
  `;

  db.query(query, (err, results) => {
    if (err) {
      console.error('Error fetching active tickets:', err);
      return res.status(500).json({ error: 'Internal Server Error' });
    }

    res.json({ activeTickets: results[0].activeTickets });
  });
});

// 2. Get status distribution
router.get('/status-distribution', (req, res) => {
  const query = `
    SELECT status, COUNT(*) AS count
    FROM service_tickets
    GROUP BY status
  `;

  db.query(query, (err, results) => {
    if (err) {
      console.error('Error fetching status distribution:', err);
      return res.status(500).json({ error: 'Internal Server Error' });
    }

    res.json({ distribution: results });
  });
});


router.get('/sos', (req, res) => {
  const query = `
    SELECT 
      SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) AS pending
    FROM sos_requests
  `;

  db.query(query, (err, results) => {
    if (err) {
      console.error('Error fetching SOS pending count:', err);
      return res.status(500).json({ error: 'Database error' });
    }

    res.json(results[0]); // returns: { "pending": 3 }
  });
});
  

router.get('/weekly-ticket-counts', (req, res) => {
  const sql = `
    SELECT 
      d.day,
      COALESCE(t.tickets, 0) AS tickets,
      COALESCE(s.sos, 0) AS sos
    FROM
      (SELECT 'Monday' AS day UNION ALL SELECT 'Tuesday' UNION ALL SELECT 'Wednesday' UNION ALL
       SELECT 'Thursday' UNION ALL SELECT 'Friday' UNION ALL SELECT 'Saturday' UNION ALL SELECT 'Sunday') d
    LEFT JOIN (
      SELECT DAYNAME(created_at) AS day, COUNT(*) AS tickets
      FROM service_tickets
      WHERE YEARWEEK(created_at, 1) = YEARWEEK(CURDATE(), 1)
      GROUP BY day
    ) t ON d.day = t.day
    LEFT JOIN (
      SELECT DAYNAME(created_at) AS day, COUNT(*) AS sos
      FROM sos_requests
      WHERE YEARWEEK(created_at, 1) = YEARWEEK(CURDATE(), 1)
      GROUP BY day
    ) s ON d.day = s.day
    ORDER BY FIELD(d.day, 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday');
  `;

  db.query(sql, (err, results) => {
    if (err) {
      console.error('Error fetching weekly ticket counts:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(results);
  });
});



// 3. Upcoming Appointments
router.get('/upcoming-appointments', (req, res) => {
  const query = `
    SELECT id, customer_name, appointment_date, appointment_time, service_type 
    FROM appointments 
    WHERE CONCAT(appointment_date, ' ', appointment_time) > NOW()
    ORDER BY appointment_date ASC, appointment_time ASC
  `;

  db.query(query, (err, results) => {
    if (err) {
      console.error('Error fetching upcoming appointments:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(results);
  });
});



module.exports = router;
