const express = require("express");
const router = express.Router();
const db = require("../../db/connection"); // ✅ your MySQL connection

// ✅ GET bill by ticket number
router.get("/car-bills/:ticket_number", (req, res) => {
  const { ticket_number } = req.params;

  if (!ticket_number) {
    return res.status(400).json({
      success: false,
      message: "Ticket number is required",
    });
  }

  const query = `
    SELECT 
      id, ticket_number, customer_name, vehicle_info, labor_cost, parts_cost,
      outsourced_parts_cost, outsourced_labor_cost, subtotal, tax_rate, tax_amount,
      total, discount, final_total, status, notes, created_at, updated_at
    FROM bills
    WHERE ticket_number = ?
    LIMIT 1
  `;

  db.query(query, [ticket_number], (err, results) => {
    if (err) {
      console.error("❌ Error fetching bill:", err);
      return res.status(500).json({
        success: false,
        message: "Database error while fetching bill",
      });
    }

    if (results.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No bill found for this ticket number",
      });
    }

    res.json({
      success: true,
      bill: results[0],
    });
  });
});

module.exports = router;
