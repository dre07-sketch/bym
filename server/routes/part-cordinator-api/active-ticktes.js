const express = require('express');
const router = express.Router();
const db = require('../../db/connection');

// GET /api/tickets/status/active-details
router.get('/active-tickets', (req, res) => {
  const query = `
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
      st.mechanic_assign,
      st.description,
      st.priority,
      st.type,
      st.urgency_level,
      st.status,
      st.appointment_id,
      st.created_at,
      st.updated_at,
      st.completion_date,  -- ✅ INCLUDED
      st.estimated_completion_date,  -- ✅ INCLUDED
      st.inspector_assign,  -- 👈 ADD THIS
      COALESCE(ic.phone, cc.phone) AS phone,
      COALESCE(ic.email, cc.email) AS email,
      COALESCE(ic.image, cc.image) AS customer_image,
      v.image AS vehicle_image_path
    FROM service_tickets st
    LEFT JOIN individual_customers ic 
      ON st.customer_type = 'individual' AND st.customer_id = ic.customer_id
    LEFT JOIN company_customers cc 
      ON st.customer_type = 'company' AND st.customer_id = cc.customer_id
    LEFT JOIN vehicles v 
      ON st.vehicle_id = v.id
    WHERE st.status IN ('in progress')
    ORDER BY st.updated_at DESC
  `;

  db.query(query, (err, results) => {
    if (err) {
      console.error('Error fetching service tickets:', err);
      return res.status(500).json({ error: 'Internal server error' });
    }

    res.json(results);
  });
});


// PUT /api/active-tickets/update-status/:ticket_number
router.put('/update-status/:ticket_number', (req, res) => {
  const { ticket_number } = req.params;
  const { status } = req.body;
  const allowed = ['pending','assigned','in progress','ready for inspection','inspection','successful inspection','inspection failed','completed'];
  if (!allowed.includes(status)) return res.status(400).json({ error: 'Invalid status' });
  const query = `UPDATE service_tickets SET status = ? WHERE ticket_number = ?`;
  db.query(query, [status, ticket_number], (err, result) => {
    if (err) return res.status(500).json({ error: 'DB error' });
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Updated' });
  });
});



const allowedStatuses = [
  'ready for inspection',
  'inspection',
  'successful inspection',
  'inspection failed',
  'completed'
];

router.get('/completed-cars/:ticketNumber', (req, res) => {
  const ticketNumber = req.params.ticketNumber;

  // 1. Query the main ticket
  const ticketQuery = `
    SELECT 
      t.ticket_number,
      t.customer_name,
      t.license_plate,
      t.mechanic_assign AS mechanicName,
      t.created_at AS startDate,
      t.completion_date AS dueDate,
      t.estimated_completion_date AS estimatedCompletionDate,
      t.description,
      t.status,
      t.vehicle_info
    FROM service_tickets t
    WHERE t.ticket_number = ?
      AND t.status IN (?)
  `;

  db.query(ticketQuery, [ticketNumber, allowedStatuses], (err, ticketResults) => {
    if (err) {
      console.error('Error fetching ticket:', err);
      return res.status(500).json({ message: 'Internal server error' });
    }

    if (ticketResults.length === 0) {
      return res.status(404).json({ message: 'Ticket not found or status not allowed' });
    }

    const ticket = ticketResults[0];

    // 2. Query progress logs
   const progressLogsQuery = `
  SELECT 
    DATE(created_at) AS date,
    
    description AS notes
  FROM progress_logs
  WHERE ticket_number = ?
  ORDER BY created_at ASC
`;

    db.query(progressLogsQuery, [ticketNumber], (err, logsResults) => {
      if (err) {
        console.error('Error fetching activity logs:', err);
        return res.status(500).json({ message: 'Internal server error' });
      }

      // 3. Query disassembled parts
      const disassembledPartsQuery = `
        SELECT 
          part_name,
          \`condition\`,
          status,
          notes,
          logged_at
        FROM disassembled_parts
        WHERE ticket_number = ?
        ORDER BY logged_at ASC
      `;


      db.query(disassembledPartsQuery, [ticketNumber], (err, partsResults) => {
        if (err) {
          console.error('Error fetching disassembled parts:', err);
          return res.status(500).json({ message: 'Internal server error' });
        }

        // 4. Send the final response
        res.json({
          ...ticket,
          activityLogs: logsResults,
          disassembledParts: partsResults,
          toolsUsed: [] // Still empty unless tool tracking is implemented
        });
      });
    });
  });
});

router.get('/completed-cars', (req, res) => {
  const query = `
    SELECT 
      t.ticket_number,
      t.customer_name,
      t.license_plate,
      t.vehicle_info,
      t.mechanic_assign AS mechanicName,
      DATE(t.created_at) AS startDate,
      DATE(t.updated_at) AS dueDate,
      DATE(t.completion_date) AS completedDate,
      DATE(t.estimated_completion_date) AS estimatedCompletionDate,
     
      t.status
    FROM service_tickets t
    WHERE t.status IN (?)
    ORDER BY t.completion_date DESC
  `;

  db.query(query, [allowedStatuses], (err, results) => {
    if (err) {
      console.error('Error fetching completed cars:', err);
      return res.status(500).json({ message: 'Internal server error' });
    }

    res.json(results);
  });
});

module.exports = router;
