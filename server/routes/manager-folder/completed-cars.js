const express = require("express");
const router = express.Router();
const db = require("../../db/connection");

// ✅ GET all completed tickets with full details
router.get("/completed-tickets", (req, res) => {
  const ticketsQuery = `
    SELECT *
    FROM service_tickets
    WHERE status = 'completed'
    ORDER BY updated_at DESC
  `;

  db.query(ticketsQuery, (err, tickets) => {
    if (err) {
      console.error("❌ Error fetching completed tickets:", err);
      return res.status(500).json({ error: "Database error" });
    }

    if (tickets.length === 0) {
      return res.json([]);
    }

    let results = [];
    let remaining = tickets.length;

    tickets.forEach(ticket => {
      const { ticket_number } = ticket;
      let details = {
        disassembled_parts: [],
        outsource_mechanics: [],
        ordered_parts: [],
        outsource_stock: [],
        inspections: [],
        progress_logs: [],
        bills: [],
        insurance: null
      };

      const queries = {
        disassembled_parts: "SELECT * FROM disassembled_parts WHERE ticket_number = ? ORDER BY logged_at",
        outsource_mechanics: "SELECT * FROM outsource_mechanics WHERE ticket_number = ? ORDER BY created_at",
        ordered_parts: "SELECT * FROM ordered_parts WHERE ticket_number = ? ORDER BY ordered_at",
        outsource_stock: "SELECT * FROM outsource_stock WHERE ticket_number = ? ORDER BY requested_at",
        inspections: "SELECT * FROM inspections WHERE ticket_number = ? ORDER BY created_at",
        progress_logs: "SELECT * FROM progress_logs WHERE ticket_number = ? ORDER BY created_at",
        bills: "SELECT * FROM bills WHERE ticket_number = ? ORDER BY created_at",
        insurance: "SELECT * FROM insurance WHERE ticket_number = ? LIMIT 1"
      };

      let pending = Object.keys(queries).length;

      Object.entries(queries).forEach(([key, sql]) => {
        db.query(sql, [ticket_number], (err, rows) => {
          if (err) {
            console.error(`❌ Error fetching ${key} for ${ticket_number}:`, err);
            details[key] = key === "insurance" ? null : [];
          } else {
            if (key === "insurance") {
              details[key] = rows.length > 0 ? rows[0] : null;
            } else {
              details[key] = rows;
            }
          }

          pending--;
          if (pending === 0) {
            results.push({ ...ticket, ...details });
            remaining--;
            if (remaining === 0) {
              return res.json(results);
            }
          }
        });
      });
    });
  });
});


module.exports = router;
