const express = require('express');
const router = express.Router();
const db = require('../../db/connection'); // adjust to your DB connection file
const EventEmitter = require('events');
const events = new EventEmitter(); // 👈 create an event emitter instance


router.post('/disassembled-parts', (req, res) => {
  const { ticket_number, part_name, condition, status, notes } = req.body;

  // Allowed status values
  const allowedStatuses = ['received', 'returned'];

  // Validate required fields
  if (!ticket_number || !part_name || !condition || !status) {
    return res.status(400).json({ error: 'Missing required fields.' });
  }

  // Validate status value
  if (!allowedStatuses.includes(status)) {
    return res.status(400).json({ error: 'Invalid status. Must be either "received" or "returned".' });
  }

  const query = `
    INSERT INTO disassembled_parts (ticket_number, part_name, \`condition\`, status, notes)
    VALUES (?, ?, ?, ?, ?)
  `;

  const values = [ticket_number, part_name, condition, status, notes || null];

  db.query(query, values, (err, result) => {
    if (err) {
      console.error('Error inserting disassembled part:', err);
      return res.status(500).json({ error: 'Database error.' });
    }

    res.status(201).json({
      message: 'Disassembled part logged successfully',
      id: result.insertId
    });
  });
});

// Fetch disassembled parts by ticket number
router.get('/disassembled-parts/:ticket_number', (req, res) => {
  const { ticket_number } = req.params;

  const query = `
    SELECT id, part_name, \`condition\`, status, notes, logged_at
    FROM disassembled_parts
    WHERE ticket_number = ?
    ORDER BY logged_at DESC
  `;

  db.query(query, [ticket_number], (err, results) => {
    if (err) {
      console.error('Error fetching disassembled parts:', err);
      return res.status(500).json({ error: 'Database error' });
    }

    res.json({ ticket_number, disassembled_parts: results });
  });
});


// PUT: Update disassembled part status
// In the PUT /disassembled-parts/:id route, after updating the part status:

router.put('/disassembled-parts/:id', (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const allowedStatuses = ['received', 'returned'];

  if (!status || !allowedStatuses.includes(status)) {
    return res.status(400).json({ error: 'Invalid or missing status. Must be "received" or "returned".' });
  }

  const query = `UPDATE disassembled_parts SET status = ? WHERE id = ?`;
  db.query(query, [status, id], (err, result) => {
    if (err) {
      console.error('Error updating part status:', err);
      return res.status(500).json({ error: 'Database error.' });
    }
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Part not found.' });

    // ✅ Emit event only if status is "returned"
    if (status === 'returned') {
      const getTicketQuery = `SELECT ticket_number FROM disassembled_parts WHERE id = ?`;
      db.query(getTicketQuery, [id], (err2, partResult) => {
        if (err2) {
          console.error('Error getting ticket number:', err2);
        } else if (partResult.length > 0) {
          const ticketNumber = partResult[0].ticket_number;

          events.emit('parts_returned', {
            recordId: id,
            ticketNumber,
            coordinatorName: 'Part Coordinator'
          });

          console.log(`🔔 Emitted parts_returned event for part ${id} in ticket ${ticketNumber}`);
        }
      });
    }

    res.json({ message: 'Status updated successfully.' });
  });
});

// Fetch today's disassembled parts only
router.get('/today-parts', (req, res) => {
  const sql = `
    SELECT 
        dp.id AS part_id,
        dp.ticket_number,
        dp.part_name,
        dp.condition AS part_condition,
        dp.status AS part_status,
        dp.notes AS part_notes,
        dp.logged_at,
        st.id AS service_ticket_id,
        st.customer_name,
        st.license_plate,
        st.title,
        st.description AS issueDescription,
        st.priority,
        st.type,
        st.status AS ticket_status,
        st.completion_date,
        st.estimated_completion_date,
        st.created_at AS assignedDate,
        ma.mechanic_name
    FROM disassembled_parts dp
    JOIN service_tickets st 
        ON dp.ticket_number = st.ticket_number
    LEFT JOIN mechanic_assignments ma
        ON ma.ticket_number = st.ticket_number
    WHERE DATE(dp.logged_at) = CURDATE() -- ✅ only today's records
    ORDER BY dp.logged_at DESC
  `;

  db.query(sql, (err, results) => {
    if (err) {
      console.error("Error fetching today's disassembled parts:", err);
      return res.status(500).json({ message: "Server error" });
    }

    // Group by ticket
    const ticketsMap = {};
    results.forEach(row => {
      if (!ticketsMap[row.ticket_number]) {
        ticketsMap[row.ticket_number] = {
          ticketNumber: row.ticket_number,
          service_ticket_id: row.service_ticket_id,
          clientName: row.customer_name,
          licensePlate: row.license_plate,
          mechanicName: row.mechanic_name, // ✅ now from mechanic_assignments
          title: row.title,
          issueDescription: row.issueDescription,
          priority: row.priority,
          type: row.type,
          status: row.ticket_status,
          assignedDate: row.assignedDate,
          estimatedCompletionDate: row.estimated_completion_date,
          finishedDate: row.completion_date,
          replacedParts: []
        };
      }

      // Push part info under replacedParts
      ticketsMap[row.ticket_number].replacedParts.push({
        partId: row.part_id,
        partName: row.part_name,
        condition: row.part_condition,
        status: row.part_status,
        notes: row.part_notes,
        loggedAt: row.logged_at
      });
    });

    const tickets = Object.values(ticketsMap);
    res.json(tickets);
  });
});



// PUT /api/active-tickets/update-status/:ticket_number


module.exports = router;

