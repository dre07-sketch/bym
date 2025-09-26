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



// GET /api/proformas/converted
// GET /api/proformas/converted
// GET /api/proformas/converted
router.get('/converted', (req, res) => {
  const query = `
    SELECT 
      p.id AS proforma_id,
      p.proforma_number,
      p.proforma_date,
      p.customer_name AS proforma_customer_name,
      p.company_name,
      p.company_address,
      p.company_phone,
      p.company_vat_number,
      p.notes AS proforma_notes,
      p.subtotal,
      p.vat_rate,
      p.vat_amount,
      p.total,
      p.status AS proforma_status,
      p.created_at AS proforma_created_at,
      p.updated_at AS proforma_updated_at,
      t.id AS ticket_id,
      t.ticket_number,
      t.customer_type,
      t.customer_id,
      t.customer_name AS ticket_customer_name,
      t.vehicle_id,
      t.vehicle_info,
      t.license_plate,
      t.title AS ticket_title,
      t.outsource_mechanic,
      t.inspector_assign,
      t.description AS ticket_description,
      t.priority,
      t.type,
      t.urgency_level,
      t.status AS ticket_status,
      t.appointment_id,
      t.created_at AS ticket_created_at,
      t.updated_at AS ticket_updated_at,
      t.completion_date,
      t.estimated_completion_date
    FROM proformas p
    LEFT JOIN service_tickets t ON p.proforma_number = t.ticket_number
    WHERE LOWER(p.status) = 'converted'
    ORDER BY p.created_at DESC
  `;

  db.query(query, (err, rows) => {
    if (err) {
      console.error("❌ Error fetching converted proformas:", err);
      return res.status(500).json({
        success: false,
        message: "Server error while fetching converted proformas",
      });
    }

    if (!rows || rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No converted proformas found",
      });
    }

    res.status(200).json({
      success: true,
      count: rows.length,
      data: rows,
    });
  });
});


router.get("/converted-proformas/count", (req, res) => {
  const query = `
    SELECT COUNT(*) AS convertedCount
    FROM proformas
    WHERE status = 'converted'
  `;

  db.query(query, (err, results) => {
    if (err) {
      console.error("Error counting converted proformas:", err);
      return res.status(500).json({ error: "Database error" });
    }

    res.json({
      success: true,
      convertedCount: results[0].convertedCount
    });
  });
});



module.exports = router;
