const express = require('express');
const router = express.Router();
const db = require('../../db/connection');

const BASE_URL = 'http://localhost:5001';
const IMAGE_BASE_URL = `${BASE_URL}/uploads`; // important!
const encode = (path) => encodeURIComponent(path).replace(/%2F/g, '/');

// =============================
// GET ALL MECHANICS
// =============================
router.get('/mechanics-fetch', (req, res) => {
  const sql = `
    SELECT 
      id,
      full_name,
      email,
      role,
      specialty,
      is_mechanic_permanent,
      phone_number,
      address,
      join_date,
      expertise,
      experience,
      salary,
      working_hours,
      image_url,
      mechanic_status,
      created_at,
      updated_at
    FROM employees
    WHERE role = 'mechanic'
  `;

  db.query(sql, (err, results) => {
    if (err) {
      console.error('Error fetching mechanics:', err);
      return res.status(500).json({ error: 'Database error' });
    }

    const processed = results.map(mechanic => ({
      ...mechanic,
      imageUrl: mechanic.image_url
        ? `${IMAGE_BASE_URL}//uploads/${encode(mechanic.image_url)}`
        : null
    }));

    res.json(processed);
  });
});

// =============================
// ASSIGN MECHANIC TO A TICKET
// =============================
router.post("/mechanics-status", (req, res) => {
  const { ticketId, mechanicId } = req.body;

  if (!ticketId || !mechanicId) {
    return res.status(400).json({ message: "Ticket ID and mechanic ID are required." });
  }

  const getMechanicQuery = "SELECT full_name FROM employees WHERE id = ?";
  db.query(getMechanicQuery, [mechanicId], (err, mechanicResults) => {
    if (err || mechanicResults.length === 0) {
      return res.status(500).json({ message: "Failed to retrieve mechanic info." });
    }

    const mechanicName = mechanicResults[0].full_name;

    const updateTicketQuery = `
      UPDATE service_tickets 
      SET mechanic_assign = ?, status = 'in progress' 
      WHERE id = ?
    `;

    const updateMechanicQuery = `
      UPDATE employees 
      SET mechanic_status = 'assigned' 
      WHERE id = ?
    `;

    db.query(updateTicketQuery, [mechanicName, ticketId], (err1) => {
      if (err1) {
        return res.status(500).json({ message: "Failed to assign mechanic to ticket." });
      }

      db.query(updateMechanicQuery, [mechanicId], (err2) => {
        if (err2) {
          return res.status(500).json({ message: "Failed to update mechanic status." });
        }

        return res.status(200).json({ message: "Mechanic assigned successfully." });
      });
    });
  });
});


