// routes/feedback/feedback.js
const express = require('express');
const db = require('../../db/connection');
const router = express.Router();

// GET /api/feedback
router.get('/', (req, res) => {
  const query = `
    SELECT 
      sf.id,
      sf.ticket_number,
      st.customer_id,
      st.customer_name,
      sf.rating,
      sf.comment AS comments,
      sf.created_at AS date,
      'service' AS category, -- or derive from ticket if needed
      'reviewed' AS status -- or add a status column later
    FROM service_feedback sf
    LEFT JOIN service_tickets st ON sf.ticket_number = st.ticket_number
    ORDER BY sf.created_at DESC
  `;

  db.query(query, (err, results) => {
    if (err) {
      console.error('Error fetching feedback:', err);
      return res.status(500).json({ error: 'Failed to fetch feedback' });
    }
    res.json(results);
  });
});

module.exports = router;