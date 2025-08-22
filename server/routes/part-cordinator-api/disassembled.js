const express = require('express');
const router = express.Router();
const db = require('../../db/connection'); // adjust to your DB connection file

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
            dp.condition,
            dp.status AS part_status,
            dp.notes AS part_notes,
            dp.logged_at,
            st.ticket_number AS service_ticket_number,
            st.customer_name,
            st.license_plate,
            st.mechanic_assign,
            st.title,
            st.description,
            st.priority,
            st.type,
            st.status AS ticket_status,
            st.completion_date,
            st.estimated_completion_date
        FROM disassembled_parts dp
        JOIN service_tickets st 
            ON dp.ticket_number = st.ticket_number
        WHERE DATE(dp.logged_at) = CURDATE() -- ✅ only today's records
        ORDER BY dp.logged_at DESC
    `;

    db.query(sql, (err, results) => {
        if (err) {
            console.error("Error fetching today's disassembled parts:", err);
            return res.status(500).json({ message: "Server error" });
        }

        res.json(results);
    });
});


// PUT /api/active-tickets/update-status/:ticket_number


module.exports = router;

