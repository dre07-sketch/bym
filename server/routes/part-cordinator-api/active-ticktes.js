const express = require('express');
const router = express.Router();
const db = require('../../db/connection');

// GET /api/tickets/status/active-details
router.get('/active-tickets', (req, res) => {
  const ticketsQuery = `
    SELECT 
      st.id,
      st.ticket_number,
      st.customer_type,
      st.customer_id,
      st.customer_name,
      st.vehicle_id,
      st.vehicle_info,
      st.license_plate,
      st.title,
      st.description,
      st.priority,
      st.type,
      st.urgency_level,
      st.status,
      st.appointment_id,
      st.created_at,
      st.updated_at,
      st.completion_date,
      st.estimated_completion_date,
      st.inspector_assign,
      COALESCE(ic.phone, cc.phone) AS phone,
      COALESCE(ic.email, cc.email) AS email,
      COALESCE(ic.image, cc.image) AS customer_image,
      v.image AS vehicle_image_path,
      ma.mechanic_name
    FROM service_tickets st
    LEFT JOIN individual_customers ic 
      ON st.customer_type = 'individual' AND st.customer_id = ic.customer_id
    LEFT JOIN company_customers cc 
      ON st.customer_type = 'company' AND st.customer_id = cc.customer_id
    LEFT JOIN vehicles v 
      ON st.vehicle_id = v.id
    LEFT JOIN mechanic_assignments ma
      ON ma.ticket_number = st.ticket_number
    WHERE st.status IN ('in progress')
    ORDER BY st.updated_at DESC
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

  const outsourceMechanicQuery = `
    SELECT mechanic_name, phone, payment, payment_method, work_done, notes, created_at
    FROM outsource_mechanics
    WHERE ticket_number = ?
    ORDER BY created_at DESC
  `;

  db.query(ticketsQuery, (err, tickets) => {
    if (err) {
      console.error('Error fetching service tickets:', err);
      return res.status(500).json({ error: 'Internal server error' });
    }

    if (!tickets.length) {
      return res.json([]);
    }

    let completed = 0;

    tickets.forEach(ticket => {
      db.query(toolAssignmentsQuery, [ticket.ticket_number], (err, tools) => {
        ticket.tools_assigned = err ? [] : tools;

        db.query(outsourceStockQuery, [ticket.ticket_number], (err, outsourceStock) => {
          ticket.outsource_stock = err ? [] : outsourceStock;

          db.query(orderedPartsQuery, [ticket.ticket_number], (err, orderedParts) => {
            ticket.ordered_parts = err ? [] : orderedParts;

            db.query(outsourceMechanicQuery, [ticket.ticket_number], (err, mechanics) => {
              ticket.outsource_mechanics = err ? [] : mechanics;

              completed++;
              if (completed === tickets.length) {
                res.json(tickets);
              }
            });
          });
        });
      });
    });
  });
});







// PUT /api/active-tickets/update-status/:ticket_number
router.put('/update-status/:ticket_number', (req, res) => {
  const { ticket_number } = req.params;
  const { status } = req.body;
  const allowed = ['pending','assigned','in progress','ready for inspection','inspection','successful inspection','inspection failed','completed'];
  if (!allowed.includes(status)) return res.status(400).json({ error: 'Invalid status' });
  const query = `UPDATE service_tickets SET status = ? WHERE ticket_number = ?`;
  db.query(query, [status, ticket_number], (err, result) => {
    if (err) return res.status(500).json({ error: 'DB error' });
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Updated' });
  });
});



const allowedStatuses = [
  'ready for inspection',
  'inspection',
  'successful inspection',
  'inspection failed',
  'awaiting bill',
  'payment requested', 
  'Billed',
  'request payment', // Added this status
  'completed'
];

// ✅ Fetch a single completed car with all details
router.get('/completed-cars/:ticketNumber', (req, res) => {
  const ticketNumber = req.params.ticketNumber;

  const ticketQuery = `
    SELECT 
      t.ticket_number,
      t.customer_name,
      t.license_plate,
      ma.mechanic_name AS mechanicName,
      t.created_at AS startDate,
      t.completion_date AS dueDate,
      t.estimated_completion_date AS estimatedCompletionDate,
      t.description,
      t.status,
      t.vehicle_info
    FROM service_tickets t
    LEFT JOIN mechanic_assignments ma
      ON ma.ticket_number = t.ticket_number
    WHERE t.ticket_number = ?
      AND t.status IN (?)
  `;

  db.query(ticketQuery, [ticketNumber, allowedStatuses], (err, ticketResults) => {
    if (err) {
      console.error('Error fetching ticket:', err);
      return res.status(500).json({ message: 'Internal server error' });
    }

    if (ticketResults.length === 0) {
      return res.status(404).json({ message: 'Ticket not found or status not allowed' });
    }

    const ticket = ticketResults[0];

    // Progress logs
    const progressLogsQuery = `
      SELECT DATE(created_at) AS date, description AS notes
      FROM progress_logs
      WHERE ticket_number = ?
      ORDER BY created_at ASC
    `;
    db.query(progressLogsQuery, [ticketNumber], (err, logsResults) => {
      if (err) {
        console.error('Error fetching activity logs:', err);
        return res.status(500).json({ message: 'Internal server error' });
      }

      // Disassembled parts
      const disassembledPartsQuery = `
        SELECT part_name, \`condition\`, status, notes, logged_at
        FROM disassembled_parts
        WHERE ticket_number = ?
        ORDER BY logged_at ASC
      `;
      db.query(disassembledPartsQuery, [ticketNumber], (err, partsResults) => {
        if (err) {
          console.error('Error fetching disassembled parts:', err);
          return res.status(500).json({ message: 'Internal server error' });
        }

        // Tool assignments
        const toolAssignmentsQuery = `
          SELECT id, ticket_number, tool_id, tool_name, assigned_quantity, assigned_by, status, assigned_at, returned_at, updated_at
          FROM tool_assignments
          WHERE ticket_number = ?
          ORDER BY assigned_at DESC
        `;
        db.query(toolAssignmentsQuery, [ticketNumber], (err, toolsResults) => {
          if (err) {
            console.error('Error fetching tool assignments:', err);
            return res.status(500).json({ message: 'Internal server error' });
          }

          // Outsource stock
          const outsourceStockQuery = `
            SELECT id, ticket_number, name, category, sku, price, quantity, source_shop, status, requested_at, received_at, notes, updated_at
            FROM outsource_stock
            WHERE ticket_number = ?
            ORDER BY requested_at DESC
          `;
          db.query(outsourceStockQuery, [ticketNumber], (err, outsourceStockResults) => {
            if (err) {
              console.error('Error fetching outsource stock:', err);
              return res.status(500).json({ message: 'Internal server error' });
            }

            // Ordered parts
            const orderedPartsQuery = `
              SELECT id, ticket_number, item_id, name, category, sku, price, quantity, status, ordered_at
              FROM ordered_parts
              WHERE ticket_number = ?
              ORDER BY ordered_at DESC
            `;
            db.query(orderedPartsQuery, [ticketNumber], (err, orderedPartsResults) => {
              if (err) {
                console.error('Error fetching ordered parts:', err);
                return res.status(500).json({ message: 'Internal server error' });
              }

              // Outsource mechanics
              const outsourceMechanicQuery = `
                SELECT mechanic_name, phone, payment, payment_method, work_done, notes, created_at
                FROM outsource_mechanics
                WHERE ticket_number = ?
                ORDER BY created_at DESC
              `;
              db.query(outsourceMechanicQuery, [ticketNumber], (err, outsourceMechanicResults) => {
                if (err) {
                  console.error('Error fetching outsource mechanics:', err);
                  return res.status(500).json({ message: 'Internal server error' });
                }

                // ✅ Final response
                res.json({
                  ...ticket,
                  activityLogs: logsResults,
                  disassembledParts: partsResults,
                  toolsUsed: toolsResults,
                  outsourceStock: outsourceStockResults,
                  orderedParts: orderedPartsResults,
                  outsourceMechanics: outsourceMechanicResults
                });
              });
            });
          });
        });
      });
    });
  });
});


