const express = require('express');
const router = express.Router();
const db = require('../../db/connection'); // adjust path to your db connection

// =============================
// Add a new payment
// =============================
router.post('/pay', (req, res) => {
  const { ticket_number, mechanic_name, payment_amount, payment_date, payment_method, notes } = req.body;

  if (!ticket_number || !mechanic_name || !payment_amount || !payment_date || !payment_method) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  const query = `
    INSERT INTO outsource_mechanic_payments 
      (ticket_number, mechanic_name, payment_amount, payment_date, payment_method, notes)
    VALUES (?, ?, ?, ?, ?, ?)
  `;

  db.query(query, [ticket_number, mechanic_name, payment_amount, payment_date, payment_method, notes || null], (err, result) => {
    if (err) {
      console.error('Error adding payment:', err);
      return res.status(500).json({ message: 'Database error' });
    }
    res.status(201).json({ message: 'Payment added', payment_id: result.insertId });
  });
});

router.get("/outsource-payments/:ticket_number", (req, res) => {
  const { ticket_number } = req.params;

  if (!ticket_number) {
    return res.status(400).json({ message: "ticket_number is required" });
  }

  // 1️⃣ Fetch mechanics with totals
  const summaryQuery = `
    SELECT 
        om.id,
        om.ticket_number,
        om.mechanic_name,
        om.phone,
        om.payment AS agreed_payment,
        om.payment_method,
        om.work_done,
        om.notes AS mechanic_notes,
        IFNULL(SUM(omp.payment_amount), 0) AS total_paid,
        (om.payment - IFNULL(SUM(omp.payment_amount), 0)) AS remaining_balance
    FROM outsource_mechanics om
    LEFT JOIN outsource_mechanic_payments omp 
        ON om.ticket_number = omp.ticket_number 
       AND om.mechanic_name = omp.mechanic_name
    WHERE om.ticket_number = ?
    GROUP BY om.id, om.ticket_number, om.mechanic_name
  `;

  db.query(summaryQuery, [ticket_number], (err, mechanics) => {
    if (err) {
      console.error("Error fetching summary:", err);
      return res.status(500).json({ message: "Database error" });
    }

    if (mechanics.length === 0) {
      return res.status(404).json({ message: "No outsource mechanic found for this ticket" });
    }

    // 2️⃣ Fetch payment history for all mechanics under this ticket
    const paymentsQuery = `
      SELECT 
          id,
          ticket_number,
          mechanic_name,
          payment_amount,
          payment_date,
          payment_method,
          notes,
          created_at
      FROM outsource_mechanic_payments
      WHERE ticket_number = ?
      ORDER BY payment_date ASC
    `;

    db.query(paymentsQuery, [ticket_number], (err, payments) => {
      if (err) {
        console.error("Error fetching payments:", err);
        return res.status(500).json({ message: "Database error" });
      }

      // 3️⃣ Attach payments to each mechanic
      const mechanicsWithPayments = mechanics.map(m => ({
        ...m,
        payments: payments.filter(p => p.mechanic_name === m.mechanic_name)
      }));

      res.json({
        success: true,
        ticket_number,
        mechanics: mechanicsWithPayments
      });
    });
  });
});




module.exports = router;