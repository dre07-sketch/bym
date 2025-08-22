const express = require('express');
const router = express.Router();
const db = require('../../db/connection'); // use your mysql2/mysql connection

router.get('/overview', (req, res) => {
  const query = `
    SELECT 
      -- Active Repairs: any status not 'completed'
      (SELECT COUNT(*) FROM service_tickets WHERE status != 'completed') AS activeRepairs,
      
      -- Completed Repairs
      (SELECT COUNT(*) FROM service_tickets WHERE status = 'completed') AS completedRepairs,
      
      -- Pending Repairs
      (SELECT COUNT(*) FROM service_tickets WHERE status = 'pending') AS pendingRepairs,
      
      -- Active Customers (distinct customer_ids from both tables)
      (
        SELECT COUNT(*) FROM (
          SELECT customer_id FROM individual_customers
          UNION
          SELECT customer_id FROM company_customers
        ) AS all_customers
      ) AS activeCustomers;
  `;

  db.query(query, (err, results) => {
    if (err) {
      console.error('Error fetching analytics overview:', err);
      return res.status(500).json({ message: 'Internal server error' });
    }

    const data = results[0];
    res.json({
      activeRepairs: data.activeRepairs,
      completedRepairs: data.completedRepairs,
      pendingRepairs: data.pendingRepairs,
      activeCustomers: data.activeCustomers
    });
  });
});

router.get('/dashboard-counts', (req, res) => {
  const vehiclesQuery = `
    SELECT COUNT(*) AS inProgressCount 
    FROM service_tickets 
    WHERE status = 'in progress'
  `;

  const partsQuery = `
    SELECT COUNT(*) AS partsReceivedToday 
    FROM disassembled_parts 
    WHERE DATE(logged_at) = CURDATE()
  `;

  db.query(vehiclesQuery, (err1, vehiclesResult) => {
    if (err1) return res.status(500).json({ error: 'Failed to fetch vehicle count' });

    db.query(partsQuery, (err2, partsResult) => {
      if (err2) return res.status(500).json({ error: 'Failed to fetch parts count' });

      res.json({
        vehiclesInProgressCount: vehiclesResult[0].inProgressCount,
        partsReceivedCount: partsResult[0].partsReceivedToday,
      });
    });
  });
});

module.exports = router;