// ✅ Fetch all completed cars with summary details
router.get('/completed-cars', (req, res) => {
  const query = `
    SELECT 
      t.ticket_number,
      t.customer_name,
      t.license_plate,
      t.vehicle_info,
      ma.mechanic_name AS mechanicName,
      DATE(t.created_at) AS startDate,
      DATE(t.updated_at) AS dueDate,
      DATE(t.completion_date) AS completedDate,
      DATE(t.estimated_completion_date) AS estimatedCompletionDate,
      t.status
    FROM service_tickets t
    LEFT JOIN mechanic_assignments ma
      ON ma.ticket_number = t.ticket_number
    WHERE t.status IN (?)
    ORDER BY t.completion_date DESC
  `;

  db.query(query, [allowedStatuses], (err, tickets) => {
    if (err) {
      console.error('Error fetching completed cars:', err);
      return res.status(500).json({ message: 'Internal server error' });
    }

    if (tickets.length === 0) {
      return res.json([]);
    }

    let processed = 0;
    const results = [];

    tickets.forEach(ticket => {
      const { ticket_number } = ticket;

      // Tool assignments
      const toolAssignmentsQuery = `
        SELECT id, ticket_number, tool_id, tool_name, assigned_quantity, assigned_by, status, assigned_at, returned_at, updated_at
        FROM tool_assignments
        WHERE ticket_number = ?
        ORDER BY assigned_at DESC
      `;
      db.query(toolAssignmentsQuery, [ticket_number], (err, toolsResults) => {
        if (err) {
          console.error('Error fetching tools:', err);
          return res.status(500).json({ message: 'Internal server error' });
        }

        // Outsource stock
        const outsourceStockQuery = `
          SELECT id, ticket_number, name, category, sku, price, quantity, source_shop, status, requested_at, received_at, notes, updated_at
          FROM outsource_stock
          WHERE ticket_number = ?
          ORDER BY requested_at DESC
        `;
        db.query(outsourceStockQuery, [ticket_number], (err, outsourceStockResults) => {
          if (err) {
            console.error('Error fetching outsource stock:', err);
            return res.status(500).json({ message: 'Internal server error' });
          }

          // Ordered parts
          const orderedPartsQuery = `
            SELECT id, ticket_number, item_id, name, category, sku, price, quantity, status, ordered_at
            FROM ordered_parts
            WHERE ticket_number = ?
            ORDER BY ordered_at DESC
          `;
          db.query(orderedPartsQuery, [ticket_number], (err, orderedPartsResults) => {
            if (err) {
              console.error('Error fetching ordered parts:', err);
              return res.status(500).json({ message: 'Internal server error' });
            }

            // Outsource mechanics
            const outsourceMechanicQuery = `
              SELECT mechanic_name, phone, payment, payment_method, work_done, notes, created_at
              FROM outsource_mechanics
              WHERE ticket_number = ?
              ORDER BY created_at DESC
            `;
            db.query(outsourceMechanicQuery, [ticket_number], (err, outsourceMechanicResults) => {
              if (err) {
                console.error('Error fetching outsource mechanics:', err);
                return res.status(500).json({ message: 'Internal server error' });
              }

              // Push final ticket object with details
              results.push({
                ...ticket,
                toolsUsed: toolsResults,
                outsourceStock: outsourceStockResults,
                orderedParts: orderedPartsResults,
                outsourceMechanics: outsourceMechanicResults
              });

              processed++;
              if (processed === tickets.length) {
                res.json(results);
              }
            });
          });
        });
      });
    });
  });
});


module.exports = router;