router.get("/:mechanicName/tickets", (req, res) => {
  const { mechanicName } = req.params;

  if (!mechanicName) {
    return res.status(400).json({ message: "Mechanic name is required" });
  }

  const validStatuses = ["in progress", "ready for inspection"];

  const ticketsQuery = `
    SELECT 
      id,
      ticket_number,
      customer_type,
      customer_id,
      customer_name,
      vehicle_id,
      vehicle_info,
      license_plate,
      title,
      mechanic_assign,
      inspector_assign,
      description,
      priority,
      type,
      urgency_level,
      status,
      appointment_id,
      created_at,
      updated_at,
      completion_date,
      estimated_completion_date
    FROM service_tickets
    WHERE mechanic_assign = ?
      AND status IN (?, ?)
    ORDER BY updated_at DESC
  `;

  db.query(ticketsQuery, [mechanicName, ...validStatuses], (err, tickets) => {
    if (err) {
      console.error("Error fetching service tickets:", err);
      return res.status(500).json({ message: "Database error", error: err });
    }

    if (!tickets || tickets.length === 0) {
      return res.json([]);
    }

    const disassembledPartsQuery = `
      SELECT id, ticket_number, part_name, \`condition\`, status, notes, logged_at, reassembly_verified
      FROM disassembled_parts
      WHERE ticket_number = ?
      ORDER BY logged_at DESC
    `;

    const progressLogsQuery = `
      SELECT id, ticket_number, \`date\`, \`time\`, \`status\`, \`description\`, created_at
      FROM progress_logs
      WHERE ticket_number = ?
      ORDER BY created_at DESC
    `;

    const inspectionsQuery = `
      SELECT id, ticket_number, main_issue_resolved, reassembly_verified, general_condition,
             notes, inspection_date, inspection_status, created_at, updated_at
      FROM inspections
      WHERE ticket_number = ?
      ORDER BY created_at DESC
    `;

    const toolAssignmentsQuery = `
      SELECT id, ticket_number, tool_id, tool_name, assigned_quantity, assigned_by, status, assigned_at, returned_at, updated_at
      FROM tool_assignments
      WHERE ticket_number = ?
      ORDER BY assigned_at DESC
    `;

   const outsourceStockQuery = `
  SELECT 
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
  WHERE ticket_number = ?
  ORDER BY requested_at DESC
`;



    const orderedPartsQuery = `
      SELECT id, ticket_number, name, category, sku, price, quantity, source_shop, status, requested_at, received_at, notes, updated_at
      FROM ordered_parts
      WHERE ticket_number = ?
      ORDER BY requested_at DESC
    `;

    let completed = 0;

    tickets.forEach((ticket, index) => {
      const { ticket_number } = ticket;

      db.query(disassembledPartsQuery, [ticket_number], (err1, rows1) => {
        tickets[index].disassembledParts = err1 ? [] : rows1 || [];

        db.query(progressLogsQuery, [ticket_number], (err2, rows2) => {
          tickets[index].progressLogs = err2 ? [] : rows2 || [];

          db.query(inspectionsQuery, [ticket_number], (err3, rows3) => {
            tickets[index].inspections = err3 ? [] : rows3 || [];

            db.query(toolAssignmentsQuery, [ticket_number], (err4, rows4) => {
              tickets[index].toolAssignments = err4 ? [] : rows4 || [];

             db.query(outsourceStockQuery, [ticket_number], (err5, rows5) => {
  if (err5) {
    console.error("Error fetching outsource stock:", err5);
    tickets[index].outsourceStock = [];
  } else {
    console.log("Outsource stock for", ticket_number, rows5); // 👈 debug log
    tickets[index].outsourceStock = rows5 || [];
  }

                db.query(orderedPartsQuery, [ticket_number], (err6, rows6) => {
                  tickets[index].orderedParts = err6 ? [] : rows6 || [];

                  completed += 1;
                  if (completed === tickets.length) {
                    return res.json(tickets);
                  }
                });
              });
            });
          });
        });
      });
    });
  });
});


