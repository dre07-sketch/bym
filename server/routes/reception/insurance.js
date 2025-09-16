const express = require("express");
const router = express.Router();
const db = require("../../db/connection"); // ✅ MySQL connection

// ===================== FETCH ACCEPTED PROFORMAS =====================
router.get("/proformas/accepted", (req, res) => {
  const query = `
    SELECT 
      id,
      proforma_number,
      proforma_date,
      customer_name,
      company_name,
      company_address,
      company_phone,
      company_vat_number,
      notes,
      subtotal,
      vat_rate,
      vat_amount,
      total,
      status,
      created_at,
      updated_at
    FROM proformas
    WHERE status = 'Accepted'
    ORDER BY proforma_date DESC
  `;

  db.query(query, (err, results) => {
    if (err) {
      console.error("Error fetching accepted proformas:", err);
      return res.status(500).json({
        success: false,
        message: "Database error while fetching accepted proformas",
      });
    }

    res.json({
      success: true,
      count: results.length,
      data: results,
    });
  });
});


router.get("/proformas/:proforma_number", (req, res) => {
  const { proforma_number } = req.params;

  const proformaQuery = `SELECT * FROM proformas WHERE proforma_number = ?`;
  db.query(proformaQuery, [proforma_number], (err, proformaRows) => {
    if (err) {
      console.error("Error fetching proforma:", err);
      return res.status(500).json({ success: false, message: "Database error" });
    }

    if (proformaRows.length === 0) {
      return res.status(404).json({ success: false, message: "Proforma not found" });
    }

    const proforma = proformaRows[0];

    const itemsQuery = `SELECT * FROM proforma_items WHERE proforma_id = ?`;
    db.query(itemsQuery, [proforma.id], (err, itemRows) => {
      if (err) {
        console.error("Error fetching proforma items:", err);
        return res.status(500).json({ success: false, message: "Database error" });
      }

      proforma.items = itemRows;
      res.json({ success: true, data: proforma });
    });
  });
});


module.exports = router;
