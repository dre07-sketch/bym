  const express = require('express');
  const router = express.Router();
  const db = require('../../db/connection');

  // Helper: Send JSON response with optional pagination
  const sendResponse = (
    res,
    success,
    data = null,
    message = '',
    status = 200,
    pagination = null
  ) => {
    const response = { success, data, message };
    if (pagination) response.pagination = pagination;
    return res.status(status).json(response);
  };

  // ====== PROFORMA INVOICES ======

 
router.post('/proformas-post', async (req, res) => {
  const {
    proforma_number,
    proforma_date,
    notes,
    items,
    customer_name,
    company_name,
    company_address,
    company_phone,
    company_vat_number
  } = req.body;

  // Required fields validation
  if (!proforma_number || !proforma_date || !items || !Array.isArray(items) || items.length === 0) {
    return sendResponse(res, false, null, 'Missing required fields: proforma_number, proforma_date, or items', 400);
  }

  for (const item of items) {
    if (!item.description) {
      return sendResponse(res, false, null, 'Each item must have a description.', 400);
    }
    if (typeof item.quantity !== 'number' || item.quantity <= 0) {
      return sendResponse(res, false, null, 'Item quantity must be a positive number.', 400);
    }
    if (typeof item.unit_price !== 'number' || item.unit_price < 0) {
      return sendResponse(res, false, null, 'Item unit price must be a non-negative number.', 400);
    }
  }

  let connection;
  try {
    connection = await db.promise().getConnection();
    await connection.beginTransaction();

    // Calculate totals
    const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
    const vat_rate = 15; // default VAT rate
    const vat_amount = parseFloat((subtotal * (vat_rate / 100)).toFixed(2));
    const total = subtotal + vat_amount;

    // Insert proforma (now including customer & company info)
    const [proformaResult] = await connection.execute(
      `INSERT INTO proformas 
      (proforma_number, proforma_date, customer_name, company_name, company_address, company_phone, company_vat_number, notes, status, subtotal, vat_rate, vat_amount, total)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        proforma_number,
        proforma_date,
        customer_name || null,
        company_name || null,
        company_address || null,
        company_phone || null,
        company_vat_number || null,
        notes || null,
        'Awaiting Send',
        subtotal,
        vat_rate,
        vat_amount,
        total,
      ]
    );

    const proformaId = proformaResult.insertId;

    // Insert items
    const itemValues = items.map(item => [
      proformaId,
      item.description,
      item.size || null,
      item.quantity,
      item.unit_price,
    ]);

    await connection.query(
      `INSERT INTO proforma_items (proforma_id, description, size, quantity, unit_price) VALUES ?`,
      [itemValues]
    );

    await connection.commit();

    return sendResponse(res, true, {
      id: proformaId,
      proforma_number,
      proforma_date,
      subtotal,
      vat_rate,
      vat_amount,
      total,
      item_count: items.length,
    }, 'Proforma invoice saved successfully!', 201);

  } catch (error) {
    if (connection) await connection.rollback().catch(console.error);
    console.error('❌ Proforma save error:', error);

    if (error.code === 'ER_DUP_ENTRY') {
      return sendResponse(res, false, null, `Proforma number "${proforma_number}" already exists.`, 409);
    }

    return sendResponse(res, false, null, 'Failed to save proforma invoice.', 500);
  } finally {
    if (connection) connection.release();
  }
});


  // GET /api/communication-center/proformas
  // List all proformas with pagination, search, and filters
router.get('/proformas', async (req, res) => {
  const {
    page = 1,
    limit = 10,
    search,
    status,
    date,
  } = req.query;

  const pageNum = Math.max(1, parseInt(page)) || 1;
  const limitNum = Math.min(100, Math.max(1, parseInt(limit))) || 10;
  const offset = (pageNum - 1) * limitNum;

  let connection;
  try {
    connection = await db.promise().getConnection();

    // Base query with all fields you want
    let query = `
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
        status,
        subtotal,
        vat_rate,
        vat_amount,
        total,
        created_at,
        updated_at
      FROM proformas
      WHERE 1=1
    `;
    let countQuery = `SELECT COUNT(*) AS total FROM proformas WHERE 1=1`;
    const params = [];

    // Apply filters
    if (search) {
      query += ` AND (proforma_number LIKE ? OR notes LIKE ? OR customer_name LIKE ? OR company_name LIKE ?)`;
      countQuery += ` AND (proforma_number LIKE ? OR notes LIKE ? OR customer_name LIKE ? OR company_name LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
    }

    if (status) {
      query += ` AND status = ?`;
      countQuery += ` AND status = ?`;
      params.push(status);
    }

    if (date) {
      query += ` AND DATE(proforma_date) = DATE(?)`;
      countQuery += ` AND DATE(proforma_date) = DATE(?)`;
      params.push(date);
    }

    // Add sorting and pagination
    query += ` ORDER BY created_at DESC LIMIT ? OFFSET ?`;
    params.push(limitNum, offset);

    // Execute both queries
    const [rows] = await connection.execute(query, params);
    const [[{ total }]] = await connection.execute(countQuery, params.slice(0, -2)); // exclude LIMIT/OFFSET

    const totalPages = Math.ceil(total / limitNum);

    connection.release();

    return sendResponse(res, true, rows, 'Proforma list retrieved successfully.', 200, {
      page: pageNum,
      pages: totalPages,
      total,
      limit: limitNum,
    });

  } catch (error) {
    if (connection) connection.release();
    console.error('❌ Fetch proformas error:', error);
    return sendResponse(res, false, null, 'Could not retrieve proforma invoices.', 500);
  }
});


 
// GET /api/communication-center/proformas/:id
router.get('/proformas/:id', async (req, res) => {
  const { id } = req.params;

  // Validate ID
  if (!id || isNaN(parseInt(id))) {
    return sendResponse(res, false, null, 'Invalid or missing proforma ID.', 400);
  }

  let connection;
  try {
    // Use connection from pool
    connection = await db.promise().getConnection();

    // Get proforma
    const [proformaRows] = await connection.execute(
      `SELECT * FROM proformas WHERE id = ?`,
      [id]
    );

    if (proformaRows.length === 0) {
      await connection.release();
      return sendResponse(res, false, null, 'Proforma not found.', 404);
    }

    // Get items
    const [itemRows] = await connection.execute(
      `SELECT * FROM proforma_items WHERE proforma_id = ?`,
      [id]
    );

    // Release connection
    await connection.release();

    // Build response
    const proforma = proformaRows[0];
    const items = Array.isArray(itemRows) ? itemRows : [];

    const responseData = {
      ...proforma,
      items: items,
      // Add dummy customer/vehicle for now (you can join later)
      customer_name: 'John Doe',        // TODO: JOIN with customers
      customer_email: 'john@example.com',
      customer_phone: '+123 456 7890',
      customer_address: '123 Main St, Colombo',
      vehicle: 'Toyota Corolla - ABC-123',
    };

    return sendResponse(res, true, responseData, 'Proforma invoice retrieved successfully.');

  } catch (error) {
    // Safely handle errors
    console.error('❌ Fetch proforma by ID error:', error);

    // Release connection on error
    if (connection) {
      await connection.release().catch(console.error);
    }

    return sendResponse(res, false, null, 'Could not retrieve proforma invoice.', 500);
  }
});


router.put('/proformas/:id/status', async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  // Allowed statuses
  const allowedStatuses = [
    'Awaiting Send',
    'Sent',
    'Cancelled',
    'Accepted',
    'Expired',
    'Draft'
  ];

  // Validation
  if (!status || !allowedStatuses.includes(status)) {
    return res.status(400).json({
      success: false,
      message: `Invalid status. Allowed values: ${allowedStatuses.join(', ')}`
    });
  }

  try {
    const [result] = await db
      .promise()
      .query(
        `UPDATE proformas 
         SET status = ?, updated_at = CURRENT_TIMESTAMP 
         WHERE id = ?`,
        [status, id]
      );

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Proforma not found' });
    }

    res.json({
      success: true,
      message: `Proforma status updated to "${status}"`,
      data: { id, status }
    });
  } catch (err) {
    console.error('Error updating proforma status:', err);
    res.status(500).json({
      success: false,
      message: 'Server error while updating proforma status'
    });
  }
});
  // ====== STATS ENDPOINT ======
  // GET /api/communication-center/stats
