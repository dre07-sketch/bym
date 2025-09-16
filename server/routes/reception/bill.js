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

  // Step 1: fetch bill + proforma_number + proforma_id
  const billQuery = `
    SELECT 
      b.id, b.ticket_number, b.proforma_number,
      p.id AS proforma_id, p.proforma_date,
      b.customer_name, b.vehicle_info, b.labor_cost, b.parts_cost,
      b.outsourced_parts_cost, b.outsourced_labor_cost, b.subtotal, 
      b.tax_rate, b.tax_amount, b.total, b.discount, b.final_total, 
      b.status, b.notes, b.created_at, b.updated_at
    FROM bills b
    LEFT JOIN proformas p ON p.proforma_number = b.proforma_number
    WHERE b.ticket_number = ?
    LIMIT 1
  `;

  db.query(billQuery, [ticket_number], (err, billResults) => {
    if (err) {
      console.error("❌ Error fetching bill:", err);
      return res.status(500).json({
        success: false,
        message: "Database error while fetching bill",
      });
    }

    if (billResults.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No bill found for this ticket number",
      });
    }

    const bill = billResults[0];

    // Step 2: if bill has no proforma, return only bill
    if (!bill.proforma_id) {
      return res.json({
        success: true,
        bill,
        items: []
      });
    }

    // Step 3: fetch proforma_items for this proforma_id
    const itemsQuery = `
      SELECT 
        id, proforma_id, description, size, quantity, unit_price, amount, created_at, updated_at
      FROM proforma_items
      WHERE proforma_id = ?
    `;

    db.query(itemsQuery, [bill.proforma_id], (err2, items) => {
      if (err2) {
        console.error("❌ Error fetching proforma items:", err2);
        return res.status(500).json({
          success: false,
          message: "Database error while fetching proforma items",
        });
      }

      res.json({
        success: true,
        bill,
        items
      });
    });
  });
});



module.exports = router;
