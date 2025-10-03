const express = require('express');
const router = express.Router();
const db = require('../../db/connection');

const BASE_URL = 'https://ipasystem.bymsystem.com';
const IMAGE_BASE_URL = `${BASE_URL}/uploads`; // important!
const encode = (path) => encodeURIComponent(path).replace(/%2F/g, '/');

// =============================
// GET ALL MECHANICS
// =============================
router.get('/mechanics-fetch', (req, res) => {
  const sql = `
    SELECT 
      e.id,
      e.full_name,
      e.email,
      e.role,
      e.specialty,
      e.is_mechanic_permanent,
      e.phone_number,
      e.address,
      e.join_date,
      e.expertise,
      e.experience,
      e.salary,
      e.working_hours,
      e.image_url,
      e.mechanic_status,
      e.created_at,
      e.updated_at,
      -- Count active tickets
      COALESCE(active_assignments.active_count, 0) AS active_tickets
    FROM employees e
    LEFT JOIN (
      SELECT 
        ma.mechanic_id,
        COUNT(*) AS active_count
      FROM mechanic_assignments ma
      JOIN service_tickets st 
        ON ma.ticket_number = st.ticket_number
      WHERE st.status IN ('pending', 'assigned', 'in progress')
      GROUP BY ma.mechanic_id
    ) AS active_assignments
      ON e.id = active_assignments.mechanic_id
    WHERE e.role = 'mechanic'
  `;

  db.query(sql, (err, results) => {
    if (err) {
      console.error('Error fetching mechanics:', err);
      return res.status(500).json({ error: 'Database error' });
    }

    const processed = results.map(mechanic => ({
      ...mechanic,
      imageUrl: mechanic.image_url
        ? `${IMAGE_BASE_URL}/uploads/${encodeURIComponent(mechanic.image_url)}`
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

  // 1. Get mechanic name
  const getMechanicQuery = "SELECT full_name FROM employees WHERE id = ?";
  db.query(getMechanicQuery, [mechanicId], (err, mechanicResults) => {
    if (err || mechanicResults.length === 0) {
      return res.status(500).json({ message: "Failed to retrieve mechanic info." });
    }

    const mechanicName = mechanicResults[0].full_name;

    // 2. Get ticket_number from service_tickets
    const getTicketQuery = "SELECT ticket_number FROM service_tickets WHERE id = ?";
    db.query(getTicketQuery, [ticketId], (err2, ticketResults) => {
      if (err2 || ticketResults.length === 0) {
        return res.status(500).json({ message: "Failed to retrieve ticket info." });
      }

      const ticketNumber = ticketResults[0].ticket_number;

      // 3. Count active assignments for this mechanic
      const activeAssignmentsQuery = `
        SELECT COUNT(*) AS active_count
        FROM mechanic_assignments ma
        JOIN service_tickets st ON ma.ticket_number = st.ticket_number
        WHERE ma.mechanic_id = ?
          AND st.status IN ('pending', 'assigned', 'in progress')
      `;

      db.query(activeAssignmentsQuery, [mechanicId], (err3, countResults) => {
        if (err3) {
          return res.status(500).json({ message: "Failed to check mechanic workload." });
        }

        const activeCount = countResults[0].active_count;
        if (activeCount >= 5) {
          return res.status(400).json({ message: "This mechanic already has 5 active assignments." });
        }

        // 4. Update ticket status only
        const updateTicketQuery = `
          UPDATE service_tickets 
          SET status = 'in progress' 
          WHERE id = ?
        `;

        db.query(updateTicketQuery, [ticketId], (err4) => {
          if (err4) {
            return res.status(500).json({ message: "Failed to update ticket status." });
          }

          // 5. Update mechanic status (optional, can be kept or removed)
          const updateMechanicQuery = `
            UPDATE employees 
            SET mechanic_status = 'assigned' 
            WHERE id = ?
          `;

          db.query(updateMechanicQuery, [mechanicId], (err5) => {
            if (err5) {
              return res.status(500).json({ message: "Failed to update mechanic status." });
            }

            // 6. Insert into mechanic_assignments
            const insertAssignmentQuery = `
              INSERT INTO mechanic_assignments (ticket_number, mechanic_id, mechanic_name)
              VALUES (?, ?, ?)
            `;

            db.query(insertAssignmentQuery, [ticketNumber, mechanicId, mechanicName], (err6) => {
              if (err6) {
                return res.status(500).json({ message: "Failed to save mechanic assignment." });
              }

              return res.status(200).json({ message: "Mechanic assigned successfully." });
            });
          });
        });
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
    SELECT st.*
    FROM service_tickets st
    JOIN mechanic_assignments ma 
      ON st.ticket_number = ma.ticket_number
    WHERE ma.mechanic_name = ?
      AND st.status IN (?, ?)
    ORDER BY st.updated_at DESC
  `;

  db.query(ticketsQuery, [mechanicName, ...validStatuses], (err, tickets) => {
    if (err) {
      console.error("Error fetching service tickets:", err);
      return res.status(500).json({ message: "Database error", error: err });
    }

    if (!tickets || tickets.length === 0) {
      return res.json([]);
    }

    // Nested queries remain the same
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
      SELECT id, ticket_number, name, category, sku, price, quantity, source_shop, status, requested_at, received_at, notes, updated_at
      FROM outsource_stock
      WHERE ticket_number = ?
      ORDER BY requested_at DESC
    `;

    const orderedPartsQuery = `
      SELECT id, ticket_number, item_id, name, category, sku, price, quantity, status, ordered_at
      FROM ordered_parts
      WHERE ticket_number = ?
      ORDER BY ordered_at DESC
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
                tickets[index].outsourceStock = err5 ? [] : rows5 || [];

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
    'awaiting survey',
      'awaiting salvage form',
      'survey complete',
      'Payment Requested',
      'Request Payment',
    "awaiting bill",
    "completed"
  ];

  const statusPlaceholders = validStatuses.map(() => "?").join(", ");

  const ticketsQuery = `
    SELECT st.*
    FROM service_tickets st
    JOIN mechanic_assignments ma
      ON st.ticket_number = ma.ticket_number
    WHERE ma.mechanic_name = ?
      AND st.status IN (${statusPlaceholders})
    ORDER BY st.updated_at DESC
  `;

  db.query(ticketsQuery, [mechanicName, ...validStatuses], (err, tickets) => {
    if (err) {
      console.error("Error fetching service tickets:", err);
      return res.status(500).json({ message: "Database error", error: err });
    }

    if (!tickets || tickets.length === 0) {
      return res.json([]);
    }

    // --- Sub Queries ---
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
        updated_at,
        check_oil_leaks,
        check_engine_air_filter_oil_coolant_level,
        check_brake_fluid_levels,
        check_gluten_fluid_levels,
        check_battery_timing_belt,
        check_tire,
        check_tire_pressure_rotation,
        check_lights_wiper_horn,
        check_door_locks_central_locks,
        check_customer_work_order_reception_book
      FROM inspections
      WHERE ticket_number = ?
      ORDER BY created_at DESC
    `;

    const formatInspection = (inspection) => ({
      ...inspection,
      checklist: {
        oilLeaks: inspection.check_oil_leaks ?? null,
        engineAirFilterOilCoolant: inspection.check_engine_air_filter_oil_coolant_level ?? null,
        brakeFluidLevels: inspection.check_brake_fluid_levels ?? null,
        glutenFluidLevels: inspection.check_gluten_fluid_levels ?? null,
        batteryTimingBelt: inspection.check_battery_timing_belt ?? null,
        tire: inspection.check_tire ?? null,
        tirePressureRotation: inspection.check_tire_pressure_rotation ?? null,
        lightsWiperHorn: inspection.check_lights_wiper_horn ?? null,
        doorLocksCentralLocks: inspection.check_door_locks_central_locks ?? null,
        customerWorkOrderReceptionBook: inspection.check_customer_work_order_reception_book ?? null
      }
    });

    const orderedPartsQuery = `
      SELECT id, ticket_number, item_id, name, category, sku, price, quantity, status, ordered_at
      FROM ordered_parts
      WHERE ticket_number = ?
      ORDER BY ordered_at DESC
    `;

    const outsourceStockQuery = `
      SELECT id, ticket_number, name, category, sku, price, quantity, source_shop, status, requested_at, received_at, notes, updated_at
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

    // --- Fetch Related Data ---
    const fetchRelatedData = (ticket) => {
      return new Promise((resolve) => {
        db.query(disassembledPartsQuery, [ticket.ticket_number], (err1, disassembledParts) => {
          ticket.disassembledParts = err1 ? [] : disassembledParts || [];

          db.query(progressLogsQuery, [ticket.ticket_number], (err2, progressLogs) => {
            ticket.progressLogs = err2 ? [] : progressLogs || [];

            db.query(inspectionsQuery, [ticket.ticket_number], (err3, inspections) => {
              ticket.inspections = err3 ? [] : (inspections || []).map(formatInspection);

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

    // --- Final Response ---
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
    FROM service_tickets st
    JOIN mechanic_assignments ma
      ON st.ticket_number = ma.ticket_number
    WHERE ma.mechanic_name = ?
      AND st.status = 'awaiting bill'
  `;

  db.query(sql, [mechanicName], (err, results) => {
    if (err) {
      console.error("Error fetching awaiting bill count:", err);
      return res.status(500).json({ message: "Database error", error: err });
    }

    return res.json({ 
      mechanic: mechanicName, 
      awaitingBillCount: results[0].awaitingBillCount 
    });
  });
});



module.exports = router;
