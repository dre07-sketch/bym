const express = require('express');
const router = express.Router();
const db = require('../../db/connection');

function generateTicketNumber() {
  const prefix = 'TICK';
  const randomNum = Math.floor(10000 + Math.random() * 90000);
  return `${prefix}-${randomNum}`;
}

// Routes

router.post('/', (req, res) => {
  const {
    customer_type,
    customer_id,
    customer_name,
    vehicle_id,
    vehicle_info,
    license_plate,
    title,
    description,
    priority,
    type,
    urgency_level,
    appointment_id
  } = req.body;

  // Validate required fields
  if (
    !customer_type ||
    !customer_id ||
    !customer_name ||
    !vehicle_id ||
    !vehicle_info ||
    !license_plate ||
    !title ||
    !description ||
    !priority ||
    !type
  ) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const ticket_number = generateTicketNumber();

  const insertQuery = `
    INSERT INTO service_tickets (
      ticket_number,
      customer_type,
      customer_id,
      customer_name,
      vehicle_id,
      vehicle_info,
      license_plate,
      title,
      description,
      priority,
      type,
      urgency_level,
      appointment_id,
      status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')
  `;

  const insertValues = [
    ticket_number,
    customer_type,
    customer_id,
    customer_name,
    vehicle_id,
    vehicle_info,
    license_plate,
    title,
    description,
    priority,
    type,
    urgency_level || null,
    appointment_id || null
  ];

  db.query(insertQuery, insertValues, (err, result) => {
    if (err) {
      console.error('Error inserting ticket:', err);
      return res.status(500).json({ error: 'Failed to create ticket' });
    }

    const insertedId = result.insertId;

    db.query('SELECT * FROM service_tickets WHERE id = ?', [insertedId], (err, rows) => {
      if (err) {
        console.error('Error fetching new ticket:', err);
        return res.status(500).json({ error: 'Failed to fetch created ticket' });
      }

      res.status(201).json(rows[0]);
    });
  });
});

router.get('/vehicles/:customerId', (req, res) => {
  const customerId = req.params.customerId;
  console.log('🔎 Fetching vehicles for customerId:', customerId);

  const sql = `
    SELECT 
      id AS vehicleId,
      make,
      model,
      year,
      license_plate,
      vin,
      color,
      mileage,
      
      customer_id AS customerId
    FROM vehicles
    WHERE customer_id = ?
  `;

  db.query(sql, [customerId], (err, results) => {
    if (err) {
      console.error('❌ Error fetching vehicles:', err);
      return res.status(500).json({ error: 'Failed to fetch vehicles' });
    }

    res.json(results);
  });
});

// This route fetches all customers (individuals and companies)
router.get('/customers', (req, res) => {
  const type = req.query.type;
  console.log('🔎 Received request for customer type:', type); // log query param

  if (type === 'individual') {
    const sql = `
      SELECT 
        id,
        customer_id AS customerId,
        'individual' AS customerType,
        name AS personal_name,
        phone
      FROM individual_customers
    `;
    db.query(sql, (err, results) => {
      if (err) {
        console.error('❌ MySQL Error (individual):', err); // this will show the actual issue
        return res.status(500).json({ error: 'Failed to fetch customers' });
      }
      res.json(results);
    });

  } else if (type === 'company') {
    const sql = `
      SELECT 
        id,
        customer_id AS customerId,
        'company' AS customerType,
        company_name AS name,
        contact_person_name AS personal_name,
        phone
      FROM company_customers
    `;
    db.query(sql, (err, results) => {
      if (err) {
        console.error('❌ MySQL Error (company):', err); // real cause shown here
        return res.status(500).json({ error: 'Failed to fetch customers' });
      }
      res.json(results);
    });

  } else {
    res.status(400).json({ error: 'Invalid customer type' });
  }
});



