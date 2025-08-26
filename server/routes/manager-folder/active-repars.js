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
      COALESCE(ic.phone, cc.phone) AS phone,
      op.id AS ordered_part_id,
      op.item_id AS ordered_item_id,
      op.name AS ordered_name,
      op.category AS ordered_category,
      op.sku AS ordered_sku,
      op.price AS ordered_price,
      op.quantity AS ordered_quantity,
      op.status AS ordered_status,
      op.ordered_at AS ordered_at
    FROM service_tickets st
    LEFT JOIN vehicles v 
      ON st.vehicle_id = v.id
    LEFT JOIN individual_customers ic 
      ON st.customer_type = 'individual' AND st.customer_id = ic.customer_id
    LEFT JOIN company_customers cc 
      ON st.customer_type = 'company' AND st.customer_id = cc.customer_id
    LEFT JOIN ordered_parts op
      ON st.ticket_number = op.ticket_number
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

    // ✅ Group ordered parts under each ticket
    const ticketsMap = {};
    results.forEach(row => {
      if (!ticketsMap[row.ticket_number]) {
        ticketsMap[row.ticket_number] = {
          id: row.id,
          ticket_number: row.ticket_number,
          customer_type: row.customer_type,
          customer_id: row.customer_id,
          customer_name: row.customer_name,
          vehicle_id: row.vehicle_id,
          vehicle_make: row.vehicle_make,
          vehicle_model: row.vehicle_model,
          vehicle_year: row.vehicle_year,
          license_plate: row.license_plate,
          vehicle_info: row.vehicle_info,
          title: row.title,
          mechanic_assign: row.mechanic_assign,
          inspector_assign: row.inspector_assign,
          description: row.description,
          priority: row.priority,
          type: row.type,
          urgency_level: row.urgency_level,
          status: row.status,
          appointment_id: row.appointment_id,
          completion_date: row.completion_date,
          estimated_completion_date: row.estimated_completion_date,
          created_at: row.created_at,
          updated_at: row.updated_at,
          email: row.email,
          phone: row.phone,
          ordered_parts: []
        };
      }

      if (row.ordered_part_id) {
        ticketsMap[row.ticket_number].ordered_parts.push({
          id: row.ordered_part_id,
          item_id: row.ordered_item_id,
          name: row.ordered_name,
          category: row.ordered_category,
          sku: row.ordered_sku,
          price: row.ordered_price,
          quantity: row.ordered_quantity,
          status: row.ordered_status,
          ordered_at: row.ordered_at
        });
      }
    });

    res.json(Object.values(ticketsMap));
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

router.get("/progress/:ticket_number", (req, res) => {
  const { ticket_number } = req.params;

  if (!ticket_number) {
    return res.status(400).json({ message: "ticket_number is required" });
  }

  const query = `
    SELECT 
      id,
      ticket_number,
      date,
      time,
      status,
      description,
      created_at
    FROM progress_logs
    WHERE ticket_number = ?
    ORDER BY date ASC, time ASC
  `;

  db.query(query, [ticket_number], (err, results) => {
    if (err) {
      console.error("Error fetching progress logs:", err);
      return res.status(500).json({ message: "Database error" });
    }

    if (results.length === 0) {
      return res.status(404).json({ message: "No progress logs found for this ticket" });
    }

    res.json(results);
  });
});

router.get("/diassmbled/:ticket_number", (req, res) => {
  const { ticket_number } = req.params;

  if (!ticket_number) {
    return res.status(400).json({ message: "ticket_number is required" });
  }

  const query = `
    SELECT 
      id,
      ticket_number,
      part_name,
      condition,
      status,
      notes,
      logged_at,
      reassembly_verified
    FROM disassembled_parts
    WHERE ticket_number = ?
    ORDER BY logged_at ASC
  `;

  db.query(query, [ticket_number], (err, results) => {
    if (err) {
      console.error("Error fetching disassembled parts:", err);
      return res.status(500).json({ message: "Database error" });
    }

    if (results.length === 0) {
      return res.status(404).json({ message: "No disassembled parts found for this ticket" });
    }

    res.json(results);
  });
});

router.get("/used-tools/:ticket_number", (req, res) => {
  const { ticket_number } = req.params;

  if (!ticket_number) {
    return res.status(400).json({ message: "ticket_number is required" });
  }

  const query = `
    SELECT 
      id,
      tool_id,
      tool_name,
      ticket_id,
      ticket_number,
      assigned_quantity,
      assigned_by,
      status,
      assigned_at,
      returned_at,
      updated_at
    FROM tool_assignments
    WHERE ticket_number = ?
    ORDER BY assigned_at ASC
  `;

  db.query(query, [ticket_number], (err, results) => {
    if (err) {
      console.error("Error fetching tool assignments:", err);
      return res.status(500).json({ message: "Database error" });
    }

    if (results.length === 0) {
      return res.status(404).json({ message: "No tool assignments found for this ticket" });
    }

    res.json(results);
  });
});

router.get("/inspection/:ticket_number", (req, res) => {
  const { ticket_number } = req.params;

  if (!ticket_number) {
    return res.status(400).json({ message: "ticket_number is required" });
  }

  const query = `
    SELECT 
      id,
      ticket_number,
      main_issue_resolved,
      reassembly_verified,
      general_condition,
      notes,
      inspection_date,
      inspection_status,
      created_at,
      updated_at
    FROM inspections
    WHERE ticket_number = ?
    ORDER BY created_at DESC
  `;

  db.query(query, [ticket_number], (err, results) => {
    if (err) {
      console.error("Error fetching inspection records:", err);
      return res.status(500).json({ message: "Database error" });
    }

    if (results.length === 0) {
      return res.status(404).json({ message: "No inspection records found for this ticket" });
    }

    res.json(results);
  });
});

router.post("/outsource", (req, res) => {
  const { ticket_number, name, category, quantity } = req.body;

  if (!ticket_number || !name || !category || !quantity) {
    return res.status(400).json({
      success: false,
      message: "Ticket number, name, category, and quantity are required",
    });
  }

  const sql = `
    INSERT INTO outsource_stock 
      (ticket_number, name, category, quantity, status, requested_at) 
    VALUES (?, ?, ?, ?, 'awaiting_request', NOW())
  `;

  db.query(sql, [ticket_number, name, category, quantity], (err, result) => {
    if (err) {
      console.error("Error inserting outsourced part:", err);
      return res.status(500).json({ success: false, message: "Server error" });
    }

    res.json({ success: true, message: "Part saved successfully", insertId: result.insertId });
  });
});

module.exports = router;