// adjust path if needed

// GET all "awaiting survey" tickets with related data
router.get('/awaiting-survey', (req, res) => {
  // 1. Fetch tickets with awaiting survey status
  const ticketsQuery = `
    SELECT 
      id,
      ticket_number,
      customer_id,
      customer_name,
      customer_type,
      vehicle_id,
      vehicle_info,
      license_plate,
      title,
      description,
      priority,
      type,
      urgency_level,
      status,
      inspector_assign,
      estimated_completion_date,
      completion_date,
      created_at,
      updated_at
    FROM service_tickets
    WHERE status = 'awaiting survey'
    ORDER BY created_at DESC
  `;

  db.query(ticketsQuery, (err, tickets) => {
    if (err) {
      console.error('Error fetching tickets:', err);
      return res.status(500).json({ success: false, message: 'Database error' });
    }

    if (tickets.length === 0) {
      return res.json({ success: true, tickets: [] });
    }

    const ticketNumbers = tickets.map(t => t.ticket_number);

    // Helper function for running related queries
    const runQuery = (query, cb) => db.query(query, [ticketNumbers], cb);

    // Related queries
    const disassembledQuery = `
      SELECT id, ticket_number, part_name, \`condition\` AS part_condition, status, notes, logged_at, reassembly_verified
      FROM disassembled_parts WHERE ticket_number IN (?) ORDER BY logged_at DESC
    `;
    const logsQuery = `
      SELECT id, ticket_number, date, time, status, description, created_at
      FROM progress_logs WHERE ticket_number IN (?) ORDER BY created_at DESC
    `;
    const inspectionsQuery = `
      SELECT id, ticket_number, main_issue_resolved, reassembly_verified, general_condition, notes,
             inspection_date, inspection_status, created_at, updated_at,
             check_oil_leaks, check_engine_air_filter_oil_coolant_level,
             check_brake_fluid_levels, check_gluten_fluid_levels,
             check_battery_timing_belt, check_tire, check_tire_pressure_rotation,
             check_lights_wiper_horn, check_door_locks_central_locks,
             check_customer_work_order_reception_book
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
      SELECT id, ticket_number, name, category, sku, price, quantity, source_shop, status, requested_at, received_at, notes, updated_at,
             (quantity * price) AS total_cost
      FROM outsource_stock WHERE ticket_number IN (?) ORDER BY requested_at DESC
    `;

    // Run all queries in parallel
    let results = {};
    let completed = 0;
    let hasError = false;

    const queries = {
      disassembled_parts: disassembledQuery,
      progress_logs: logsQuery,
      inspections: inspectionsQuery,
      outsource_mechanics: mechanicsQuery,
      tool_assignments: toolsQuery,
      ordered_parts: orderedPartsQuery,
      outsource_stock: outsourceStockQuery,
    };

    Object.entries(queries).forEach(([key, query]) => {
      runQuery(query, (err, rows) => {
        if (hasError) return; // prevent multiple responses
        if (err) {
          console.error(`Error fetching ${key}:`, err);
          hasError = true;
          return res.status(500).json({ success: false, message: `Database error on ${key}` });
        }
        results[key] = rows;
        completed++;

        if (completed === Object.keys(queries).length) {
          // Enrich tickets with related data
          const enrich = (ticket_number, source) =>
            source.filter(r => r.ticket_number === ticket_number);

          const enrichedTickets = tickets.map(t => ({
            ...t,
            disassembled_parts: enrich(t.ticket_number, results.disassembled_parts),
            progress_logs: enrich(t.ticket_number, results.progress_logs),
            inspections: enrich(t.ticket_number, results.inspections),
            outsource_mechanics: enrich(t.ticket_number, results.outsource_mechanics),
            tool_assignments: enrich(t.ticket_number, results.tool_assignments),
            ordered_parts: enrich(t.ticket_number, results.ordered_parts),
            outsource_stock: enrich(t.ticket_number, results.outsource_stock),
          }));

          res.json({ success: true, tickets: enrichedTickets });
        }
      });
    });
  });
});

