const express = require('express');
const router = express.Router();
const db = require('../../db/connection'); // adjust path as needed

// GET /api/tickets/in-progress - fetch all tickets with status "in progress"


// GET /api/process/in-progress
router.get('/in-progress', (req, res) => {
  const query = `
    SELECT 
      st.id,
      st.ticket_number,
      st.customer_type,
      st.customer_id,
      st.customer_name,
      st.vehicle_id,
      v.make AS vehicle_make,
      v.model AS vehicle_model,
      v.year AS vehicle_year,
      v.license_plate,
      CONCAT(v.make, ' ', v.model, ' (', v.year, ')') AS vehicle_info,
      st.title,
      st.mechanic_assign,
      st.inspector_assign,
      st.description,
      st.priority,
      st.type,
      st.urgency_level,
      st.status,
      st.appointment_id,
      st.completion_date,
      st.estimated_completion_date,
      st.created_at,
      st.updated_at,
      COALESCE(ic.email, cc.email) AS email,
      COALESCE(ic.phone, cc.phone) AS phone
    FROM service_tickets st
    LEFT JOIN vehicles v ON st.vehicle_id = v.id
    LEFT JOIN individual_customers ic ON st.customer_type = 'individual' AND st.customer_id = ic.customer_id
    LEFT JOIN company_customers cc ON st.customer_type = 'company' AND st.customer_id = cc.customer_id
    WHERE st.status IN (
      
      'in progress',
      'ready for inspection',
      'inspection',
      'successful inspection',
      'inspection failed',
      'awaiting bill',
      'completed'
    )
    ORDER BY st.updated_at DESC
  `;

  db.query(query, (err, results) => {
    if (err) {
      console.error('Error fetching inspection-related tickets:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(results);
  });
});


router.post('/:id/completion', (req, res) => {
  const ticketId = req.params.id;
  const { completion_date } = req.body;

  if (!completion_date) {
    return res.status(400).json({ error: 'completion_date is required' });
  }

  const query = 'UPDATE service_tickets SET estimated_completion_date = ? WHERE id = ?';

  db.query(query, [completion_date, ticketId], (err, result) => {
    if (err) {
      console.error('Error updating completion date:', err);
      return res.status(500).json({ error: 'Database error' });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    return res.status(200).json({ message: 'Completion date updated successfully' });
  });
});

// GET /api/inspectors - Fetch all inspection staff
router.get("/inspectors", (req, res) => {
  const query = `
    SELECT 
      id,
      full_name,
      email,
      phone_number,
      role,
      inspection_status
    FROM employees
    WHERE role = 'Inspection'
  `;

  db.query(query, (err, results) => {
    if (err) {
      console.error("Error fetching inspectors:", err);
      return res.status(500).json({ error: "Database query error" });
    }
    res.json(results);
  });
});

router.put("/:id/status-inspector", (req, res) => {
  const { id } = req.params;
  const { status, ticket_number } = req.body;

  // Input validation
  if (!status || !ticket_number) {
    return res.status(400).json({
      error: "Status and ticket_number are required",
    });
  }

  if (status !== "Busy") {
    return res.status(400).json({
      error: "Only 'Busy' status assignment is allowed in this endpoint.",
    });
  }

  // Step 1: Fetch the inspector
  const getInspectorQuery = `
    SELECT id, full_name, inspection_status 
    FROM employees 
    WHERE id = ? AND role = 'Inspection'
  `;

  db.query(getInspectorQuery, [id], (err, results) => {
    if (err) {
      console.error("Database error fetching inspector:", err);
      return res.status(500).json({ error: "Failed to fetch inspector" });
    }

    if (results.length === 0) {
      return res.status(404).json({
        error: "Inspector not found or not authorized for inspection duties.",
      });
    }

    const inspector = results[0];

    // 🔒 Block if inspector is already busy
    if (inspector.inspection_status === "Busy") {
      return res.status(400).json({
        error: `Inspector '${inspector.full_name}' is currently busy and cannot be assigned.`,
      });
    }

    // Step 2: Check if the ticket already has an inspector assigned
    const checkTicketQuery = `
      SELECT inspector_assign, status 
      FROM service_tickets 
      WHERE ticket_number = ?
    `;

    db.query(checkTicketQuery, [ticket_number], (err, ticketResults) => {
      if (err) {
        console.error("Database error checking ticket:", err);
        return res.status(500).json({ error: "Failed to check ticket assignment" });
      }

      if (ticketResults.length === 0) {
        return res.status(404).json({ error: "Ticket not found." });
      }

      const ticket = ticketResults[0];

      // 🔒 Block reassignment if another inspector is already assigned
      if (ticket.inspector_assign && ticket.inspector_assign.trim() !== "") {
        return res.status(400).json({
          error: `This ticket is already assigned to ${ticket.inspector_assign}. Reassignment is not allowed.`,
        });
      }

      // Step 3: Update inspector status to 'Busy'
      const updateInspectorQuery = `
        UPDATE employees 
        SET inspection_status = ? 
        WHERE id = ?
      `;

      db.query(updateInspectorQuery, [status, id], (err) => {
        if (err) {
          console.error("Error updating inspector status:", err);
          return res.status(500).json({ error: "Failed to update inspector status" });
        }

        // Step 4: Update ticket: assign inspector and set status to 'Inspection'
        const updateTicketQuery = `
          UPDATE service_tickets 
          SET status = 'Inspection', inspector_assign = ? 
          WHERE ticket_number = ?
        `;

        db.query(
          updateTicketQuery,
          [inspector.full_name, ticket_number],
          (err, result) => {
            if (err) {
              console.error("Error updating ticket:", err);
              return res.status(500).json({ error: "Failed to update ticket" });
            }

            // ✅ Success: Return meaningful response
            return res.status(200).json({
              message: `Inspector '${inspector.full_name}' successfully assigned to ticket ${ticket_number}`,
              success: true,
              inspectorName: inspector.full_name,
              ticketNumber: ticket_number,
              newStatus: "Inspection",
            });
          }
        );
      });
    });
  });
});

// New route: Get single ticket by ticket number
router.get("/ticket/:ticketNumber", (req, res) => {
  const { ticketNumber } = req.params;

  const query = `SELECT ticket_number, inspector_assign, status FROM service_tickets WHERE ticket_number = ?`;

  db.query(query, [ticketNumber], (err, results) => {
    if (err) {
      console.error("Error fetching ticket:", err);
      return res.status(500).json({ error: "Database error" });
    }

    if (results.length === 0) {
      return res.status(404).json({ error: "Ticket not found" });
    }

    res.json(results[0]);
  });
});

router.get('/parts', (req, res) => {
  const query = `
    SELECT 
      id, 
      item_id, 
      name, 
      category, 
      sku, 
      price, 
      quantity AS inStock,
      min_stock_level AS minStock,
      supplier,
      location,
      description,
      image_url
    FROM inventory_items
  `;

  db.query(query, (err, results) => {
    if (err) {
      console.error('Error fetching parts:', err);
      return res.status(500).json({ error: 'Failed to fetch parts' });
    }
    res.json(results);
  });
});

// ✅ Place order for parts
router.post('/ordered-parts', (req, res) => {
  const { ticketNumber, items } = req.body;
  /**
   * items should be:
   * [
   *   { item_id: "ITM-001", name: "Brake Pads", category: "Brake System", sku: "BP-001", price: 45.99, quantity: 2 },
   *   { item_id: "ITM-002", name: "Oil Filter", category: "Engine Parts", sku: "OF-001", price: 8.99, quantity: 1 }
   * ]
   */
  if (!ticketNumber || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'Ticket number and items are required' });
  }

  const values = items.map(item => [
    ticketNumber,
    item.item_id,
    item.name,
    item.category,
    item.sku,
    item.price,
    item.quantity,
    'pending'
  ]);

  const query = `
    INSERT INTO ordered_parts
    (ticket_number, item_id, name, category, sku, price, quantity, status)
    VALUES ?
  `;

  db.query(query, [values], (err, result) => {
    if (err) {
      console.error('Error ordering parts:', err);
      return res.status(500).json({ error: 'Failed to order parts' });
    }
    res.json({ success: true, message: 'Parts ordered successfully', inserted: result.affectedRows });
  });
});


module.exports = router;