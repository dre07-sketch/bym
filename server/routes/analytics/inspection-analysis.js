// routes/dashboard.js
const express = require('express');
const router = express.Router();
const db = require('../../db/connection'); // your MySQL connection

// GET /api/dashboard/inspection-stats
router.get('/inspection-stats', (req, res) => {
  const statuses = [
    'pending',
    'in progress',
    'ready for inspection',
    'inspection',
    'successful inspection',
    'inspection failed',
    'completed'
  ];

  const query = `
    SELECT status, COUNT(*) AS count
    FROM service_tickets
    WHERE status IN (?)
    GROUP BY status
  `;

  db.query(query, [statuses], (err, results) => {
    if (err) {
      console.error('Error fetching inspection stats:', err);
      return res.status(500).json({ message: 'Internal server error' });
    }

    // Initialize all counts to 0
    const stats = {};
    statuses.forEach(status => {
      stats[status] = 0;
    });

    // Fill counts from query
    results.forEach(row => {
      stats[row.status] = row.count;
    });

    res.json(stats);
  });
});

module.exports = router;