// ✅ API: Mark survey as completed -> move ticket to "awaiting salvage form"
router.put('/tickets/:ticketNumber/complete-survey', (req, res) => {
  const { ticketNumber } = req.params;

  const query = `
    UPDATE service_tickets
    SET status = 'awaiting salvage form',
        updated_at = CURRENT_TIMESTAMP
    WHERE ticket_number = ? AND status = 'awaiting survey'
  `;

  db.query(query, [ticketNumber], (err, result) => {
    if (err) {
      console.error("❌ Error updating ticket status:", err);
      return res.status(500).json({ error: "Internal server error" });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ 
        message: "Ticket not found or not in 'awaiting survey' status" 
      });
    }

    res.json({ 
      success: true,
      message: `Ticket ${ticketNumber} moved to 'awaiting salvage form'`
    });
  });
});

router.get('/awaiting-salvage-form', (req, res) => {
  // Step 1: Fetch tickets with status 'awaiting salvage form'
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
      outsource_mechanic,
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
    WHERE status = 'awaiting salvage form'
    ORDER BY created_at DESC
  `;

  db.query(ticketsQuery, (err, tickets) => {
    if (err) return res.status(500).json({ success: false, message: 'Error fetching tickets', error: err });

    const ticketNumbers = tickets.map(t => t.ticket_number);
    if (ticketNumbers.length === 0) {
      return res.json({ success: true, tickets: [], disassembledParts: [], logs: [], inspections: [], mechanics: [], tools: [], orderedParts: [], outsourceStock: [] });
    }

    // Related queries
    const disassembledQuery = `
      SELECT id, ticket_number, part_name, \`condition\` AS part_condition, status, notes, logged_at, reassembly_verified
      FROM disassembled_parts WHERE ticket_number IN (?) ORDER BY logged_at DESC
    `;
    const logsQuery = `
      SELECT id, ticket_number, date, time, status, description, created_at
      FROM progress_logs WHERE ticket_number IN (?) ORDER BY created_at DESC
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
      WHERE ticket_number IN (?)
      ORDER BY created_at DESC
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

    // Execute all related queries
    db.query(disassembledQuery, [ticketNumbers], (err, disassembledParts) => {
      if (err) return res.status(500).json({ success: false, message: 'Error fetching disassembled parts', error: err });

      db.query(logsQuery, [ticketNumbers], (err, logs) => {
        if (err) return res.status(500).json({ success: false, message: 'Error fetching logs', error: err });

        db.query(inspectionsQuery, [ticketNumbers], (err, inspections) => {
          if (err) return res.status(500).json({ success: false, message: 'Error fetching inspections', error: err });

          db.query(mechanicsQuery, [ticketNumbers], (err, mechanics) => {
            if (err) return res.status(500).json({ success: false, message: 'Error fetching mechanics', error: err });

            db.query(toolsQuery, [ticketNumbers], (err, tools) => {
              if (err) return res.status(500).json({ success: false, message: 'Error fetching tools', error: err });

              db.query(orderedPartsQuery, [ticketNumbers], (err, orderedParts) => {
                if (err) return res.status(500).json({ success: false, message: 'Error fetching ordered parts', error: err });

                db.query(outsourceStockQuery, [ticketNumbers], (err, outsourceStock) => {
                  if (err) return res.status(500).json({ success: false, message: 'Error fetching outsource stock', error: err });

                  // ✅ Final response
                  res.json({
                    success: true,
                    tickets,
                    disassembledParts,
                    logs,
                    inspections,
                    mechanics,
                    tools,
                    orderedParts,
                    outsourceStock
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

// Update service ticket status from "awaiting salvage form" to "request payment"
router.post('/service-tickets/request-payment', (req, res) => {
  const { ticket_number } = req.body;

  if (!ticket_number) {
    return res.status(400).json({ message: "ticket_number is required" });
  }

  const sql = `
    UPDATE service_tickets
    SET status = 'request payment', updated_at = NOW()
    WHERE ticket_number = ? AND status = 'awaiting salvage form'
  `;

  db.query(sql, [ticket_number], (err, result) => {
    if (err) {
      console.error("❌ Error updating ticket status:", err);
      return res.status(500).json({ error: "Internal server error" });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({
        message: `No ticket found with ticket_number ${ticket_number} and status 'awaiting salvage form'`
      });
    }

    res.json({
      message: `Ticket ${ticket_number} status updated to 'request payment'`
    });
  });
});


router.get('/stats', async (req, res) => {
    try {
      const [rows] = await db.promise().execute(`
        SELECT
          COUNT(*) AS total,
          SUM(CASE WHEN status = 'Draft' THEN 1 ELSE 0 END) AS draft,
          SUM(CASE WHEN status = 'Awaiting Send' THEN 1 ELSE 0 END) AS awaiting_send,
          SUM(CASE WHEN status = 'Sent' THEN 1 ELSE 0 END) AS sent,
          SUM(CASE WHEN status = 'Accepted' THEN 1 ELSE 0 END) AS accepted,
          SUM(CASE WHEN status = 'Cancelled' THEN 1 ELSE 0 END) AS cancelled,
          SUM(CASE WHEN status = 'Expired' THEN 1 ELSE 0 END) AS expired
        FROM proformas
      `);

      const stats = rows[0];

      const result = {
        total: parseInt(stats.total),
        awaitingSend: parseInt(stats.awaiting_send) || 0,
        draft: parseInt(stats.draft) || 0,
        accepted: parseInt(stats.accepted) || 0,
        cancelled: parseInt(stats.cancelled) || 0,
      };

      return sendResponse(res, true, result, 'Stats retrieved successfully.');
    } catch (error) {
      console.error('❌ Fetch stats error:', error);
      return sendResponse(res, false, null, 'Could not retrieve statistics.', 500);
    }
});

router.get('/status-counts', (req, res) => {
  const query = `
    SELECT status, COUNT(*) AS count
    FROM proformas
    WHERE status IN ('Converted', 'Awaiting Send', 'Sent', 'Accepted', 'Cancelled')
    GROUP BY status
  `;

  db.query(query, (err, results) => {
    if (err) {
      console.error("❌ Error fetching status counts:", err);
      return res.status(500).json({ error: "Database query failed" });
    }

    // Initialize all statuses with 0
    const counts = {
      Converted: 0,
      "Awaiting Send": 0,
      Sent: 0,
      Accepted: 0,
      Cancelled: 0,
    };

    // Fill in actual counts from DB
    results.forEach(row => {
      counts[row.status] = row.count;
    });

    res.json({ success: true, counts });
  });
});

// ✅ Fetch all cancelled proformas
// ✅ Request Volume Trend (per month)

router.get('/analytics', (req, res) => {
  const analyticsQuery = `
    SELECT
      COUNT(*) AS totalRequests,
      ROUND(
        (SUM(CASE WHEN status = 'Accepted' THEN 1 ELSE 0 END) / COUNT(*)) * 100, 2
      ) AS completionRate,
      AVG(TIMESTAMPDIFF(HOUR, created_at, NOW())) AS avgResponseTime,
      SUM(CASE WHEN status = 'Urgent' THEN 1 ELSE 0 END) AS urgentRequests,
      (
        SELECT status
        FROM proformas
        GROUP BY status
        ORDER BY COUNT(*) DESC
        LIMIT 1
      ) AS topType,
      (
        SELECT 
          ROUND(
            (
              (SELECT COUNT(*) FROM proformas WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY))
              -
              (SELECT COUNT(*) FROM proformas WHERE created_at BETWEEN DATE_SUB(NOW(), INTERVAL 60 DAY) AND DATE_SUB(NOW(), INTERVAL 30 DAY))
            ) / 
            NULLIF(
              (SELECT COUNT(*) FROM proformas WHERE created_at BETWEEN DATE_SUB(NOW(), INTERVAL 60 DAY) AND DATE_SUB(NOW(), INTERVAL 30 DAY)),
              0
            ) * 100, 2
          )
      ) AS monthlyGrowth
    FROM proformas;
  `;

  db.query(analyticsQuery, (err, results) => {
    if (err) {
      console.error('❌ Error fetching analytics:', err);
      return res.status(500).json({
        success: false,
        data: null,
        message: 'Database query failed'
      });
    }

    res.json({
      success: true,
      data: results[0],
      message: 'Analytics fetched successfully'
    });
  });
});


router.get('/analytics/request-volume', (req, res) => {
  const query = `
    SELECT 
      DATE_FORMAT(proforma_date, '%Y-%m') AS month,
      COUNT(*) AS totalRequests
    FROM proformas
    GROUP BY month
    ORDER BY month ASC
  `;
  db.query(query, (err, results) => {
    if (err) {
      console.error("❌ Error fetching request volume:", err);
      return res.status(500).json({ success: false, data: null, message: "Database query failed" });
    }
    res.json({ success: true, data: results, message: "Request volume trend fetched successfully" });
  });
});

// ✅ Request Type Distribution
router.get('/analytics/request-distribution', (req, res) => {
  const query = `
    SELECT 
      status,
      COUNT(*) AS count
    FROM proformas
    GROUP BY status
  `;
  db.query(query, (err, results) => {
    if (err) {
      console.error("❌ Error fetching request distribution:", err);
      return res.status(500).json({ success: false, data: null, message: "Database query failed" });
    }
    res.json({ success: true, data: results, message: "Request type distribution fetched successfully" });
  });
});



  // GET /api/communication-center/outsource-stock
// List outsourced stock with pagination, search, and filters
router.get('/outsource-stock', async (req, res) => {
  console.log('✅ HIT: /outsource-stock route triggered');
  const {
    page = 1,
    limit = 10,
    search,
    status,
    category,
  } = req.query;

  const pageNum = Math.max(1, parseInt(page)) || 1;
  const limitNum = Math.min(100, Math.max(1, parseInt(limit))) || 10;
  const offset = (pageNum - 1) * limitNum;

  try {
    // Base queries
    let query = `
      SELECT 
        id,
        name,
        category,
        sku,
        price,
        quantity,
        source_shop,
        status,
        requested_at,
        received_at,
        notes
      FROM outsource_stock
      WHERE 1=1
    `;

    let countQuery = `SELECT COUNT(*) AS total FROM outsource_stock WHERE 1=1`;

    // Shared filter params
    const filterParams = [];

    if (search) {
      query += ` AND (name LIKE ? OR sku LIKE ? OR source_shop LIKE ?)`;
      countQuery += ` AND (name LIKE ? OR sku LIKE ? OR source_shop LIKE ?)`;
      filterParams.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    if (status) {
      query += ` AND status = ?`;
      countQuery += ` AND status = ?`;
      filterParams.push(status);
    }

    if (category) {
      query += ` AND category = ?`;
      countQuery += ` AND category = ?`;
      filterParams.push(category);
    }

    // Add sorting (always DESC) and pagination
    query += ` ORDER BY requested_at DESC LIMIT ? OFFSET ?`;
    const params = [...filterParams, limitNum, offset];

    // Run queries
    const [rows] = await db.promise().query(query, params);
    const [[{ total }]] = await db.promise().query(countQuery, filterParams);

    const totalPages = Math.ceil(total / limitNum);

    return sendResponse(res, true, rows, 'Outsource stock list retrieved successfully.', 200, {
      page: pageNum,
      pages: totalPages,
      total,
      limit: limitNum,
    });

  } catch (error) {
    console.error('❌ Fetch outsource stock error:', error);
    return sendResponse(res, false, null, 'Could not retrieve outsource stock.', 500);
  }
});



// GET /api/communication-center/outsource-stock-stats
// Get summary stats for outsource stock
router.get('/outsource-stock-stats', async (req, res) => {
  try {
    const [rows] = await db.promise().execute(`
      SELECT
        COUNT(*) AS total,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) AS pending,
        SUM(CASE WHEN status = 'accepted' THEN 1 ELSE 0 END) AS accepted,
        SUM(CASE WHEN status = 'received' THEN 1 ELSE 0 END) AS received
      FROM outsource_stock
    `);

    const data = rows[0];

    const result = {
      total: parseInt(data.total) || 0,
      pending: parseInt(data.pending) || 0,
      accepted: parseInt(data.accepted) || 0,
      received: parseInt(data.received) || 0,
    };

    return sendResponse(res, true, result, 'Outsource stock stats retrieved successfully.');
  } catch (error) {
    console.error('❌ Fetch outsource stock stats error:', error);
    return sendResponse(res, false, null, 'Could not retrieve outsource stock statistics.', 500);
  }
});

// PATCH /api/communication-center/outsource-stock/:id/status
// Update status of an outsource stock item
router.patch('/outsource-stock/:id/status', async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  // Validate status
const validStatuses = ['awaiting_request', 'requested', 'received', 'cancelled'];
if (!status || !validStatuses.includes(status)) {
  return sendResponse(res, false, null, 'Invalid or missing status.', 400);
}

  // Validate ID
  if (!id) {
  return sendResponse(res, false, null, 'Missing ID.', 400);
}

// Optional: Validate it's a valid format (e.g., OS001 or number)
const isValidId = /^\d+$/.test(id) || /^[A-Z0-9-]+$/.test(id); // Allows numbers or codes like OS001
if (!isValidId) {
  return sendResponse(res, false, null, 'Invalid ID format.', 400);
}

  let connection;
  try {
    connection = await db.promise().getConnection();

    // Check if record exists
    const [existing] = await connection.execute(
      'SELECT id FROM outsource_stock WHERE id = ?',
      [id]
    );

    if (existing.length === 0) {
      await connection.release();
      return sendResponse(res, false, null, 'Stock item not found.', 404);
    }

    // Update status
    await connection.execute(
      'UPDATE outsource_stock SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [status, id]
    );

    await connection.release();

    return sendResponse(res, true, { id, status }, 'Status updated successfully.', 200);
  } catch (error) {
    if (connection) connection.release();
    console.error('❌ Update outsource stock status error:', error);
    return sendResponse(res, false, null, 'Could not update status.', 500);
  }
});

router.post('/update-price/:id', (req, res) => {
  const { id } = req.params;
  const { price } = req.body;

  if (!price || isNaN(price)) {
    return res.status(400).json({ success: false, message: "Valid price is required" });
  }

  // Update by `id` (varchar business identifier)
  const updateQuery = `
    UPDATE outsource_stock 
    SET price = ?, updated_at = NOW() 
    WHERE id = ?
  `;

  db.query(updateQuery, [price, id], (err, result) => {
    if (err) {
      console.error("DB Error:", err);
      return res.status(500).json({ success: false, message: "Database error" });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: "Item not found" });
    }

    // Fetch updated item including calculated total
    const fetchQuery = `
      SELECT 
        auto_id, id, ticket_number, name, category, sku, price, quantity,
        (price * quantity) AS total, source_shop, status, requested_at, received_at, notes, updated_at
      FROM outsource_stock 
      WHERE id = ?
    `;

    db.query(fetchQuery, [id], (err, rows) => {
      if (err) {
        console.error("DB Error:", err);
        return res.status(500).json({ success: false, message: "Database error" });
      }

      res.json({ success: true, data: rows[0] });
    });
  });
});


router.get('/payment-requested', (req, res) => {
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
      outsource_mechanic,
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
    WHERE status = 'Payment Requested'
    ORDER BY created_at DESC
  `;

  db.query(ticketsQuery, (err, tickets) => {
    if (err)
      return res
        .status(500)
        .json({ success: false, message: 'Error fetching tickets', error: err });

    const ticketNumbers = tickets.map((t) => t.ticket_number);
    if (ticketNumbers.length === 0) {
      return res.json({
        success: true,
        tickets: [],
        disassembledParts: [],
        logs: [],
        inspections: [],
        mechanics: [],
        tools: [],
        orderedParts: [],
        outsourceStock: [],
        insurance: [],
      });
    }

    const disassembledQuery = `
      SELECT id, ticket_number, part_name, \`condition\` AS part_condition, status, notes, logged_at, reassembly_verified
      FROM disassembled_parts WHERE ticket_number IN (?) ORDER BY logged_at DESC
    `;
    const logsQuery = `
      SELECT id, ticket_number, date, time, status, description, created_at
      FROM progress_logs WHERE ticket_number IN (?) ORDER BY created_at DESC
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
      WHERE ticket_number IN (?)
      ORDER BY created_at DESC
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

    // ✅ New insurance query
    const insuranceQuery = `
      SELECT 
        id,
        ticket_number,
        insurance_company,
        insurance_phone,
        accident_date,
        owner_name,
        owner_phone,
        owner_email,
        description,
        created_at,
        updated_at
      FROM insurance
      WHERE ticket_number IN (?)
      ORDER BY created_at DESC
    `;

    // Execute all related queries
    db.query(disassembledQuery, [ticketNumbers], (err, disassembledParts) => {
      if (err)
        return res
          .status(500)
          .json({ success: false, message: 'Error fetching disassembled parts', error: err });

      db.query(logsQuery, [ticketNumbers], (err, logs) => {
        if (err)
          return res
            .status(500)
            .json({ success: false, message: 'Error fetching logs', error: err });

        db.query(inspectionsQuery, [ticketNumbers], (err, inspections) => {
          if (err)
            return res
              .status(500)
              .json({ success: false, message: 'Error fetching inspections', error: err });

          db.query(mechanicsQuery, [ticketNumbers], (err, mechanics) => {
            if (err)
              return res
                .status(500)
                .json({ success: false, message: 'Error fetching mechanics', error: err });

            db.query(toolsQuery, [ticketNumbers], (err, tools) => {
              if (err)
                return res
                  .status(500)
                  .json({ success: false, message: 'Error fetching tools', error: err });

              db.query(orderedPartsQuery, [ticketNumbers], (err, orderedParts) => {
                if (err)
                  return res
                    .status(500)
                    .json({ success: false, message: 'Error fetching ordered parts', error: err });

                db.query(outsourceStockQuery, [ticketNumbers], (err, outsourceStock) => {
                  if (err)
                    return res
                      .status(500)
                      .json({ success: false, message: 'Error fetching outsource stock', error: err });

                  // 🔹 Finally fetch insurance
                  db.query(insuranceQuery, [ticketNumbers], (err, insurance) => {
                    if (err)
                      return res
                        .status(500)
                        .json({ success: false, message: 'Error fetching insurance', error: err });

                    // ✅ Final response with insurance added
                    res.json({
                      success: true,
                      tickets,
                      disassembledParts,
                      logs,
                      inspections,
                      mechanics,
                      tools,
                      orderedParts,
                      outsourceStock,
                      insurance,
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
});


  // ====== EXPORT ======
  module.exports = router;