// ===================== HISTORY TICKETS =====================
router.get("/:mechanicName/tickets-history", (req, res) => {
  const { mechanicName } = req.params;

  if (!mechanicName) {
    return res.status(400).json({ message: "Mechanic name is required" });
  }

  const validStatuses = [
    "awaiting inspection",
    "ready for inspection",
    "inspection",
    "successful inspection",
    "inspection failed",
    "awaiting bill",
    "completed"
  ];

  const statusPlaceholders = validStatuses.map(() => "?").join(", ");

  const ticketsQuery = `
    SELECT 
      id,
      ticket_number,
      customer_type,
      customer_id,
      customer_name,
      vehicle_id,
      vehicle_info,
      license_plate,
      title,
      mechanic_assign,
      inspector_assign,
      description,
      priority,
      type,
      urgency_level,
      status,
      appointment_id,
      created_at,
      updated_at,
      completion_date,
      estimated_completion_date
    FROM service_tickets
    WHERE mechanic_assign = ?
      AND status IN (${statusPlaceholders})
    ORDER BY updated_at DESC
  `;

  db.query(ticketsQuery, [mechanicName, ...validStatuses], (err, tickets) => {
    if (err) {
      console.error("Error fetching service tickets:", err);
      return res.status(500).json({ message: "Database error", error: err });
    }

    if (!tickets || tickets.length === 0) {
      return res.json([]);
    }

    const disassembledPartsQuery = `
      SELECT id, ticket_number, part_name, \`condition\`, status, notes, logged_at, reassembly_verified
      FROM disassembled_parts
      WHERE ticket_number = ?
      ORDER BY logged_at DESC
    `;

    const progressLogsQuery = `
      SELECT id, ticket_number, \`date\`, \`time\`, \`status\`, \`description\`, created_at
      FROM progress_logs
      WHERE ticket_number = ?
      ORDER BY created_at DESC
    `;

    const inspectionsQuery = `
      SELECT id, ticket_number, main_issue_resolved, reassembly_verified, general_condition,
             notes, inspection_date, inspection_status, created_at, updated_at
      FROM inspections
      WHERE ticket_number = ?
      ORDER BY created_at DESC
    `;

    const orderedPartsQuery = `
      SELECT id, ticket_number, item_id, name, category, sku, price, quantity, status, ordered_at
      FROM ordered_parts
      WHERE ticket_number = ?
      ORDER BY ordered_at DESC
    `;

   const outsourceStockQuery = `
  SELECT 
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
  WHERE ticket_number = ?
  ORDER BY requested_at DESC
`;
    const toolAssignmentsQuery = `
      SELECT id, tool_id, tool_name, ticket_id, ticket_number, assigned_quantity,
             assigned_by, status, assigned_at, returned_at, updated_at
      FROM tool_assignments
      WHERE ticket_number = ?
      ORDER BY assigned_at DESC
    `;

    const fetchRelatedData = (ticket) => {
      return new Promise((resolve) => {
        db.query(disassembledPartsQuery, [ticket.ticket_number], (err1, disassembledParts) => {
          ticket.disassembledParts = err1 ? [] : disassembledParts || [];

          db.query(progressLogsQuery, [ticket.ticket_number], (err2, progressLogs) => {
            ticket.progressLogs = err2 ? [] : progressLogs || [];

            db.query(inspectionsQuery, [ticket.ticket_number], (err3, inspections) => {
              ticket.inspections = err3 ? [] : inspections || [];

              db.query(orderedPartsQuery, [ticket.ticket_number], (err4, orderedParts) => {
                ticket.orderedParts = err4 ? [] : orderedParts || [];

                db.query(outsourceStockQuery, [ticket.ticket_number], (err5, outsourceStock) => {
                  ticket.outsourceStock = err5 ? [] : outsourceStock || [];

                  db.query(toolAssignmentsQuery, [ticket.ticket_number], (err6, toolAssignments) => {
                    ticket.toolAssignments = err6 ? [] : toolAssignments || [];
                    resolve(ticket);
                  });
                });
              });
            });
          });
        });
      });
    };

    Promise.all(tickets.map(fetchRelatedData))
      .then((ticketsWithDetails) => res.json(ticketsWithDetails))
      .catch((error) => {
        console.error("Error fetching related data:", error);
        res.status(500).json({ message: "Error fetching related data", error });
      });
  });
});


// GET /:mechanicName/awaiting-bill-count
router.get("/:mechanicName/awaiting-bill-count", (req, res) => {
  const { mechanicName } = req.params;

  if (!mechanicName) {
    return res.status(400).json({ message: "Mechanic name is required" });
  }

  const sql = `
    SELECT COUNT(*) AS awaitingBillCount
    FROM service_tickets
    WHERE mechanic_assign = ?
      AND status = 'awaiting bill'
  `;

  db.query(sql, [mechanicName], (err, results) => {
    if (err) {
      console.error("Error fetching awaiting bill count:", err);
      return res.status(500).json({ message: "Database error", error: err });
    }

    // results[0].awaitingBillCount will have the count
    return res.json({ mechanic: mechanicName, awaitingBillCount: results[0].awaitingBillCount });
  });
});


module.exports = router;
