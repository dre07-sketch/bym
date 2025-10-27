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

router.post('/update-to-payment-requested', (req, res) => {
  const { ticketNumber } = req.body;

  if (!ticketNumber) {
    return res.status(400).json({
      success: false,
      message: 'ticketNumber is required'
    });
  }

  const query = `
    UPDATE service_tickets
    SET status = 'Payment Requested'
    WHERE ticket_number = ? AND status = 'Request Payment'
  `;

  db.query(query, [ticketNumber], (err, result) => {
    if (err) {
      console.error('❌ Error updating ticket status:', err);
      return res.status(500).json({
        success: false,
        message: 'Database update failed'
      });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'No ticket found with status "Request Payment" and given ticket number'
      });
    }

    res.json({
      success: true,
      message: `Ticket ${ticketNumber} status updated to "Payment Requested"`
    });
  });
});

router.post('/submit-payment', (req, res) => {
  const { ticketNumber, paymentType, customerId } = req.body;

  if (!ticketNumber || !paymentType || !customerId) {
    return res.status(400).json({
      success: false,
      message: 'ticketNumber, paymentType, and customerId are required'
    });
  }

  db.getConnection((err, connection) => {
    if (err) {
      console.error('❌ DB connection error:', err);
      return res.status(500).json({ success: false, message: 'Database connection failed' });
    }

    connection.beginTransaction((err) => {
      if (err) {
        connection.release();
        return res.status(500).json({ success: false, message: 'Transaction start failed' });
      }

      // 1️⃣ Get ticket info (type + status)
      const getTicketQuery = `
        SELECT type, status FROM service_tickets WHERE ticket_number = ?
      `;
      connection.query(getTicketQuery, [ticketNumber], (err, result) => {
        if (err) {
          connection.release();
          return res.status(500).json({ success: false, message: 'Failed to fetch ticket info' });
        }

        if (result.length === 0) {
          connection.release();
          return res.status(404).json({ success: false, message: 'Service ticket not found' });
        }

        const { type, status } = result[0];

        // 2️⃣ Update bill (mark as paid)
        const billQuery = `
          UPDATE bills
          SET payment_type = ?, status = 'paid'
          WHERE ticket_number = ? AND status = 'pending'
        `;
        connection.query(billQuery, [paymentType, ticketNumber], (err, billResult) => {
          if (err) {
            return connection.rollback(() => {
              connection.release();
              console.error('❌ Error updating bill:', err);
              res.status(500).json({ success: false, message: 'Failed to update bill' });
            });
          }

          if (billResult.affectedRows === 0) {
            return connection.rollback(() => {
              connection.release();
              return res.status(404).json({
                success: false,
                message: 'No pending bill found for given ticket number'
              });
            });
          }

          // 3️⃣ Determine how to mark ticket as Completed
          let ticketUpdateQuery = '';

          if (status.toLowerCase() === 'billed') {
            // If current status is "Billed" → complete immediately
            ticketUpdateQuery = `
              UPDATE service_tickets
              SET status = 'Completed'
              WHERE ticket_number = ?
            `;
          } else if (type.toLowerCase() !== 'insurance') {
            // If ticket type is NOT Insurance → complete
            ticketUpdateQuery = `
              UPDATE service_tickets
              SET status = 'Completed'
              WHERE ticket_number = ?
            `;
          } else {
            // Insurance ticket → only complete if it was Payment Requested
            ticketUpdateQuery = `
              UPDATE service_tickets
              SET status = 'Completed'
              WHERE ticket_number = ? AND status = 'Payment Requested'
            `;
          }

          connection.query(ticketUpdateQuery, [ticketNumber], (err, ticketResult) => {
            if (err) {
              return connection.rollback(() => {
                connection.release();
                console.error('❌ Error updating ticket:', err);
                res.status(500).json({ success: false, message: 'Failed to update ticket' });
              });
            }

            if (ticketResult.affectedRows === 0) {
              return connection.rollback(() => {
                connection.release();
                return res.status(404).json({
                  success: false,
                  message: 'No matching service ticket found to update status'
                });
              });
            }

            // 4️⃣ Add loyalty points for BOTH customer types
            const loyaltyIndividualQuery = `
              UPDATE individual_customers 
              SET loyalty_points = COALESCE(loyalty_points, 0) + 5
              WHERE customer_id = ?
            `;

            const loyaltyCompanyQuery = `
              UPDATE company_customers 
              SET loyalty_points = COALESCE(loyalty_points, 0) + 5
              WHERE customer_id = ?
            `;

            connection.query(loyaltyIndividualQuery, [customerId], (err) => {
              if (err) {
                return connection.rollback(() => {
                  connection.release();
                  console.error('❌ Error updating individual loyalty points:', err);
                  res.status(500).json({ success: false, message: 'Failed to update individual loyalty points' });
                });
              }

              connection.query(loyaltyCompanyQuery, [customerId], (err) => {
                if (err) {
                  return connection.rollback(() => {
                    connection.release();
                    console.error('❌ Error updating company loyalty points:', err);
                    res.status(500).json({ success: false, message: 'Failed to update company loyalty points' });
                  });
                }

                // ✅ Commit transaction after everything succeeds
                connection.commit((err) => {
                  if (err) {
                    return connection.rollback(() => {
                      connection.release();
                      console.error('❌ Transaction commit failed:', err);
                      res.status(500).json({ success: false, message: 'Transaction commit failed' });
                    });
                  }

                  connection.release();
                  res.json({
                    success: true,
                    message: `✅ Payment submitted for ticket ${ticketNumber}. Bill marked as paid, ticket marked as Completed (${type}/${status}), and loyalty points updated.`
                  });
                });
              });
            });
          });
        });
      });
    });
  });
});





module.exports = router;
