const express = require('express');
const router = express.Router();
const db = require('../../db/connection');

// =============================
// GET Completed Ticket by ticket_number
// =============================
router.get('/completed/:ticket_number', (req, res) => {
  const { ticket_number } = req.params;

  // First get the ticket if completed
  const ticketQuery = `
    SELECT 
      st.id,
      st.ticket_number,
      st.customer_name,
      st.vehicle_info,
      st.license_plate,
      st.title,
      st.description,
      st.mechanic_assign,
      st.priority,
      st.type,
      st.status,
      st.created_at,
      st.completion_date,
      st.estimated_completion_date
    FROM service_tickets st
    WHERE st.ticket_number = ? AND st.status = 'completed'
  `;

  db.query(ticketQuery, [ticket_number], (err, ticketResults) => {
    if (err) {
      console.error("Error fetching ticket:", err);
      return res.status(500).json({ message: "Error fetching ticket" });
    }

    if (ticketResults.length === 0) {
      return res.status(404).json({ message: "No completed ticket found" });
    }

    const ticket = ticketResults[0];

    // Fetch inspection details
    const inspectionQuery = `
      SELECT 
        main_issue_resolved,
        reassembly_verified,
        general_condition,
        notes,
        inspection_date,
        inspection_status
      FROM inspections
      WHERE ticket_number = ?
    `;

    db.query(inspectionQuery, [ticket_number], (err, inspectionResults) => {
      if (err) {
        console.error("Error fetching inspection:", err);
        return res.status(500).json({ message: "Error fetching inspection" });
      }

      // Fetch progress logs
      const progressQuery = `
        SELECT 
          part_name,
          condition,
          status,
          notes,
          logged_at
        FROM progress_logs
        WHERE ticket_number = ?
        ORDER BY logged_at ASC
      `;

      db.query(progressQuery, [ticket_number], (err, progressResults) => {
        if (err) {
          console.error("Error fetching progress logs:", err);
          return res.status(500).json({ message: "Error fetching progress logs" });
        }

        // Fetch disassembled parts
        const disassembledQuery = `
          SELECT 
            part_name,
            condition,
            status,
            notes,
            logged_at,
            reassembly_verified
          FROM disassembled_parts
          WHERE ticket_number = ?
        `;

        db.query(disassembledQuery, [ticket_number], (err, disassembledResults) => {
          if (err) {
            console.error("Error fetching disassembled parts:", err);
            return res.status(500).json({ message: "Error fetching disassembled parts" });
          }

          // Build response
          const response = {
            ticket,
            inspections: inspectionResults,
            progress_logs: progressResults,
            disassembled_parts: disassembledResults
          };

          res.json(response);
        });
      });
    });
  });
});

module.exports = router;
