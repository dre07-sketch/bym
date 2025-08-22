const express = require('express');
const router = express.Router();
const db = require('../../db/connection'); // adjust based on your db connection setup

router.post('/progress-logs', (req, res) => {
  const { ticket_number, date, time, status, description } = req.body;

  // Basic validation
  if (!ticket_number || !date || !time || !status || !description) {
    return res.status(400).json({ error: 'All fields are required.' });
  }

  const query = `
    INSERT INTO progress_logs (ticket_number, date, time, status, description)
    VALUES (?, ?, ?, ?, ?)
  `;

  const values = [ticket_number, date, time, status, description];

  db.query(query, values, (err, result) => {
    if (err) {
      console.error('Error inserting progress log:', err);
      return res.status(500).json({ error: 'Database error' });
    }

    res.status(201).json({ message: 'Progress log added successfully', id: result.insertId });
  });
});

router.get('/progress-logs/:ticket_number', (req, res) => {
  const { ticket_number } = req.params;

  const query = `
    SELECT id, date, time, status, description, created_at
    FROM progress_logs
    WHERE ticket_number = ?
    ORDER BY created_at DESC
  `;

  db.query(query, [ticket_number], (err, results) => {
    if (err) {
      console.error('Error fetching progress logs:', err);
      return res.status(500).json({ error: 'Database error' });
    }

    res.json({ ticket_number, progress_logs: results });
  });
});


module.exports = router;