// ===================== All Tickets API =====================
router.get('/service_tickets', (req, res) => {
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
      v.make,
      v.model,
      v.year,
      v.image,
      COALESCE(ic.phone, cc.phone) AS phone,
      COALESCE(ic.email, cc.email) AS email
    FROM service_tickets st
    LEFT JOIN individual_customers ic 
      ON st.customer_id = ic.customer_id AND st.customer_type = 'individual'
    LEFT JOIN company_customers cc 
      ON st.customer_id = cc.customer_id AND st.customer_type = 'company'
    LEFT JOIN vehicles v
      ON st.vehicle_id = v.id
    WHERE st.status IN (
      'pending',
      'assigned',
      'in progress',
      'ready for inspection',
      'inspection',
      'successful inspection',
      'inspection failed',
      'awaiting bill',
      'completed'
    )
    ORDER BY st.created_at DESC
  `;

  db.query(ticketsQuery, (err, tickets) => {
    if (err) {
      console.error('Error fetching service tickets:', err);
      return res.status(500).json({ message: 'Database query error' });
    }

    if (tickets.length === 0) {
      return res.json([]);
    }

    const ticketNumbers = tickets.map(t => t.ticket_number);

    // Queries
    const disassembledQuery = `
      SELECT id, ticket_number, \`condition\` AS part_condition, part_name, status, notes, logged_at, reassembly_verified
      FROM disassembled_parts
      WHERE ticket_number IN (?)
      ORDER BY logged_at DESC
    `;

    const logsQuery = `
      SELECT id, ticket_number, \`date\` AS log_date, \`time\` AS log_time, status, description, created_at
      FROM progress_logs
      WHERE ticket_number IN (?)
      ORDER BY created_at DESC
    `;

    const inspectionsQuery = `
      SELECT id, ticket_number, main_issue_resolved, reassembly_verified, general_condition, notes, inspection_date, inspection_status, created_at, updated_at
      FROM inspections
      WHERE ticket_number IN (?)
      ORDER BY created_at DESC
    `;

    const outsourceMechanicsQuery = `
      SELECT id, ticket_number, mechanic_name, phone, payment, payment_method, work_done, notes, created_at
      FROM outsource_mechanics
      WHERE ticket_number IN (?)
      ORDER BY created_at DESC
    `;

    const outsourceStockQuery = `
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
      WHERE ticket_number IN (?)
      ORDER BY requested_at DESC
    `;

    const orderedPartsQuery = `
      SELECT id, ticket_number, item_id, name, category, sku, price, quantity, status, ordered_at
      FROM ordered_parts
      WHERE ticket_number IN (?)
      ORDER BY ordered_at DESC
    `;

    const toolsQuery = `
      SELECT id, tool_id, tool_name, ticket_number, assigned_quantity, assigned_by, status, assigned_at, returned_at, updated_at
      FROM tool_assignments
      WHERE ticket_number IN (?)
      ORDER BY assigned_at DESC
    `;

    // 🔹 New: Mechanic Assignments
    const mechanicAssignmentsQuery = `
      SELECT id, ticket_number, mechanic_id, mechanic_name, assigned_at
      FROM mechanic_assignments
      WHERE ticket_number IN (?)
      ORDER BY assigned_at DESC
    `;

    // Run queries
    db.query(disassembledQuery, [ticketNumbers], (err, disassembledRows) => {
      if (err) return res.status(500).json({ error: 'Failed to fetch disassembled parts' });

      db.query(logsQuery, [ticketNumbers], (err, logRows) => {
        if (err) return res.status(500).json({ error: 'Failed to fetch progress logs' });

        db.query(inspectionsQuery, [ticketNumbers], (err, inspectionRows) => {
          if (err) return res.status(500).json({ error: 'Failed to fetch inspections' });

          db.query(outsourceMechanicsQuery, [ticketNumbers], (err, mechanicsRows) => {
            if (err) return res.status(500).json({ error: 'Failed to fetch outsource mechanics' });

            db.query(outsourceStockQuery, [ticketNumbers], (err, stockRows) => {
              if (err) return res.status(500).json({ error: 'Failed to fetch outsource stock' });

              db.query(orderedPartsQuery, [ticketNumbers], (err, orderedRows) => {
                if (err) return res.status(500).json({ error: 'Failed to fetch ordered parts' });

                db.query(toolsQuery, [ticketNumbers], (err, toolRows) => {
                  if (err) return res.status(500).json({ error: 'Failed to fetch tool assignments' });

                  db.query(mechanicAssignmentsQuery, [ticketNumbers], (err, mechanicAssignRows) => {
                    if (err) return res.status(500).json({ error: 'Failed to fetch mechanic assignments' });

                    // === Maps ===
                    const disassembledMap = {};
                    disassembledRows.forEach(r => {
                      if (!disassembledMap[r.ticket_number]) disassembledMap[r.ticket_number] = [];
                      disassembledMap[r.ticket_number].push(r);
                    });

                    const logsMap = {};
                    logRows.forEach(r => {
                      if (!logsMap[r.ticket_number]) logsMap[r.ticket_number] = [];
                      logsMap[r.ticket_number].push(r);
                    });

                    const inspectionsMap = {};
                    inspectionRows.forEach(r => {
                      if (!inspectionsMap[r.ticket_number]) inspectionsMap[r.ticket_number] = [];
                      inspectionsMap[r.ticket_number].push(r);
                    });

                    const mechanicsMap = {};
                    mechanicsRows.forEach(r => {
                      if (!mechanicsMap[r.ticket_number]) mechanicsMap[r.ticket_number] = [];
                      mechanicsMap[r.ticket_number].push(r);
                    });

                    const stockMap = {};
                    stockRows.forEach(r => {
                      if (!stockMap[r.ticket_number]) stockMap[r.ticket_number] = [];
                      stockMap[r.ticket_number].push(r);
                    });

                    const orderedMap = {};
                    orderedRows.forEach(r => {
                      if (!orderedMap[r.ticket_number]) orderedMap[r.ticket_number] = [];
                      orderedMap[r.ticket_number].push(r);
                    });

                    const toolsMap = {};
                    toolRows.forEach(r => {
                      if (!toolsMap[r.ticket_number]) toolsMap[r.ticket_number] = [];
                      toolsMap[r.ticket_number].push(r);
                    });

                    const mechanicAssignMap = {};
                    mechanicAssignRows.forEach(r => {
                      if (!mechanicAssignMap[r.ticket_number]) mechanicAssignMap[r.ticket_number] = [];
                      mechanicAssignMap[r.ticket_number].push(r);
                    });

                    // === Format results ===
                    const formattedResults = tickets.map(ticket => ({
                      id: ticket.id,
                      ticket_number: ticket.ticket_number,
                      customer_type: ticket.customer_type,
                      customer_id: ticket.customer_id,
                      customer_name: ticket.customer_name,
                      vehicle_id: ticket.vehicle_id,
                      vehicle_info: ticket.vehicle_info,
                      license_plate: ticket.license_plate,
                      title: ticket.title,
                      description: ticket.description,
                      priority: ticket.priority,
                      type: ticket.type,
                      urgency_level: ticket.urgency_level,
                      status: ticket.status === 'in progress' ? 'in-progress' : ticket.status,
                      appointment_id: ticket.appointment_id,
                      created_at: ticket.created_at,
                      updated_at: ticket.updated_at,
                      estimated_time: ticket.completion_date,
                      phone: ticket.phone,
                      email: ticket.email,
                      vehicle: {
                        make: ticket.make,
                        model: ticket.model,
                        year: ticket.year,
                        image: ticket.image,
                      },
                      mechanic_assignments: mechanicAssignMap[ticket.ticket_number] || [],
                      disassembled_parts: disassembledMap[ticket.ticket_number] || [],
                      progress_logs: logsMap[ticket.ticket_number] || [],
                      inspections: inspectionsMap[ticket.ticket_number] || [],
                      outsource_mechanics: mechanicsMap[ticket.ticket_number] || [],
                      outsource_stock: stockMap[ticket.ticket_number] || [],
                      ordered_parts: orderedMap[ticket.ticket_number] || [],
                      tool_assignments: toolsMap[ticket.ticket_number] || []
                    }));

                    res.json(formattedResults);
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

// ===================== Single Ticket API =====================
router.get('/service_tickets/:ticket_number', (req, res) => {
  const { ticket_number } = req.params;

  const ticketQuery = `
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
      COALESCE(ic.phone, cc.phone) AS phone,
      COALESCE(ic.email, cc.email) AS email,
      v.make,
      v.model,
      v.year,
      v.image AS vehicle_image
    FROM service_tickets st
    LEFT JOIN individual_customers ic 
      ON st.customer_id = ic.customer_id AND st.customer_type = 'individual'
    LEFT JOIN company_customers cc 
      ON st.customer_id = cc.customer_id AND st.customer_type = 'company'
    LEFT JOIN vehicles v 
      ON st.vehicle_id = v.id
    WHERE st.ticket_number = ?
    LIMIT 1
  `;

  db.query(ticketQuery, [ticket_number], (err, results) => {
    if (err) {
      console.error('Error fetching service ticket:', err);
      return res.status(500).json({ message: 'Database query error' });
    }
    if (results.length === 0) {
      return res.status(404).json({ message: 'Service ticket not found' });
    }

    const row = results[0];

    // Related data queries...
    const disassembledQuery = `
      SELECT id, ticket_number, part_name, \`condition\` AS part_condition, status, notes, logged_at, reassembly_verified
      FROM disassembled_parts
      WHERE ticket_number = ?
      ORDER BY logged_at DESC
    `;

    const logsQuery = `
      SELECT id, ticket_number, \`date\` AS log_date, \`time\` AS log_time, status, description, created_at
      FROM progress_logs
      WHERE ticket_number = ?
      ORDER BY created_at DESC
    `;

    const inspectionQuery = `
      SELECT id, ticket_number, main_issue_resolved, reassembly_verified, general_condition, notes, inspection_date, inspection_status, created_at, updated_at
      FROM inspections
      WHERE ticket_number = ?
      ORDER BY created_at DESC
    `;

    const outsourceMechanicsQuery = `
      SELECT id, ticket_number, mechanic_name, phone, payment, payment_method, work_done, notes, created_at
      FROM outsource_mechanics
      WHERE ticket_number = ?
      ORDER BY created_at DESC
    `;

    const outsourceStockQuery = `
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
      WHERE ticket_number = ?
      ORDER BY requested_at DESC
    `;

    const orderedPartsQuery = `
      SELECT id, ticket_number, item_id, name, category, sku, price, quantity, status, ordered_at
      FROM ordered_parts
      WHERE ticket_number = ?
      ORDER BY ordered_at DESC
    `;

    const toolsQuery = `
      SELECT id, tool_id, tool_name, ticket_number, assigned_quantity, assigned_by, status, assigned_at, returned_at, updated_at
      FROM tool_assignments
      WHERE ticket_number = ?
      ORDER BY assigned_at DESC
    `;

    // 🔹 New: Mechanic Assignments
    const mechanicAssignmentsQuery = `
      SELECT id, ticket_number, mechanic_id, mechanic_name, assigned_at
      FROM mechanic_assignments
      WHERE ticket_number = ?
      ORDER BY assigned_at DESC
    `;

    // Execute queries
    db.query(disassembledQuery, [ticket_number], (err, disassembledRows) => {
      if (err) return res.status(500).json({ error: 'Failed to fetch disassembled parts' });

      db.query(logsQuery, [ticket_number], (err, logRows) => {
        if (err) return res.status(500).json({ error: 'Failed to fetch progress logs' });

        db.query(inspectionQuery, [ticket_number], (err, inspectionRows) => {
          if (err) return res.status(500).json({ error: 'Failed to fetch inspections' });

          db.query(outsourceMechanicsQuery, [ticket_number], (err, mechanicsRows) => {
            if (err) return res.status(500).json({ error: 'Failed to fetch outsource mechanics' });

            db.query(outsourceStockQuery, [ticket_number], (err, stockRows) => {
              if (err) return res.status(500).json({ error: 'Failed to fetch outsource stock' });

              db.query(orderedPartsQuery, [ticket_number], (err, orderedRows) => {
                if (err) return res.status(500).json({ error: 'Failed to fetch ordered parts' });

                db.query(toolsQuery, [ticket_number], (err, toolRows) => {
                  if (err) return res.status(500).json({ error: 'Failed to fetch tool assignments' });

                  db.query(mechanicAssignmentsQuery, [ticket_number], (err, mechanicAssignRows) => {
                    if (err) return res.status(500).json({ error: 'Failed to fetch mechanic assignments' });

                    const ticket = {
                      id: row.id,
                      ticket_number: row.ticket_number,
                      customer_type: row.customer_type,
                      customer_id: row.customer_id,
                      customer_name: row.customer_name,
                      vehicle_id: row.vehicle_id,
                      vehicle_info: row.vehicle_info,
                      license_plate: row.license_plate,
                      title: row.title,
                      description: row.description,
                      priority: row.priority,
                      type: row.type,
                      urgency_level: row.urgency_level,
                      status: row.status,
                      appointment_id: row.appointment_id,
                      created_at: row.created_at,
                      updated_at: row.updated_at,
                      completion_date: row.completion_date,
                      estimated_completion_date: row.estimated_completion_date,
                      phone: row.phone,
                      email: row.email,
                      vehicle: {
                        make: row.make,
                        model: row.model,
                        year: row.year,
                        image: row.vehicle_image
                      },
                      mechanic_assignments: mechanicAssignRows,
                      disassembled_parts: disassembledRows,
                      progress_logs: logRows,
                      inspections: inspectionRows,
                      outsource_mechanics: mechanicsRows,
                      outsource_stock: stockRows,
                      ordered_parts: orderedRows,
                      tool_assignments: toolRows
                    };

                    res.json(ticket);
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

// GET /api/tickets/summary
router.get('/summary', (req, res) => {
  const query = `
    SELECT 
      st.ticket_number,
      st.status,
      st.priority,
      st.license_plate,
      st.inspector_assign AS inspectorName,
      ma.mechanic_name AS mechanicName,   -- ✅ joined from mechanic_assignments
      st.completion_date,
      st.estimated_completion_date,
      st.title,
      st.created_at,
      st.description,
      v.make,
      v.model,
      v.year,
      v.license_plate AS vehicle_license_plate,
      v.image
    FROM service_tickets st
    JOIN vehicles v ON st.vehicle_id = v.id
    LEFT JOIN mechanic_assignments ma ON st.ticket_number = ma.ticket_number
    WHERE st.status IN (
      'pending',
      'in progress',
      'ready for inspection',
      'inspection',
      'successful inspection',
      'inspection failed',
      'awaiting bill',
      'completed'
    )
    ORDER BY st.created_at DESC
  `;

  db.query(query, (err, tickets) => {
    if (err) {
      console.error('Error fetching tickets:', err);
      return res.status(500).json({ error: 'Failed to fetch tickets' });
    }

    if (!tickets || tickets.length === 0) return res.json([]);

    const ticketNumbers = tickets.map(t => t.ticket_number);
    if (ticketNumbers.length === 0) return res.json([]);

    // Queries for related tables
    const disassembledQuery = `
      SELECT id, ticket_number, part_name, \`condition\` AS part_condition, status, notes, logged_at, reassembly_verified
      FROM disassembled_parts WHERE ticket_number IN (?) ORDER BY logged_at DESC
    `;
    const logsQuery = `
      SELECT id, ticket_number, date, time, status, description, created_at
      FROM progress_logs WHERE ticket_number IN (?) ORDER BY created_at DESC
    `;
    const inspectionsQuery = `
      SELECT id, ticket_number, main_issue_resolved, reassembly_verified, general_condition, notes, inspection_date, inspection_status, created_at, updated_at
      FROM inspections WHERE ticket_number IN (?) ORDER BY created_at DESC
    `;
    const mechanicsQuery = `
      SELECT id, ticket_number, mechanic_name, phone, payment, payment_method, work_done, notes, created_at
      FROM outsource_mechanics WHERE ticket_number IN (?) ORDER BY created_at DESC
    `;
    const toolsQuery = `
      SELECT id, tool_id, tool_name, ticket_id, ticket_number, assigned_quantity, assigned_by, status, assigned_at, returned_at, updated_at
      FROM tool_assignments WHERE ticket_number IN (?) ORDER BY assigned_at DESC
    `;
    const orderedPartsQuery = `
      SELECT item_id, ticket_number, name, category, sku, price, quantity, status, ordered_at
      FROM ordered_parts WHERE ticket_number IN (?) ORDER BY ordered_at DESC
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
        updated_at,
        (quantity * price) AS total_cost
      FROM outsource_stock 
      WHERE ticket_number IN (?) 
      ORDER BY requested_at DESC
    `;

    // Helper to query safely
    const querySafe = (sql, params) =>
      new Promise(resolve => {
        db.query(sql, params, (err, rows) => {
          if (err) {
            console.error('Error executing query:', err.sqlMessage || err);
            return resolve([]);
          }
          resolve(rows || []);
        });
      });

    (async () => {
      const [
        disassembledRows,
        logRows,
        inspectionRows,
        mechanicRows,
        toolRows,
        orderedRows,
        stockRows
      ] = await Promise.all([
        querySafe(disassembledQuery, [ticketNumbers]),
        querySafe(logsQuery, [ticketNumbers]),
        querySafe(inspectionsQuery, [ticketNumbers]),
        querySafe(mechanicsQuery, [ticketNumbers]),
        querySafe(toolsQuery, [ticketNumbers]),
        querySafe(orderedPartsQuery, [ticketNumbers]),
        querySafe(outsourceStockQuery, [ticketNumbers])
      ]);

      // Group by ticket_number
      const groupByTicket = rows => {
        const map = {};
        rows.forEach(r => {
          if (!map[r.ticket_number]) map[r.ticket_number] = [];
          map[r.ticket_number].push(r);
        });
        return map;
      };

      const formattedResults = tickets.map(row => ({
        ticket_number: row.ticket_number,
        status: row.status,
        priority: row.priority,
        mechanicName: row.mechanicName,     // ✅ using mechanic_assignments
        inspector_assign: row.inspectorName,
        completion_date: row.completion_date,
        estimated_completion_date: row.estimated_completion_date,
        title: row.title,
        created_at: row.created_at,
        description: row.description,
        vehicle_info: {
          make: row.make,
          model: row.model,
          year: row.year,
          licensePlate: row.vehicle_license_plate,
          image: row.image
        },
        disassembled_parts: (groupByTicket(disassembledRows)[row.ticket_number] || []),
        progress_logs: (groupByTicket(logRows)[row.ticket_number] || []),
        inspections: (groupByTicket(inspectionRows)[row.ticket_number] || []),
        outsource_mechanics: (groupByTicket(mechanicRows)[row.ticket_number] || []),
        tool_assignments: (groupByTicket(toolRows)[row.ticket_number] || []),
        ordered_parts: (groupByTicket(orderedRows)[row.ticket_number] || []),
        outsource_stock: (groupByTicket(stockRows)[row.ticket_number] || [])
      }));

      res.json(formattedResults);
    })();
  });
});











module.exports = router;
