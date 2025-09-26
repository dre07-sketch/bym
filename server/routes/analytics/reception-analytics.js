const express = require('express');
const router = express.Router();
const db = require('../../db/connection');
const { Parser } = require('json2csv');

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


router.get('/reports/overview', (req, res) => {
  const ticketsQuery = `SELECT COUNT(*) AS total FROM service_tickets`;
  const revenueQuery = `SELECT SUM(final_total) AS totalRevenue FROM bills WHERE status='paid'`;
  const customersQuery = `
    SELECT 
      (SELECT COUNT(*) FROM individual_customers) + 
      (SELECT COUNT(*) FROM company_customers) AS totalCustomers
  `;
  const avgResponseQuery = `
    SELECT AVG(TIMESTAMPDIFF(MINUTE, created_at, updated_at)) AS avgResponse 
    FROM service_tickets
  `;

  db.query(ticketsQuery, (err, tickets) => {
    if (err) return res.status(500).json({ error: 'Tickets query failed' });

    db.query(revenueQuery, (err, revenue) => {
      if (err) return res.status(500).json({ error: 'Revenue query failed' });

      db.query(customersQuery, (err, customers) => {
        if (err) return res.status(500).json({ error: 'Customers query failed' });

        db.query(avgResponseQuery, (err, avgResponse) => {
          if (err) return res.status(500).json({ error: 'Avg response query failed' });

          res.json({
            tickets: tickets[0].total,
            revenue: revenue[0].totalRevenue || 0,
            customers: customers[0].totalCustomers,
            avgResponse: avgResponse[0].avgResponse || 0
          });
        });
      });
    });
  });
});

// ----------------------
// Ticket Analytics
// ----------------------
router.get('/reports/tickets', (req, res) => {
  const statusQuery = `
    SELECT status AS name, COUNT(*) AS value
    FROM service_tickets
    GROUP BY status
  `;
  const trendsQuery = `
    SELECT DATE(created_at) AS date, COUNT(*) AS tickets
    FROM service_tickets
    GROUP BY DATE(created_at)
    ORDER BY date ASC
  `;

  db.query(statusQuery, (err, statusDist) => {
    if (err) return res.status(500).json({ error: 'Ticket status query failed' });

    db.query(trendsQuery, (err, ticketTrends) => {
      if (err) return res.status(500).json({ error: 'Ticket trends query failed' });

      res.json({
        statusDistribution: statusDist,
        trends: ticketTrends
      });
    });
  });
});

// ----------------------
// Revenue Report
// ----------------------
router.get('/reports/revenue', (req, res) => {
  const revenueQuery = `
    SELECT 
      DATE_FORMAT(created_at, '%b') AS month,
      SUM(final_total) AS revenue
    FROM bills
    WHERE status='paid'
    GROUP BY MONTH(created_at)
    ORDER BY MONTH(created_at)
  `;

  db.query(revenueQuery, (err, rows) => {
    if (err) return res.status(500).json({ error: 'Revenue query failed' });

    const data = rows.map(r => ({
      month: r.month,
      revenue: r.revenue,
      target: r.revenue ? Math.round(r.revenue * 1.1) : 0 // example 10% growth target
    }));

    res.json(data);
  });
});

// ----------------------
// Customer Analytics
// ----------------------
router.get('/reports/customers', (req, res) => {
  const newCustQuery = `
    SELECT COUNT(*) AS count FROM individual_customers
    WHERE registration_date >= DATE_SUB(NOW(), INTERVAL 30 DAY)
  `;
  const returningCustQuery = `
    SELECT COUNT(DISTINCT customer_id) AS count
    FROM service_tickets
    WHERE customer_id IN (
      SELECT customer_id FROM service_tickets 
      GROUP BY customer_id HAVING COUNT(*) > 1
    )
  `;

  db.query(newCustQuery, (err, newCust) => {
    if (err) return res.status(500).json({ error: 'New customers query failed' });

    db.query(returningCustQuery, (err, returningCust) => {
      if (err) return res.status(500).json({ error: 'Returning customers query failed' });

      const total = newCust[0].count + returningCust[0].count;
      const newPct = total ? (newCust[0].count / total) * 100 : 0;
      const returnPct = total ? (returningCust[0].count / total) * 100 : 0;

      res.json({
        newCustomers: { count: newCust[0].count, percentage: newPct },
        returningCustomers: { count: returningCust[0].count, percentage: returnPct },
        satisfaction: 4.8, // placeholder
        reviews: 156 // placeholder
      });
    });
  });
});

// ----------------------
// Export Report
// ----------------------
router.get('/reports/export/:type', (req, res) => {
  const type = req.params.type;
  let query;

  if (type === 'overview') {
    query = `SELECT * FROM service_tickets`;
  } else if (type === 'tickets') {
    query = `SELECT status, COUNT(*) as count FROM service_tickets GROUP BY status`;
  } else if (type === 'revenue') {
    query = `SELECT * FROM bills WHERE status='paid'`;
  } else if (type === 'customers') {
    query = `SELECT * FROM individual_customers`;
  } else {
    return res.status(400).json({ error: 'Invalid report type' });
  }

  db.query(query, (err, results) => {
    if (err) return res.status(500).json({ error: 'Export query failed' });

    try {
      const parser = new Parser();
      const csv = parser.parse(results);

      res.header('Content-Type', 'text/csv');
      res.attachment(`${type}-report.csv`);
      res.send(csv);
    } catch (e) {
      res.status(500).json({ error: 'Failed to export CSV' });
    }
  });
});



module.exports = router;
