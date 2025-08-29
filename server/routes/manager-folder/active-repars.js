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
      st.outsource_mechanic,
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
          outsource_mechanic: row.outsource_mechanic,
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
    \`condition\`,
    \`status\`,
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

// Helper function for retrying on deadlocks
function executeWithRetry(query, params, retries = 3) {
  return new Promise((resolve, reject) => {
    db.query(query, params, (err, result) => {
      if (err && err.code === "ER_LOCK_DEADLOCK" && retries > 0) {
        console.warn("Deadlock detected, retrying...");
        return resolve(executeWithRetry(query, params, retries - 1));
      }
      if (err) return reject(err);
      resolve(result);
    });
  });
}


router.post("/outsource", async (req, res) => {
  try {
    const { ticket_number, name, category, quantity } = req.body;

    if (!ticket_number) {
      return res.status(400).json({
        success: false,
        message: "Ticket number is required",
      });
    }

    const sql = `
      INSERT INTO outsource_stock 
        (ticket_number, name, category, quantity, status, requested_at) 
      VALUES (?, ?, ?, ?, 'awaiting_request', NOW())
    `;

    const result = await executeWithRetry(sql, [
      ticket_number,
      name || null,
      category || null,
      quantity || 0,
    ]);

    res.json({
      success: true,
      message: "Part saved successfully",
      insertId: result.insertId,
    });
  } catch (err) {
    console.error("Error inserting outsourced part:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});



router.get("/get-outsource-part", (req, res) => {
  const sql = `
    SELECT 
      auto_id,
      id,
      ticket_number,
      name,
      category,
      sku,
      price,
      quantity,
      source_shop,
      status,
      requested_at,
      received_at,
      notes,
      updated_at
    FROM outsource_stock
    ORDER BY requested_at DESC
  `;

  db.query(sql, (err, rows) => {
    if (err) {
      console.error("Error fetching outsourced parts:", err);
      return res.status(500).json({ success: false, message: "Server error" });
    }
    res.json({ success: true, data: rows });
  });
});


// POST outsource mechanic
router.post("/outsource-mechanic", (req, res) => {
  const { ticket_number, mechanic_name, phone, payment, payment_method, work_done, notes } = req.body;

  // ✅ Validation
  if (!ticket_number || !mechanic_name || payment === undefined || !payment_method || !work_done) {
    return res.status(400).json({
      success: false,
      message: "ticket_number, mechanic_name, payment, payment_method, and work_done are required",
    });
  }

  console.log("Incoming outsource mechanic:", req.body);

  // 1️⃣ Insert into outsource_mechanics
  const insertQuery = `
    INSERT INTO outsource_mechanics 
      (ticket_number, mechanic_name, phone, payment, payment_method, work_done, notes) 
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `;

  db.query(
    insertQuery,
    [ticket_number, mechanic_name, phone || null, payment, payment_method, work_done, notes || null],
    (err, result) => {
      if (err) {
        console.error("Error inserting outsource mechanic:", err);
        return res.status(500).json({
          success: false,
          message: "Database error inserting outsource mechanic",
          error: err.message,
        });
      }

      // 2️⃣ Update service_tickets (try ticket_number first)
      const updateByNumber = `
        UPDATE service_tickets 
        SET outsource_mechanic = ? 
        WHERE ticket_number = ?
      `;

      db.query(updateByNumber, [mechanic_name, ticket_number], (updateErr, updateResult) => {
        if (updateErr) {
          console.error("Error updating service ticket:", updateErr);
          return res.status(500).json({
            success: false,
            message: "Database error updating service ticket",
            error: updateErr.message,
          });
        }

        if (updateResult.affectedRows === 0) {
          // ⚡ fallback: maybe it's stored as ID not ticket_number
          const updateById = `
            UPDATE service_tickets 
            SET outsource_mechanic = ? 
            WHERE id = ?
          `;

          db.query(updateById, [mechanic_name, ticket_number], (idErr, idResult) => {
            if (idErr) {
              console.error("Error updating service ticket by ID:", idErr);
              return res.status(500).json({
                success: false,
                message: "Database error updating service ticket by ID",
                error: idErr.message,
              });
            }

            if (idResult.affectedRows === 0) {
              return res.status(404).json({
                success: false,
                message: `No service ticket found with ticket_number or id = ${ticket_number}`,
              });
            }

            // ✅ Success (updated by ID)
            return res.status(201).json({
              success: true,
              message: "Outsource mechanic added and service ticket updated (by ID)",
              outsource_mechanic_id: result.insertId,
              data: { ticket_number, mechanic_name, phone, payment, payment_method, work_done, notes: notes || null },
            });
          });
        } else {
          // ✅ Success (updated by ticket_number)
          res.status(201).json({
            success: true,
            message: "Outsource mechanic added and service ticket updated (by ticket_number)",
            outsource_mechanic_id: result.insertId,
            data: { ticket_number, mechanic_name, phone, payment, payment_method, work_done, notes: notes || null },
          });
        }
      });
    }
  );
});



module.exports = router;